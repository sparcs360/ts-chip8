import sdl from "@kmamal/sdl";
import Canvas from "canvas";

const WIDTH = 64;
const HEIGHT = 32;
const PIXEL_WIDTH = 10;
const PIXEL_HEIGHT = 10;

const BLOCK: number = "#".charCodeAt(0);

export class Display {
  private _width: number;
  private _height: number;
  private _fb: Uint8Array;
  private _textDecoder: TextDecoder;

  private _window: sdl.Sdl.Video.Window;
  private _canvas: Canvas.Canvas;
  private _ctx: Canvas.CanvasRenderingContext2D;

  private _DEBUG: boolean;

  constructor() {
    this._width = WIDTH * PIXEL_WIDTH;
    this._height = HEIGHT * PIXEL_HEIGHT;
    this._fb = new Uint8Array(WIDTH * HEIGHT);
    this._textDecoder = new TextDecoder();

    this._DEBUG = false;

    this._window = sdl.video.createWindow({
      title: "CHIP8",
      width: this._width,
      height: this._height,
    });
    this._window.on("close", (event: sdl.Events.Window.Close) =>
      process.exit(0)
    );
    this._window.setVsync(true);

    this._canvas = Canvas.createCanvas(this._width, this._height);
    this._ctx = this._canvas.getContext("2d");
    this._ctx.globalCompositeOperation = "xor";

    this._redraw();
  }

  public clear(): void {
    this._fb.set({ length: WIDTH * HEIGHT }, 0);

    this._ctx.globalCompositeOperation = "clear";
    this._ctx.fillStyle = "black";
    this._ctx.fillRect(
      0,
      0,
      (WIDTH - 1) * PIXEL_WIDTH,
      (HEIGHT - 1) * PIXEL_HEIGHT
    );

    this._redraw();
    this._ctx.globalCompositeOperation = "xor";
  }

  public draw(x: number, y: number, pixels: number[]): boolean {
    // console.log({ x, y, pixels }, "draw");

    let dx = x % WIDTH;
    let dy = y % HEIGHT;
    let fbIndex = dy * WIDTH + dx;
    let mask: number;
    let collide: boolean = false;

    this._ctx.fillStyle = "white";
    for (let i = 0; i < pixels.length; i++) {
      const bitmap = pixels[i];
      mask = 0x80;
      for (let bit = 7; bit >= 0; bit--) {
        // console.log({ bitmap, mask, bit, val: (bitmap & mask) >> bit }, "draw");
        if ((bitmap & mask) >> bit) {
          if (!collide && this._fb[fbIndex]) {
            collide = true;
          }
          this._fb[fbIndex] ^= 0xff;
          this._xor(dx, dy);
        }
        mask = mask >> 1;
        dx = (dx + 1) % WIDTH;
        fbIndex++;
      }
      dx = x % WIDTH;
      dy = (dy + 1) % HEIGHT;
      fbIndex += WIDTH - 8;
    }

    this._redraw();
    return collide;
  }

  private _xor(x: number, y: number): void {
    // console.log({ x, y }, "_xor");

    this._ctx.fillRect(
      x * PIXEL_WIDTH,
      y * PIXEL_HEIGHT,
      PIXEL_WIDTH - 1,
      PIXEL_HEIGHT - 1
    );
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

    if (this._DEBUG) this._dump();
  }

  private _dump(): void {
    let i = 0;
    while (i < WIDTH * HEIGHT) {
      console.log(
        this._textDecoder.decode(
          this._fb.slice(i, i + WIDTH).map((v) => (v ? BLOCK : 0x2e))
        )
      );
      i += WIDTH;
    }
  }

  public setDebug(debug: boolean = true): void {
    this._DEBUG = debug;
  }
}
