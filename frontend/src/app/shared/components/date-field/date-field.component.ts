import { Component, computed, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-date-field',
  imports: [
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.scss',
})
export class DateFieldComponent implements ControlValueAccessor {
  readonly mode = input<'date' | 'year'>('date');
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly required = input(false);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly value = signal<Date | null>(null);
  readonly disabled = signal(false);
  readonly touched = signal(false);
  readonly yearText = computed(() => this.value()?.getFullYear().toString() ?? '');

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null | undefined): void {
    this.value.set(this.parse(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  change(value: Date | null): void {
    this.value.set(value);
    this.onChange(value ? this.format(value) : '');
  }

  selectYear(value: Date): void {
    const selected = new Date(value.getFullYear(), 0, 1);
    this.value.set(selected);
    this.onChange(String(selected.getFullYear()));
    this.touch();
  }

  touch(): void {
    this.touched.set(true);
    this.onTouched();
  }

  dateLimit(value?: string): Date | null {
    return this.parse(value);
  }

  private parse(value?: string | null): Date | null {
    if (!value) return null;
    if (/^\d{4}$/.test(value)) {
      return new Date(Number(value), 0, 1);
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private format(value: Date): string {
    const year = value.getFullYear();
    if (this.mode() === 'year') return String(year);
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
