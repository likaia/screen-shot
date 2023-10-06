# vue-web-screen-shot · [![npm](https://img.shields.io/badge/npm-v1.5.3-2081C1)](https://www.npmjs.com/package/vue-web-screen-shot) [![yarn](https://img.shields.io/badge/yarn-v1.5.3-F37E42)](https://yarnpkg.com/package/vue-web-screen-shot) [![github](https://img.shields.io/badge/GitHub-depositary-9A9A9A)](https://github.com/likaia/screen-shot) [![](https://img.shields.io/github/issues/likaia/screen-shot)](https://github.com/likaia/screen-shot/issues) [![](	https://img.shields.io/github/forks/likaia/screen-shot)](https://github.com/likaia/screen-shot/network/members) [![](	https://img.shields.io/github/stars/likaia/screen-shot)](https://github.com/likaia/screen-shot/stargazers)
web端自定义截屏插件(Vue3版)，运行视频：[实现web端自定义截屏功能](https://www.bilibili.com/video/BV1Ey4y127cV) , 本插件仅支持Vue3,如需在其他平台使用请移步 ：[js-web-screen-shot](https://www.npmjs.com/package/js-web-screen-shot) 效果图如下：
![截屏效果图](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/486d810877a24582aa8cf110e643c138~tplv-k3u1fbpfcp-watermark.image)

## 写在前面
关于此插件的更多介绍以及实现原理请移步：
- [实现Web端自定义截屏](https://juejin.cn/post/6924368956950052877)
- [实现Web端自定义截屏(JS版)](https://juejin.cn/post/6931901091445473293)

## 插件安装
```bash
yarn add vue-web-screen-shot

# or

npm install vue-web-screen-shot --save
```

## 插件使用
由于插件使用Vue3编写，因此它只能在Vue3项目中运行，如果你需要在vue2项目或者其他js项目中运行请移步：[js-web-screen-shot](https://www.npmjs.com/package/js-web-screen-shot)，它采用原生js编写，功能与本插件功能一致。
> 注意⚠️： 如果需要使用插件的webrtc模式或者截图写入剪切板功能，需要你的网站运行在`https`环境或者`localhost`环境。

* 在项目的入口文件`main.ts/main.js`中加入下述代码
```javascript
// 导入截屏插件
import screenShort from "vue-web-screen-shot";
const app = createApp(App);
// 使用截屏插件
app.use(screenShort, { enableWebRtc: false })
```
* 在你的需要使用的业务代码中，添加下述代码
```vue
<template>
  <!--截图组件-->
  <screen-short v-if="screenshotStatus"
  @destroy-component="destroyComponent"
  @get-image-data="getImg"
  ></screen-short>
</template>

<script lang="ts">

export default defineComponent({
  setup(props, context) {
    const screenshotStatus = ref<boolean>(false);
    // 销毁组件函数
    const destroyComponent = function(status: boolean) {
      screenshotStatus.value = status;
    }
    // 获取裁剪区域图片信息
    const getImg = function(base64: string) {
      console.log("截图组件传递的图片信息", base64);
    }
    
    return {
      screenshotStatus,
      destroyComponent,
      getImg
    }
  }
})
</script>
```
### 参数说明
如示例代码所示，在template中直接使用`screen-short`插件，绑定组件需要的事件处理函数即可。

接下来就跟大家讲下组件中每个属性的意义：
* screenshotStatus 用于控制组件是否出现在dom中
* @destroy-component 用于接收截图组件传递的销毁消息，我们需要在对应的函数中销毁截图组件
* @get-image-data 用于接收截图组件传递的框选区域的base64图片信息，我们需要为他提供一个函数来接收截图组件传递的消息
* @webrtc-error 使用webrtc模式截图时，当用户的浏览器不支持或者未授权时会触发此回调

#### 可选参数
截图插件有一个可选参数，它接受一个对象，对象每个key的作用如下: 
* `enableWebRtc` 是否启用webrtc，值为boolean类型，值为false则使用html2canvas来截图
* `level` 截图容器层级，值为number类型。
* `clickCutFullScreen` 单击截全屏启用状态,值为`boolean`类型， 默认为`false`
* `hiddenToolIco` 需要隐藏的截图工具栏图标，值为`{ save?: boolean; undo?: boolean; confirm?: boolean }`类型，默认为`{}`。传你需要隐藏的图标名称，将值设为`true`即可。
* `enableCORS` html2canvas截图模式下跨域的启用状态,值为`boolean`类型，默认为`false`
* `proxyAddress`  html2canvas截图模式下的图片服务器代理地址,值为`string`类型，默认为`undefined`
* `writeBase64` 是否将截图内容写入剪切板，值为`boolean`类型，默认为`true`
* `wrcWindowMode` 是否启用窗口截图模式，值为`boolean`类型，默认为`false`，即当前标签页截图。如果标签页截图的内容有滚动条或者底部有空缺，可以考虑启用此模式。
* `hiddenScrollBar` 是否隐藏滚动条，用webrtc模式截图时chrome 112版本的浏览器在部分系统下会挤压出现滚动条，如果出现你可以尝试通过此参数来进行修复。值为`Object`类型，有4个属性：
  * `state: boolean`; 启用状态, 默认为`false`
  * `fillState?: boolean`; 填充状态，默认为`false`
  * `color?: string`; 填充层颜色，滚动条隐藏后可能会出现空缺，需要进行填充，默认填充色为黑色。
  * `fillWidth?: number`; 填充层宽度，默认为截图容器的宽度
  * `fillHeight?: number`; 填充层高度，默认为空缺区域的高度

> 使用当前标签页进行截图相对而言用户体验是最好的，但是因为`chrome 112`版本的bug会造成页面内容挤压导致截取到的内容不完整，因此只能采用其他方案来解决此问题了。`wrcWindowMode`和`hiddenScrollBar`都可以解决这个问题。
> * `wrcWindowMode`方案会更完美些，但是用户授权时会出现其他的应用程序选项，用户体验会差一些
> * `hiddenScrollBar`方案还是采用标签页截图，但是会造成内容挤压，底部出现空白。
>
> 两种方案的优点与缺点都讲完了，最好的办法还是希望`chrome`能在之后的版本更新中修复此问题。


## 写在最后
至此，插件的所有使用方法就介绍完了。
