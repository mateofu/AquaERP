import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CreatePaymentInput, Payment, PortfolioInvoice } from '../domain/payment.models';
import { PaymentsApiService } from '../infrastructure/payments-api.service';

@Injectable()
export class PaymentsFacade {
  private readonly api = inject(PaymentsApiService);
  readonly portfolio = signal<PortfolioInvoice[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly loading = signal(false); readonly saving = signal(false);
  readonly notice = signal<string | null>(null); readonly error = signal<string | null>(null);
  readonly page = signal(1); readonly totalPages = signal(1); readonly search = signal('');
  readonly totalReceivable = computed(() => this.portfolio().reduce((sum, invoice) => sum + Number(invoice.balance), 0));
  readonly overdueCount = computed(() => this.portfolio().filter((invoice) => invoice.status === 'OVERDUE').length);

  load(): void {
    this.loading.set(true);
    this.api.portfolio().subscribe({ next: (data) => this.portfolio.set(data), error: (error) => this.fail(error) });
    this.api.list(this.page(), 10, this.search()).pipe(finalize(() => this.loading.set(false))).subscribe({ next: ({ data, meta }) => { this.payments.set(data); this.totalPages.set(meta.totalPages); }, error: (error) => this.fail(error) });
  }
  create(input: CreatePaymentInput, done: () => void): void {
    this.clear(); this.saving.set(true);
    this.api.create(input).pipe(finalize(() => this.saving.set(false))).subscribe({ next: (payment) => { this.notice.set(`Pago registrado. Saldo pendiente: $${Number(payment.balance).toLocaleString('es-CO')}`); done(); this.load(); }, error: (error) => this.fail(error) });
  }
  applySearch(value: string): void { this.search.set(value.trim()); this.page.set(1); this.load(); }
  clear(): void { this.notice.set(null); this.error.set(null); }
  private fail(error: { error?: { message?: string } }): void { this.error.set(error.error?.message ?? 'No fue posible completar la operación.'); this.loading.set(false); }
}
