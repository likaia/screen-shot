import { App } from "vue";
import screenShort from "@/components/screen-short.vue";
import PlugInParameters from "@/module/main-entrance/PlugInParameters";

export default {
  install(app: App, options: { enableWebRtc: boolean; level: number }): void {
    const plugInParameters = new PlugInParameters();
    if (
      options &&
      Object.prototype.hasOwnProperty.call(options, "enableWebRtc")
    ) {
      plugInParameters.setWebRtcStatus(options?.enableWebRtc);
      plugInParameters.setLevel(options?.level);
    }
    // 将截屏组件挂载到vue实例
    app.component(screenShort.name, screenShort);
  }
};
