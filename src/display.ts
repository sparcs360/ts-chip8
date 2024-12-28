import sdl from "@kmamal/sdl";
import Canvas from "canvas";

const WIDTH = 64;
const HEIGHT = 32;
const PIXEL_WIDTH = 10;
const PIXEL_HEIGHT = 10;

export class Display {
  private _width: number;
  private _height: number;

  private _window: sdl.Sdl.Video.Window;
  private _canvas: Canvas.Canvas;
  private _ctx: Canvas.CanvasRenderingContext2D;

  constructor() {
    this._width = 64 * PIXEL_WIDTH;
    this._height = 32 * PIXEL_HEIGHT;

    this._window = sdl.video.createWindow({
      title: "CHIP8",
      width: this._width,
      height: this._height,
    });
    // this._window.on("*", console.log);
    this._canvas = Canvas.createCanvas(this._width, this._height);
    this._ctx = this._canvas.getContext("2d");
    // this._ctx.globalCompositeOperation = "xor";

    this._redraw();
  }

  public clear(): void {
    this._ctx.fillStyle = "black";
    this._ctx.fillRect(
      0,
      0,
      (WIDTH - 1) * PIXEL_WIDTH,
      (HEIGHT - 1) * PIXEL_HEIGHT
    );
    this._redraw();
  }

  public draw(x: number, y: number, pixels: number[]): void {
    // console.log({ x, y, pixels }, "draw");

    let dx = x;
    let dy = y;
    let mask: number;

    this._ctx.fillStyle = "white";
    for (let i = 0; i < pixels.length; i++) {
      const bitmap = pixels[i];
      mask = 0x80;
      for (let bit = 7; bit >= 0; bit--) {
        // console.log({ bitmap, mask, bit, val: (bitmap & mask) >> bit }, "draw");
        if ((bitmap & mask) >> bit) {
          this._xor(dx, dy);
        }
        mask = mask >> 1;
        dx++;
      }
      dx = x;
      dy++;
    }

    this._redraw();
  }

  private _xor(x: number, y: number): boolean {
    // console.log({ x, y }, "_xor");

    this._ctx.fillRect(
      x * PIXEL_WIDTH,
      y * PIXEL_HEIGHT,
      PIXEL_WIDTH - 1,
      PIXEL_HEIGHT - 1
    );

    return false;
  }

  private _redraw(): void {
    const buffer = this._canvas.toBuffer("raw");
    this._window.render(
      this._width,
      this._height,
      this._width * 4,
      "bgra32",
      buffer
    );
  }
}
