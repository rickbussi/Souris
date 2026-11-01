import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('Parcours Souris', () => {
  it('garde la suite verrouillée jusqu’aux trois actions du premier exercice', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('.section-link')).toHaveLength(6);
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
    expect(root.querySelector('.progress strong')?.textContent?.trim()).toBe('1 / 6 exercices réussis');
    expect(JSON.parse(localStorage.getItem('souris-progress-v2') ?? '{}').completed).toEqual([0]);
  });

  it('valide le double clic, le clic droit, la sélection et le survol', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const enterExercise = (index: number) => { app.start(index); app.next(); fixture.detectChanges(); };

    enterExercise(1);
    root.querySelector('.folder')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await fixture.whenStable();
    expect(app.completed()).toContain(1);

    enterExercise(3);
    root.querySelector('.context-image')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 100 }));
    fixture.detectChanges();
    (root.querySelector('.context-popup button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(app.completed()).toContain(3);

    enterExercise(4);
    const text = root.querySelector('textarea')!;
    text.setSelectionRange(3, 15);
    text.dispatchEvent(new Event('select', { bubbles: true }));
    await fixture.whenStable();
    expect(app.completed()).toContain(4);

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
  });
});
