import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActionIconComponent } from '../../../shared/components/action-icon/action-icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog/confirmation-dialog.service';
import { UnsavedChangesService } from '../../../shared/services/unsaved-changes.service';
import { NumericInputDirective } from '../../../shared/directives/numeric-input.directive';
import {
  ListFilterField,
  ListFiltersComponent,
} from '../../../shared/components/list-filters/list-filters.component';
import { AuthSessionService } from '../../auth/application/auth-session.service';
import { BillingPeriodsFacade } from '../application/billing-periods.facade';
import { BillingPeriod } from '../domain/billing-period.models';

@Component({
  selector: 'app-billing-periods-page',
  imports: [
    ActionIconComponent,
    ModalComponent,
    NotificationComponent,
    EmptyStateComponent,
    DatePipe,
    ListFiltersComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule,
    NumericInputDirective,
  ],
  providers: [BillingPeriodsFacade],
  templateUrl: './billing-periods.page.html',
  styleUrl: './billing-periods.page.scss',
})
export class BillingPeriodsPage implements OnInit {
  readonly facade = inject(BillingPeriodsFacade);
  private readonly session = inject(AuthSessionService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  readonly selected = signal<BillingPeriod | null>(null);
  readonly formOpen = signal(false);
  readonly canWrite = computed(() => {
    const roles = this.session.user()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('OPERADOR');
  });
  readonly filterFields = computed<ListFilterField[]>(() => [
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: this.facade.statuses(),
    },
    { key: 'year', label: 'Año', type: 'year' },
  ]);
  readonly form = new FormGroup({
    year: new FormControl(new Date().getFullYear(), {
      nonNullable: true,
      validators: [Validators.required, Validators.min(2000), Validators.max(2100)],
    }),
    month: new FormControl<number | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.facade.loadCatalogs();
    this.facade.load();
  }

  openCreate(): void {
    this.selected.set(null);
    this.form.reset({ year: new Date().getFullYear(), month: null });
    this.facade.clearFeedback();
    this.formOpen.set(true);
  }

  openEdit(period: BillingPeriod): void {
    this.selected.set(period);
    this.form.reset({ year: period.year, month: period.month });
    this.formOpen.set(true);
  }

  async closeForm(force = false): Promise<void> {
    if (!force && !(await this.unsavedChanges.canDiscard(this.form))) return;
    this.formOpen.set(false);
    this.selected.set(null);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { year, month } = this.form.getRawValue();
    if (month === null) return;
    const period = this.selected();
    if (period) {
      const confirmed = await this.confirmation.confirm({
        title: 'Guardar cambios',
        message: '¿Deseas actualizar este periodo de facturación?',
        confirmLabel: 'Sí, actualizar',
      });
      if (!confirmed) return;
    }
    this.facade.save({ year, month }, period ?? undefined);
    await this.closeForm(true);
  }

  async openPeriod(period: BillingPeriod): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Abrir periodo',
      message: '¿Deseas abrir este periodo para registrar lecturas y continuar el ciclo?',
      confirmLabel: 'Sí, abrir',
    });
    if (confirmed) this.facade.open(period);
  }

  async closePeriod(period: BillingPeriod): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Cerrar periodo',
      message: '¿Deseas cerrar este periodo? Ya no estará disponible para nuevas operaciones.',
      confirmLabel: 'Sí, cerrar',
      danger: true,
    });
    if (confirmed) this.facade.close(period);
  }

  monthLabel(month: number): string {
    return this.facade.months().find((option) => Number(option.value) === month)?.label ?? String(month);
  }

  statusLabel(status: string): string {
    return this.facade.statuses().find((option) => option.value === status)?.label ?? status;
  }
}
