import { onMounted, onUnmounted, Ref, nextTick } from "vue";
import { SetupContext } from "@vue/runtime-core";
import {
  cutOutBoxBorder,
  movePositionType,
  zoomCutOutBoxReturnType,
  drawCutOutBoxReturnType,
  positionInfoType,
  textInfoType,
  hideBarInfoType
} from "@/module/type/ComponentType";
import { drawMasking } from "@/module/split-methods/DrawMasking";
import html2canvas from "html2canvas";
import PlugInParameters from "@/module/main-entrance/PlugInParameters";
import { fixedData, nonNegativeData } from "@/module/common-methords/FixedData";
import { zoomCutOutBoxPosition } from "@/module/common-methords/ZoomCutOutBoxPosition";
import { saveBorderArrInfo } from "@/module/common-methords/SaveBorderArrInfo";
import { drawCutOutBox } from "@/module/split-methods/DrawCutOutBox";
import InitData from "@/module/main-entrance/InitData";
import { calculateToolLocation } from "@/module/split-methods/CalculateToolLocation";
import { drawRectangle } from "@/module/split-methods/DrawRectangle";
import { drawCircle } from "@/module/split-methods/DrawCircle";
import { drawPencil, initPencil } from "@/module/split-methods/DrawPencil";
import { drawText } from "@/module/split-methods/DrawText";
import { saveCanvasToImage } from "@/module/common-methords/SaveCanvasToImage";
import { saveCanvasToBase64 } from "@/module/common-methords/SaveCanvasToBase64";
import { drawMosaic } from "@/module/split-methods/DrawMosaic";
import { calculateOptionIcoPosition } from "@/module/split-methods/CalculateOptionIcoPosition";
import { setSelectedClassName } from "@/module/common-methords/SetSelectedClassName";
import adapter from "webrtc-adapter";
import { getDrawBoundaryStatus } from "@/module/split-methods/BoundaryJudgment";
import { getCanvas2dCtx } from "@/module/common-methords/CanvasPatch";
import { updateContainerMouseStyle } from "@/module/common-methords/UpdateContainerMouseStyle";
import { DrawArrow } from "@/module/split-methods/DrawArrow";

export default class EventMonitoring {
  // 当前实例的响应式data数据
  private readonly data: InitData;
  private emit: ((event: string, ...args: any[]) => void) | undefined;

  // 截图区域canvas容器
  private screenShortController: Ref<HTMLCanvasElement | null>;
  // 截图工具栏dom
  private toolController: Ref<HTMLDivElement | null>;
  // 截图图片存放容器
  private screenShortImageController: HTMLCanvasElement | null;
  // 截图区域画布
  private screenShortCanvas: CanvasRenderingContext2D | undefined;
  // 文本区域dom
  private textInputController: Ref<HTMLDivElement | null> | undefined;
  // 截图工具栏画笔选项dom
  private optionController: Ref<HTMLDivElement | null> | undefined;
  private optionIcoController: Ref<HTMLDivElement | null> | undefined;
  // video容器用于存放屏幕MediaStream流
  private readonly videoController: HTMLVideoElement;
  private wrcWindowMode = false;
  // 图形位置参数
  private drawGraphPosition: positionInfoType = {
    startX: 0,
    startY: 0,
    width: 0,
    height: 0
  };
  // 临时图形位置参数
  private tempGraphPosition: positionInfoType = {
    startX: 0,
    startY: 0,
    width: 0,
    height: 0
  };
  // 裁剪框边框节点坐标事件
  private cutOutBoxBorderArr: Array<cutOutBoxBorder> = [];
  // 裁剪框顶点边框直径大小
  private borderSize = 10;
  // 当前操作的边框节点
  private borderOption: number | null = null;
  // 递增变粗箭头的实现
  private drawArrow = new DrawArrow();

  // 点击裁剪框时的鼠标坐标
  private movePosition: movePositionType = {
    moveStartX: 0,
    moveStartY: 0
  };

  // 裁剪框修剪状态
  private draggingTrim = false;
  // 裁剪框拖拽状态
  private dragging = false;

  // 鼠标点击状态
  private clickFlag = false;
  // 鼠标拖动状态
  private dragFlag = false;
  // 单击截取屏启用状态
  private clickCutFullScreen = false;
  // 全屏截取状态
  private getFullScreenStatus = false;
  // 上一个裁剪框坐标信息
  private drawGraphPrevX = 0;
  private drawGraphPrevY = 0;

