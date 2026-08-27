/**
 * @file src/core/memory/stack.test.ts
 * @module core/memory/stack.test
 *
 * @description Unit test suite validating `GoStackManager` stack guard threshold checking,
 * dynamic stack expansion, contiguous copying mechanics, and interior pointer adjustments.
 *
 * @see {@link GoStackManager}
 */

import { describe, it, expect } from 'vitest';
import { GoStackManager } from './stack';
import type { Goroutine } from 'tsgoruntime-kernel';

describe('GoStackManager', () => {
  /**
   * ANCHOR: TEST_STACK_OVERFLOW
   * Validates stack overflow condition detection when SP drops within 256 bytes of `stackLo`.
   */
  it('детектує переповнення стека при наближенні SP до stackguard0', () => {
    const mockG: Goroutine = {
      goid: 1,
      status: '_Grunning',
      stack: {
        lo: '0xc000000000',
        hi: '0xc000000800', // 2 KB stack
        sp: '0xc000000100', // SP lo (+256 B)
      },
    };

    const result = GoStackManager.checkStackOverflow(mockG, 512);
    expect(result.overflow).toBe(true);
  });

  /**
   * ANCHOR: TEST_STACK_GROWTH
   * Validates contiguous stack size doubling and explanation output upon `growStack()` execution.
   */
  it('подвоює розмір стека при виклику growStack()', () => {
    const mockG: Goroutine = {
      goid: 1,
      status: '_Grunning',
      stack: {
        lo: '0xc000000000',
        hi: '0xc000000800',
        sp: '0xc000000200',
      },
    };

    const { g: newG, explanation } = GoStackManager.growStack(mockG, []);
    expect(explanation).toContain('runtime.newstack()');
    expect(BigInt(newG.stack.hi) - BigInt(newG.stack.lo)).toBe(4096n);
  });
});
