import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { lessons } from './lessons';
import { FolderArt } from './folder-art';
import { TrashArt } from './trash-art';

type Stage = 'home' | 'lesson' | 'exercise' | 'advanced' | 'mail' | 'summary';
type Level = 1 | 2;
type Progress = { version: 2; completed: number[]; failed?: number[] };
type DesktopApi = { loadProgress(): Promise<Progress>; saveProgress(progress: Progress): Promise<boolean> };
declare global { interface Window { sourisDesktop?: DesktopApi } }

const browserKey = 'souris-progress-v2';
const hoverLabels = ['ouvrir un document', 'lancer l’impression', 'enregistrer le document'];
const folderSuccessDelayMs = 1500;
const advancedPhotos = [
  { file: 'cappuccino-heart.png', name: 'cappuccino.png' },
  { file: 'suv-gris.png', name: 'voiture.png' },
  { file: 'ballon-plage.png', name: 'ballon.png' },
  { file: 'cavalier-echecs.png', name: 'cavalier.png' }
];
const mailExerciseIndex = lessons.length + 1;
const totalExercises = lessons.length + 2;

function readBrowserProgress(): Progress {
  try {
    const data = JSON.parse(localStorage.getItem(browserKey) ?? 'null') as Progress | null;
    return data?.version === 2 && Array.isArray(data.completed)
      ? { version: 2, completed: data.completed, failed: Array.isArray(data.failed) ? data.failed : [] }
      : { version: 2, completed: [], failed: [] };
  } catch { return { version: 2, completed: [], failed: [] }; }
}

function lessonBlocks(markdown: string): { list: boolean; html: string }[] {
  const blocks: { list: boolean; html: string }[] = [];
  let paragraph: string[] = [];
  const format = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const flush = () => {
    if (paragraph.length) blocks.push({ list: false, html: format(paragraph.join(' ')) });
    paragraph = [];
  };
  for (const raw of markdown.replaceAll('\r', '').split('\n')) {
    const line = raw.trim();
    if (!line) flush();
    else if (/^(?:\d+\.|-) /.test(line)) {
      flush();
      blocks.push({ list: true, html: format(line.startsWith('- ') ? `• ${line.slice(2)}` : line) });
    } else paragraph.push(line);
  }
  flush();
  return blocks;
}

