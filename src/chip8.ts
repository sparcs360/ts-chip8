import { Cpu } from "./cpu";
import { Memory } from "./memory";
import { Display } from "./display";
import { Keyboard } from "./keyboard";

const DEBUG: boolean = true;

const memory = new Memory();
memory.setDebug(DEBUG);
const display = new Display();
display.setDebug(DEBUG);
const keyboard = new Keyboard();
keyboard.setDebug(DEBUG);

const cpu = new Cpu(memory, display, keyboard);
cpu.setDebug(DEBUG);

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

  memory.load("./.roms/chip8-test-suite/5-quirks.ch8", 0x200);
  await cpu.run(0x200);

  // memory.load("./.roms/chip8-test-suite/6-keypad.ch8", 0x200);
  // await cpu.run(0x200);
})();