  // 当前点击的工具栏条目
  private toolName = "";
  private fontSize = 17;
  // 撤销点击次数
  private undoClickNum = 0;
  // 最大可撤销次数
  private maxUndoNum = 15;
  // 马赛克涂抹区域大小
  private degreeOfBlur = 5;
  private dpr = window.devicePixelRatio || 1;
  // 截全屏时工具栏展示的位置要减去的高度
  private fullScreenDiffHeight = 60;
  private history: Array<Record<string, any>> = [];
  // 文本输入框位置
  private textInputPosition: { mouseX: number; mouseY: number } = {
    mouseX: 0,
    mouseY: 0
  };
  // 是否隐藏页面滚动条
  private hiddenScrollBar = {
    color: "#000000",
    fillState: false,
    state: false,
    fillWidth: 0,
    fillHeight: 0
  };
  private textInfo: textInfoType = {
    positionX: 0,
    positionY: 0,
    color: "",
    size: 0
  };

  constructor(props: Record<string, any>, context: SetupContext<any>) {
    // 实例化响应式data
    this.data = new InitData();
    // 获取截图区域canvas容器
    this.screenShortController = this.data.getScreenShortController();
    this.toolController = this.data.getToolController();
    this.textInputController = this.data.getTextInputController();
    this.optionController = this.data.getOptionController();
    this.optionIcoController = this.data.getOptionIcoController();
    this.videoController = document.createElement("video");
    this.videoController.autoplay = true;
    this.screenShortImageController = document.createElement("canvas");
    // 设置实例与属性
    this.data.setPropsData(context.emit);

    onMounted(() => {
      this.emit = this.data.getEmit();
      const plugInParameters = new PlugInParameters();
      this.hiddenScrollBar = plugInParameters.getHiddenScrollBarInfo();
      if (this.hiddenScrollBar.state) {
        // 设置页面宽高并隐藏滚动条
        this.updateScrollbarState();
      }
      // 单击截屏启用状态
      this.clickCutFullScreen = plugInParameters.getClickCutFullScreenStatus();
      // 设置需要隐藏的工具栏图标
      this.data.setHiddenToolIco(plugInParameters.getHiddenToolIco());
      if (!plugInParameters.getWebRtcStatus()) {
        this.h2cMode(plugInParameters);
        return;
      }
      // 是否启用窗口截图模式
      this.wrcWindowMode = plugInParameters.getWrcWindowMode();
      this.wrcMode(plugInParameters);
    });

    onUnmounted(() => {
      // 初始化initData中的数据
      this.data.setInitStatus(true);
    });
  }

  private wrcMode(plugInParameters: PlugInParameters) {
    if (this.screenShortImageController == null) return;
    // 设置截图图片存放容器宽高
    this.screenShortImageController.width = parseFloat(
      window.getComputedStyle(document.body).width
    );
    this.screenShortImageController.height = parseFloat(
      window.getComputedStyle(document.body).height
    );
    this.startCapture().then(() => {
      setTimeout(() => {
        if (
          this.screenShortController.value == null ||
          this.screenShortImageController == null
        ) {
          return;
        }
        const containerWidth = this.screenShortImageController?.width;
        const containerHeight = this.screenShortImageController?.height;
        let imgContainerWidth = containerWidth;
        let imgContainerHeight = containerHeight;
        if (this.wrcWindowMode) {
          imgContainerWidth = containerWidth * this.dpr;
          imgContainerHeight = containerHeight * this.dpr;
        }
        // 修正截图容器尺寸
        const context = getCanvas2dCtx(
          this.screenShortController.value,
          containerWidth,
          containerHeight
        );
        // 修正图像容器画布尺寸并返回
        const imgContext = getCanvas2dCtx(
          this.screenShortImageController,
          imgContainerWidth,
          imgContainerHeight
        );
        if (context == null || imgContext == null) return;

        const { videoWidth, videoHeight } = this.videoController;
        if (this.wrcWindowMode) {
          // 从窗口视频流中获取body内容
          const bodyImgData = this.getWindowContentData(
            videoWidth,
            videoHeight,
            containerWidth * this.dpr,
            containerHeight * this.dpr
          );
          if (bodyImgData == null) return;
          // 将body内容绘制到图片容器里
          imgContext.putImageData(bodyImgData, 0, 0);
        } else {
          // 对webrtc源提供的图像宽高进行修复
          let fixWidth = containerWidth;
          let fixHeight = (videoHeight * containerWidth) / videoWidth;
          if (fixHeight > containerHeight) {
            fixWidth = (containerWidth * containerHeight) / fixHeight;
            fixHeight = containerHeight;
          }
          // 将获取到的屏幕流绘制到图片容器里
          imgContext?.drawImage(
            this.videoController,
            0,
            0,
            fixWidth,
            fixHeight
          );
          // 隐藏滚动条会出现部分内容未截取到，需要进行修复
          const diffHeight = containerHeight - fixHeight;
          if (
            this.hiddenScrollBar.state &&
            diffHeight > 0 &&
            this.hiddenScrollBar.fillState
          ) {
            // 填充容器的剩余部分
            imgContext.beginPath();
            let fillWidth = containerWidth;
            let fillHeight = diffHeight;
            if (this.hiddenScrollBar.fillWidth > 0) {
              fillWidth = this.hiddenScrollBar.fillWidth;
            }
            if (this.hiddenScrollBar.fillHeight > 0) {
              fillHeight = this.hiddenScrollBar.fillHeight;
            }
            imgContext.rect(0, fixHeight, fillWidth, fillHeight);
            imgContext.fillStyle = this.hiddenScrollBar.color;
            imgContext.fill();
          }
        }

        // 存储屏幕截图
        this.data.setScreenShortImageController(
          this.screenShortImageController
        );

        // 将屏幕截图绘制到截图容器中
        this.drawContent(context, this.screenShortController.value);

        // 调整截屏容器层级
        this.screenShortController.value.style.zIndex =
          plugInParameters.getLevel() + "";
        // 调整截图工具栏层级
        if (this.toolController.value == null) return;
        this.toolController.value.style.zIndex = `${plugInParameters.getLevel() +
          1}`;
        // 停止捕捉屏幕
        this.stopCapture();
      }, 500);
    });
  }

