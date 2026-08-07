import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AuthSessionService } from '../auth/application/auth-session.service';
import { BillingPeriod } from '../billing-periods/domain/billing-period.models';
import { BillingPeriodsApiService } from '../billing-periods/infrastructure/billing-periods-api.service';
import { CustomersApiService } from '../customers/infrastructure/customers-api.service';
import { MeterReadingsApiService } from '../meter-readings/infrastructure/meter-readings-api.service';
import { MetersApiService } from '../meters/infrastructure/meters-api.service';
import { PaymentsApiService } from '../payments/infrastructure/payments-api.service';
import { PropertiesApiService } from '../properties/infrastructure/properties-api.service';

interface DashboardSummary {
  customers: number;
  properties: number;
  meters: number;
  receivable: number;
  invoicesWithBalance: number;
  overdueInvoices: number;
  openPeriod: BillingPeriod | null;
  pendingReadings: number;
}

const EMPTY_SUMMARY: DashboardSummary = {
  customers: 0,
  properties: 0,
  meters: 0,
  receivable: 0,
  invoicesWithBalance: 0,
  overdueInvoices: 0,
  openPeriod: null,
  pendingReadings: 0,
};

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  readonly session = inject(AuthSessionService);
  private readonly customersApi = inject(CustomersApiService);
  private readonly propertiesApi = inject(PropertiesApiService);
  private readonly metersApi = inject(MetersApiService);
  private readonly periodsApi = inject(BillingPeriodsApiService);
  private readonly readingsApi = inject(MeterReadingsApiService);
  private readonly paymentsApi = inject(PaymentsApiService);

  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly summary = signal<DashboardSummary>(EMPTY_SUMMARY);

  userDisplayName(): string {
    const user = this.session.user();
    if (!user) return 'Usuario';
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  periodLabel(period: BillingPeriod | null): string {
    if (!period) return 'Sin periodo abierto';
    const date = new Date(period.year, period.month - 1, 1);
    return new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.hasError.set(false);

    forkJoin({
      customers: this.safe(this.customersApi.list(1, 1, '', { isActive: 'true' })),
      properties: this.safe(this.propertiesApi.list(1, 1, '')),
      meters: this.safe(this.metersApi.list(1, 1, '')),
      periods: this.safe(this.periodsApi.list(1, 1, { status: 'OPEN' })),
      portfolio: this.safe(this.paymentsApi.portfolio()),
    })
      .pipe(
        switchMap((result) => {
          const openPeriod = result.periods?.data[0] ?? null;
          const meters = result.meters?.meta.total ?? 0;
          const readings$ = openPeriod
            ? this.safe(
                this.readingsApi.list(1, 1, {
                  billingPeriodId: String(openPeriod.id),
                }),
              )
            : of(null);

          return readings$.pipe(
            map((readings) => {
              const portfolio = result.portfolio ?? [];
              return {
                customers: result.customers?.meta.total ?? 0,
                properties: result.properties?.meta.total ?? 0,
                meters,
                receivable: portfolio.reduce(
                  (total, invoice) => total + Number(invoice.balance),
                  0,
                ),
                invoicesWithBalance: portfolio.length,
                overdueInvoices: portfolio.filter(
                  (invoice) => invoice.status === 'OVERDUE',
                ).length,
                openPeriod,
                pendingReadings: openPeriod
                  ? Math.max(0, meters - (readings?.meta.total ?? 0))
                  : 0,
              } satisfies DashboardSummary;
            }),
          );
        }),
      )
      .subscribe({
        next: (summary) => {
          this.summary.set(summary);
          this.loading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.loading.set(false);
        },
      });
  }

  private safe<T>(request: Observable<T>): Observable<T | null> {
    return request.pipe(
      catchError(() => {
        this.hasError.set(true);
        return of(null);
      }),
    );
  }
}
