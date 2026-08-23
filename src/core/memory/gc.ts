import type { RuntimeSnapshot } from '../engine/types';

export type GCPhase = '_GCoff' | '_GCmark' | '_GCmarktermination';

export interface TriColorState {
  white: Set<string>; // Об'єкти-кандидати на видалення (Unvisited)
  grey: Set<string>;  // Зачерпнуті об'єкти, що очікують сканування
  black: Set<string>; // Перевірені корисні об'єкти (Alive)
}

export class GarbageCollector {
  public phase: GCPhase = '_GCoff';
  public triColor: TriColorState = {
    white: new Set(),
    grey: new Set(),
    black: new Set(),
  };

  /**
   * Зупинка світу (runtime.stopTheWorld)
   */
  public stopTheWorld(snapshot: RuntimeSnapshot): void {
    Object.values(snapshot.processors).forEach((p) => {
      p.status = '_Pgcstop';
    });
    snapshot.action = 'runtime.stopTheWorld()';
    snapshot.explanation = 'STW Phase: Усі P переведено у стан _Pgcstop. Призупинено виконання юзер-коду для фіксації кореневих посилань (Root Scanning).';
  }

  /**
   * Відновлення роботи (runtime.startTheWorld)
   */
  public startTheWorld(snapshot: RuntimeSnapshot): void {
    Object.values(snapshot.processors).forEach((p, idx) => {
      p.status = idx === 0 ? '_Prunning' : '_Pidle';
    });
    snapshot.action = 'runtime.startTheWorld()';
    snapshot.explanation = 'Start-The-World: Відновлено виконання мутаторів. Процесори повернуто у робочі стани.';
  }

  /**
   * Гібридний бар'єр запису (runtime.gcWriteBarrier)
   * Реалізує комбіноване правило Dijkstra & Yuasa під час фази _GCmark
   */
  public gcWriteBarrier(slotAddr: string, oldPtr: string, newPtr: string): { shadeOld: boolean; shadeNew: boolean; explanation: string } {
    if (this.phase !== '_GCmark') {
      return { shadeOld: false, shadeNew: false, explanation: 'Write barrier inactive outside _GCmark phase.' };
    }

    let shadeOld = false;
    let shadeNew = false;

    // Yuasa Barrier: Старе значення посилання підфарбовується у сірий колір
    if (this.triColor.white.has(oldPtr)) {
      this.triColor.white.delete(oldPtr);
      this.triColor.grey.add(oldPtr);
      shadeOld = true;
    }

    // Dijkstra Barrier: Нове значення посилання також підфарбовується у сірий колір
    if (this.triColor.white.has(newPtr)) {
      this.triColor.white.delete(newPtr);
      this.triColor.grey.add(newPtr);
      shadeNew = true;
    }

    const explanation = `runtime.gcWriteBarrier(*slot=${slotAddr}): Включено гібридний бар'єр. OldPtr (${oldPtr}) -> Grey, NewPtr (${newPtr}) -> Grey. Запобігання втраті посилань під час паралельного маркування.`;

    return { shadeOld, shadeNew, explanation };
  }

  /**
   * Повний цикл фази маркування Tri-color Mark & Sweep
   */
  public stepMarking(): void {
    if (this.triColor.grey.size === 0) {
      this.phase = '_GCmarktermination';
      return;
    }

    // Вибираємо елемент із сірої множини
    const addr = this.triColor.grey.values().next().value!;
    this.triColor.grey.delete(addr);
    this.triColor.black.add(addr);
  }
}
