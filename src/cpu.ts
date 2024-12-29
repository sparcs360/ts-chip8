import { Display } from "./display";
import { Keyboard } from "./keyboard";
import { MEM_MAX, Memory } from "./memory";

type Work = {
  pc: number;
  op: number;
  b2: number;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
};

export class Cpu {
  private _pc: number;
  private _sp: number;
  private _stack: number[];
  private _v: number[];
  private _i: number;
  private _dt: number;
  private _snd: number;

  private _mem: Memory;
  private _disp: Display;
  private _kb: Keyboard;

  private _DEBUG: boolean;

  public constructor(memory: Memory, display: Display, keyboard: Keyboard) {
    this._pc = 0;
    this._sp = -1;
    this._stack = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._v = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._i = 0;
    this._dt = 0;
    this._snd = 0;

    this._mem = memory;
    this._disp = display;
    this._kb = keyboard;

    this._DEBUG = false;
  }

  public async run(address: number, cycles: number = Infinity): Promise<void> {
    if (address < 0 || address > MEM_MAX - 2) {
      throw new Error(`Attempt to execute at address ${address}`);
    }

    this._pc = address;
    if (this._DEBUG) this._dump();

    const self = this;
    let c = 0;

    setInterval(() => {
      if (this._dt) {
        this._dt--;
      }
    }, 1000.0 / 60.0);

    const doTick = async () => {
      for (let i = 0; i < 17; i++) {
        const isRunning = await self._tick();
        if (!isRunning) {
          return;
        }
        c++;
      }
      if (c < cycles) {
        setTimeout(doTick, 1000.0 / 500.0);
      }
    };

    setTimeout(doTick, 1000.0 / 500.0);
  }

  private async _tick(): Promise<boolean> {
    try {
      const pc = this._pc;
      await this._execute(this._fetch());
      if (this._pc === pc) {
        console.log(`HALT at $${this._h4(pc)}`);
        return false;
      }
      if (this._DEBUG) this._dump();
    } catch (error) {
      console.error(error);
      console.log(`failed after ${this._tick} ticks`);
      this._dump();
      return false;
    }

    return true;
  }

  private _fetch(): Work {
    const pc = this._pc;
    const op = (this._mem.get(this._pc++) << 8) + this._mem.get(this._pc++);
    // console.debug(
    //   `FETCH  : PC=${pc.toString(16).padStart(4, "0")}, op=${op
    //     .toString(16)
    //     .padStart(4, "0")}`
    // );
    return this._decode(pc, op);
  }

  private _decode(pc: number, op: number): Work {
    const b2: number = op & 0xff;
    const n1: number = (op & 0xf000) >> 12;
    const n2: number = (op & 0xf00) >> 8;
    const n3: number = (op & 0xf0) >> 4;
    const n4: number = op & 0xf;
    // console.debug(
    //   `DECODE : n1=${n1.toString(16)}, n2=${n2.toString(16)}, n3=${n3.toString(
    //     16
    //   )}, n4=${n4.toString(16)}`
    // );

    return { pc, op, b2, n1, n2, n3, n4 };
  }

