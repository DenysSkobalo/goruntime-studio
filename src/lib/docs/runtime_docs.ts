import type { RuntimeDocEntry } from './types';

export const RUNTIME_DOCS: Record<string, RuntimeDocEntry> = {
  goroutine: {
    id: 'goroutine',
    title: 'Goroutine Descriptor',
    structName: 'runtime.g',
    sizeBytes64Bit: 376,
    source: {
      file: 'src/runtime/runtime2.go',
      repoUrl: 'https://cs.opensource.google/go/go/+/master:src/runtime/runtime2.go',
      specUrl: 'https://go.dev/doc/effective_go#goroutines'
    },
    description: 'Центральна структура планувальника (GMP), що представляє окремий потік виконання на рівні користувача (user-space thread).',
    keyInvariants: [
      'Початковий розмір стека становить 2 KB (2048 B).',
      'Стек динамічно зростає у напрямку зменшення адрес (downward growth).',
      'Стан atomicstatus змінюється атомарно через інструкції CAS.'
    ],
    memoryLayout: [
      { offset: '0x00', field: 'stack.lo', type: 'uintptr', note: 'Нижня межа стека' },
      { offset: '0x08', field: 'stack.hi', type: 'uintptr', note: 'Верхня межа стека' },
      { offset: '0x10', field: 'm', type: '*m', note: 'Покажчик на машинний потік ОС' },
      { offset: '0x38', field: 'atomicstatus', type: 'uint32', note: 'Поточний стан (_Grunnable, _Grunning)' },
      { offset: '0x40', field: 'goid', type: 'int64', note: 'Унікальний ідентифікатор Горутини' }
    ]
  },
  channel: {
    id: 'channel',
    title: 'Buffered/Unbuffered Channel',
    structName: 'runtime.hchan',
    sizeBytes64Bit: 96,
    source: {
      file: 'src/runtime/chan.go',
      repoUrl: 'https://cs.opensource.google/go/go/+/master:src/runtime/chan.go',
      specUrl: 'https://go.dev/ref/spec#Channel_types'
    },
    description: 'Потокобезпечна структура потокового обміну даними між Горутинами на основі кільцевого буфера та черг очікування.',
    keyInvariants: [
      'Виділення пам\'яті hchan та кільцевого буфера здійснюється єдиним блоком в mallocgc.',
      'Пряма передача через стек (Direct Stack Transfer) оминає hchan.buf, якщо є очікуюча Горутина у recvq/sendq.',
      'Доступ до всіх полів захищено внутрішнім локом lock mutex.'
    ],
    memoryLayout: [
      { offset: '0x00', field: 'qcount', type: 'uint', note: 'Кількість елементів у буфері' },
      { offset: '0x08', field: 'dataqsiz', type: 'uint', note: 'Ємність кільцевого буфера' },
      { offset: '0x10', field: 'buf', type: 'unsafe.Pointer', note: 'Вказівник на масив буфера' },
      { offset: '0x38', field: 'recvq', type: 'waitq', note: 'Двонапрямлений список sudog (читачі)' },
      { offset: '0x48', field: 'sendq', type: 'waitq', note: 'Двонапрямлений список sudog (письменники)' }
    ]
  },
  mutex: {
    id: 'mutex',
    title: 'Mutual Exclusion Lock',
    structName: 'sync.Mutex',
    sizeBytes64Bit: 8,
    source: {
      file: 'src/sync/mutex.go',
      repoUrl: 'https://cs.opensource.google/go/go/+/master:src/sync/mutex.go',
      specUrl: 'https://pkg.go.dev/sync#Mutex'
    },
    description: 'Примітив синхронізації з підтримкою двофазного блокування (Spinning + Semaphore Wait).',
    keyInvariants: [
      'У звичайному режимі (Normal Mode) черга працює за принципом FIFO, але розбуджена Горутина конкурує з новими на Spinlock.',
      'У голодному режимі (Starvation Mode) м\'ютекс передається напряму першій Горутині в черзі.',
      'Fast-path виконується за одну інструкцію atomic.CompareAndSwapInt32.'
    ],
    memoryLayout: [
      { offset: '0x00', field: 'state', type: 'int32', note: 'Бітова маска: bit 0 (locked), bit 1 (woken), bit 2 (starving), bits 3..31 (waiters)' },
      { offset: '0x04', field: 'sema', type: 'uint32', note: 'Семафора для переведення ОС-потоку в стан сну' }
    ]
  },
  waitgroup: {
    id: 'waitgroup',
    title: 'Synchronization Counter',
    structName: 'sync.WaitGroup',
    sizeBytes64Bit: 12,
    source: {
      file: 'src/sync/waitgroup.go',
      repoUrl: 'https://cs.opensource.google/go/go/+/master:src/sync/waitgroup.go',
      specUrl: 'https://pkg.go.dev/sync#WaitGroup'
    },
    description: 'Структура для очікування завершення групи паралельних дій.',
    keyInvariants: [
      'Поле state1 об\'єднує 32-бітний counter та 32-бітний waiters.',
      'Атомарні операції на state1 гарантують безпечність без використання повноцінних локів.'
    ],
    memoryLayout: [
      { offset: '0x00', field: 'state1', type: 'uint64', note: 'High 32b: counter, Low 32b: waiters count' },
      { offset: '0x08', field: 'sema', type: 'uint32', note: 'Внутрішня семафора' }
    ]
  },
  select: {
    id: 'select',
    title: 'Channel Multiplexer',
    structName: 'runtime.hselect',
    sizeBytes64Bit: 32,
    source: {
      file: 'src/runtime/select.go',
      repoUrl: 'https://cs.opensource.google/go/go/+/master:src/runtime/select.go',
      specUrl: 'https://go.dev/ref/spec#Select_statements'
    },
    description: 'Механізм мультиплексування декількох канальних операцій в одній інструкції.',
    keyInvariants: [
      'pollorder ґрунтується на псевдовипадковій генерації для уникнення голодування каналів.',
      'lockorder сортує адреси hchan для суворого запобігання Deadlock.'
    ],
    memoryLayout: [
      { offset: '0x00', field: 'tcase', type: 'uint16', note: 'Загальна кількість case' },
      { offset: '0x02', field: 'ncase', type: 'uint16', note: 'Кількість актуальних case у сесії' },
      { offset: '0x08', field: 'pollorder', type: '*uint16', note: 'Масив індексів для випадкового обходу' },
      { offset: '0x10', field: 'lockorder', type: '*uint16', note: 'Масив вказівників, відсортованих за адресами' }
    ]
  },
  sudog: {
    id: 'sudog',
    title: 'Wait Queue Element',
    structName: 'runtime.sudog',
    sizeBytes64Bit: 88,
    source: {
      file: 'src/runtime/runtime2.go',
      repoUrl: 'https://cs.opensource.google/go/go/+/master:src/runtime/runtime2.go#L348'
    },
    description: 'Вузол двонапрямленого списку очікування Горутини в каналах або семафорах.',
    keyInvariants: [
      'Виділяється з внутрішнього кешу (sudogcache) для мінімізації навантаження на GC.',
      'elem вказує безпосередньо на фрейм стека Горутини для прямих операцій memmove.'
    ],
    memoryLayout: [
      { offset: '0x00', field: 'g', type: '*g', note: 'Покажчик на заблоковану Горутину' },
      { offset: '0x08', field: 'next', type: '*sudog', note: 'Наступний елемент черги' },
      { offset: '0x10', field: 'prev', type: '*sudog', note: 'Попередній елемент черги' },
      { offset: '0x18', field: 'elem', type: 'unsafe.Pointer', note: 'Адреса змінної на стеку' },
      { offset: '0x28', field: 'c', type: '*hchan', note: 'Канал, на якому зависла Горутина' }
    ]
  }
};