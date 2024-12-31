import { Cpu } from "./cpu";
import { Memory } from "./memory";
import { Display } from "./display";
import { Keyboard } from "./keyboard";
import { Beeper } from "./beeper";

const DEBUG_CPU: boolean = false;
const DEBUG_MEMORY: boolean = false;
const DEBUG_DISPLAY: boolean = false;
const DEBUG_KEYBOARD: boolean = false;
const DEBUG_BEEPER: boolean = true;

const memory = new Memory();
memory.setDebug(DEBUG_MEMORY);
const display = new Display();
display.setDebug(DEBUG_DISPLAY);
const keyboard = new Keyboard();
keyboard.setDebug(DEBUG_KEYBOARD);
const beeper = new Beeper();
beeper.setDebug(DEBUG_BEEPER);

const cpu = new Cpu(memory, display, keyboard, beeper);
cpu.setDebug(DEBUG_CPU);

(async () => {
  // memory.load("./.roms/test_opcode.ch8", 0x200);
  // await cpu.run(0x200);

  // memory.load("./.roms/IBM Logo.ch8", 0x200);
  // await cpu.run(0x200);

  // memory.load("./.roms/chip8-test-suite/1-chip8-logo.ch8", 0x200);
  // await cpu.run(0x200);

  // memory.load("./.roms/chip8-test-suite/2-ibm-logo.ch8", 0x200);
  // await cpu.run(0x200);

  // memory.load("./.roms/chip8-test-suite/4-flags.ch8", 0x200);
  // await cpu.run(0x200);

  // memory.load("./.roms/chip8-test-suite/5-quirks.ch8", 0x200);
  // await cpu.run(0x200);

  // memory.load("./.roms/chip8-test-suite/6-keypad.ch8", 0x200);
  // await cpu.run(0x200);

  memory.load("./.roms/chip8-test-suite/7-beep.ch8", 0x200);
  await cpu.run(0x200);
})();
