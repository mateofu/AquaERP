import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { CatalogOption } from '../../../core/catalogs/catalog.models';
import { CatalogsApiService } from '../../../core/catalogs/catalogs-api.service';
import { MeterReading, MeterReadingInput } from '../domain/meter-reading.models';
import { MeterReadingsApiService } from '../infrastructure/meter-readings-api.service';

@Injectable()
export class MeterReadingsFacade {
  private readonly api = inject(MeterReadingsApiService);
  private readonly catalogsApi = inject(CatalogsApiService);
  readonly readings = signal<MeterReading[]>([]);
  readonly meters = signal<CatalogOption[]>([]);
  readonly periods = signal<CatalogOption[]>([]);
  readonly openPeriods = signal<CatalogOption[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly totalPages = signal(1);
  readonly filters = signal<Record<string, string>>({});
  readonly hasPrevious = computed(() => this.page() > 1);
  readonly hasNext = computed(() => this.page() < this.totalPages());

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(this.page(), this.limit(), this.filters())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data, meta }) => {
          this.readings.set(data);
          this.totalPages.set(meta.totalPages);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
      });
  }

  loadCatalogs(): void {
    forkJoin({
      meters: this.catalogsApi.get('meters', { limit: '100' }),
      periods: this.catalogsApi.get('billing-periods', { status: 'OPEN' }),
      allPeriods: this.catalogsApi.get('billing-periods'),
    }).subscribe({
      next: ({ meters, periods, allPeriods }) => {
        this.meters.set(meters);
        this.periods.set(allPeriods);
        this.openPeriods.set(periods);
      },
      error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
    });
  }

  applyFilters(search: string, filters: Record<string, string>): void {
    this.filters.set({ ...filters, ...(search && { search }) });
    this.page.set(1);
    this.load();
  }

  previous(): void {
    if (this.hasPrevious()) { this.page.update((value) => value - 1); this.load(); }
  }

  next(): void {
    if (this.hasNext()) { this.page.update((value) => value + 1); this.load(); }
  }

  save(input: MeterReadingInput, reading?: MeterReading): void {
    this.saving.set(true);
    this.error.set(null);
    const request = reading ? this.api.update(reading.id, input) : this.api.create(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notice.set(reading ? 'Lectura actualizada correctamente.' : 'Lectura registrada correctamente.');
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
    return typeof error.error?.message === 'string' ? error.error.message : 'No fue posible completar la operación.';
  }
}
