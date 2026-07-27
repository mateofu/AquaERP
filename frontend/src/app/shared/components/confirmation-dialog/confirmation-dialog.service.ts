import { Injectable, signal } from '@angular/core';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

export interface ConfirmationRequest extends ConfirmationOptions {
  resolve: (value: boolean | string | null) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  readonly request = signal<ConfirmationRequest | null>(null);

  confirm(options: ConfirmationOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.request.set({
        ...options,
        resolve: (value) => resolve(value === true),
      });
    });
  }

  prompt(options: ConfirmationOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.request.set({
        ...options,
        resolve: (value) => resolve(typeof value === 'string' ? value : null),
      });
    });
  }

  accept(inputValue = ''): void {
    const current = this.request();
    if (!current) return;
    current.resolve(current.inputLabel ? inputValue.trim() : true);
    this.request.set(null);
  }

  cancel(): void {
    const current = this.request();
    if (!current) return;
    current.resolve(current.inputLabel ? null : false);
    this.request.set(null);
  }
}