@Component({ selector: 'app-root', imports: [FolderArt, TrashArt], templateUrl: './app.html' })
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('shell') shellElement?: ElementRef<HTMLElement>;
  @ViewChild('hintsDialog') hintsDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('resultDialog') resultDialog?: ElementRef<HTMLDialogElement>;
  readonly lessons = lessons;
  readonly advancedPhotos = advancedPhotos;
  readonly totalExercises = totalExercises;
  readonly levels = [
    { number: 1 as const, entries: lessons.map((lesson, index) => ({ title: lesson.title, index, completable: true })) },
    { number: 2 as const, entries: [
      { title: 'La corbeille', index: lessons.length, completable: true },
      { title: "Le code d'activation", index: mailExerciseIndex, completable: true }
    ] }
  ];
  readonly stage = signal<Stage>('home');
  readonly sectionIndex = signal(0);
  readonly expandedLevel = signal<Level | null>(1);
  readonly completed = signal<number[]>([]);
  readonly failed = signal<number[]>([]);
  readonly lockedExercises = signal<number[]>([]);
  readonly feedback = signal('');
  readonly resultKind = signal<'success' | 'failure'>('success');
  readonly resultMessage = signal('');
  readonly doneCount = computed(() => this.completed().length);
  readonly firstIncomplete = computed(() => {
    const levelOne = lessons.findIndex((_, i) => !this.completed().includes(i));
    if (levelOne >= 0) return levelOne;
    if (!this.completed().includes(lessons.length)) return lessons.length;
    return this.completed().includes(mailExerciseIndex) ? -1 : mailExerciseIndex;
  });
  readonly currentLesson = computed(() => lessons[this.sectionIndex()]);
  readonly blocks = computed(() => lessonBlocks(this.currentLesson().markdown));
  readonly isDone = computed(() => this.completed().includes(this.sectionIndex()));
  readonly exerciseLocked = computed(() => this.lockedExercises().includes(this.sectionIndex()));
  readonly clickPlayed = signal(false);
  readonly coffeeChoice = signal('');
  readonly fileMenuOpen = signal(false);
  readonly printed = signal(false);
  readonly folderOpen = signal(false);
  readonly dragX = signal(16);
  readonly dragY = signal(58);
  readonly fileDropped = signal(false);
  readonly folderHighlighted = signal(false);
  readonly contextMenu = signal<{ x: number; y: number } | null>(null);
  readonly hoverActions = signal<string[]>([]);
  readonly hoverTarget = signal('');
  readonly hoverIndex = signal(-1);
  readonly tooltipIndex = signal(-1);
  readonly seenTooltips = signal<number[]>([]);
  readonly advancedTargetIndex = signal(-1);
  readonly advancedFolderOpen = signal(false);
  readonly advancedTrashedImages = signal<number[]>([]);
  readonly advancedDeletedImages = signal<number[]>([]);
  readonly advancedTrashFiles = computed(() => this.advancedTrashedImages().map((index) => advancedPhotos[index].file));
  readonly advancedTrashMenu = signal<{ x: number; y: number } | null>(null);
  readonly advancedGhost = signal<{ index: number; x: number; y: number } | null>(null);
  readonly advancedTrashHot = signal(false);
  readonly mailOpen = signal(false);
  readonly validationOpen = signal(true);
  readonly mailWindowFront = signal<'validation' | 'email'>('validation');
  readonly mailWindowPositions = signal({ validation: { x: 275, y: 38 }, email: { x: 42, y: 132 } });
  readonly mailCodeSelected = signal(false);
  readonly mailContextMenu = signal<{ x: number; y: number; target: 'email' | 'validation' | 'field' } | null>(null);
  readonly validationSelection = signal({ start: 0, end: 0 });
  readonly mailCopied = signal(false);
  readonly mailPastedWithMouse = signal(false);
  readonly clipboardCopyMethod = signal<'none' | 'mouse' | 'keyboard'>('none');
  readonly lastPasteMethod = signal<'none' | 'mouse' | 'keyboard'>('none');
  readonly lastPasteCopyMethod = signal<'none' | 'mouse' | 'keyboard'>('none');
  readonly keyboardEditedCode = signal(false);
  readonly selectedMailText = signal('');
  readonly copiedMailText = signal('');
  readonly pastedCode = signal('');
  readonly desktopTime = new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  private hoverTimer?: ReturnType<typeof setTimeout>;
  private folderSuccessTimer?: ReturnType<typeof setTimeout>;
  private drag?: { pointerId: number; offsetX: number; offsetY: number };
  private advancedPointer?: { pointerId: number; index: number; offsetX: number; offsetY: number };
  private mailWindowDrag?: { pointerId: number; window: 'validation' | 'email'; offsetX: number; offsetY: number };
  private previousPage: { stage: Stage; sectionIndex: number } = { stage: 'home', sectionIndex: 0 };
  private fontResizeObserver?: ResizeObserver;

  constructor(private readonly hostElement: ElementRef<HTMLElement>) { this.loadProgress(); this.resetExercise(); }
  ngAfterViewInit(): void {
    const sidebar = this.shellElement?.nativeElement.querySelector<HTMLElement>('.sidebar');
    const measure = document.createElement('canvas').getContext('2d');
    if (!sidebar || !measure) return;
    const updateFontSize = () => {
      const fontFamily = getComputedStyle(sidebar).fontFamily;
      measure.font = `10px ${fontFamily}`;
      const referenceWidth = measure.measureText('Text reference').width;
      const sidebarWidth = sidebar.getBoundingClientRect().width;
      if (!referenceWidth || !sidebarWidth) return;
      const fontSize = Math.max(8, sidebarWidth * 0.5 * 10 / referenceWidth);
      this.hostElement.nativeElement.style.setProperty('--ui-reference-font-size', `${fontSize}px`);
    };
    updateFontSize();
    void document.fonts.ready.then(updateFontSize);
    this.fontResizeObserver = new ResizeObserver(updateFontSize);
    this.fontResizeObserver.observe(sidebar);
  }
  ngOnDestroy(): void {
    this.fontResizeObserver?.disconnect();
    this.clearHoverTimer();
    this.clearFolderSuccessTimer();
  }

  private async loadProgress(): Promise<void> {
    let progress: Progress;
    try { progress = window.sourisDesktop ? await window.sourisDesktop.loadProgress() : readBrowserProgress(); }
    catch { progress = { version: 2, completed: [], failed: [] }; }
    const valid = (values: number[]) => [...new Set(values.filter((i) => Number.isInteger(i) && i >= 0 && i < totalExercises))].sort();
    const completed = valid(progress.completed ?? []);
    this.completed.set(completed);
    this.failed.set(valid(progress.failed ?? []).filter((index) => !completed.includes(index)));
  }
  private async saveProgress(completed: number[], failed = this.failed()): Promise<boolean> {
    try {
      const progress = { version: 2, completed, failed } satisfies Progress;
      if (window.sourisDesktop) return await window.sourisDesktop.saveProgress(progress);
      localStorage.setItem(browserKey, JSON.stringify(progress));
      return true;
    } catch { return false; }
  }

  toggleLevel(level: Level): void { this.expandedLevel.update((current) => current === level ? null : level); }
  isLevelActive(level: Level): boolean {
    return level === 2 ? this.stage() === 'advanced' || this.stage() === 'mail' || this.stage() === 'summary'
      : this.stage() === 'lesson' || this.stage() === 'exercise';
  }
  start(index = 0): void {
    if (index < 0 || index >= lessons.length) return;
    this.sectionIndex.set(index);
    this.stage.set('lesson');
    this.expandedLevel.set(1);
    this.resetExercise();
  }
  goTo(index: number): void {
    if (index === lessons.length) this.openAdvancedExercise();
    else if (index === mailExerciseIndex) this.openMailExercise();
    else this.start(index);
  }
  private openAdvancedExercise(): void {
    if (this.stage() !== 'advanced') this.previousPage = { stage: this.stage(), sectionIndex: this.sectionIndex() };
    this.sectionIndex.set(lessons.length);
    this.stage.set('advanced');
    this.expandedLevel.set(2);
    this.resetExercise();
  }
  private openMailExercise(): void {
    if (this.stage() !== 'mail') this.previousPage = { stage: this.stage(), sectionIndex: this.sectionIndex() };
    this.sectionIndex.set(mailExerciseIndex);
    this.stage.set('mail');
    this.expandedLevel.set(2);
    this.resetExercise();
  }
  async restartTutorial(): Promise<void> {
    if (!await this.saveProgress([], [])) {
      this.feedback.set('La progression n’a pas pu être remise à zéro. Réessaie.');
      return;
    }
    this.completed.set([]);
    this.failed.set([]);
    this.lockedExercises.set([]);
    this.start();
  }
  back(): void {
    const stage = this.stage();
    if (stage === 'advanced') {
      this.sectionIndex.set(this.previousPage.sectionIndex);
      this.stage.set(this.previousPage.stage);
      this.expandedLevel.set(this.previousPage.stage === 'summary' ? 2 : 1);
    }
    else if (stage === 'mail') { this.sectionIndex.set(lessons.length); this.stage.set('advanced'); this.expandedLevel.set(2); }
    else if (stage === 'summary') { this.sectionIndex.set(lessons.length); this.stage.set('advanced'); this.expandedLevel.set(2); }
    else if (stage === 'exercise') this.stage.set('lesson');
    else if (this.sectionIndex() > 0) this.sectionIndex.update((i) => i - 1);
    else this.stage.set('home');
    this.resetExercise();
  }
  next(): void {
    if (this.stage() === 'lesson') { this.stage.set('exercise'); this.resetExercise(); }
    else if (this.stage() === 'exercise' && this.isDone()) {
      if (this.sectionIndex() === lessons.length - 1) { this.openAdvancedExercise(); return; }
      else { this.sectionIndex.update((i) => i + 1); this.stage.set('lesson'); }
      this.resetExercise();
    }
    else if (this.stage() === 'advanced' && this.isDone()) {
      this.openMailExercise();
      return;
    }
    else if (this.stage() === 'mail' && this.isDone()) {
      this.stage.set('summary');
      this.resetExercise();
    }
  }
  resetExercise(): void {
    this.clearHoverTimer();
    this.clearFolderSuccessTimer();
    this.feedback.set('');
    this.clickPlayed.set(false);
    this.coffeeChoice.set('');
    this.fileMenuOpen.set(false);
    this.printed.set(false);
    this.folderOpen.set(false);
    this.dragX.set(16);
    this.dragY.set(58);
    this.fileDropped.set(false);
    this.folderHighlighted.set(false);
    this.contextMenu.set(null);
    const actions = [...hoverLabels];
    for (let i = actions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [actions[i], actions[j]] = [actions[j], actions[i]];
    }
    this.hoverActions.set(actions);
    this.hoverTarget.set(actions[Math.floor(Math.random() * actions.length)]);
    this.hoverIndex.set(-1);
    this.tooltipIndex.set(-1);
    this.seenTooltips.set([]);
    this.advancedFolderOpen.set(false);
    this.advancedTrashedImages.set([]);
    this.advancedDeletedImages.set([]);
    this.advancedTrashMenu.set(null);
    this.advancedGhost.set(null);
    this.advancedTrashHot.set(false);
    this.mailOpen.set(false);
    this.validationOpen.set(true);
    this.mailWindowFront.set('validation');
    this.mailWindowPositions.set({ validation: { x: 275, y: 38 }, email: { x: 42, y: 132 } });
    this.mailCodeSelected.set(false);
    this.mailContextMenu.set(null);
    this.mailCopied.set(false);
    this.mailPastedWithMouse.set(false);
    this.clipboardCopyMethod.set('none');
    this.lastPasteMethod.set('none');
    this.lastPasteCopyMethod.set('none');
    this.keyboardEditedCode.set(false);
    this.selectedMailText.set('');
    this.copiedMailText.set('');
    this.pastedCode.set('');
    this.advancedPointer = undefined;
    if (this.stage() === 'advanced') {
      const previous = this.advancedTargetIndex();
      const next = previous < 0 ? Math.floor(Math.random() * advancedPhotos.length)
        : (previous + 1 + Math.floor(Math.random() * (advancedPhotos.length - 1))) % advancedPhotos.length;
      this.advancedTargetIndex.set(next);
    }
  }
  restartExercise(): void {
    this.failed.update((indices) => indices.filter((index) => index !== this.sectionIndex()));
    this.lockedExercises.update((indices) => indices.filter((index) => index !== this.sectionIndex()));
    void this.saveProgress(this.completed());
    this.resetExercise();
  }
  private clearFolderSuccessTimer(): void {
    if (this.folderSuccessTimer) clearTimeout(this.folderSuccessTimer);
    this.folderSuccessTimer = undefined;
  }
  private showResult(kind: 'success' | 'failure', message: string): void {
    this.resultKind.set(kind);
    this.resultMessage.set(message);
    const dialog = this.resultDialog?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
      this.lockedExercises.update((indices) => [...new Set([...indices, this.sectionIndex()])]);
    }
  }
  closeResult(): void { this.resultDialog?.nativeElement.close(); }
  private async complete(successMessage = 'Bravo ! Tu as réussi l’exercice. Tu peux passer à la suite.'): Promise<void> {
    if ((this.stage() !== 'exercise' && this.stage() !== 'advanced' && this.stage() !== 'mail') || this.exerciseLocked()) return;
    const values = [...new Set([...this.completed(), this.sectionIndex()])].sort();
    const newCompletion = !this.isDone();
    this.completed.set(values);
    this.failed.update((indices) => indices.filter((index) => index !== this.sectionIndex()));
    this.feedback.set('');
    this.showResult('success', successMessage);
    const saved = !newCompletion || await this.saveProgress(values);
    if (!saved) this.resultMessage.set('Bravo ! Tu as réussi l’exercice. La progression n’a pas pu être gardée pour la prochaine fois.');
  }
  private failExercise(reason: string): void {
    if ((this.stage() !== 'advanced' && this.stage() !== 'mail') || this.exerciseLocked()) return;
    const index = this.sectionIndex();
    this.failed.update((indices) => [...new Set([...indices, index])]);
    const values = this.completed().filter((item) => item !== index);
    this.completed.set(values);
    void this.saveProgress(values);
    this.feedback.set('');
    this.showResult('failure', reason);
  }
  tryAgain(message = 'Presque ! Essaie encore doucement.'): void {
    if (!this.isDone() && !this.exerciseLocked()) this.feedback.set(message);
  }
  play(): void { if (this.exerciseLocked()) return; this.clickPlayed.set(true); this.checkFirstExercise(); }
  chooseCoffee(choice: string): void {
    if (this.exerciseLocked()) return;
    this.coffeeChoice.set(choice);
    if (choice !== 'Cappuccino') this.tryAgain();
    this.checkFirstExercise();
  }
  fileAction(action: string): void {
    if (this.exerciseLocked()) return;
    this.fileMenuOpen.set(false);
    if (action === 'Imprimer') { this.printed.set(true); this.checkFirstExercise(); }
    else this.tryAgain();
  }
  private checkFirstExercise(): void {
    if (this.clickPlayed() && this.coffeeChoice() === 'Cappuccino' && this.printed()) void this.complete();
  }
  openFolder(): void {
    if (this.exerciseLocked() || this.folderOpen()) return;
    this.folderOpen.set(true);
    this.folderSuccessTimer = setTimeout(() => {
      this.folderSuccessTimer = undefined;
      if (this.stage() === 'exercise' && this.sectionIndex() === 1 && this.folderOpen()) void this.complete();
    }, folderSuccessDelayMs);
  }

  openAdvancedFolder(): void {
    if (this.exerciseLocked()) return;
    this.advancedFolderOpen.set(true);
  }
  openHints(): void { if (!this.exerciseLocked()) this.hintsDialog?.nativeElement.showModal(); }
  closeHints(): void { this.hintsDialog?.nativeElement.close(); }
  advancedDragStart(event: PointerEvent, index: number): void {
    if (event.button !== 0 || this.advancedPointer || this.exerciseLocked()) return;
    this.advancedTrashMenu.set(null);
    const file = event.currentTarget as HTMLElement;
    const scene = file.closest('.advanced-desktop') as HTMLElement;
    const fileRect = file.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();
    this.advancedPointer = { pointerId: event.pointerId, index,
      offsetX: event.clientX - fileRect.left, offsetY: event.clientY - fileRect.top };
    this.advancedGhost.set({ index, x: fileRect.left - sceneRect.left, y: fileRect.top - sceneRect.top });
    file.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  advancedDragMove(event: PointerEvent): void {
    if (this.exerciseLocked()) return;
    const drag = this.advancedPointer;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const scene = (event.currentTarget as HTMLElement).closest('.advanced-desktop') as HTMLElement;
    const sceneRect = scene.getBoundingClientRect();
    const trashRect = scene.querySelector('.advanced-trash')!.getBoundingClientRect();
    this.advancedGhost.set({ index: drag.index,
      x: event.clientX - sceneRect.left - drag.offsetX, y: event.clientY - sceneRect.top - drag.offsetY });
    this.advancedTrashHot.set(event.clientX >= trashRect.left && event.clientX <= trashRect.right
      && event.clientY >= trashRect.top && event.clientY <= trashRect.bottom);
  }
  advancedDragEnd(event: PointerEvent): void {
    if (this.exerciseLocked()) return;
    const drag = this.advancedPointer;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const file = event.currentTarget as HTMLElement;
    if (file.hasPointerCapture?.(event.pointerId)) file.releasePointerCapture(event.pointerId);
    this.advancedPointer = undefined;
    this.advancedGhost.set(null);
    const dropped = event.type !== 'pointercancel' && this.advancedTrashHot();
    this.advancedTrashHot.set(false);
    if (!dropped) return;
    this.advancedTrashedImages.update((items) => [...items, drag.index]);
  }
  showTrashMenu(event: MouseEvent): void {
    event.preventDefault();
    if (this.exerciseLocked()) return;
    const scene = (event.currentTarget as HTMLElement).closest('.advanced-desktop') as HTMLElement;
    const rect = scene.getBoundingClientRect();
    this.advancedTrashMenu.set({
      x: Math.max(0, Math.min(event.clientX - rect.left, rect.width - 220)),
      y: Math.max(0, Math.min(event.clientY - rect.top, rect.height - 100))
    });
  }
  restoreTrash(): void {
    if (this.exerciseLocked()) return;
    this.advancedTrashMenu.set(null);
    if (this.advancedTrashedImages().length === 0) return;
    this.advancedTrashedImages.set([]);
  }
  emptyTrash(): void {
    if (this.exerciseLocked()) return;
    this.advancedTrashMenu.set(null);
    const items = this.advancedTrashedImages();
    if (items.length === 0) return;
    const target = this.advancedTargetIndex();
    this.advancedDeletedImages.update((deleted) => [...deleted, ...items]);
    this.advancedTrashedImages.set([]);
    const wrong = items.filter((index) => index !== target);
    if (wrong.length) {
      const names = wrong.map((index) => `« ${advancedPhotos[index].name} »`).join(', ');
      this.failExercise(`Tu as supprimé définitivement ${wrong.length > 1 ? 'les images' : 'l’image'} ${names}. Seule l’image « ${advancedPhotos[target].name} » devait être supprimée. Recommence l’exercice pour réessayer.`);
    } else if (items.includes(target)) void this.complete('Bravo ! Tu as supprimé uniquement l’image demandée. Tu peux passer à la suite.');
  }

  openMail(): void {
    if (this.exerciseLocked()) return;
    this.mailOpen.set(true);
    this.bringMailWindowToFront('email');
  }
  closeMail(): void { this.mailOpen.set(false); this.bringMailWindowToFront('validation'); }
  closeValidation(): void { this.validationOpen.set(false); }
  bringMailWindowToFront(which: 'validation' | 'email'): void { this.mailWindowFront.set(which); }
  mailWindowDragStart(event: PointerEvent, which: 'validation' | 'email'): void {
    if (event.button !== 0 || this.exerciseLocked() || (event.target as HTMLElement).closest('button')) return;
    const bar = event.currentTarget as HTMLElement;
    const windowElement = bar.closest('.mail-window') as HTMLElement;
    const desktop = bar.closest('.mail-desktop') as HTMLElement;
    const rect = windowElement.getBoundingClientRect();
    this.bringMailWindowToFront(which);
    this.mailWindowDrag = { pointerId: event.pointerId, window: which,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    desktop.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  mailWindowDragMove(event: PointerEvent): void {
    const drag = this.mailWindowDrag;
    if (!drag || drag.pointerId !== event.pointerId || this.exerciseLocked()) return;
    const desktop = (event.currentTarget as HTMLElement).closest('.mail-desktop') as HTMLElement;
    const windowElement = desktop.querySelector(drag.window === 'email' ? '.email-window' : '.validation-window') as HTMLElement;
    if (!windowElement) return;
    const desktopRect = desktop.getBoundingClientRect();
    const windowRect = windowElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(desktop.clientWidth - windowRect.width, event.clientX - desktopRect.left - drag.offsetX));
    const y = Math.max(0, Math.min(desktop.clientHeight - windowRect.height - 35, event.clientY - desktopRect.top - drag.offsetY));
    this.mailWindowPositions.update((positions) => ({ ...positions, [drag.window]: { x, y } }));
  }
  mailWindowDragEnd(event: PointerEvent): void {
    if (this.mailWindowDrag?.pointerId === event.pointerId) this.mailWindowDrag = undefined;
  }
  captureMailSelection(): void {
    if (this.exerciseLocked()) return;
    const selected = window.getSelection()?.toString() ?? '';
    this.selectedMailText.set(selected);
    this.mailCodeSelected.set(selected.trim() === '482731');
  }
  showValidationContextMenu(event: MouseEvent): void {
    const target = (event.target as HTMLElement).closest('input') ? 'field' : 'validation';
    this.showMailContextMenu(event, target);
  }
  showMailContextMenu(event: MouseEvent, target: 'email' | 'validation' | 'field'): void {
    event.preventDefault();
    if (this.exerciseLocked()) return;
    if ((target === 'email' || target === 'validation') && !this.selectedMailText().trim()) return;
    if (target === 'field' && !this.validationOpen()) {
      this.tryAgain('La fenêtre de validation est fermée. Recommence l’exercice pour la rouvrir.');
      return;
    }
    const desktop = (event.currentTarget as HTMLElement).closest('.mail-desktop') as HTMLElement;
    const rect = desktop.getBoundingClientRect();
    if (target === 'field') {
      const input = (event.target as HTMLElement).closest('input') as HTMLInputElement;
      this.validationSelection.set({ start: input.selectionStart ?? input.value.length, end: input.selectionEnd ?? input.value.length });
    }
    this.mailContextMenu.set({ x: Math.max(0, Math.min(event.clientX - rect.left, rect.width - 190)),
      y: Math.max(0, Math.min(event.clientY - rect.top, rect.height - 140)), target });
  }
  mailActionDisabled(target: 'email' | 'validation' | 'field', action: 'Couper' | 'Copier' | 'Coller'): boolean {
    if (target === 'email' || target === 'validation') return action !== 'Copier' || !this.selectedMailText().trim();
    const selection = this.validationSelection();
    if (action === 'Coller') return !this.copiedMailText();
    return selection.start === selection.end;
  }
  mailContextAction(action: 'Couper' | 'Copier' | 'Coller'): void {
    const menu = this.mailContextMenu();
    if (!menu || this.exerciseLocked()) return;
    if (this.mailActionDisabled(menu.target, action)) return;
    this.mailContextMenu.set(null);
    if ((menu.target === 'email' || menu.target === 'validation') && action === 'Copier') {
      this.copiedMailText.set(this.selectedMailText());
      this.clipboardCopyMethod.set('mouse');
      this.mailCopied.set(menu.target === 'email' && this.selectedMailText().trim() === '482731');
    }
    else if (menu.target === 'field') {
      const value = this.pastedCode();
      const { start, end } = this.validationSelection();
      if (action === 'Copier' || action === 'Couper') {
        this.copiedMailText.set(value.slice(start, end));
        this.clipboardCopyMethod.set('mouse');
        this.mailCopied.set(false);
        if (action === 'Couper') {
          this.pastedCode.set(value.slice(0, start) + value.slice(end));
          this.validationSelection.set({ start, end: start });
        }
      } else if (action === 'Coller') {
        const inserted = this.copiedMailText();
        this.pastedCode.set(value.slice(0, start) + inserted + value.slice(end));
        this.lastPasteMethod.set('mouse');
        this.lastPasteCopyMethod.set(this.clipboardCopyMethod());
        this.mailPastedWithMouse.set(this.mailCopied() && this.clipboardCopyMethod() === 'mouse' && inserted.trim() === '482731');
        if (this.mailPastedWithMouse()) this.keyboardEditedCode.set(false);
        const cursor = start + inserted.length;
        this.validationSelection.set({ start: cursor, end: cursor });
      }
    }
  }
  updateValidationCode(event: Event): void {
    this.pastedCode.set((event.target as HTMLInputElement).value);
  }
  continueValidation(): void {
    if (this.exerciseLocked()) return;
    if (this.lastPasteMethod() === 'keyboard' || this.lastPasteCopyMethod() === 'keyboard' || this.keyboardEditedCode()) {
      this.failExercise('Erreur : le clavier a été utilisé. Le but de cet exercice est d’utiliser seulement la souris.');
    } else if (this.pastedCode() === '482731' && this.mailPastedWithMouse())
      void this.complete('Bravo ! Tu as copié le code du courriel et tu l’as collé dans la fenêtre de validation.');
    else this.failExercise('Erreur : le code est incorrect.');
  }

  dragStart(event: PointerEvent): void {
    if (event.button !== 0 || this.fileDropped() || this.exerciseLocked()) return;
    const file = event.currentTarget as HTMLElement;
    const rect = file.getBoundingClientRect();
    this.drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    file.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  dragMove(event: PointerEvent): void {
    if (this.exerciseLocked()) return;
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const scene = (event.currentTarget as HTMLElement).parentElement!;
    const rect = scene.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 125, event.clientX - rect.left - this.drag.offsetX));
    const y = Math.max(0, Math.min(rect.height - 145, event.clientY - rect.top - this.drag.offsetY));
    this.dragX.set(x);
    this.dragY.set(y);
    const folder = scene.querySelector('.drop-folder')!.getBoundingClientRect();
    this.folderHighlighted.set(x + rect.left + 62 > folder.left && x + rect.left + 62 < folder.right
      && y + rect.top + 72 > folder.top && y + rect.top + 72 < folder.bottom);
  }
  dragEnd(event: PointerEvent): void {
    if (this.exerciseLocked()) return;
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.drag = undefined;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    if (this.folderHighlighted()) { this.fileDropped.set(true); void this.complete(); }
    else { this.dragX.set(16); this.dragY.set(58); this.tryAgain(); }
    this.folderHighlighted.set(false);
  }
  showContextMenu(event: MouseEvent): void {
    event.preventDefault();
    if (this.exerciseLocked()) return;
    const scene = (event.currentTarget as HTMLElement).parentElement!;
    const rect = scene.getBoundingClientRect();
    this.contextMenu.set({ x: Math.max(0, Math.min(event.clientX - rect.left, rect.width - 225)),
      y: Math.max(0, Math.min(event.clientY - rect.top, rect.height - 130)) });
  }
  contextAction(action: string): void {
    if (this.exerciseLocked()) return;
    this.contextMenu.set(null);
    if (action === 'Ouvrir') void this.complete();
    else this.tryAgain();
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as Element).closest('.context-scene')) this.contextMenu.set(null);
    if (!(event.target as Element).closest('.file-menu')) this.fileMenuOpen.set(false);
    if (!(event.target as Element).closest('.advanced-trash, .trash-menu')) this.advancedTrashMenu.set(null);
    if (!(event.target as Element).closest('.mail-context-menu')) this.mailContextMenu.set(null);
  }
  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent): void {
    if ((event.target as Element).closest('.exercise')) event.preventDefault();
  }
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (this.stage() !== 'mail') return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const input = target instanceof HTMLInputElement && target.closest('.mail-exercise') ? target : null;
    if (input && !event.ctrlKey && !event.metaKey
      && (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete')) {
      this.keyboardEditedCode.set(true);
    }
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();
    if (!['c', 'x', 'v'].includes(key)) return;
    const selection = window.getSelection();
    const selectedWindow = selection?.anchorNode instanceof Element
      ? selection.anchorNode.closest('.mail-window')
      : selection?.anchorNode?.parentElement?.closest('.mail-window');
    const selectedText = selection?.toString() ?? '';

    // A document selection takes priority over whichever control still has focus.
    if ((key === 'c' || key === 'x') && selectedWindow && selectedText) {
      if (key === 'x') return; // Message and instruction text are read-only.
      event.preventDefault();
      this.copiedMailText.set(selectedText);
      this.clipboardCopyMethod.set('keyboard');
      this.mailCopied.set(false);
      return;
    }

    if (input) {
      const value = this.pastedCode();
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      if (key === 'c' || key === 'x') {
        if (start === end) return;
        event.preventDefault();
        this.copiedMailText.set(value.slice(start, end));
        this.clipboardCopyMethod.set('keyboard');
        this.mailCopied.set(false);
        if (key === 'x') this.pastedCode.set(value.slice(0, start) + value.slice(end));
      } else {
        event.preventDefault();
        const inserted = this.copiedMailText();
        this.pastedCode.set(value.slice(0, start) + inserted + value.slice(end));
        this.lastPasteMethod.set('keyboard');
        this.lastPasteCopyMethod.set(this.clipboardCopyMethod());
        this.mailCopied.set(false);
        this.mailPastedWithMouse.set(false);
      }
      return;
    }
    if (key === 'v' && target?.closest('.mail-window')) {
      event.preventDefault();
      this.lastPasteMethod.set('keyboard');
      this.lastPasteCopyMethod.set(this.clipboardCopyMethod());
      this.mailPastedWithMouse.set(false);
    }
  }
  checkSelection(event: Event): void {
    if (this.exerciseLocked()) return;
    const field = event.target as HTMLTextAreaElement;
    if (field.value.slice(field.selectionStart, field.selectionEnd).trim().toLowerCase() === 'petite barre')
      void this.complete();
  }
  hoverEnter(index: number): void {
    if (this.exerciseLocked()) return;
    this.clearHoverTimer();
    this.hoverIndex.set(index);
    this.tooltipIndex.set(-1);
    this.hoverTimer = setTimeout(() => {
      this.tooltipIndex.set(index);
      this.seenTooltips.update((seen) => [...new Set([...seen, index])]);
    }, 1000);
  }
  hoverLeave(index: number): void {
    if (this.hoverIndex() !== index) return;
    this.clearHoverTimer();
    this.hoverIndex.set(-1);
    this.tooltipIndex.set(-1);
  }
  hoverMove(index: number): void {
    if (this.exerciseLocked()) return;
    if (this.hoverIndex() === index) this.hoverEnter(index);
  }
  chooseHover(index: number): void {
    if (this.exerciseLocked()) return;
    if (this.hoverActions()[index] === this.hoverTarget() && this.seenTooltips().includes(index))
      void this.complete();
    else this.tryAgain(this.seenTooltips().includes(index)
      ? 'Ce n’est pas le bon bouton. Lis les autres info-bulles.'
      : 'Attends que l’info-bulle de ce bouton apparaisse avant de choisir.');
  }
  private clearHoverTimer(): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = undefined;
  }
}
