<template>
  <teleport to="body">
    <div id="screenShotPanel">
      <!--截图区域-->
      <canvas
        id="screenShotContainer"
        :width="screenShortWidth"
        :height="screenShortHeight"
        ref="screenShortController"
      ></canvas>
      <!--工具栏-->
      <div
        id="toolPanel"
        v-show="toolStatus"
        :style="{ left: toolLeft + 'px', top: toolTop + 'px' }"
        ref="toolController"
      >
        <!--  保存图标需要根据参数来决定是否显示  -->
        <div
          v-for="item in toolbar"
          :key="item.id"
          v-show="!(item.title === 'save' && hiddenToolIco?.save === true)"
          :class="`item-panel ${item.title} `"
          @click="toolClickEvent(item.title, item.id, $event)"
        ></div>
        <!--撤销部分单独处理, 加多了图标是否需要隐藏的判断-->
        <div
          v-if="undoStatus && !hiddenToolIco?.undo === true"
          class="item-panel undo"
          @click="toolClickEvent('undo', 9, $event)"
        ></div>
        <div
          v-if="!undoStatus && !hiddenToolIco?.undo === true"
          class="item-panel undo-disabled"
        ></div>

        <!--关闭与确认进行单独处理-->
        <div
          class="item-panel close"
          @click="toolClickEvent('close', 10, $event)"
        ></div>
        <!-- 加多了图标是否需要隐藏的判断 -->
        <div
          class="item-panel confirm"
          v-if="!hiddenToolIco?.confirm === true"
          @click="toolClickEvent('confirm', 11, $event)"
        ></div>
      </div>
      <!--画笔绘制选项-->
      <div
        class="ico-panel"
        ref="optionIcoController"
        v-show="optionStatus"
        v-if="currentName !== 'mosaicPen'"
        :style="{
          left: toolLeft + optionIcoPosition + 'px',
          top: toolTop + 44 + 'px'
        }"
      ></div>
      <div
        id="optionPanel"
        ref="optionController"
        v-show="optionStatus"
        :style="{ left: toolLeft + 'px', top: toolTop + 44 + 6 + 'px' }"
      >
        <!--画笔大小选择-->
        <div class="brush-select-panel">
          <div
            class="item-panel brush-small brush-small-active"
            @click="setBrushSize('small', 1, $event)"
          ></div>
          <div
            class="item-panel brush-medium"
            @click="setBrushSize('medium', 2, $event)"
          ></div>
          <div
            class="item-panel brush-big"
            @click="setBrushSize('big', 3, $event)"
          ></div>
        </div>

        <div class="right-panel" v-if="currentName !== 'mosaicPen'">
          <!--颜色选择-->
          <div
            class="color-select-panel"
            @click="selectColor()"
            :style="{ background: selectedColor }"
          ></div>
          <div class="color-panel" v-show="colorPanelStatus">
            <div
              class="color-item"
              v-for="index in 10"
              :key="index"
              @click="getColor(index)"
            ></div>
          </div>
          <div class="pull-down-arrow" @click="selectColor()"></div>
        </div>
      </div>
      <!--文本输入区域-->
      <div
        id="textInputPanel"
        ref="textInputController"
        v-show="textStatus"
        contenteditable="true"
        spellcheck="false"
      ></div>
    </div>
  </teleport>
</template>

<script lang="ts">
import initData from "@/module/main-entrance/InitData";
import eventMonitoring from "@/module/main-entrance/EventMonitoring";
import { getColor } from "@/module/common-methords/GetColor";
import { selectColor } from "@/module/common-methords/SelectColor";
import { SetupContext } from "@vue/runtime-core";
import { setBrushSize } from "@/module/common-methords/SetBrushSize";
import toolbar from "@/module/config/Toolbar";

export default {
  name: "screen-short",
  props: {},
  setup(props: Record<string, any>, context: SetupContext<any>) {
    const data = new initData();
    const screenShortWidth = data.getScreenShortWidth();
    const screenShortHeight = data.getScreenShortHeight();
    const screenShortController = data.getScreenShortController();
    const toolController = data.getToolController();
    const textInputController = data.getTextInputController();
    const toolStatus = data.getToolStatus();
    const textStatus = data.getTextStatus();
    const undoStatus = data.getUndoStatus();
    const currentName = data.getToolName();
    const optionStatus = data.getOptionStatus();
    const colorPanelStatus = data.getColorPanelStatus();
    const optionIcoController = data.getOptionIcoController();
    const optionController = data.getOptionController();
    const toolLeft = data.getToolLeft();
    const toolTop = data.getToolTop();
    const optionIcoPosition = data.getOptionIcoPosition();
    const selectedColor = data.getSelectedColor();
    const hiddenToolIco = data.getHiddenToolIco();
    const event = new eventMonitoring(props, context as SetupContext<any>);
    const toolClickEvent = event.toolClickEvent;
    return {
      screenShortWidth,
      screenShortHeight,
      screenShortController,
      textInputController,
      toolController,
      optionIcoController,
      optionController,
      toolStatus,
      textStatus,
      undoStatus,
      optionStatus,
      colorPanelStatus,
      currentName,
      toolLeft,
      toolTop,
      optionIcoPosition,
      selectedColor,
      toolbar,
      toolClickEvent,
      getColor,
      selectColor,
      setBrushSize,
      hiddenToolIco
    };
  },
  emits: {
    // vue3中建议对所有emit事件进行验证
    "destroy-component": (status: boolean) => {
      return status != null;
    },
    "get-image-data": (base64: string) => {
      return base64 != null;
    }
  }
};
</script>

<style scoped lang="scss" src="../assets/scss/screen-short.scss"></style>
