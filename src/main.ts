import { App } from "vue";
import screenShort from "@/components/screen-short.vue";
import PlugInParameters from "@/module/main-entrance/PlugInParameters";
import { screenShotType } from "@/module/type/ComponentType";
import "@/assets/scss/global.scss";

export default {
  install(app: App, options: screenShotType): void {
    const plugInParameters = new PlugInParameters();
    if (options?.enableWebRtc != null) {
      plugInParameters.setWebRtcStatus(options.enableWebRtc);
    }

    if (options?.level != null) {
      plugInParameters.setLevel(options.level);
    }

    if (options?.clickCutFullScreen != null) {
      plugInParameters.setClickCutFullScreenStatus(options.clickCutFullScreen);
    }

    if (options?.hiddenToolIco) {
      plugInParameters.setHiddenToolIco(options.hiddenToolIco);
    }

    if (options?.enableCORS) {
      plugInParameters.setEnableCORSStatus(options.enableCORS);
    }

    if (options?.proxyAddress) {
      plugInParameters.setProxyAddress(options.proxyAddress);
    }
    if (options?.writeBase64 != null) {
      plugInParameters.setWriteImgState(options.writeBase64);
    }
    if (options?.hiddenScrollBar != null) {
      plugInParameters.setHiddenScrollBarInfo(options.hiddenScrollBar);
    }

    // 将截屏组件挂载到vue实例
    app.component(screenShort.name, screenShort);
  }
};
