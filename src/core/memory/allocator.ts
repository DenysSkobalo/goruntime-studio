export interface AllocationResult {
  address: string;
  level: 'tiny' | 'mcache' | 'mcentral' | 'mheap';
  explanation: string;
}

export class GoHeapAllocator {
  private static instance: GoHeapAllocator | null = null;
  private currentAddress: bigint = 0xc000000000n;
  private readonly tinyThreshold: number = 16;
  private readonly maxSmallSize: number = 32768; // 32 KB

  private constructor() {}

  public static getInstance(): GoHeapAllocator {
    if (!GoHeapAllocator.instance) {
      GoHeapAllocator.instance = new GoHeapAllocator();
    }
    return GoHeapAllocator.instance;
  }

  public allocate(size: number, _needsZeroing: boolean = true): AllocationResult {
    if (size <= 0) {
      return {
        address: '0x000000000000',
        level: 'tiny',
        explanation: 'mallocgc(): Запит на 0 байтів повертає вказівник на zerobase.',
      };
    }

    const allocatedAddress = `0x${this.currentAddress.toString(16)}`;
    // Вирівнювання адреси за кордоном 8 байтів для наступних алокацій
    const alignedSize = BigInt(Math.ceil(size / 8) * 8);
    this.currentAddress += alignedSize;

    if (size <= this.tinyThreshold) {
      return {
        address: allocatedAddress,
        level: 'tiny',
        explanation: `mallocgc(): Дрібний об'єкт (${size}B <= 16B). Використано Tiny Allocator у mcache без явного заповнення метаданих.`,
      };
    }

    if (size <= this.maxSmallSize) {
      return {
        address: allocatedAddress,
        level: 'mcache',
        explanation: `mallocgc(): Малий об'єкт (${size}B <= 32KB). Виділено зі span відповідного sizeclass в mcache поточного P.`,
      };
    }

    return {
      address: allocatedAddress,
      level: 'mheap',
      explanation: `mallocgc(): Великий об'єкт (${size}B > 32KB). Запит пройшов mcache/mcentral напряму до mheap (pageAlloc).`,
    };
  }

  public reset(): void {
    this.currentAddress = 0xc000000000n;
  }
}
