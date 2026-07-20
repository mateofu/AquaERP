import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { Tariff, TariffInput } from '../domain/tariff.models';
import { TariffsApiService } from '../infrastructure/tariffs-api.service';

@Injectable()
export class TariffsFacade {
  private readonly api = inject(TariffsApiService);
  readonly tariffs = signal<Tariff[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly totalPages = signal(1);
  readonly search = signal('');
  readonly filters = signal<Record<string, string>>({});
  readonly hasPrevious = computed(() => this.page() > 1);
  readonly hasNext = computed(() => this.page() < this.totalPages());

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(this.page(), this.limit(), this.search(), this.filters())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data, meta }) => {
          this.tariffs.set(data);
          this.totalPages.set(meta.totalPages);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.message(error)),
      });
  }

  applyFilters(search: string, filters: Record<string, string>): void {
    this.search.set(search);
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

  save(input: TariffInput, tariff?: Tariff): void {
    this.mutate(
      tariff ? this.api.update(tariff.id, input) : this.api.create(input),
      tariff ? 'Tarifa actualizada correctamente.' : 'Tarifa creada correctamente.',
    );
  }

  activate(tariff: Tariff): void {
    this.mutate(this.api.activate(tariff.id), 'Tarifa activada correctamente.');
  }

  retire(tariff: Tariff): void {
    this.mutate(this.api.retire(tariff.id), 'Tarifa retirada correctamente.');
  }

  clearFeedback(): void {
    this.error.set(null);
    this.notice.set(null);
  }

  private mutate(request: Observable<Tariff>, notice: string): void {
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
