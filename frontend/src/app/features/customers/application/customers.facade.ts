import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Customer, CustomerInput } from '../domain/customer.models';
import { CustomersApiService } from '../infrastructure/customers-api.service';

@Injectable()
export class CustomersFacade {
  private readonly api = inject(CustomersApiService);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(false);
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
          this.customers.set(data);
          this.total.set(meta.total);
          this.totalPages.set(meta.totalPages);
        },
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
    if (this.hasPrevious()) {
      this.page.update((value) => value - 1);
      this.load();
    }
  }

  next(): void {
    if (this.hasNext()) {
      this.page.update((value) => value + 1);
      this.load();
    }
  }

  save(input: CustomerInput, customer?: Customer): void {
    this.saving.set(true);
    this.clearFeedback();
    const request = customer ? this.api.update(customer.id, input) : this.api.create(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notice.set(customer
          ? 'Suscriptor actualizado correctamente.'
          : 'Suscriptor creado correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
    });
  }

  deactivate(customer: Customer): void {
    this.saving.set(true);
    this.clearFeedback();
    this.api.deactivate(customer.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.notice.set('Suscriptor desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
      });
  }

  activate(customer: Customer): void {
    this.saving.set(true);
    this.clearFeedback();
    this.api.activate(customer.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.notice.set('Suscriptor reactivado correctamente.');
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
