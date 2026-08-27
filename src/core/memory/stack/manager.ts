/**
 * @file src/core/memory/stack/manager.ts
 * @module core/memory/stack/manager
 *
 * @architecture Dynamic Virtual Stack Frame Architecture
 * @description State manager tracking active call frames, Stack Pointers (SP), Frame Pointers (FP),
 * dynamic local variables, and automatic contiguous stack expansion per Goroutine (`goid`).
 *
 * @see {@link https://github.com/golang/go/blob/master/src/runtime/stack.go Go Runtime Stack Manager}
 */

/**
 * Structural metadata defining an execution frame on a Goroutine stack.
 */
export interface StackFrame {
  /** Unique frame instance identifier. */
  id: string;
  /** Name of executing function symbol. */
  functionName: string;
  /** Allocated frame size in bytes. */
  frameSize: number;
  /** Byte length reserved for call arguments. */
  argsSize: number;
  /** Virtual Stack Pointer (SP) address for frame base. */
  sp: number; // Stack Pointer
  /** Virtual Frame Pointer (FP) address. */
  fp: number; // Frame Pointer
  /** Local frame key-value variable registry. */
  variables: Record<string, unknown>;
}

/**
 * Representation of a Goroutine's total call stack space allocation.
 */
export interface GoroutineStack {
  /** Target Goroutine ID (`goid`). */
  id: number;
  /** Current total allocated stack byte capacity (default: 2048 B / 2 KiB). */
  stackSize: number; // e.g., 2048 (2KB initial limit)
  /** Upper virtual boundary address (`stack.hi`). */
  hi: number;
  /** Lower virtual boundary address (`stack.lo`). */
  lo: number;
  /** Active stack frame stack (ordered from outermost caller to active callee). */
  frames: StackFrame[];
}

/**
 * Manages allocation, frame pushing/popping, and dynamic capacity doubling for Goroutine stacks.
 */
export class VirtualStackManager {
  private stacks: Map<number, GoroutineStack> = new Map();
  /** Initial stack capacity matching Go's 2 KiB minimum stack boundary (`_StackMin`). */
  private readonly INITIAL_STACK_SIZE = 2048; // 2 KiB

  /**
   * Instantiates a new 2 KiB initial stack allocation for a target Goroutine ID.
   *
   * ANCHOR: CREATE_STACK
   *
   * @param goid - Goroutine unique numerical ID.
   * @returns Formatted {@link GoroutineStack} structure.
   */
  public createGoroutineStack(goid: number): GoroutineStack {
    const baseAddr = 0xc000000000 + goid * 0x100000;
    const stack: GoroutineStack = {
      id: goid,
      stackSize: this.INITIAL_STACK_SIZE,
      hi: baseAddr + this.INITIAL_STACK_SIZE,
      lo: baseAddr,
      frames: [],
    };
    this.stacks.set(goid, stack);
    return stack;
  }

  /**
   * Pushes a new function call frame to the target Goroutine stack.
   * Triggers contiguous stack capacity expansion if threshold check detects overflow risk.
   *
   * ANCHOR: FRAME_PUSH
   *
   * @param goid - Target Goroutine ID.
   * @param functionName - Fully qualified function identifier.
   * @param frameSize - Stack frame payload size requirement in bytes.
   * @param argsSize - Argument size in bytes.
   * @returns Pushed {@link StackFrame} metadata object.
   */
  public pushFrame(
    goid: number,
    functionName: string,
    frameSize: number,
    argsSize: number,
  ): StackFrame {
    let stack = this.stacks.get(goid);
    if (!stack) {
      stack = this.createGoroutineStack(goid);
    }

    const currentUsed = stack.frames.reduce((acc, f) => acc + f.frameSize, 0);

    // Preamble stack overflow check (morestack)
    if (currentUsed + frameSize > stack.stackSize - 256) {
      this.growStack(goid);
      stack = this.stacks.get(goid)!;
    }

    const sp = stack.hi - currentUsed - frameSize;
    const frame: StackFrame = {
      id: `frame_${functionName}_${Date.now()}`,
      functionName,
      frameSize,
      argsSize,
      sp,
      fp: sp + frameSize,
      variables: {},
    };

    stack.frames.push(frame);
    return frame;
  }

  /**
   * Pops the active top-most frame from the Goroutine call stack.
   *
   * ANCHOR: FRAME_POP
   *
   * @param goid - Target Goroutine ID.
   * @returns Popped {@link StackFrame} or undefined if stack is empty or uninitialized.
   */
  public popFrame(goid: number): StackFrame | undefined {
    const stack = this.stacks.get(goid);
    if (!stack || stack.frames.length === 0) return undefined;
    return stack.frames.pop();
  }

  /**
   * Simulates dynamic contiguous stack reallocation ($2\times$ capacity growth) and frame re-basing.
   *
   * ANCHOR: STACK_REALLOCATION
   *
   * @param goid - Goroutine ID requiring stack memory expansion.
   * @internal
   */
  private growStack(goid: number): void {
    const stack = this.stacks.get(goid);
    if (!stack) return;

    const oldSize = stack.stackSize;
    const newSize = oldSize * 2; // Double stack size

    stack.stackSize = newSize;
    stack.hi = stack.lo + newSize;

    // Relocate SP/FP offsets across frames
    let currentOffset = 0;
    for (let i = stack.frames.length - 1; i >= 0; i--) {
      const frame = stack.frames[i];
      currentOffset += frame.frameSize;
      frame.sp = stack.hi - currentOffset;
      frame.fp = frame.sp + frame.frameSize;
    }
  }

  /**
   * Fetches the current stack state for a Goroutine.
   *
   * @param goid - Goroutine ID.
   * @returns Active {@link GoroutineStack} or undefined.
   */
  public getStack(goid: number): GoroutineStack | undefined {
    return this.stacks.get(goid);
  }
}
