import type { Goroutine } from 'tsgoruntime-kernel';
import { formatHex, getRawBaseAddress } from './layout';

export interface StackVariable {
  name: string;
  type: string;
  value: string;
}

export interface StackFrameDescriptor {
  function: string;
  spOffset: string;
  address: string;
  vars: StackVariable[];
}

export interface StackFrame {
  name: string;
  size: number;
  localPointers: string[];
}

export class GoStackManager {
  /**
   * @todo Issue #RUNTIME-204: Refactor static virtual stack frame generation.
   * Remove static hardcoded stack frames ('main.main', 'runtime.chansend1') and static addresses.
   * Connect frame generation directly to tsgoruntime-kernel execution snapshot for the given `goid`.
   */
  public static getVirtualStackFrames(stackLo: bigint, elemAddr: bigint): StackFrameDescriptor[] {
    return [
      {
        function: 'main.main()',
        spOffset: '0x0780',
        address: formatHex(stackLo + 0x0780n),
        vars: [
          { name: 'ch', type: 'chan string', value: formatHex(getRawBaseAddress('channel-1')) },
          { name: 'msg', type: 'string', value: '"hello runtime"' },
        ],
      },
      {
        function: 'runtime.chansend1()',
        spOffset: '0x0640',
        address: formatHex(stackLo + 0x0640n),
        vars: [
          { name: 'c', type: '*hchan', value: formatHex(getRawBaseAddress('channel-1')) },
          { name: 'elem', type: 'unsafe.Pointer', value: formatHex(elemAddr) },
        ],
      },
    ];
  }

  public static checkStackOverflow(
    g: Goroutine,
    nextFrameSize: number,
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
    frames: StackFrame[],
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
