import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';
import { OverlayContainer } from '@angular/cdk/overlay';

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;
  let component: ModalComponent;
  let dialog: HTMLDialogElement;
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('label', 'Modal de prueba');
    component = fixture.componentInstance;
    overlayContainer = TestBed.inject(OverlayContainer);
    fixture.detectChanges();
    dialog = fixture.nativeElement.querySelector('dialog');
  });

  afterEach(() => fixture.destroy());

  it('opens in the browser top layer', () => {
    expect(dialog.open).toBeTrue();
    expect(dialog.getAttribute('aria-label')).toBe('Modal de prueba');
  });

  it('keeps Angular Material overlays inside the top layer', () => {
    expect(overlayContainer.getContainerElement().parentElement).toBe(dialog);
  });

  it('requests closing when Escape is pressed', () => {
    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('requests closing when the backdrop is pressed', () => {
    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
