import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';

describe('Parcours Souris', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  });

  it('garde la suite verrouillée jusqu’aux trois actions du premier exercice', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('.section-link')).toHaveLength(7);
    (root.querySelector('.home .big') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Clic gauche');
    (root.querySelector('.actions button:last-child') as HTMLButtonElement).click();
    fixture.detectChanges();
    const next = () => root.querySelector('.actions button:last-child') as HTMLButtonElement;
    expect(next().disabled).toBe(true);

    (root.querySelector('.first-scene .click-action button') as HTMLButtonElement).click();
    (root.querySelectorAll('.coffee input')[1] as HTMLInputElement).click();
    fixture.detectChanges();
    expect(next().disabled).toBe(true);
    (root.querySelector('.file-menu > button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('.popup-menu button:last-child') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(next().disabled).toBe(false);
    expect(root.querySelector('.result-dialog[open] #result-title')?.textContent).toContain('Exercice réussi');
    expect(root.querySelector('.exercise.locked')?.hasAttribute('inert')).toBe(true);
    expect(root.querySelector('.feedback')).toBeNull();
    expect(root.querySelector('.actions .secondary')?.textContent).toContain('Recommencer l’exercice');
    expect(root.querySelector('.progress strong')?.textContent?.trim()).toBe('1 / 7 exercices réussis');
    expect(JSON.parse(localStorage.getItem('souris-progress-v2') ?? '{}').completed).toEqual([0]);
  });

  it('ouvre le niveau actif et reprend les six réussites du niveau 1', async () => {
    localStorage.clear();
    localStorage.setItem('souris-progress-v2', JSON.stringify({ version: 2, completed: [0, 1, 2, 3, 4, 5] }));
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.home .big')?.textContent?.trim()).toBe('Continuer vers La corbeille');
    const headers = root.querySelectorAll<HTMLButtonElement>('.level-header');
    expect(headers).toHaveLength(2);
    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
    expect(headers[1].getAttribute('aria-expanded')).toBe('false');

    headers[0].click();
    fixture.detectChanges();
    expect(headers[0].getAttribute('aria-expanded')).toBe('false');
    headers[1].click();
    fixture.detectChanges();
    expect(headers[0].getAttribute('aria-expanded')).toBe('false');
    expect(headers[1].getAttribute('aria-expanded')).toBe('true');
    (root.querySelector('#level-2-sections .section-link') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('La corbeille');
    expect(root.querySelector('.advanced-desktop')).not.toBeNull();
    expect((root.querySelector('.actions button:last-child') as HTMLButtonElement).disabled).toBe(true);
    expect(root.querySelector('.progress strong')?.textContent?.trim()).toBe('6 / 7 exercices réussis');

    headers[0].click();
    fixture.detectChanges();
    (root.querySelector('#level-1-sections .section-link') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
    expect(headers[1].getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Clic gauche');

    const app = fixture.componentInstance;
    app.start(5);
    app.next();
    app.next();
    fixture.detectChanges();
    expect(app.stage()).toBe('advanced');
    expect(headers[0].getAttribute('aria-expanded')).toBe('false');
    expect(headers[1].getAttribute('aria-expanded')).toBe('true');
    app.back();
    expect(app.stage()).toBe('exercise');
  });

  it('reprend un échec enregistré et efface le X quand l’exercice recommence', async () => {
    localStorage.clear();
    localStorage.setItem('souris-progress-v2', JSON.stringify({ version: 2, completed: [0], failed: [6] }));
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#level-2-sections .check.failed')?.textContent).toBe('×');
    expect(root.querySelector('#level-2-sections .section-link')?.getAttribute('aria-label')).toContain('exercice échoué');

    fixture.componentInstance.goTo(6);
    fixture.detectChanges();
    (root.querySelector('.actions .secondary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('#level-2-sections .check.failed')).toBeNull();
    expect(JSON.parse(localStorage.getItem('souris-progress-v2') ?? '{}').failed).toEqual([]);
  });

  it('affiche un échec pour une mauvaise suppression et réussit avec la bonne image seule', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.goTo(6);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const firstTarget = app.advancedTargetIndex();

    const dialog = root.querySelector('.hints-dialog') as HTMLDialogElement;
    const result = root.querySelector('.result-dialog') as HTMLDialogElement;
    const hintButton = root.querySelector('.hint-button') as HTMLButtonElement;
    expect(hintButton.title).toBe('Voir les indices');
    hintButton.click();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.textContent).toContain('Double-clique sur un dossier');
    const dialogClose = dialog.querySelector('.hints-close') as HTMLButtonElement;
    expect(dialogClose.title).toBe('Fermer les indices');
    dialogClose.click();
    expect(dialog.hasAttribute('open')).toBe(false);
    hintButton.click();
    (dialog.querySelector('.hints-actions button') as HTMLButtonElement).click();
    expect(dialog.hasAttribute('open')).toBe(false);

    const scene = root.querySelector('.advanced-desktop') as HTMLElement;
    const trash = root.querySelector('.advanced-trash') as HTMLElement;
    scene.getBoundingClientRect = () => ({ left: 0, top: 0, right: 720, bottom: 430, width: 720, height: 430 }) as DOMRect;
    trash.getBoundingClientRect = () => ({ left: 527, top: 120, right: 678, bottom: 357, width: 151, height: 237 }) as DOMRect;
    const openTrashMenu = () => {
      trash.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 600, clientY: 220 }));
      fixture.detectChanges();
    };
    const menuButton = (name: string) => [...root.querySelectorAll<HTMLButtonElement>('.trash-menu button')]
      .find((button) => button.textContent?.trim() === name)!;
    openTrashMenu();
    expect(menuButton('Restaurer les éléments').disabled).toBe(true);
    expect(menuButton('Vider la corbeille').disabled).toBe(true);

    root.querySelector('.advanced-folder')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelectorAll('.advanced-image-file')).toHaveLength(4);
    expect(root.querySelector('.exercise-toast')).toBeNull();
    expect((root.querySelector('.advanced-window-bar button') as HTMLButtonElement).title).toBe('Fermer le dossier Images');
    expect(root.querySelector('.desktop-taskbar button')).toBeNull();

    const dragFile = (index: number) => {
      const file = [...root.querySelectorAll<HTMLElement>('.advanced-image-file')]
        .find((item) => item.textContent?.includes(app.advancedPhotos[index].name))!;
      file.setPointerCapture = () => {};
      file.hasPointerCapture = () => true;
      file.releasePointerCapture = () => {};
      file.getBoundingClientRect = () => ({ left: 70, top: 200, right: 166, bottom: 316, width: 96, height: 116 }) as DOMRect;
      const pointer = (name: string, x: number, y: number) => {
        const event = new MouseEvent(name, { bubbles: true, button: 0, clientX: x, clientY: y });
        Object.defineProperty(event, 'pointerId', { value: 2 });
        file.dispatchEvent(event);
      };
      pointer('pointerdown', 84, 216);
      pointer('pointermove', 600, 220);
      pointer('pointerup', 600, 220);
      fixture.detectChanges();
    };

    const wrong = (firstTarget + 1) % 4;
    dragFile(wrong);
    expect(app.advancedTrashedImages()).toEqual([wrong]);
    expect(root.querySelectorAll('.advanced-trash svg image')).toHaveLength(1);
    expect(root.querySelectorAll('.advanced-image-file')).toHaveLength(3);
    expect(root.querySelector('.exercise-toast')).toBeNull();
    expect((root.querySelector('.actions button:last-child') as HTMLButtonElement).disabled).toBe(true);

    openTrashMenu();
    menuButton('Restaurer les éléments').click();
    fixture.detectChanges();
    expect(app.advancedTrashedImages()).toEqual([]);
    expect(root.querySelectorAll('.advanced-image-file')).toHaveLength(4);
    expect(root.querySelectorAll('.advanced-trash svg image')).toHaveLength(0);
    expect(root.querySelector('.exercise-toast')).toBeNull();

    dragFile(wrong);
    openTrashMenu();
    menuButton('Vider la corbeille').click();
    fixture.detectChanges();
    expect(app.completed()).not.toContain(6);
    expect(app.advancedDeletedImages()).toEqual([wrong]);
    expect(root.querySelectorAll('.advanced-image-file')).toHaveLength(3);
    expect(result.open).toBe(true);
    expect(result.textContent).toContain('Exercice échoué');
    expect(result.textContent).toContain(app.advancedPhotos[wrong].name);
    expect(root.querySelector('#level-2-sections .check.failed')?.textContent).toBe('×');
    expect(root.querySelector('.advanced-exercise.locked')?.hasAttribute('inert')).toBe(true);
    app.closeResult();

    (root.querySelector('.actions .secondary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(app.advancedTargetIndex()).not.toBe(firstTarget);
    expect(root.querySelector('#level-2-sections .check.failed')).toBeNull();
    expect(root.querySelector('.advanced-exercise.locked')).toBeNull();
    root.querySelector('.advanced-folder')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelectorAll('.advanced-image-file')).toHaveLength(4);
    const target = app.advancedTargetIndex();
    dragFile((target + 1) % 4);
    dragFile(target);
    expect(app.advancedTrashedImages()).toHaveLength(2);
    expect(root.querySelectorAll('.advanced-trash svg image')).toHaveLength(2);
    expect(root.querySelectorAll('.advanced-image-file')).toHaveLength(2);
    openTrashMenu();
    menuButton('Vider la corbeille').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelectorAll('.advanced-trash svg image')).toHaveLength(0);
    expect(root.querySelectorAll('.advanced-image-file')).toHaveLength(2);
    expect(app.advancedDeletedImages()).toHaveLength(2);
    expect(app.completed()).not.toContain(6);
    expect(result.open).toBe(true);
    expect(result.textContent).toContain('Exercice échoué');
    app.closeResult();

    (root.querySelector('.actions .secondary') as HTMLButtonElement).click();
    fixture.detectChanges();
    root.querySelector('.advanced-folder')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    dragFile(app.advancedTargetIndex());
    openTrashMenu();
    menuButton('Vider la corbeille').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(app.advancedDeletedImages()).toEqual([app.advancedTargetIndex()]);
    expect(app.completed()).toContain(6);
    expect(result.open).toBe(true);
    expect(result.textContent).toContain('Exercice réussi');
    expect(root.querySelector('.advanced-exercise.locked')?.hasAttribute('inert')).toBe(true);
    expect(root.querySelector('#level-2-sections .check.done')).not.toBeNull();
    expect(JSON.parse(localStorage.getItem('souris-progress-v2') ?? '{}').completed).toEqual([6]);
    expect((root.querySelector('.actions button:last-child') as HTMLButtonElement).disabled).toBe(false);
    (result.querySelector('.result-actions button') as HTMLButtonElement).click();
    expect(result.open).toBe(false);
    (root.querySelector('.actions button:last-child') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Bravo pour ton parcours !');
  });

  it('valide le double clic, le clic droit, la sélection et le survol', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const enterExercise = (index: number) => { app.start(index); app.next(); fixture.detectChanges(); };

    enterExercise(1);
    expect(root.querySelectorAll('.folder .previews image')).toHaveLength(4);
    root.querySelector('.folder')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelector('.folder svg')?.classList.contains('open')).toBe(true);
    expect(root.querySelector('.result-dialog[open]')).toBeNull();
    expect(app.exerciseLocked()).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 1550));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(app.completed()).toContain(1);
    expect(root.querySelector('.result-dialog[open]')?.textContent).toContain('Exercice réussi');
    expect(root.querySelector('.exercise.locked')?.hasAttribute('inert')).toBe(true);
    app.closeResult();

    enterExercise(1);
    expect(app.exerciseLocked()).toBe(true);
    root.querySelector('.folder')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(app.folderOpen()).toBe(false);
    (root.querySelector('.actions .secondary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(app.exerciseLocked()).toBe(false);

    enterExercise(3);
    root.querySelector('.context-image')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 100 }));
    fixture.detectChanges();
    (root.querySelector('.context-popup button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(app.completed()).toContain(3);
    expect(root.querySelector('.result-dialog[open]')?.textContent).toContain('Exercice réussi');
    app.closeResult();

    enterExercise(4);
    const text = root.querySelector('textarea')!;
    text.setSelectionRange(3, 15);
    text.dispatchEvent(new Event('select', { bubbles: true }));
    await fixture.whenStable();
    expect(app.completed()).toContain(4);
    expect(root.querySelector('.result-dialog[open]')?.textContent).toContain('Exercice réussi');
    app.closeResult();

    enterExercise(5);
    const target = app.hoverActions().indexOf(app.hoverTarget());
    const button = root.querySelectorAll('.hover-choice button')[target] as HTMLButtonElement;
    button.dispatchEvent(new Event('pointerenter'));
    await new Promise((resolve) => setTimeout(resolve, 1050));
    fixture.detectChanges();
    expect(root.querySelector('.tooltip')?.textContent?.toLowerCase()).toContain(app.hoverTarget());
    button.click();
    await fixture.whenStable();
    expect(app.completed()).toContain(5);
    expect(root.querySelector('.result-dialog[open]')?.textContent).toContain('Exercice réussi');
  });

  it('valide le dépôt du fichier dans le dossier', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.start(2);
    app.next();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const scene = root.querySelector('.drag-stage') as HTMLElement;
    const file = root.querySelector('.drag-file') as HTMLElement;
    const folder = root.querySelector('.drop-folder') as HTMLElement;
    file.setPointerCapture = () => {};
    file.releasePointerCapture = () => {};
    file.getBoundingClientRect = () => ({ left: 16, top: 58, right: 141, bottom: 203, width: 125, height: 145 }) as DOMRect;
    scene.getBoundingClientRect = () => ({ left: 0, top: 0, right: 560, bottom: 280, width: 560, height: 280 }) as DOMRect;
    folder.getBoundingClientRect = () => ({ left: 330, top: 70, right: 480, bottom: 195, width: 150, height: 125 }) as DOMRect;
    const pointer = (name: string, x: number, y: number) => {
      const event = new MouseEvent(name, { bubbles: true, button: 0, clientX: x, clientY: y });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      file.dispatchEvent(event);
    };
    pointer('pointerdown', 30, 70);
    pointer('pointermove', 364, 82);
    pointer('pointerup', 364, 82);
    await fixture.whenStable();
    expect(app.completed()).toContain(2);
    expect(root.querySelector('.result-dialog[open]')?.textContent).toContain('Exercice réussi');
  });
});
