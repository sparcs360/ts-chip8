import { Cpu } from "./cpu";
import { Memory } from "./memory";
import { Display } from "./display";

const memory = new Memory();
const display = new Display();

const cpu = new Cpu(memory, display);

memory.load("./.roms/IBM Logo.ch8", 0x200);
cpu.run(0x200);
cpu.tick(21);