  private h2cMode(plugInParameters: PlugInParameters) {
    if (this.screenShortImageController == null) return;
    const viewSize = {
      width: parseFloat(window.getComputedStyle(document.body).width),
      height: parseFloat(window.getComputedStyle(document.body).height)
    };
    // 设置截图图片存放容器宽高
    this.screenShortImageController.width = viewSize.width;
    this.screenShortImageController.height = viewSize.height;
    // 获取截图区域画canvas容器画布
    if (this.screenShortController.value == null) return;
    const canvasContext = getCanvas2dCtx(
      this.screenShortController.value,
      this.screenShortImageController.width,
      this.screenShortImageController.height
    );
    if (canvasContext == null) return;
    html2canvas(document.body, {
      useCORS: plugInParameters.getEnableCORSStatus(),
      proxy: plugInParameters.getProxyAddress()
    }).then(canvas => {
      // 装载截图的dom为null则退出
      if (this.screenShortController.value == null) return;

      // 调整截屏容器层级
      this.screenShortController.value.style.zIndex =
        plugInParameters.getLevel() + "";
      // 调整截图工具栏层级
      if (this.toolController.value == null) return;
      this.toolController.value.style.zIndex = `${plugInParameters.getLevel() +
        1}`;

      // 存放html2canvas截取的内容
      this.screenShortImageController = canvas;
      // 存储屏幕截图
      this.data.setScreenShortImageController(canvas);
      // 将屏幕截图绘制到截图容器中
      this.drawContent(canvasContext, this.screenShortController.value);
    });
  }

