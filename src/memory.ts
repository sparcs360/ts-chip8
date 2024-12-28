import * as fs from "fs";

export const MEM_MIN = 0x0;
export const MEM_MAX = 0xfff;

const font_0: number[] = [0xf0, 0x90, 0x90, 0x90, 0xf0];
const font_1: number[] = [0x20, 0x60, 0x20, 0x20, 0x70];
const font_2: number[] = [0xf0, 0x10, 0xf0, 0x80, 0xf0];
const font_3: number[] = [0xf0, 0x10, 0xf0, 0x10, 0xf0];
const font_4: number[] = [0x90, 0x90, 0xf0, 0x10, 0x10];
const font_5: number[] = [0xf0, 0x80, 0xf0, 0x10, 0xf0];
const font_6: number[] = [0xf0, 0x80, 0xf0, 0x90, 0xf0];
const font_7: number[] = [0xf0, 0x10, 0x20, 0x40, 0x40];
const font_8: number[] = [0xf0, 0x90, 0xf0, 0x90, 0xf0];
const font_9: number[] = [0xf0, 0x90, 0xf0, 0x10, 0xf0];
const font_a: number[] = [0xf0, 0x90, 0xf0, 0x90, 0x90];
const font_b: number[] = [0xe0, 0x90, 0xe0, 0x90, 0xe0];
const font_c: number[] = [0xf0, 0x80, 0x80, 0x80, 0xf0];
const font_d: number[] = [0xe0, 0x90, 0x90, 0x90, 0xe0];
const font_e: number[] = [0xf0, 0x80, 0xf0, 0x80, 0xf0];
const font_f: number[] = [0xf0, 0x80, 0xf0, 0x80, 0x80];

const font = [
  ...font_0,
  ...font_1,
  ...font_2,
  ...font_3,
  ...font_4,
  ...font_5,
  ...font_6,
  ...font_7,
  ...font_8,
  ...font_9,
  ...font_a,
  ...font_b,
  ...font_c,
  ...font_d,
  ...font_e,
  ...font_f,
];

export class Memory {
  private _mem: Uint8Array;

  public constructor() {
    this._mem = new Uint8Array(MEM_MAX);

    this._mem.set(font, 0x050);
  }

  public get(address: number): number {
    if (address < 0 || address > MEM_MAX) {
      throw new Error(`Attempt to read byte at address ${address}`);
    }
    return this._mem[address];
  }

  public set(address: number, value: number): number {
    if (address < 0 || address > MEM_MAX) {
      throw new Error(`Attempt to read byte at address ${address}`);
    }
    if (value < 0 || value > 255) {
      throw new Error(
        `Attempt to write bad value (${value}) to address ${address}`
      );
    }
    return (this._mem[address] = value);
  }

  public load(filename: string, address: number): void {
    if (address < 0 || address > MEM_MAX) {
      throw new Error(`Attempt to load bytes at address ${address}`);
    }

    const bytes = fs.readFileSync(filename, { encoding: null });
    console.log(bytes.toString("hex"));
    if (address + bytes.length > MEM_MAX) {
      throw new Error(
        `Attempt to load bytes past available RAM (start=${address}, len=${bytes.length})`
      );
    }

    this._mem.set(bytes, address);
  }
}
