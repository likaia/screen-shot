import { App } from "vue";
import screenShort from "@/components/screen-short.vue";

export default {
  install(app: App): void {
    // 将截屏组件挂载到vue实例
    app.component(screenShort.name, screenShort);
  }
};
