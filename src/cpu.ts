import { Display } from "./display";
import { MEM_MAX, Memory } from "./memory";

type Work = {
  pc: number;
  op: number;
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
  private _del: number;
  private _snd: number;

  private _mem: Memory;
  private _disp: Display;

  public constructor(memory: Memory, display: Display) {
    this._pc = 0;
    this._sp = 0;
    this._stack = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._v = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._i = 0;
    this._del = 0;
    this._snd = 0;

    this._mem = memory;
    this._disp = display;
  }

  public run(address: number): void {
    if (address < 0 || address > MEM_MAX - 2) {
      throw new Error(`Attempt to execute at address ${address}`);
    }

    this._pc = address;
  }

  public tick(cycles: number = Infinity): void {
    for (let i = 0; i < cycles; i++) {
      this._execute(this._fetch());
    }
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
    const n1: number = (op & 0xf000) >> 12;
    const n2: number = (op & 0xf00) >> 8;
    const n3: number = (op & 0xf0) >> 4;
    const n4: number = op & 0xf;
    // console.debug(
    //   `DECODE : n1=${n1.toString(16)}, n2=${n2.toString(16)}, n3=${n3.toString(
    //     16
    //   )}, n4=${n4.toString(16)}`
    // );

    return { pc, op, n1, n2, n3, n4 };
  }

  private _execute(w: Work): void {
    switch (w.n1) {
      case 0x0: {
        switch (w.op) {
          case 0x00e0: {
            this._log(w, "CLS");
            this._disp.clear();
            return;
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
      case 0x1: {
        const a = (w.n2 << 8) + (w.n3 << 4) + w.n4;
        this._log(w, `JMP $${a.toString(16).padStart(4, "0")}`);
        this.run(a);
        return;
      }
      case 0x6: {
        const r = w.n2;
        const v = (w.n3 << 4) + w.n4;
        this._log(
          w,
          `LD V${r.toString(16)}, #${v.toString(16).padStart(4, "0")}`
        );
        this._v[r] = v;
        return;
      }
      case 0x7: {
        const r = w.n2;
        const v = (w.n3 << 4) + w.n4;
        this._log(
          w,
          `ADD V${r.toString(16)}, #${v.toString(16).padStart(4, "0")}`
        );
        this._v[r] += v;
        return;
      }
      case 0xa: {
        const a = (w.n2 << 8) + (w.n3 << 4) + w.n4;
        this._log(w, `LD I, #${a.toString(16).padStart(4, "0")}`);
        this._i = a;
        return;
      }
      case 0xd: {
        const x = w.n2;
        const y = w.n3;
        const c = w.n4;
        this._log(
          w,
          `DRW (V${x.toString(16)},V${y.toString(16)}), #${c.toString(16)}`
        );

        const pixels: number[] = [];
        for (let i = 0; i < c; i++) {
          pixels[i] = this._mem.get(this._i + i);
        }
        this._disp.draw(this._v[x], this._v[y], pixels);
        return;
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

  private _log(work: Work, assembly: string) {
    console.log(
      `$${work.pc.toString(16).padStart(4, "0")} $${work.op
        .toString(16)
        .padStart(4, "0")}: ${assembly}`
    );
  }
}
