import { Component, HostListener, OnDestroy, computed, signal } from '@angular/core';
import { lessons } from './lessons';
import { FolderArt } from './folder-art';

type Stage = 'home' | 'lesson' | 'exercise' | 'summary';
type Progress = { version: 2; completed: number[] };
type DesktopApi = { loadProgress(): Promise<number[]>; saveProgress(completed: number[]): Promise<boolean> };
declare global { interface Window { sourisDesktop?: DesktopApi } }

const browserKey = 'souris-progress-v2';
const hoverLabels = ['ouvrir un document', 'lancer l’impression', 'enregistrer le document'];

function readBrowserProgress(): number[] {
  try {
    const data = JSON.parse(localStorage.getItem(browserKey) ?? 'null') as Progress | null;
    return data?.version === 2 && Array.isArray(data.completed) ? data.completed : [];
  } catch { return []; }
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

@Component({ selector: 'app-root', imports: [FolderArt], templateUrl: './app.html' })
export class App implements OnDestroy {
  readonly lessons = lessons;
  readonly stage = signal<Stage>('home');
  readonly sectionIndex = signal(0);
  readonly completed = signal<number[]>([]);
  readonly feedback = signal('');
  readonly doneCount = computed(() => this.completed().length);
  readonly firstIncomplete = computed(() => lessons.findIndex((_, i) => !this.completed().includes(i)));
  readonly currentLesson = computed(() => lessons[this.sectionIndex()]);
  readonly blocks = computed(() => lessonBlocks(this.currentLesson().markdown));
  readonly isDone = computed(() => this.completed().includes(this.sectionIndex()));
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
  private hoverTimer?: ReturnType<typeof setTimeout>;
  private drag?: { pointerId: number; offsetX: number; offsetY: number };

  constructor() { this.loadProgress(); this.resetExercise(); }
  ngOnDestroy(): void { this.clearHoverTimer(); }

  private async loadProgress(): Promise<void> {
    let values: number[];
    try { values = window.sourisDesktop ? await window.sourisDesktop.loadProgress() : readBrowserProgress(); }
    catch { values = []; }
    this.completed.set([...new Set(values.filter((i) => Number.isInteger(i) && i >= 0 && i < lessons.length))].sort());
  }
  private async saveProgress(values: number[]): Promise<boolean> {
    try {
      if (window.sourisDesktop) return await window.sourisDesktop.saveProgress(values);
      localStorage.setItem(browserKey, JSON.stringify({ version: 2, completed: values } satisfies Progress));
      return true;
    } catch { return false; }
  }

  start(index = 0): void { this.sectionIndex.set(index); this.stage.set('lesson'); this.resetExercise(); }
  goTo(index: number): void { if (this.stage() !== 'home') this.start(index); }
  async restartTutorial(): Promise<void> {
    if (!await this.saveProgress([])) {
      this.feedback.set('La progression n’a pas pu être remise à zéro. Réessaie.');
      return;
    }
    this.completed.set([]);
    this.start();
  }
  back(): void {
    const stage = this.stage();
    if (stage === 'summary') { this.sectionIndex.set(lessons.length - 1); this.stage.set('lesson'); }
    else if (stage === 'exercise') this.stage.set('lesson');
    else if (this.sectionIndex() > 0) this.sectionIndex.update((i) => i - 1);
    else this.stage.set('home');
    this.resetExercise();
  }
  next(): void {
    if (this.stage() === 'lesson') { this.stage.set('exercise'); this.resetExercise(); }
    else if (this.stage() === 'exercise' && this.isDone()) {
      if (this.sectionIndex() === lessons.length - 1) this.stage.set('summary');
      else { this.sectionIndex.update((i) => i + 1); this.stage.set('lesson'); }
      this.resetExercise();
    }
  }
  resetExercise(): void {
    this.clearHoverTimer();
    this.feedback.set(this.stage() === 'exercise' && this.isDone()
      ? 'Cet exercice est déjà réussi. Tu peux le refaire ou passer à la suite.'
      : 'Prends ton temps. Tu peux essayer autant de fois que tu veux.');
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
  }
  private async complete(): Promise<void> {
    if (this.stage() !== 'exercise') return;
    const values = [...new Set([...this.completed(), this.sectionIndex()])].sort();
    const newCompletion = !this.isDone();
    this.completed.set(values);
    const saved = !newCompletion || await this.saveProgress(values);
    this.feedback.set(saved
      ? 'Bravo ! Tu as réussi l’exercice. Tu peux passer à la suite.'
      : 'Bravo ! Tu as réussi l’exercice. La progression n’a pas pu être gardée pour la prochaine fois.');
  }
  tryAgain(message = 'Presque ! Essaie encore doucement.'): void {
    if (!this.isDone()) this.feedback.set(message);
  }
  play(): void { this.clickPlayed.set(true); this.checkFirstExercise(); }
  chooseCoffee(choice: string): void {
    this.coffeeChoice.set(choice);
    if (choice !== 'Cappuccino') this.tryAgain();
    this.checkFirstExercise();
  }
  fileAction(action: string): void {
    this.fileMenuOpen.set(false);
    if (action === 'Imprimer') { this.printed.set(true); this.checkFirstExercise(); }
    else this.tryAgain();
  }
  private checkFirstExercise(): void {
    if (this.clickPlayed() && this.coffeeChoice() === 'Cappuccino' && this.printed()) void this.complete();
  }
  openFolder(): void { this.folderOpen.set(true); void this.complete(); }

  dragStart(event: PointerEvent): void {
    if (event.button !== 0 || this.fileDropped()) return;
    const file = event.currentTarget as HTMLElement;
    const rect = file.getBoundingClientRect();
    this.drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    file.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  dragMove(event: PointerEvent): void {
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
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.drag = undefined;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    if (this.folderHighlighted()) { this.fileDropped.set(true); void this.complete(); }
    else { this.dragX.set(16); this.dragY.set(58); this.tryAgain(); }
    this.folderHighlighted.set(false);
  }
  showContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const scene = (event.currentTarget as HTMLElement).parentElement!;
    const rect = scene.getBoundingClientRect();
    this.contextMenu.set({ x: Math.max(0, Math.min(event.clientX - rect.left, rect.width - 225)),
      y: Math.max(0, Math.min(event.clientY - rect.top, rect.height - 130)) });
  }
  contextAction(action: string): void {
    this.contextMenu.set(null);
    if (action === 'Ouvrir') void this.complete();
    else this.tryAgain();
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as Element).closest('.context-scene')) this.contextMenu.set(null);
    if (!(event.target as Element).closest('.file-menu')) this.fileMenuOpen.set(false);
  }
  checkSelection(event: Event): void {
    const field = event.target as HTMLTextAreaElement;
    if (field.value.slice(field.selectionStart, field.selectionEnd).trim().toLowerCase() === 'petite barre')
      void this.complete();
  }
  hoverEnter(index: number): void {
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
    if (this.hoverIndex() === index) this.hoverEnter(index);
  }
  chooseHover(index: number): void {
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
