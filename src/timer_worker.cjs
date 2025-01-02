"use strict";

const { parentPort, workerData } = require("worker_threads");

const DEBUG = false;

const { timers } = workerData;

const hrtime = process.hrtime;

for (const timer of timers) {
  timer.start = hrtime.bigint();
}

let running = false;
const YIELD_MODULO = 1_000;
let yield_timer = YIELD_MODULO;

parentPort.on("message", (command) => {
  if (DEBUG) {
    console.log(command, "onMessage");
  }

  switch (command) {
    case "START": {
      onStart();
      break;
    }
    case "STOP": {
      running = false;
      break;
    }
    default: {
      console.error(`timer_worker: unknown command received (${command})`);
    }
  }
});

const onStart = async () => {
  running = true;

  let promiseResolver;

  const channel = new MessageChannel();
  channel.port2.onmessage = () => {
    promiseResolver();
  };

  while (running) {
    for (const timer of timers) {
      if (hrtime.bigint() - timer.start >= timer.frequency) {
        timer.start = hrtime.bigint();
        parentPort.postMessage(timer.id);
      }
    }

    if (--yield_timer === 0) {
      yield_timer = YIELD_MODULO;

      const yielder = new Promise((resolve) => {
        promiseResolver = resolve;
      });
      channel.port1.postMessage(null);
      await yielder;
    }
  }
};
