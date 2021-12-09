import { toolIcoType } from "@/module/type/ComponentType";

let enableWebRtc = true;

// 数据初始化标识
let initStatus = false;
let level = 0;
// 单击截取屏启用状态
let clickCutFullScreen = false;
// 需要隐藏的工具栏图标
let hiddenToolIco: toolIcoType = {};

export default class PlugInParameters {
  constructor() {
    // 标识为true时则初始化数据
    if (initStatus) {
      enableWebRtc = true;
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
}
