import { Component, inject, signal } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { ConfirmationDialogService } from './confirmation-dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [ModalComponent],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent {
  readonly dialog = inject(ConfirmationDialogService);
  readonly inputValue = signal('');

  accept(): void {
    this.dialog.accept(this.inputValue());
    this.inputValue.set('');
  }

  cancel(): void {
    this.inputValue.set('');
    this.dialog.cancel();
  }
}
