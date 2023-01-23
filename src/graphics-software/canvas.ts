import { Vec2 } from '../maths/vec2';
import { Vec4 } from '../maths/vec4';

export class Canvas {
  context: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;

  imageData: ImageData;
  pixels: Uint8ClampedArray;
  zBuffer: number[];

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.canvasWidth = context.canvas.width;
    this.canvasHeight = context.canvas.height;
    this.imageData = context.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    this.pixels = this.imageData.data;

    const depthBufferSize = this.pixels.length / 4;
    this.zBuffer = new Array(depthBufferSize).fill(256);
  }

  setPixel(vector: Vec2, color: Vec4, depth: number) {
    const index = (this.canvasWidth * 4)
      * Math.ceil(vector[1] + (this.canvasHeight / 2))
      + (Math.ceil(vector[0] + this.canvasWidth / 2) * 4);

    if (index < this.pixels.length && index > 0) {
      this.pixels[index + 0] = color[0];
      this.pixels[index + 1] = color[1];
      this.pixels[index + 2] = color[2];
      this.pixels[index + 3] = color[3];
    }

    const zIndex = this.canvasWidth
      * (vector[1] + (this.canvasHeight / 2))
      + vector[0]
      + (this.canvasWidth / 2);

    this.zBuffer[zIndex] = depth;
  }

  getDepth(screenPos: Vec4) {
    const index = this.canvasWidth
      * (screenPos[1] + (this.canvasHeight / 2))
      + screenPos[0]
      + (this.canvasWidth / 2);

    return this.zBuffer[index];
  }

  isPixelInScreenSpace(x: number, y: number) {
    const halfWidth = this.canvasWidth / 2;
    const halfHeight = this.canvasHeight / 2;
    return (x > -halfWidth && y > -halfHeight && x < halfWidth && y < halfHeight);
  }

  submitImageData() {
    this.context.putImageData(this.imageData, 0, 0);
  }
}
