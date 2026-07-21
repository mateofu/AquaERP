import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DateFieldComponent } from '../date-field/date-field.component';

export interface ListFilterOption {
  label: string;
  value: string | number;
}

export interface ListFilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'year';
  options?: ListFilterOption[];
  emptyLabel?: string;
}

export type ListFilterValues = Record<string, string>;
export interface ListFilterQuery {
  search: string;
  filters: ListFilterValues;
}

@Component({
  selector: 'app-list-filters',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    DateFieldComponent,
  ],
  templateUrl: './list-filters.component.html',
  styleUrl: './list-filters.component.scss',
})
export class ListFiltersComponent {
  private readonly yearControls = new Map<string, FormControl<string>>();
  readonly placeholder = input('Buscar');
  readonly fields = input<ListFilterField[]>([]);
  readonly filterChange = output<ListFilterQuery>();
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly searchValue = signal('');
  readonly values = signal<ListFilterValues>({});
  readonly hasFilters = computed(
    () =>
      Boolean(this.searchValue()) ||
      Object.values(this.values()).some(Boolean),
  );

  search(): void {
    this.filterChange.emit({
      search: this.searchControl.value.trim(),
      filters: this.values(),
    });
  }

  clear(): void {
    this.searchControl.setValue('');
    this.searchValue.set('');
    this.values.set({});
    this.yearControls.forEach((control) => control.setValue('', { emitEvent: false }));
    this.filterChange.emit({ search: '', filters: {} });
  }

  updateValue(key: string, value: string | number): void {
    this.values.update((current) => ({ ...current, [key]: String(value) }));
  }

  yearControl(key: string): FormControl<string> {
    const existing = this.yearControls.get(key);
    if (existing) return existing;
    const control = new FormControl('', { nonNullable: true });
    control.valueChanges.subscribe((value) => this.updateValue(key, value));
    this.yearControls.set(key, control);
    return control;
  }
}
