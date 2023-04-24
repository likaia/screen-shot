// 裁剪框节点事件定义
export type cutOutBoxBorder = {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number; // 样式
  option: number; // 操作
};

// 鼠标起始位置坐标
export type movePositionType = {
  moveStartX: number;
  moveStartY: number;
};

// 裁剪框位置参数
export type positionInfoType = {
  startX: number;
  startY: number;
  width: number;
  height: number;
};

// 裁剪框缩放时所返回的数据类型
export type zoomCutOutBoxReturnType = {
  tempStartX: number;
  tempStartY: number;
  tempWidth: number;
  tempHeight: number;
};

// 绘制裁剪框所返回的数据类型
export type drawCutOutBoxReturnType = {
  startX: number;
  startY: number;
  width: number;
  height: number;
};

export type toolIcoType = { save?: boolean; undo?: boolean; confirm?: boolean };

export type screenShotType = {
  enableWebRtc?: boolean; // 是否启用webrtc，默认是启用状态
  level?: number; // 截图容器层级
  clickCutFullScreen?: boolean; // 单击截全屏启用状态, 默认值为false
  hiddenToolIco?: toolIcoType; // 需要隐藏的工具栏图标
  enableCORS?: boolean; // html2canvas截图时跨域启用状态
  proxyAddress?: string; // html2canvas截图时的图片服务器代理地址
  writeBase64?: boolean; // 是否将截图内容写入剪切板
  hiddenScrollBar?: hideBarInfoType; // 是否隐藏滚动条
  wrcWindowMode?: boolean; // 是否启用窗口截图模式，默认为当前标签页截图
};

export type textInfoType = {
  positionX: number;
  positionY: number;
  color: string;
  size: number;
};

export type hideBarInfoType = {
  state: boolean;
  color?: string;
  fillWidth?: number;
  fillHeight?: number;
  fillState?: boolean;
};
