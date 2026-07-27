import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: 'input[appNumericInput]',
})
export class NumericInputDirective {
  readonly decimals = input(0);
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (['e', 'E', '+', '-', ','].includes(event.key)) event.preventDefault();
  }

  @HostListener('beforeinput', ['$event'])
  handleBeforeInput(event: InputEvent): void {
    if (!event.data || event.inputType.startsWith('delete')) return;
    if (!this.isValid(this.nextValue(event.data))) event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  handlePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!this.isValid(this.nextValue(pasted))) event.preventDefault();
  }

  private nextValue(inserted: string): string {
    const input = this.element.nativeElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    return input.value.slice(0, start) + inserted + input.value.slice(end);
  }

  private isValid(value: string): boolean {
    const decimalPlaces = Math.max(0, this.decimals());
    if (decimalPlaces === 0) return /^\d*$/.test(value);
    return new RegExp(`^\\d*(?:\\.\\d{0,${decimalPlaces}})?$`).test(value);
  }
}
