import type { RuntimeDocEntry } from './types';

export const RUNTIME_DOCS: RuntimeDocEntry[] = [
  {
    id: 'goroutine',
    title: 'Планувальник Go: Модель GMP та runtime.g',
    structName: 'runtime.g',
    sizeBytes64Bit: 376,
    source: {
      file: 'src/runtime/runtime2.go',
      repoUrl: 'https://github.com/golang/go/blob/master/src/runtime/runtime2.go#L400',
    },
    description: 'Дескриптор горутини, що зберігає стек, статус та контекст виконання.',
    keyInvariants: [
      'Початковий розмір стека становить 2 KB (_StackMin).',
      'Мультиплексується на OS threads (M) через логічні процесори (P).',
    ],
    memoryLayout: [
      { offset: '0x00', field: 'stack.lo', type: 'uintptr', note: 'Нижня межа стека' },
      { offset: '0x08', field: 'stack.hi', type: 'uintptr', note: 'Верхня межа стека' },
      { offset: '0x10', field: 'sched.sp', type: 'uintptr', note: 'Stack Pointer' },
      { offset: '0x18', field: 'atomicstatus', type: 'uint32', note: 'Статус горутини (_Grunning, _Gwaiting)' },
      { offset: '0x20', field: 'goid', type: 'int64', note: 'Унікальний ідентифікатор горутини' },
    ],
  },
  {
    id: 'channel',
    title: 'Канали: Структура runtime.hchan та кільцевий буфер',
    structName: 'runtime.hchan',
    sizeBytes64Bit: 96,
    source: {
      file: 'src/runtime/chan.go',
      repoUrl: 'https://github.com/golang/go/blob/master/src/runtime/chan.go#L32',
    },
    description: 'Потокобезпечна черга повідомлень з підтримкою Direct Stack Transfer.',
    keyInvariants: [
      'Завжди виділяється у Heap через mallocgc.',
      'Використовує mutex (lock) для синхронізації внутрішнього стану.',
    ],
    memoryLayout: [
      { offset: '0x00', field: 'qcount', type: 'uint', note: 'Кількість елементів у буфері' },
      { offset: '0x08', field: 'dataqsiz', type: 'uint', note: 'Ємність кільцевого буфера' },
      { offset: '0x10', field: 'buf', type: 'unsafe.Pointer', note: 'Вказівник на буфер у Heap' },
      { offset: '0x18', field: 'elemsize', type: 'uint16', note: 'Розмір одного елемента в байтах' },
      { offset: '0x1A', field: 'closed', type: 'uint32', note: 'Прапорець закриття каналу' },
      { offset: '0x20', field: 'sendx', type: 'uint', note: 'Індекс кольцевого буфера для запису' },
      { offset: '0x28', field: 'recvx', type: 'uint', note: 'Індекс кольцевого буфера для читання' },
      { offset: '0x30', field: 'recvq', type: 'waitq', note: 'Черга sudog заблокованих читачів' },
      { offset: '0x48', field: 'sendq', type: 'waitq', note: 'Черга sudog заблокованих письменників' },
    ],
  },
  {
    id: 'sudog',
    title: 'Зв\'язуюча ланка: runtime.sudog',
    structName: 'runtime.sudog',
    sizeBytes64Bit: 88,
    source: {
      file: 'src/runtime/runtime2.go',
      repoUrl: 'https://github.com/golang/go/blob/master/src/runtime/runtime2.go#L350',
    },
    description: 'Представляє заблоковану горутину в черзі очікування каналу або семафори.',
    keyInvariants: [
      'elem вказує безпосередньо на змінну у фреймі стека.',
      'Передача даних здійснюється через runtime.memmove без алокації в Heap.',
    ],
    memoryLayout: [
      { offset: '0x00', field: 'g', type: '*g', note: 'Вказівник на очікуючу горутину' },
      { offset: '0x08', field: 'next', type: '*sudog', note: 'Наступний елемент черги' },
      { offset: '0x10', field: 'prev', type: '*sudog', note: 'Попередній елемент черги' },
      { offset: '0x18', field: 'elem', type: 'unsafe.Pointer', note: 'Адреса стека для Direct Transfer' },
      { offset: '0x20', field: 'c', type: '*hchan', note: 'Вказівник на канал' },
    ],
  },
];
