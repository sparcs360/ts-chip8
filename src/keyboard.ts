import sdl from "@kmamal/sdl";

const SCANCODES: number[] = [
  sdl.keyboard.getScancode("0")!,
  sdl.keyboard.getScancode("1")!,
  sdl.keyboard.getScancode("2")!,
  sdl.keyboard.getScancode("3")!,
  sdl.keyboard.getScancode("4")!,
  sdl.keyboard.getScancode("5")!,
  sdl.keyboard.getScancode("6")!,
  sdl.keyboard.getScancode("7")!,
  sdl.keyboard.getScancode("8")!,
  sdl.keyboard.getScancode("9")!,
  sdl.keyboard.getScancode("a")!,
  sdl.keyboard.getScancode("b")!,
  sdl.keyboard.getScancode("c")!,
  sdl.keyboard.getScancode("d")!,
  sdl.keyboard.getScancode("e")!,
  sdl.keyboard.getScancode("f")!,
];

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
