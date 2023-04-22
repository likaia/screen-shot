/**
 * 绘制蒙层
 * @param context 需要进行绘制canvas
 * @param canvasWidth
 * @param canvasHeight
 */
export function drawMasking(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) {
  // 清除画布
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  // 绘制蒙层
  context.save();
  context.fillStyle = "rgba(0, 0, 0, .6)";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  // 绘制结束
  context.restore();
}
