import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Customer } from '../../customers/domain/customer.models';
import { CustomersApiService } from '../../customers/infrastructure/customers-api.service';
import { Property, PropertyInput } from '../domain/property.models';
import { PropertiesApiService } from '../infrastructure/properties-api.service';

@Injectable()
export class PropertiesFacade {
  private readonly api = inject(PropertiesApiService);
  private readonly customersApi = inject(CustomersApiService);
  readonly properties = signal<Property[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly loadingCustomers = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly search = signal('');
  readonly filters = signal<Record<string, string>>({});
  readonly hasPrevious = computed(() => this.page() > 1);
  readonly hasNext = computed(() => this.page() < this.totalPages());

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(this.page(), this.limit(), this.search(), this.filters())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data, meta }) => {
          this.properties.set(data);
          this.total.set(meta.total);
          this.totalPages.set(meta.totalPages);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
      });
  }

  loadCustomers(): void {
    if (this.customers().length || this.loadingCustomers()) return;
    this.loadingCustomers.set(true);
    this.customersApi.list(1, 100, '')
      .pipe(finalize(() => this.loadingCustomers.set(false)))
      .subscribe({
        next: ({ data }) => this.customers.set(data),
        error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
      });
  }

  applyFilters(search: string, filters: Record<string, string>): void {
    this.search.set(search.trim());
    this.filters.set(filters);
    this.page.set(1);
    this.load();
  }

  previous(): void {
    if (!this.hasPrevious()) return;
    this.page.update((value) => value - 1);
    this.load();
  }

  next(): void {
    if (!this.hasNext()) return;
    this.page.update((value) => value + 1);
    this.load();
  }

  save(input: PropertyInput, property?: Property): void {
    this.saving.set(true);
    this.clearFeedback();
    const request = property ? this.api.update(property.id, input) : this.api.create(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notice.set(property ? 'Predio actualizado correctamente.' : 'Predio creado correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
    });
  }

  deactivate(property: Property): void {
    this.saving.set(true);
    this.clearFeedback();
    this.api.deactivate(property.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.notice.set('Predio desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
      });
  }

  clearFeedback(): void {
    this.error.set(null);
    this.notice.set(null);
  }

  private message(error: HttpErrorResponse): string {
    const message = error.error?.message;
    if (Array.isArray(message)) return message.join(' ');
    return typeof message === 'string'
      ? message
      : 'No fue posible completar la operación. Intenta nuevamente.';
  }
}
