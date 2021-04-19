let enableWebRtc = true;

// 数据初始化标识
let initStatus = false;
let level = 0;

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
}
