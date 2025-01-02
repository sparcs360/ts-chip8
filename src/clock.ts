import path from "path";
import { Worker } from "worker_threads";

const ONE_HERTZ = 1_000_000_000n;

export type TimerFn = () => Promise<void> | void;

export type Timer = {
  id: string;
  hertz: number;
  fn: TimerFn;
};

export class Clock {
  private _timerFns: Record<string, TimerFn>;

  private _worker: Worker;
  private _running: boolean;

  private _DEBUG: boolean;

  constructor(timers: Timer[]) {
    this._timerFns = timers.reduce<typeof this._timerFns>((acc, timer) => {
      acc[timer.id] = timer.fn;
      return acc;
    }, {});

    this._worker = new Worker(path.resolve(__dirname, "./timer_worker.cjs"), {
      workerData: {
        timers: timers.map((timer) => ({
          id: timer.id,
          frequency: ONE_HERTZ / BigInt(timer.hertz),
        })),
      },
    });

    this._worker
      .on("error", (error) => {
        console.error("Timer Worker Error", error);
        process.exit(1);
      })
      .on("message", (id: string) => {
        if (this._running) {
          this._timerFns[id]();
        }
      });

    this._running = false;

    this._DEBUG = false;
  }

  public start(): void {
    if (!this._running) {
      this._running = true;
      this._worker.postMessage("START");
    }
  }

  public stop(): void {
    if (this._running) {
      this._running = false;
      this._worker.postMessage("STOP");
    }
  }

  public setDebug(debug: boolean = true): void {
    this._DEBUG = debug;
  }
}