  private async _execute(w: Work): Promise<void> {
    switch (w.n1) {
      case 0x0: {
        switch (w.op) {
          case 0x00e0: {
            this._log(w, "CLS");
            this._disp.clear();
            return;
          }
          case 0x00ee: {
            const pc = this._stack[this._sp--];
            this._log(w, `RET // to ${this._h4(pc)}`);
            this._pc = pc;
            return;
          }
          default: {
            throw new Error(
              `Bad opcode (${this._h4(w.op)}) at ${this._h4(this._pc - 2)}`
            );
          }
        }
      }
      case 0x1: {
        const a = (w.n2 << 8) + (w.n3 << 4) + w.n4;
        this._log(w, `JMP $${this._h4(a)}`);
        this._pc = a;
        return;
      }
      case 0x2: {
        const a = (w.n2 << 8) + (w.n3 << 4) + w.n4;
        this._log(w, `CALL $${this._h4(a)}`);
        this._stack[++this._sp] = this._pc;
        this._pc = a;
        return;
      }
      case 0x3: {
        const r = w.n2;
        const v = (w.n3 << 4) + w.n4;
        this._log(w, `SE V${this._h1(r)}, #$${this._h2(v)}`);
        if (this._v[r] === v) {
          this._pc += 2;
        }
        return;
      }
      case 0x4: {
        const r = w.n2;
        const v = (w.n3 << 4) + w.n4;
        this._log(w, `SNE V${this._h1(r)}, #$${this._h2(v)}`);
        if (this._v[r] !== v) {
          this._pc += 2;
        }
        return;
      }
      case 0x5: {
        const r1 = w.n2;
        const r2 = w.n3;
        this._log(w, `SE V${this._h1(r1)}, V${this._h1(r2)}`);
        if (this._v[r1] === this._v[r2]) {
          this._pc += 2;
        }
        return;
      }
      case 0x6: {
        const r = w.n2;
        const v = (w.n3 << 4) + w.n4;
        this._log(w, `LD V${this._h1(r)}, #$${this._h2(v)}`);
        this._v[r] = v;
        return;
      }
      case 0x7: {
        const r = w.n2;
        const v = (w.n3 << 4) + w.n4;
        this._log(w, `ADD V${this._h1(r)}, #$${this._h2(v)}`);
        this._v[r] = (this._v[r] + v) & 0xff;
        return;
      }
      case 0x8: {
        const rx = w.n2;
        const vx = this._v[rx];
        const ry = w.n3;
        const vy = this._v[ry];

        switch (w.n4) {
          case 0x0: {
            this._log(w, `LD V${this._h1(rx)}, V${this._h1(ry)}`);
            this._v[rx] = vy;
            return;
          }
          case 0x1: {
            this._log(w, `OR V${this._h1(rx)}, V${this._h1(ry)}`);
            this._v[rx] = vx | vy;
            return;
          }
          case 0x2: {
            this._log(w, `AND V${this._h1(rx)}, V${this._h1(ry)}`);
            this._v[rx] = vx & vy;
            return;
          }
          case 0x3: {
            this._log(w, `XOR V${this._h1(rx)}, V${this._h1(ry)}`);
            this._v[rx] = vx ^ vy;
            return;
          }
          case 0x4: {
            this._log(w, `ADC V${this._h1(rx)}, V${this._h1(ry)}`);
            const sum = (vx + vy) & 0x1ff;
            this._v[rx] = sum & 0xff;
            this._v[0xf] = sum >> 8;
            return;
          }
          case 0x5: {
            this._log(w, `SBC V${this._h1(rx)}, V${this._h1(ry)}`);
            this._v[rx] = (vx - vy) & 0xff;
            this._v[0xf] = vx >= vy ? 1 : 0;
            return;
          }
          case 0x6: {
            this._log(w, `SHR V${this._h1(rx)}, V${this._h1(ry)}`);
            this._v[rx] = (vx >> 1) & 0xff;
            this._v[0xf] = vx & 0x1;
            return;
          }
          case 0x7: {
            this._log(w, `SUBN V${this._h1(rx)}, V${this._h1(ry)}`);
            this._v[rx] = (vy - vx) & 0xff;
            this._v[0xf] = vy >= vx ? 1 : 0;
            return;
          }
          case 0xe: {
            this._log(w, `SHL V${this._h1(rx)}, V${this._h1(ry)}`);
            this._v[rx] = (vx << 1) & 0xff;
            this._v[0xf] = vx & 0x80 ? 1 : 0;
            return;
          }
          default: {
            throw new Error(
              `Bad opcode (${this._h4(w.op)}) at ${this._h4(this._pc - 2)}`
            );
          }
        }
      }
      case 0x9: {
        const rx = w.n2;
        const ry = w.n3;

        this._log(w, `SNE V${this._h1(rx)}, V${this._h1(ry)}`);
        if (this._v[rx] !== this._v[ry]) {
          this._pc += 2;
        }
        return;
      }
      case 0xa: {
        const a = (w.n2 << 8) + (w.n3 << 4) + w.n4;
        this._log(w, `LD I, #$${this._h4(a)}`);
        this._i = a;
        return;
      }
      case 0xd: {
        const x = w.n2;
        const y = w.n3;
        const c = w.n4;

        this._log(w, `DRW (V${this._h1(x)},V${this._h1(y)}), #${this._h1(c)}`);

        const pixels: number[] = [];
        for (let i = 0; i < c; i++) {
          pixels[i] = this._mem.get(this._i + i);
        }
        this._v[0xf] = this._disp.draw(this._v[x], this._v[y], pixels) ? 1 : 0;
        return;
      }
      case 0xe: {
        const r = w.n2;
        const v = this._v[r];

        switch (w.b2) {
          case 0x9e: {
            if (this._kb.isDown(v)) {
              this._pc += 2;
            }
            return;
          }
          case 0xa1: {
            if (this._kb.isUp(v)) {
              this._pc += 2;
            }
            return;
          }
          default: {
            throw new Error(
              `Bad opcode (${this._h4(w.op)}) at ${this._h4(this._pc - 2)}`
            );
          }
        }
      }
      case 0xf: {
        switch (w.b2) {
          case 0x07: {
            const r = w.n2;
            const v = this._v[r];

            this._log(w, `LD V${this._h1(r)}, DT // #$${this._h2(v)}`);
            this._v[r] = this._dt;
            return;
          }
          case 0x0a: {
            const r = w.n2;

            this._log(w, `LD V${this._h1(r)}, K`);
            this._v[r] = await this._kb.getKey();
            return;
          }
          case 0x15: {
            const r = w.n2;
            const v = this._v[r];

            this._log(w, `LD DT, V${this._h1(r)} // #$${this._h2(v)}`);
            this._dt = v;
            return;
          }
          case 0x1e: {
            const r = w.n2;
            const v = this._v[r];

            this._log(w, `ADD I, V${this._h1(r)} // #$${this._h2(v)}`);
            this._i += v;
            return;
          }
          case 0x33: {
            const r = w.n2;
            const v = this._v[r];

            this._log(w, `LD B, V${this._h1(r)} // #$${this._h2(v)}`);
            this._mem.set(this._i, Math.floor(v / 100));
            this._mem.set(this._i + 1, Math.floor((v % 100) / 10));
            this._mem.set(this._i + 2, v % 10);
            return;
          }
          case 0x55: {
            const c = w.n2;

            this._log(w, `LD [I], #${this._h1(c)}`);
            for (let i = 0; i <= c; i++) {
              this._mem.set(this._i++, this._v[i]);
            }
            return;
          }
          case 0x65: {
            const c = w.n2;

            this._log(w, `LD #${this._h1(c)}, [I]`);
            for (let i = 0; i <= c; i++) {
              this._v[i] = this._mem.get(this._i++);
            }
            return;
          }
          default: {
            throw new Error(
              `Bad opcode (${this._h4(w.op)}) at ${this._h4(this._pc - 2)}`
            );
          }
        }
      }
      default: {
        throw new Error(
          `Bad opcode (${w.op.toString(16).padStart(4, "0")}) at ${(
            this._pc - 2
          )
            .toString(16)
            .padStart(4, "0")}`
        );
      }
    }
  }

  private _dump(): void {
    console.log(
      "======================================================================================"
    );
    console.log(`PC     ${this._h4(this._pc)}  SP     ${this._h2(this._sp)}`);
    console.log(`I      ${this._h4(this._i)}  DT     ${this._h2(this._dt)}`);
    console.log(
      "          0    1    2    3    4    5    6    7    8    9    a    b    c    d    e    f"
    );
    console.log(`STACK  ${this._stack.map(this._h4).join(" ")}`);
    console.log("        0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f");
    console.log(`V      ${this._v.map(this._h2).join(" ")}`);
    console.log(
      "======================================================================================"
    );
  }

  private _log(work: Work, assembly: string) {
    if (this._DEBUG)
      console.log(`$${this._h4(work.pc)} $${this._h4(work.op)}: ${assembly}`);
  }

  private _h1(v: number): string {
    return v.toString(16);
  }
  private _h2(v: number): string {
    return v.toString(16).padStart(2, "0");
  }
  private _h4(v: number): string {
    return v.toString(16).padStart(4, "0");
  }

  public setDebug(debug: boolean = true): void {
    this._DEBUG = debug;
  }
}
