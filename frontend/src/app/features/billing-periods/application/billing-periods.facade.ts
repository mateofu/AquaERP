import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { CatalogOption } from '../../../core/catalogs/catalog.models';
import { CatalogsApiService } from '../../../core/catalogs/catalogs-api.service';
import {
  BillingPeriod,
  BillingPeriodInput,
} from '../domain/billing-period.models';
import { BillingPeriodsApiService } from '../infrastructure/billing-periods-api.service';

@Injectable()
export class BillingPeriodsFacade {
  private readonly api = inject(BillingPeriodsApiService);
  private readonly catalogsApi = inject(CatalogsApiService);
  readonly periods = signal<BillingPeriod[]>([]);
  readonly months = signal<CatalogOption[]>([]);
  readonly statuses = signal<CatalogOption[]>([]);
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
          this.periods.set(data);
          this.totalPages.set(meta.totalPages);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
      });
  }

  loadCatalogs(): void {
    forkJoin({
      months: this.catalogsApi.get('months'),
      statuses: this.catalogsApi.get('billing-period-statuses'),
    }).subscribe({
      next: ({ months, statuses }) => {
        this.months.set(months);
        this.statuses.set(statuses);
      },
      error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
    });
  }

  applyFilters(filters: Record<string, string>): void {
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

  save(input: BillingPeriodInput, period?: BillingPeriod): void {
    this.mutate(
      period ? this.api.update(period.id, input) : this.api.create(input),
      period ? 'Periodo actualizado correctamente.' : 'Periodo creado correctamente.',
    );
  }

  open(period: BillingPeriod): void {
    this.mutate(this.api.open(period.id), 'Periodo abierto correctamente.');
  }

  close(period: BillingPeriod): void {
    this.mutate(this.api.close(period.id), 'Periodo cerrado correctamente.');
  }

  clearFeedback(): void {
    this.error.set(null);
    this.notice.set(null);
  }

  private mutate(request: ReturnType<BillingPeriodsApiService['open']>, notice: string): void {
    this.saving.set(true);
    this.clearFeedback();
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notice.set(notice);
        this.load();
      },
      error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
    });
  }

  private message(error: HttpErrorResponse): string {
    return typeof error.error?.message === 'string'
      ? error.error.message
      : 'No fue posible completar la operación.';
  }
}
