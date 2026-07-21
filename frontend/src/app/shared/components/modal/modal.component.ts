import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  readonly label = input.required<string>();
  readonly closeOnBackdrop = input(true);
  readonly closed = output<void>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly document = inject(DOCUMENT);
  private readonly overlayContainer = inject(OverlayContainer);

  ngAfterViewInit(): void {
    const dialog = this.dialog().nativeElement;
    dialog.showModal();
    dialog.appendChild(this.overlayContainer.getContainerElement());
  }

  ngOnDestroy(): void {
    const dialog = this.dialog().nativeElement;
    const overlays = this.overlayContainer.getContainerElement();
    if (overlays.parentElement === dialog) {
      this.document.body.appendChild(overlays);
    }
    if (dialog.open) dialog.close();
  }

  handleCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  handleBackdropClick(event: PointerEvent): void {
    if (this.closeOnBackdrop() && event.target === this.dialog().nativeElement) {
      this.closed.emit();
    }
  }
}
