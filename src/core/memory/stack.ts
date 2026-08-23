import type { Goroutine } from '../engine/types';

export interface StackFrame {
  name: string;
  size: number;
  localPointers: string[];
}

export class GoStackManager {
  public static checkStackOverflow(
    g: Goroutine,
    nextFrameSize: number
  ): { overflow: boolean; currentSize: number } {
    const lo = BigInt(g.stack.lo);
    const hi = BigInt(g.stack.hi);
    const sp = BigInt(g.stack.sp);
    const currentSize = Number(hi - lo);

    const stackguard0 = lo + 256n;
    const overflow = sp - BigInt(nextFrameSize) < stackguard0;

    return { overflow, currentSize };
  }

  public static growStack(
    g: Goroutine,
    frames: StackFrame[]
  ): { g: Goroutine; newFrames: StackFrame[]; explanation: string } {
    const oldLo = BigInt(g.stack.lo);
    const oldHi = BigInt(g.stack.hi);
    const oldSp = BigInt(g.stack.sp);
    const oldSize = Number(oldHi - oldLo);

    const newSize = oldSize * 2;
    const delta = 0x100000n;
    const newLo = oldLo + delta;
    const newHi = newLo + BigInt(newSize);
    const newSp = oldSp + delta;

    const newFrames = frames.map((frame) => ({
      ...frame,
      localPointers: frame.localPointers.map((ptrHex) => {
        const ptrVal = BigInt(ptrHex);
        if (ptrVal >= oldLo && ptrVal <= oldHi) {
          return `0x${(ptrVal + delta).toString(16)}`;
        }
        return ptrHex;
      }),
    }));

    g.stack = {
      lo: `0x${newLo.toString(16)}`,
      hi: `0x${newHi.toString(16)}`,
      sp: `0x${newSp.toString(16)}`,
    };

    const explanation = `runtime.newstack(): Переповнення стека G${g.goid}. Стек подвоєно (${
      oldSize / 1024
    } KB -> ${newSize / 1024} KB). Виконано copystack() та adjustpointers() із зсувом delta = +0x${delta.toString(16)}.`;

    return { g, newFrames, explanation };
  }
}