  // 开始捕捉屏幕
  private startCapture = async () => {
    if (this.screenShortImageController == null) return;
    let captureStream = null;
    let mediaWidth = this.screenShortImageController.width * this.dpr;
    let mediaHeight = this.screenShortImageController.height * this.dpr;
    let curTabState = true;
    let displayConfig = {};
    // 窗口模式启用时则
    if (this.wrcWindowMode) {
      mediaWidth = window.screen.width * this.dpr;
      mediaHeight = window.screen.height * this.dpr;
      curTabState = false;
      displayConfig = {
        displaySurface: "window"
      };
    }

    try {
      // 捕获屏幕
      captureStream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
          width: mediaWidth,
          height: mediaHeight,
          ...displayConfig
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        preferCurrentTab: curTabState
      });
      // 将MediaStream输出至video标签
      this.videoController.srcObject = captureStream;
    } catch (err) {
      // 销毁组件
      this.resetComponent();
      throw "浏览器不支持webrtc或者用户未授权, 浏览器名称" +
        adapter.browserDetails.browser +
        "，浏览器版本号" +
        adapter.browserDetails.version +
        err;
    }
    return captureStream;
  };

  // 停止捕捉屏幕
  private stopCapture = () => {
    const srcObject = this.videoController.srcObject;
    if (srcObject && "getTracks" in srcObject) {
      const tracks = srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoController.srcObject = null;
    }
  };

  private drawContent(
    canvasContext: CanvasRenderingContext2D,
    screenShortController: HTMLCanvasElement
  ) {
    // 赋值截图区域canvas画布
    this.screenShortCanvas = canvasContext;
    // 绘制蒙层
    drawMasking(
      canvasContext,
      screenShortController.width,
      screenShortController.height
    );

    // 添加监听
    screenShortController.addEventListener("mousedown", this.mouseDownEvent);
    screenShortController.addEventListener("mousemove", this.mouseMoveEvent);
    screenShortController.addEventListener("mouseup", this.mouseUpEvent);
  }

  // 鼠标按下事件
  private mouseDownEvent = (event: MouseEvent) => {
    // 当前操作的是撤销
    if (this.toolName == "undo") return;
    this.dragging = true;
    this.clickFlag = true;
    const mouseX = nonNegativeData(event.offsetX);
    const mouseY = nonNegativeData(event.offsetY);

    // 如果当前操作的是截图工具栏
    if (this.data.getToolClickStatus().value) {
      // 记录当前鼠标开始坐标
      this.drawGraphPosition.startX = mouseX;
      this.drawGraphPosition.startY = mouseY;
    }
    // 当前操作的是画笔
    if (this.toolName == "brush" && this.screenShortCanvas) {
      // 初始化画笔
      initPencil(this.screenShortCanvas, mouseX, mouseY);
    }
    // 当前操作的文本
    if (
      this.toolName == "text" &&
      this.textInputController?.value &&
      this.screenShortController?.value &&
      this.screenShortCanvas
    ) {
      // 显示文本输入区域
      this.data.setTextStatus(true);
      // 判断输入框位置是否变化
      if (
        this.textInputPosition.mouseX != 0 &&
        this.textInputPosition.mouseY != 0 &&
        this.textInputPosition.mouseX != mouseX &&
        this.textInputPosition.mouseY != mouseY
      ) {
        drawText(
          this.textInputController.value?.innerText,
          this.textInputPosition.mouseX,
          this.textInputPosition.mouseY,
          this.data.getSelectedColor().value,
          this.fontSize,
          this.screenShortCanvas
        );
        // 清空文本输入区域的内容
        this.textInputController.value.innerHTML = "";
        // 保存绘制记录
        this.addHistory();
      }
      // 修改文本区域位置
      this.textInputController.value.style.left = mouseX + "px";
      this.textInputController.value.style.fontSize = this.fontSize + "px";
      this.textInputController.value.style.fontFamily = "none";
      this.textInputController.value.style.color = this.data.getSelectedColor().value;
      setTimeout(() => {
        // 获取焦点
        if (this.textInputController?.value) {
          // 获取输入框容器的高度
          const containerHeight = this.textInputController.value.offsetHeight;
          // 输入框容器y轴的位置需要在坐标的基础上再加上容器高度的一半，容器的位置就正好居中于光标
          // canvas渲染的时候就不会出现位置不一致的问题了
          const textMouseY = mouseY - Math.floor(containerHeight / 2);
          this.textInputController.value.style.top = textMouseY + "px";
          // 获取焦点
          this.textInputController.value.focus();
          // 记录当前输入框位置
          this.textInputPosition = { mouseX: mouseX, mouseY: mouseY };
          this.textInfo = {
            positionX: mouseX,
            positionY: mouseY,
            color: this.data.getSelectedColor().value,
            size: this.fontSize
          };
        }
      });
    }

    // 如果操作的是裁剪框
    if (this.borderOption) {
      // 设置为拖动状态
      this.draggingTrim = true;
      // 记录移动时的起始点坐标
      this.movePosition.moveStartX = mouseX;
      this.movePosition.moveStartY = mouseY;
    } else {
      // 保存当前裁剪框的坐标
      this.drawGraphPrevX = this.drawGraphPosition.startX;
      this.drawGraphPrevY = this.drawGraphPosition.startY;
      // 绘制裁剪框,记录当前鼠标开始坐标
      this.drawGraphPosition.startX = mouseX;
      this.drawGraphPosition.startY = mouseY;
    }
  };

  // 鼠标移动事件
  private mouseMoveEvent = (event: MouseEvent) => {
    if (
      this.screenShortCanvas == null ||
      this.screenShortController.value == null ||
      this.toolName == "undo"
    ) {
      return;
    }

    // 工具栏未选择且鼠标处于按下状态时
    if (!this.data.getToolClickStatus().value && this.dragging) {
      // 修改拖动状态为true;
      this.dragFlag = true;
      // 隐藏截图工具栏
      this.data.setToolStatus(false);
    }
    this.clickFlag = false;
    // 获取当前绘制中的工具位置信息
    const { startX, startY, width, height } = this.drawGraphPosition;
    // 获取当前鼠标坐标
    const currentX = nonNegativeData(event.offsetX);
    const currentY = nonNegativeData(event.offsetY);
    // 绘制中工具的临时宽高
    const tempWidth = currentX - startX;
    const tempHeight = currentY - startY;
    // 工具栏绘制
    if (this.data.getToolClickStatus().value && this.dragging) {
      // 获取裁剪框位置信息
      const cutBoxPosition = this.data.getCutOutBoxPosition();
      // 绘制中工具的起始x、y坐标不能小于裁剪框的起始坐标
      // 绘制中工具的起始x、y坐标不能大于裁剪框的结束标作
      // 当前鼠标的x坐标不能小于裁剪框起始x坐标，不能大于裁剪框的结束坐标
      // 当前鼠标的y坐标不能小于裁剪框起始y坐标，不能大于裁剪框的结束坐标
      if (
        !getDrawBoundaryStatus(startX, startY, cutBoxPosition) ||
        !getDrawBoundaryStatus(currentX, currentY, cutBoxPosition)
      )
        return;
      // 当前操作的不是马赛克则显示最后一次画布绘制时的状态
      if (this.toolName != "mosaicPen") {
        this.showLastHistory();
      }
      switch (this.toolName) {
        case "square":
          drawRectangle(
            startX,
            startY,
            tempWidth,
            tempHeight,
            this.data.getSelectedColor().value,
            this.data.getPenSize().value,
            this.screenShortCanvas
          );
          break;
        case "round":
          drawCircle(
            this.screenShortCanvas,
            currentX,
            currentY,
            startX,
            startY,
            this.data.getPenSize().value,
            this.data.getSelectedColor().value
          );
          break;
        case "right-top":
          this.drawArrow.draw(
            this.screenShortCanvas,
            startX,
            startY,
            currentX,
            currentY,
            this.data.getSelectedColor().value
          );
          break;
        case "brush":
          // 画笔绘制
          drawPencil(
            this.screenShortCanvas,
            currentX,
            currentY,
            this.data.getPenSize().value,
            this.data.getSelectedColor().value
          );
          break;
        case "mosaicPen":
          // 绘制马赛克，为了确保鼠标位置在绘制区域中间，所以对x、y坐标进行-10处理
          drawMosaic(
            currentX - 10,
            currentY - 10,
            this.data.getPenSize().value,
            this.degreeOfBlur,
            this.screenShortCanvas
          );
          break;
        default:
          break;
      }
      return;
    }
    // 执行裁剪框操作函数
    this.operatingCutOutBox(
      currentX,
      currentY,
      startX,
      startY,
      width,
      height,
      this.screenShortCanvas
    );
    // 如果鼠标未点击或者当前操作的是裁剪框都return
    if (!this.dragging || this.draggingTrim) return;
    // 绘制裁剪框
    this.tempGraphPosition = drawCutOutBox(
      startX,
      startY,
      tempWidth,
      tempHeight,
      this.screenShortCanvas,
      this.borderSize,
      this.screenShortController.value as HTMLCanvasElement,
      this.screenShortImageController as HTMLCanvasElement
    ) as drawCutOutBoxReturnType;
  };

  /**
   * 从窗口数据流中截取页面body内容
   * @param videoWidth 窗口宽度
   * @param videoHeight 窗口高度
   * @param containerWidth body内容宽度
   * @param containerHeight body内容高度
   * @private
   */
  private getWindowContentData(
    videoWidth: number,
    videoHeight: number,
    containerWidth: number,
    containerHeight: number
  ) {
    const videoCanvas = document.createElement("canvas");
    videoCanvas.width = videoWidth;
    videoCanvas.height = videoHeight;
    const videoContext = getCanvas2dCtx(videoCanvas, videoWidth, videoHeight);
    if (videoContext) {
      videoContext.drawImage(this.videoController, 0, 0);
      const startX = 0;
      const startY = videoHeight - containerHeight;
      const width = containerWidth;
      const height = videoHeight - startY;
      // 获取裁剪框区域图片信息;
      return videoContext.getImageData(
        startX * this.dpr,
        startY * this.dpr,
        width * this.dpr,
        height * this.dpr
      );
    }
    return null;
  }

  // 鼠标抬起事件
  private mouseUpEvent = () => {
    // 当前操作的是撤销
    if (this.toolName == "undo") return;
    // 绘制结束
    this.dragging = false;
    this.draggingTrim = false;
    if (
      this.screenShortController.value == null ||
      this.screenShortCanvas == null ||
      this.screenShortImageController == null
    ) {
      return;
    }

    // 工具栏未点击且鼠标未拖动且单击截屏状态为false则复原裁剪框位置
    if (
      !this.data.getToolClickStatus().value &&
      !this.dragFlag &&
      !this.clickCutFullScreen
    ) {
      // 复原裁剪框的坐标
      this.drawGraphPosition.startX = this.drawGraphPrevX;
      this.drawGraphPosition.startY = this.drawGraphPrevY;
      return;
    }
    // 调用者尚未拖拽生成选区
    // 鼠标尚未拖动
    // 单击截取屏幕状态为true
    // 则截取整个屏幕
    const cutBoxPosition = this.data.getCutOutBoxPosition();
    if (
      cutBoxPosition.width === 0 &&
      cutBoxPosition.height === 0 &&
      cutBoxPosition.startX === 0 &&
      cutBoxPosition.startY === 0 &&
      !this.dragFlag &&
      this.clickCutFullScreen
    ) {
      this.getFullScreenStatus = true;
      // 设置裁剪框位置为全屏
      this.tempGraphPosition = drawCutOutBox(
        0,
        0,
        this.screenShortController.value.width - this.borderSize / 2,
        this.screenShortController.value.height - this.borderSize / 2,
        this.screenShortCanvas,
        this.borderSize,
        this.screenShortController.value,
        this.screenShortImageController
      ) as drawCutOutBoxReturnType;
    }
    if (this.data.getToolClickStatus().value) {
      // 保存绘制记录
      this.addHistory();
      return;
    }
    // 保存绘制后的图形位置信息
    this.drawGraphPosition = this.tempGraphPosition;
    // 如果工具栏未点击则保存裁剪框位置
    if (!this.data.getToolClickStatus().value) {
      const { startX, startY, width, height } = this.drawGraphPosition;
      this.data.setCutOutBoxPosition(startX, startY, width, height);
    }
    // 保存边框节点信息
    this.cutOutBoxBorderArr = saveBorderArrInfo(
      this.borderSize,
      this.drawGraphPosition
    );
    if (this.screenShortController.value != null) {
      // 修改鼠标状态为拖动
      this.screenShortController.value.style.cursor = "move";
      // 复原拖动状态
      this.dragFlag = false;
      // 显示截图工具栏
      this.data.setToolStatus(true);
      nextTick().then(() => {
        if (
          this.toolController.value != null &&
          this.screenShortController.value
        ) {
          // 计算截图工具栏位置
          const toolLocation = calculateToolLocation(
            this.drawGraphPosition,
            this.toolController.value?.offsetWidth,
            this.screenShortController.value.width / this.dpr
          );
          // 当前截取的是全屏，则修改工具栏的位置到截图容器最底部，防止超出
          if (this.getFullScreenStatus) {
            const containerHeight = parseInt(
              this.screenShortController.value.style.height
            );
            // 重新计算工具栏的x轴位置
            const toolPositionX =
              (this.drawGraphPosition.width / this.dpr -
                this.toolController.value.offsetWidth) /
              2;
            toolLocation.mouseY = containerHeight - this.fullScreenDiffHeight;
            toolLocation.mouseX = toolPositionX;
          }

          if (this.screenShortController.value) {
            const containerHeight = parseInt(
              this.screenShortController.value.style.height
            );

            // 工具栏的位置超出截图容器时，调整工具栏位置防止超出
            if (toolLocation.mouseY > containerHeight - 64) {
              toolLocation.mouseY -= this.drawGraphPosition.height + 64;

              // 超出屏幕顶部时
              if (toolLocation.mouseY < 0) {
                const containerHeight = parseInt(
                  this.screenShortController.value.style.height
                );
                toolLocation.mouseY =
                  containerHeight - this.fullScreenDiffHeight;
              }
            }
          }

          // 设置截图工具栏位置
          this.data.setToolInfo(toolLocation.mouseX, toolLocation.mouseY);
          // 状态重置
          this.getFullScreenStatus = false;
        }
      });
    }
  };

  /**
   * 操作裁剪框
   * @param currentX 裁剪框当前x轴坐标
   * @param currentY 裁剪框当前y轴坐标
   * @param startX 鼠标x轴坐标
   * @param startY 鼠标y轴坐标
   * @param width 裁剪框宽度
   * @param height 裁剪框高度
   * @param context 需要进行绘制的canvas画布
   * @private
   */
  private operatingCutOutBox(
    currentX: number,
    currentY: number,
    startX: number,
    startY: number,
    width: number,
    height: number,
    context: CanvasRenderingContext2D
  ) {
    // canvas元素不存在
    if (this.screenShortController.value == null) {
      return;
    }
    // 获取鼠标按下时的坐标
    const { moveStartX, moveStartY } = this.movePosition;

    // 裁剪框边框节点事件存在且裁剪框未进行操作，则对鼠标样式进行修改
    if (this.cutOutBoxBorderArr.length > 0 && !this.draggingTrim) {
      // 标识鼠标是否在裁剪框内
      let flag = false;
      // 判断鼠标位置
      context.beginPath();
      for (let i = 0; i < this.cutOutBoxBorderArr.length; i++) {
        context.rect(
          this.cutOutBoxBorderArr[i].x,
          this.cutOutBoxBorderArr[i].y,
          this.cutOutBoxBorderArr[i].width,
          this.cutOutBoxBorderArr[i].height
        );
        // 当前坐标点处于8个可操作点上，修改鼠标指针样式
        if (context.isPointInPath(currentX * this.dpr, currentY * this.dpr)) {
          switch (this.cutOutBoxBorderArr[i].index) {
            case 1:
              if (this.data.getToolClickStatus().value) {
                // 修改截图容器内的鼠标样式
                updateContainerMouseStyle(
                  this.screenShortController.value,
                  this.toolName
                );
              } else {
                this.screenShortController.value.style.cursor = "move";
              }
              break;
            case 2:
              // 工具栏被点击则不改变指针样式
              if (this.data.getToolClickStatus().value) break;
              this.screenShortController.value.style.cursor = "ns-resize";
              break;
            case 3:
              // 工具栏被点击则不改变指针样式
              if (this.data.getToolClickStatus().value) break;
              this.screenShortController.value.style.cursor = "ew-resize";
              break;
            case 4:
              // 工具栏被点击则不改变指针样式
              if (this.data.getToolClickStatus().value) break;
              this.screenShortController.value.style.cursor = "nwse-resize";
              break;
            case 5:
              // 工具栏被点击则不改变指针样式
              if (this.data.getToolClickStatus().value) break;
              this.screenShortController.value.style.cursor = "nesw-resize";
              break;
            default:
              break;
          }
          this.borderOption = this.cutOutBoxBorderArr[i].option;
          flag = true;
          break;
        }
      }
      context.closePath();
      if (!flag) {
        // 鼠标移出裁剪框重置鼠标样式
        this.screenShortController.value.style.cursor = "default";
        // 重置当前操作的边框节点为null
        this.borderOption = null;
      }
    }

    // 裁剪框正在被操作
    if (this.draggingTrim) {
      // 当前操作节点为1时则为移动裁剪框
      if (this.borderOption === 1) {
        // 计算要移动的x轴坐标
        let x = fixedData(
          currentX - (moveStartX - startX),
          width,
          this.screenShortController.value.width
        );
        // 计算要移动的y轴坐标
        let y = fixedData(
          currentY - (moveStartY - startY),
          height,
          this.screenShortController.value.height
        );
        // 计算画布面积
        const containerWidth =
          this.screenShortController.value.width / this.dpr;
        const containerHeight =
          this.screenShortController.value.height / this.dpr;
        // 计算裁剪框在画布上所占的面积
        const cutOutBoxSizeX = x + width;
        const cutOutBoxSizeY = y + height;
        // 超出画布的可视区域，进行位置修正
        if (cutOutBoxSizeX > containerWidth) {
          x = containerWidth - width;
        }
        if (cutOutBoxSizeY > containerHeight) {
          y = containerHeight - height;
        }

        // 重新绘制裁剪框
        this.tempGraphPosition = drawCutOutBox(
          x,
          y,
          width,
          height,
          context,
          this.borderSize,
          this.screenShortController.value as HTMLCanvasElement,
          this.screenShortImageController as HTMLCanvasElement
        ) as drawCutOutBoxReturnType;
      } else {
        // 裁剪框其他8个点的拖拽事件
        const {
          tempStartX,
          tempStartY,
          tempWidth,
          tempHeight
        } = zoomCutOutBoxPosition(
          currentX,
          currentY,
          startX,
          startY,
          width,
          height,
          this.borderOption as number
        ) as zoomCutOutBoxReturnType;
        // 绘制裁剪框
        this.tempGraphPosition = drawCutOutBox(
          tempStartX,
          tempStartY,
          tempWidth,
          tempHeight,
          context,
          this.borderSize,
          this.screenShortController.value as HTMLCanvasElement,
          this.screenShortImageController as HTMLCanvasElement
        ) as drawCutOutBoxReturnType;
      }
    }
  }

  /**
   * 裁剪框工具栏点击事件
   * @param toolName
   * @param index
   * @param mouseEvent
   */
  public toolClickEvent = (
    toolName: string,
    index: number,
    mouseEvent: MouseEvent
  ) => {
    // 更新当前点击的工具栏条目
    this.toolName = toolName;
    const screenShortController = this.data.getScreenShortController();
    const ScreenShortImageController = this.data.getScreenShortImageController();
    if (
      screenShortController.value == null ||
      ScreenShortImageController == null
    )
      return;
    // 获取canvas容器
    const screenShortCanvas = screenShortController.value.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
    // 工具栏尚未点击，当前属于首次点击，重新绘制一个无像素点的裁剪框
    if (!this.data.getToolClickStatus().value) {
      // 获取裁剪框位置信息
      const cutBoxPosition = this.data.getCutOutBoxPosition();
      // 开始绘制无像素点裁剪框
      drawCutOutBox(
        cutBoxPosition.startX,
        cutBoxPosition.startY,
        cutBoxPosition.width,
        cutBoxPosition.height,
        screenShortCanvas,
        this.borderSize,
        screenShortController.value,
        ScreenShortImageController,
        false
      );
    }
    this.data.setToolName(toolName);
    // 为当前点击项添加选中时的class名
    setSelectedClassName(mouseEvent, index, false);
    if (toolName != "text") {
      // 显示画笔选择工具栏
      this.data.setOptionStatus(true);
      // 设置画笔选择工具栏三角形角标位置
      this.data.setOptionIcoPosition(calculateOptionIcoPosition(index));
    } else {
      // 隐藏画笔工具栏
      this.data.setOptionStatus(false);
    }
    // 清空文本输入区域的内容并隐藏文本输入框
    if (
      this.textInputController?.value != null &&
      this.data.getTextStatus() &&
      this.screenShortCanvas
    ) {
      const text = this.textInputController.value.innerText;
      if (text && text !== "") {
        const { positionX, positionY, color, size } = this.textInfo;
        drawText(
          text,
          positionX,
          positionY,
          color,
          size,
          this.screenShortCanvas
        );
        // 添加历史记录
        this.addHistory();
      }
      this.textInputController.value.innerHTML = "";
      this.data.setTextStatus(false);
    }
    // 初始化点击状态
    this.dragging = false;
    this.draggingTrim = false;

    // 保存图片
    if (toolName == "save") {
      this.getCanvasImgData(true);
    }
    // 销毁组件
    if (toolName == "close") {
      this.resetComponent();
    }
    // 确认截图
    if (toolName == "confirm" && this.screenShortCanvas && this.emit) {
      const base64 = this.getCanvasImgData(false);
      this.emit("get-image-data", base64);
    }
    // 撤销
    if (toolName == "undo") {
      // 隐藏画笔选项工具栏
      this.data.setOptionStatus(false);
      this.takeOutHistory();
    }

    // 设置裁剪框工具栏为点击状态
    this.data.setToolClickStatus(true);
  };

  /**
   * 保存当前画布状态
   * @private
   */
  private addHistory() {
    if (
      this.screenShortCanvas != null &&
      this.screenShortController.value != null
    ) {
      // 获取canvas画布与容器
      const context = this.screenShortCanvas;
      const controller = this.screenShortController.value;
      if (this.history.length > this.maxUndoNum) {
        // 删除最早的一条画布记录
        this.history.shift();
      }
      // 保存当前画布状态
      this.history.push({
        data: context.getImageData(0, 0, controller.width, controller.height)
      });
      // 启用撤销按钮
      this.data.setUndoStatus(true);
    }
  }

  /**
   * 显示最新的画布状态
   * @private
   */
  private showLastHistory() {
    if (this.screenShortCanvas != null) {
      const context = this.screenShortCanvas;
      if (this.history.length <= 0) {
        this.addHistory();
      }
      context.putImageData(this.history[this.history.length - 1]["data"], 0, 0);
    }
  }

  /**
   * 取出一条历史记录
   */
  private takeOutHistory() {
    this.history.pop();
    if (this.screenShortCanvas != null && this.history.length > 0) {
      const context = this.screenShortCanvas;
      context.putImageData(this.history[this.history.length - 1]["data"], 0, 0);
    }

    this.undoClickNum++;
    // 历史记录已取完，禁用撤回按钮点击
    if (this.history.length - 1 <= 0) {
      this.undoClickNum = 0;
      this.data.setUndoStatus(false);
    }
  }

  /**
   * 重置组件
   */
  private resetComponent = () => {
    if (this.emit) {
      // 隐藏截图工具栏
      this.data.setToolStatus(false);
      // 初始化响应式变量
      this.data.setInitStatus(true);
      // 销毁组件
      this.destroyDOM();
      // 还原滚动条状态
      if (this.hiddenScrollBar.state) {
        this.updateScrollbarState(false);
      }
      this.emit("destroy-component", false);
      return;
    }
    throw "组件重置失败";
  };

  // 销毁截图容器
  private destroyDOM() {
    const screenShotPanel = document.getElementById("screenShotPanel");
    if (screenShotPanel && screenShotPanel.parentNode === document.body) {
      document.body.removeChild(screenShotPanel);
    }
  }

  private updateScrollbarState(state = true) {
    // 隐藏滚动条
    if (state) {
      document.documentElement.classList.add("hidden-screen-shot-scroll");
      document.body.classList.add("hidden-screen-shot-scroll");
      return;
    }
    // 还原滚动条状态
    document.documentElement.classList.remove("hidden-screen-shot-scroll");
    document.body.classList.remove("hidden-screen-shot-scroll");
  }

  /**
   * 将指定区域的canvas转为图片
   * @private
   */
  private getCanvasImgData = (isSave: boolean) => {
    const plugInParameters = new PlugInParameters();
    // 获取裁剪区域位置信息
    const { startX, startY, width, height } = this.data.getCutOutBoxPosition();
    let base64 = "";
    // 保存图片,需要减去八个点的大小
    if (this.screenShortCanvas) {
      if (isSave) {
        // 将canvas转为图片
        saveCanvasToImage(
          this.screenShortCanvas,
          startX,
          startY,
          width,
          height
        );
      } else {
        // 将canvas转为base64
        base64 = saveCanvasToBase64(
          this.screenShortCanvas,
          startX,
          startY,
          width,
          height,
          0.75,
          plugInParameters.getWriteImgState()
        );
      }
    }
    // 重置组件
    this.resetComponent();
    return base64;
  };
}
