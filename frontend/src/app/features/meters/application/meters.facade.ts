import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Property } from '../../properties/domain/property.models';
import { PropertiesApiService } from '../../properties/infrastructure/properties-api.service';
import { Meter, MeterInput } from '../domain/meter.models';
import { MetersApiService } from '../infrastructure/meters-api.service';

@Injectable()
export class MetersFacade {
  private readonly api = inject(MetersApiService);
  private readonly propertiesApi = inject(PropertiesApiService);
  readonly meters = signal<Meter[]>([]);
  readonly properties = signal<Property[]>([]);
  readonly loading = signal(false);
  readonly loadingProperties = signal(false);
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
          this.meters.set(data);
          this.total.set(meta.total);
          this.totalPages.set(meta.totalPages);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
      });
  }

  loadProperties(): void {
    if (this.properties().length || this.loadingProperties()) return;
    this.loadingProperties.set(true);
    this.propertiesApi.list(1, 100, '')
      .pipe(finalize(() => this.loadingProperties.set(false)))
      .subscribe({
        next: ({ data }) => this.properties.set(data),
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

  save(input: MeterInput, meter?: Meter): void {
    this.saving.set(true);
    this.clearFeedback();
    const request = meter ? this.api.update(meter.id, input) : this.api.create(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notice.set(meter ? 'Medidor actualizado correctamente.' : 'Medidor creado correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
    });
  }

  deactivate(meter: Meter): void {
    this.saving.set(true);
    this.clearFeedback();
    this.api.deactivate(meter.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.notice.set('Medidor desactivado correctamente.');
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
