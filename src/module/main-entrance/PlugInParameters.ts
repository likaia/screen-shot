import { hideBarInfoType, toolIcoType } from "@/module/type/ComponentType";

let enableWebRtc = true;
let writeBase64 = true;
let hiddenScrollBar = {
  color: "#000000",
  state: false,
  fillWidth: 0,
  fillHeight: 0,
  fillState: false
};

// 数据初始化标识
let initStatus = false;
let level = 0;
// 单击截取屏启用状态
let clickCutFullScreen = false;
// 需要隐藏的工具栏图标
let hiddenToolIco: toolIcoType = {};
// html2canvas模式是否启用跨域图片加载模式
let enableCORS = false;
let proxyAddress: string | undefined = undefined;
let wrcWindowMode = false;
export default class PlugInParameters {
  constructor() {
    // 标识为true时则初始化数据
    if (initStatus) {
      enableWebRtc = true;
      writeBase64 = true;
      wrcWindowMode = false;
      // 初始化完成设置其值为false
      initStatus = false;
      level = 0;
    }
  }

  // 设置数据初始化标识
  public setInitStatus(status: boolean) {
    initStatus = status;
  }

  // 获取数据初始化标识
  public getInitStatus() {
    return initStatus;
  }

  // 获取webrtc启用状态
  public getWebRtcStatus() {
    return enableWebRtc;
  }

  // 设置webrtc启用状态
  public setWebRtcStatus(status: boolean) {
    enableWebRtc = status;
  }

  public getLevel() {
    return level;
  }

  public setLevel(val: number) {
    level = val;
  }

  public getClickCutFullScreenStatus() {
    return clickCutFullScreen;
  }

  public setClickCutFullScreenStatus(value: boolean) {
    clickCutFullScreen = value;
  }

  public getHiddenToolIco() {
    return hiddenToolIco;
  }

  public setHiddenToolIco(obj: toolIcoType) {
    hiddenToolIco = obj;
  }

  public getEnableCORSStatus(): boolean {
    return enableCORS;
  }

  public setEnableCORSStatus(status: boolean) {
    enableCORS = status;
  }

  public getProxyAddress(): string | undefined {
    return proxyAddress;
  }

  public setProxyAddress(address: string) {
    proxyAddress = address;
  }

  // 设置截图数据的写入状态
  public setWriteImgState(state: boolean) {
    writeBase64 = state;
  }
  public getWriteImgState() {
    return writeBase64;
  }

  public setHiddenScrollBarInfo(info: hideBarInfoType) {
    const { state, color, fillWidth, fillHeight, fillState } = info;
    hiddenScrollBar = {
      state,
      color: color ? color : "#000000",
      fillWidth: fillWidth ? fillWidth : 0,
      fillHeight: fillHeight ? fillHeight : 0,
      fillState: fillState ? fillState : false
    };
  }

  public getHiddenScrollBarInfo() {
    return hiddenScrollBar;
  }

  public setWrcWindowMode(state: boolean) {
    wrcWindowMode = state;
  }

  public getWrcWindowMode() {
    return wrcWindowMode;
  }
}
