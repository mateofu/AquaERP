import { DatePipe, DecimalPipe } from '@angular/common';
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
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { ListFilterField, ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { AuthSessionService } from '../../auth/application/auth-session.service';
import { ExcelExportService } from '../../../shared/services/excel-export.service';
import { MeterReadingsFacade } from '../application/meter-readings.facade';
import { MeterReading } from '../domain/meter-reading.models';

@Component({
  selector: 'app-meter-readings-page',
  imports: [
    ActionIconComponent, ModalComponent, NotificationComponent, EmptyStateComponent, DateFieldComponent, DatePipe, DecimalPipe, ListFiltersComponent,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, ReactiveFormsModule, NumericInputDirective,
  ],
  providers: [MeterReadingsFacade],
  templateUrl: './meter-readings.page.html',
  styleUrl: './meter-readings.page.scss',
})
export class MeterReadingsPage implements OnInit {
  readonly facade = inject(MeterReadingsFacade);
  private readonly excel = inject(ExcelExportService);
  private readonly session = inject(AuthSessionService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  readonly selected = signal<MeterReading | null>(null);
  readonly formOpen = signal(false);
  readonly canWrite = computed(() => {
    const roles = this.session.user()?.roles ?? [];
    return roles.some((role) => ['ADMIN', 'OPERADOR', 'LECTOR'].includes(role));
  });
  exportExcel(): void {
    this.excel.download('meter-readings', 'lecturas', this.facade.filters()).subscribe();
  }
  readonly filterFields = computed<ListFilterField[]>(() => [
    { key: 'billingPeriodId', label: 'Periodo', type: 'select', options: this.facade.periods() },
    { key: 'meterId', label: 'Medidor', type: 'select', options: this.facade.meters() },
    {
      key: 'hasAnomaly', label: 'Anomalías', type: 'select',
      options: [{ value: 'true', label: 'Con anomalía' }, { value: 'false', label: 'Sin anomalía' }],
    },
  ]);
  readonly form = new FormGroup({
    billingPeriodId: new FormControl<number | null>(null, { validators: Validators.required }),
    meterId: new FormControl<number | null>(null, { validators: Validators.required }),
    readingValue: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    readingDate: new FormControl('', { nonNullable: true, validators: Validators.required }),
    notes: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.facade.loadCatalogs();
    this.facade.load();
  }

  openCreate(): void {
    this.selected.set(null);
    this.form.reset({ billingPeriodId: null, meterId: null, readingValue: null, readingDate: '', notes: '' });
    this.facade.clearFeedback();
    this.formOpen.set(true);
  }

  openEdit(reading: MeterReading): void {
    this.selected.set(reading);
    this.form.reset({
      billingPeriodId: reading.billingPeriodId,
      meterId: reading.meterId,
      readingValue: Number(reading.readingValue),
      readingDate: reading.readingDate.slice(0, 10),
      notes: reading.notes ?? '',
    });
    this.formOpen.set(true);
  }

  async closeForm(force = false): Promise<void> {
    if (!force && !(await this.unsavedChanges.canDiscard(this.form))) return;
    this.formOpen.set(false);
    this.selected.set(null);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    if (value.readingValue === null) return;
    const reading = this.selected();
    if (reading) {
      const confirmed = await this.confirmation.confirm({
        title: 'Guardar cambios',
        message: '¿Deseas actualizar esta lectura? El consumo puede cambiar.',
        confirmLabel: 'Sí, actualizar',
      });
      if (!confirmed) return;
    }
    this.facade.save({
      billingPeriodId: value.billingPeriodId!,
      meterId: value.meterId!,
      readingValue: value.readingValue,
      readingDate: value.readingDate,
      ...(value.notes.trim() && { notes: value.notes.trim() }),
    }, reading ?? undefined);
    await this.closeForm(true);
  }
}
