import sdl from "@kmamal/sdl";

const LAYOUT_RAW = "0123 4567 89ab cdef";
const LAYOUT_QWERTY = "1234 qwer asdf zxcv";

const SCANCODES = LAYOUT_QWERTY.split("")
  .filter((c) => c !== " ")
  .map((key) => sdl.keyboard.getScancode(key)!);

export class Keyboard {
  private _DEBUG: boolean;

  constructor() {
    this._DEBUG = false;
  }

  public async getKey(): Promise<number> {
    let key: number | undefined;

    return new Promise((resolve) => {
      setInterval(() => {
        if (key) {
          if (this._allReleased()) {
            resolve(key);
          }
        } else {
          key = this._anyPressed();
        }
      }, 10);
    });
  }

  private _anyPressed(): number | undefined {
    const state = sdl.keyboard.getState();
    for (let k = 0; k < SCANCODES.length; k++) {
      if (state[SCANCODES[k]]) {
        return k;
      }
    }

    return undefined;
  }

  private _allReleased(): boolean {
    const state = sdl.keyboard.getState();
    return SCANCODES.every((sc) => !state[sc]);
  }

  public isDown(key: number): boolean {
    return sdl.keyboard.getState()[SCANCODES[key]];
  }

  public isUp(key: number): boolean {
    return !sdl.keyboard.getState()[SCANCODES[key]];
  }

  public setDebug(debug: boolean = true): void {
    this._DEBUG = debug;
  }
}
