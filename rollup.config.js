import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import delFile from "rollup-plugin-delete";
import postcss from "rollup-plugin-postcss";
import vue from "rollup-plugin-vue";
import autoprefixer from "autoprefixer";
import copy from "rollup-plugin-copy";
import path from "path";
import alias from "@rollup/plugin-alias";
import postcssImport from "postcss-import";
import postcssUrl from "postcss-url";
import url from "@rollup/plugin-url";
import cssOnly from "rollup-plugin-css-only";
import cssnano from "cssnano";
import yargs from "yargs";
import { terser } from "rollup-plugin-terser";

// 使用yargs解析命令行执行时的添加参数
const commandLineParameters = yargs(process.argv.slice(1)).options({
  // css文件独立状态,默认为内嵌
  splitCss: { type: "string", alias: "spCss", default: "false" },
  // 打包格式, 默认为 umd,esm,common 三种格式
  packagingFormat: {
    type: "string",
    alias: "pkgFormat",
    default: "umd,esm,common"
  },
  // 打包后的js压缩状态
  compressedState: { type: "string", alias: "compState", default: "false" }
}).argv;
// 需要让rollup忽略的自定义参数
const ignoredWarningsKey = [...Object.keys(commandLineParameters)];
const splitCss = commandLineParameters.splitCss;
const packagingFormat = commandLineParameters.packagingFormat.split(",");
const compressedState = commandLineParameters.compressedState;

/**
 * 根据外部条件判断是否需要给对象添加属性
 * @param obj 对象名
 * @param condition 条件
 * @param propName 属性名
 * @param propValue 属性值
 */
const addProperty = (obj, condition, propName, propValue) => {
  // 条件成立则添加
  if (condition) {
    obj[propName] = propValue;
  }
};

// 处理output对象中的format字段(传入的参数会与rollup所定义的参数不符，因此需要在这里进行转换)
const buildFormat = formatVal => {
  let finalFormatVal = formatVal;
  switch (formatVal) {
    case "esm":
      finalFormatVal = "es";
      break;
    case "common":
      finalFormatVal = "cjs";
      break;
    default:
      break;
  }
  return finalFormatVal;
};

// 生成打包配置
const buildConfig = () => {
  const outputConfig = [];
  for (let i = 0; i < packagingFormat.length; i++) {
    const pkgFormat = packagingFormat[i];
    // 根据packagingFormat字段来构建对应格式的包
    const config = {
      file: `dist/screenShotPlugin.${pkgFormat}.js`,
      format: buildFormat(pkgFormat),
      name: "screenShotPlugin",
      globals: {
        vue: "Vue"
      }
    };
    // 是否需要对代码进行压缩
    addProperty(config, compressedState === "true", "plugins", [terser()]);
    addProperty(config, pkgFormat === "common", "exports", "named");
    outputConfig.push(config);
  }
  return outputConfig;
};

export default {
  input: "src/main.ts",
  output: buildConfig(),
  external: ["vue"],
  // 警告处理钩子
  onwarn: function(warning, rollupWarn) {
    const message = warning.message;
    let matchingResult = false;
    for (let i = 0; i < ignoredWarningsKey.length; i++) {
      if (message.indexOf(ignoredWarningsKey[i]) !== -1) {
        matchingResult = true;
        break;
      }
    }
    if (warning.code === "UNKNOWN_OPTION" && matchingResult) {
      return;
    }
    rollupWarn(warning);
  },
  plugins: [
    vue({
      target: "browser",
      css: true,
      // 把组件转换成 render 函数
      compileTemplate: true,
      preprocessStyles: true,
      preprocessOptions: {
        scss: {
          includePaths: ["src/assets/scss"]
        }
      }
    }),
    // 用于将vue组件中用到的css文件独立出来
    splitCss === "true" ? cssOnly({ output: "style/screen-shot.css" }) : "",
    nodeResolve(),
    commonjs(),
    alias({
      entries: [{ find: "@", replacement: path.resolve(__dirname, "src") }]
    }),
    typescript({
      tsconfig: "tsconfig.json",
      clean: true
    }),
    // 此处用来处理外置css, 需要在入口文件中使用import来导入css文件
    postcss({
      // 内联css
      extract: splitCss === "true" ? splitCss : "css/screen-shot.css",
      minimize: true,
      sourceMap: false,
      extensions: [".css", ".scss"],
      // 当前正在处理的CSS文件的路径, postcssUrl在拷贝资源时需要根据它来定位目标文件
      to: path.resolve(__dirname, "dist/assets/*"),
      use: ["sass"],
      // autoprefixer: 给css3的一些属性加前缀
      // postcssImport: 处理css文件中的@import语句
      // cssnano: 它可以通过移除注释、空格和其他不必要的字符来压缩CSS代码
      plugins: [
        autoprefixer(),
        postcssImport(),
        // 对scss中的别名进行统一替换处理（vue组件内置或者入口导入的scss文件都会走这里的规则）
        postcssUrl([
          {
            filter: "**/*.*",
            url(asset) {
              return asset.url.replace(/~@/g, ".");
            }
          }
        ]),
        //再次调用将css中引入的图片按照规则进行处理
        postcssUrl([
          {
            basePath: path.resolve(__dirname, "src"),
            url: "inline",
            maxSize: 8, // 最大文件大小（单位为KB），超过该大小的文件将不会被编码为base64
            fallback: "copy", // 如果文件大小超过最大大小，则使用'copy'选项复制文件
            useHash: true, // 进行hash命名
            encodeType: "base64" // 指定编码类型为base64
          }
        ]),
        cssnano({
          preset: "default" // 使用默认配置
        })
      ]
    }),
    // 处理通过img标签引入的图片
    url({
      include: ["**/*.jpg", "**/*.png", "**/*.svg"],
      // 输出路径
      dest: "dist/assets",
      // 超过10kb则拷贝否则转base64
      limit: 10 * 1024 // 10KB
    }),
    babel({
      exclude: "node_modules/**",
      babelHelpers: "bundled",
      bundled: "auto"
    }),
    copy({
      targets: [
        {
          src: "src/assets/fonts/**",
          dest: "dist/assets/fonts"
        }
      ]
    }),
    delFile({ targets: "dist/*" })
  ]
};
