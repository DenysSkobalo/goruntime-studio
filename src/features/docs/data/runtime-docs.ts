import type { RuntimeDoc } from './types';

export const RUNTIME_DOCS: RuntimeDoc[] = [
  {
    id: 'channel',
    title: {
      uk: 'Канал (Buffered & Unbuffered Channel)',
      en: 'Channel (Buffered & Unbuffered Channel)',
    },
    structName: 'runtime.hchan',
    sizeBytes64Bit: 96,
    description: {
      uk: 'Центральна структура даних для синхронізації та передачі повідомлень між горутинами. Містить кільцевий буфер (Ring Buffer), черги очікування читачів/письменників (Wait Queues) та м’ютекс (Mutex) для захисту стану.',
      en: 'Central data structure for synchronization and message passing between goroutines. Contains a ring buffer, reader/writer wait queues, and a mutex for state protection.',
    },
    keyInvariants: [
      {
        uk: 'Будь-який доступ до полів hchan (крім атомних перевірок) вимагає захоплення hchan.lock.',
        en: 'Any access to hchan fields (except atomic checks) requires acquiring hchan.lock.',
      },
      {
        uk: 'Якщо qcount > 0, кільцевий буфер містить елементи між recvx та sendx.',
        en: 'If qcount > 0, the ring buffer contains elements between recvx and sendx.',
      },
      {
        uk: 'Якщо recvq не порожня, sendq обов’язково порожня (і навпаки).',
        en: 'If recvq is not empty, sendq must be empty (and vice versa).',
      },
    ],
    source: {
      file: 'src/runtime/chan.go',
      repoUrl: 'https://github.com/golang/go/blob/master/src/runtime/chan.go',
    },
    memoryLayout: [
      {
        offset: '0x00 (0)',
        field: 'qcount',
        type: 'uint',
        note: {
          uk: 'Кількість елементів у буфері',
          en: 'Number of elements in the buffer',
        },
      },
      {
        offset: '0x08 (8)',
        field: 'dataqsiz',
        type: 'uint',
        note: {
          uk: 'Ємність кільцевого буфера (cap)',
          en: 'Buffer capacity (cap)',
        },
      },
      {
        offset: '0x10 (16)',
        field: 'buf',
        type: 'unsafe.Pointer',
        note: {
          uk: 'Вказівник на масив елементів буфера',
          en: 'Pointer to buffer element array',
        },
      },
      {
        offset: '0x18 (24)',
        field: 'elemsize',
        type: 'uint16',
        note: {
          uk: 'Розмір одного елемента в байтах',
          en: 'Element size in bytes',
        },
      },
      {
        offset: '0x1A (26)',
        field: 'closed',
        type: 'uint32',
        note: {
          uk: 'Прапор закриття каналу (0 = open, 1 = closed)',
          en: 'Channel closed flag (0 = open, 1 = closed)',
        },
      },
      {
        offset: '0x20 (32)',
        field: 'elemtype',
        type: '*_type',
        note: {
          uk: 'Вказівник на дескриптор типу Go',
          en: 'Pointer to Go type descriptor',
        },
      },
      {
        offset: '0x28 (40)',
        field: 'sendx',
        type: 'uint',
        note: {
          uk: 'Індекс запису в кільцевому буфері',
          en: 'Send index in ring buffer',
        },
      },
      {
        offset: '0x30 (48)',
        field: 'recvx',
        type: 'uint',
        note: {
          uk: 'Індекс читання з кільцевого буфера',
          en: 'Receive index in ring buffer',
        },
      },
      {
        offset: '0x38 (56)',
        field: 'recvq',
        type: 'waitq (16B)',
        note: {
          uk: 'Зв’язаний список горутин, що очікують на читання',
          en: 'Wait queue of goroutines waiting to receive',
        },
      },
      {
        offset: '0x48 (72)',
        field: 'sendq',
        type: 'waitq (16B)',
        note: {
          uk: 'Зв’язаний список горутин, що очікують на запис',
          en: 'Wait queue of goroutines waiting to send',
        },
      },
      {
        offset: '0x58 (88)',
        field: 'lock',
        type: 'mutex (8B)',
        note: {
          uk: 'Спінлок для синхронізації доступу до hchan',
          en: 'Spinlock for hchan synchronization',
        },
      },
    ],
  },
  {
    id: 'goroutine',
    title: {
      uk: 'Дескриптор Горутини (Goroutine Descriptor)',
      en: 'Goroutine Descriptor',
    },
    structName: 'runtime.g',
    sizeBytes64Bit: 376,
    description: {
      uk: 'Представляє окремий потік виконання Go (User-space Thread). Містить стек виконання, контекст регістрів ЦП (gobuf), поточний стан виконання та прив’язку до системного потоку (runtime.m).',
      en: 'Represents an execution thread in Go (User-space Thread). Contains execution stack, CPU register context (gobuf), current execution status, and binding to OS thread (runtime.m).',
    },
    keyInvariants: [
      {
        uk: 'Стан g.atomicstatus визначає право планувальника (GMP) на переміщення горутини між чергами.',
        en: 'The g.atomicstatus state dictates GMP scheduler permission to move the goroutine between queues.',
      },
      {
        uk: 'Стек g.stack динамічно розширюється (Stack Allocator) при досягненні межі g.stackguard0.',
        en: 'The g.stack dynamically expands (Stack Allocator) when reaching g.stackguard0.',
      },
      {
        uk: 'Кожна горутина прив’язана до єдиного об’єкта runtime.m під час виконання інструкцій.',
        en: 'Each goroutine is bound to a single runtime.m object during instruction execution.',
      },
    ],
    source: {
      file: 'src/runtime/runtime2.go',
      repoUrl: 'https://github.com/golang/go/blob/master/src/runtime/runtime2.go',
    },
    memoryLayout: [
      {
        offset: '0x00 (0)',
        field: 'stack',
        type: 'stack (16B)',
        note: {
          uk: 'Межі стека: lo (uintptr) та hi (uintptr)',
          en: 'Stack boundaries: lo (uintptr) and hi (uintptr)',
        },
      },
      {
        offset: '0x10 (16)',
        field: 'stackguard0',
        type: 'uintptr',
        note: {
          uk: 'Вказівник перевірки переповнення стека (Stack Split)',
          en: 'Stack overflow check pointer (Stack Split)',
        },
      },
      {
        offset: '0x18 (24)',
        field: 'stackguard1',
        type: 'uintptr',
        note: {
          uk: 'Перевірка стека для Cgo',
          en: 'Stack check pointer for Cgo',
        },
      },
      {
        offset: '0x20 (32)',
        field: '_panic',
        type: '*_panic',
        note: {
          uk: 'Вказівник на поточну ланцюгову структуру panic',
          en: 'Pointer to panic chain structure',
        },
      },
      {
        offset: '0x28 (40)',
        field: '_defer',
        type: '*_defer',
        note: {
          uk: 'Вказівник на стек відкладених викликів defer',
          en: 'Pointer to defer chain structure',
        },
      },
      {
        offset: '0x30 (48)',
        field: 'm',
        type: '*m',
        note: {
          uk: 'Поточний системний потік (OS Thread), що виконує G',
          en: 'Current OS Thread executing G',
        },
      },
      {
        offset: '0x38 (56)',
        field: 'sched',
        type: 'gobuf (64B)',
        note: {
          uk: 'Контекст регістрів (SP, PC, BP, LR) для Перемикання Контексту',
          en: 'Register context (SP, PC, BP, LR) for context switching',
        },
      },
      {
        offset: '0x78 (120)',
        field: 'atomicstatus',
        type: 'uint32',
        note: {
          uk: 'Стан горутини (_Gidle, _Grunnable, _Grunning, _Gwaiting)',
          en: 'Goroutine state (_Gidle, _Grunnable, _Grunning, _Gwaiting)',
        },
      },
      {
        offset: '0x80 (128)',
        field: 'goid',
        type: 'int64',
        note: {
          uk: 'Унікальний ідентифікатор горутини',
          en: 'Unique goroutine ID',
        },
      },
    ],
  },
  {
    id: 'sudog',
    title: {
      uk: 'Вузол Очікування Каналу / Семафора (Wait Node)',
      en: 'Channel / Semaphore Wait Node (Wait Node)',
    },
    structName: 'runtime.sudog',
    sizeBytes64Bit: 88,
    description: {
      uk: 'Проміжна структура для представлення горутини в чергах очікування (wait queues), таких як блоки каналів (sendq/recvq) або семафори. Запобігає рекурсивній алокації та забезпечує зв’язок «багато-до-багатьох» між G та Hchan.',
      en: 'Intermediate structure representing a goroutine in wait queues (sendq/recvq or semaphores). Prevents recursive allocation and provides many-to-many binding between G and Hchan.',
    },
    keyInvariants: [
      {
        uk: 'Один об’єкт g може мати декілька sudog у випадку оператора select.',
        en: 'A single g object can have multiple sudog instances during a select operation.',
      },
      {
        uk: 'sudog алокуються з локального пулу P (p.sudogcache) для уникнення навантаження на Garbage Collector.',
        en: 'sudog objects are allocated from local P pool (p.sudogcache) to avoid Garbage Collector overhead.',
      },
    ],
    source: {
      file: 'src/runtime/runtime2.go',
      repoUrl: 'https://github.com/golang/go/blob/master/src/runtime/runtime2.go',
    },
    memoryLayout: [
      {
        offset: '0x00 (0)',
        field: 'g',
        type: '*g',
        note: {
          uk: 'Вказівник на заблоковану горутину',
          en: 'Pointer to blocked goroutine',
        },
      },
      {
        offset: '0x08 (8)',
        field: 'next',
        type: '*sudog',
        note: {
          uk: 'Наступний елемент у двозв’язному списку',
          en: 'Next element in doubly-linked list',
        },
      },
      {
        offset: '0x10 (16)',
        field: 'prev',
        type: '*sudog',
        note: {
          uk: 'Попередній елемент у двозв’язному списку',
          en: 'Previous element in doubly-linked list',
        },
      },
      {
        offset: '0x18 (24)',
        field: 'elem',
        type: 'unsafe.Pointer',
        note: {
          uk: 'Вказівник на дані (буфер передачі/прийому)',
          en: 'Pointer to data element',
        },
      },
      {
        offset: '0x20 (32)',
        field: 'acquiretime',
        type: 'int64',
        note: {
          uk: 'Мітка часу початку очікування (для профайлера)',
          en: 'Wait start timestamp (for profiler)',
        },
      },
      {
        offset: '0x28 (40)',
        field: 'releasetime',
        type: 'int64',
        note: {
          uk: 'Мітка часу розблокування',
          en: 'Release timestamp',
        },
      },
      {
        offset: '0x30 (48)',
        field: 'ticket',
        type: 'uint32',
        note: {
          uk: 'Тікет для черговості в семафорах',
          en: 'Ticket for semaphore queue ordering',
        },
      },
      {
        offset: '0x34 (52)',
        field: 'isSelect',
        type: 'bool',
        note: {
          uk: 'Прапор участі в операції select',
          en: 'Flag indicating select operation participation',
        },
      },
      {
        offset: '0x38 (56)',
        field: 'c',
        type: '*hchan',
        note: {
          uk: 'Вказівник на канал, на якому заблокована G',
          en: 'Pointer to channel where G is blocked',
        },
      },
    ],
  },
];
