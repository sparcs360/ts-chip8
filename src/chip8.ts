import { Cpu } from "./cpu";
import { Memory } from "./memory";
import { Display } from "./display";

const memory = new Memory();
const display = new Display();

const cpu = new Cpu(memory, display);

// memory.load("./.roms/test_opcode.ch8", 0x200);
// memory.load("./.roms/IBM Logo.ch8", 0x200);

// memory.load("./.roms/chip8-test-suite/1-chip8-logo.ch8", 0x200);
// cpu.run(0x200);
// cpu.tick();

// memory.load("./.roms/chip8-test-suite/2-ibm-logo.ch8", 0x200);
// cpu.run(0x200);
// cpu.tick();

memory.load("./.roms/chip8-test-suite/3-corax+.ch8", 0x200);
cpu.run(0x200);
cpu.tick();
