import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActionIconComponent } from '../../../shared/components/action-icon/action-icon.component';
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import {
  ListFilterField,
  ListFiltersComponent,
} from '../../../shared/components/list-filters/list-filters.component';
import { AuthSessionService } from '../../auth/application/auth-session.service';
import { TariffsFacade } from '../application/tariffs.facade';
import {
  TARIFF_STATUS_LABELS,
  Tariff,
  TariffInput,
  TariffStatus,
} from '../domain/tariff.models';

@Component({
  selector: 'app-tariffs-page',
  imports: [
    ActionIconComponent,
    CurrencyPipe,
    DateFieldComponent,
    DatePipe,
    ListFiltersComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
  providers: [TariffsFacade],
  templateUrl: './tariffs.page.html',
  styleUrl: './tariffs.page.scss',
})
export class TariffsPage implements OnInit {
  readonly facade = inject(TariffsFacade);
  private readonly session = inject(AuthSessionService);
  readonly selected = signal<Tariff | null>(null);
  readonly formOpen = signal(false);
  readonly canWrite = computed(() => this.session.user()?.roles?.includes('ADMIN') ?? false);
  readonly filterFields: ListFilterField[] = [
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: Object.entries(TARIFF_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    },
  ];
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    }),
    fixedCharge: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    pricePerCubicMeter: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    validFrom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    validTo: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.facade.load();
  }

  openCreate(): void {
    this.selected.set(null);
    this.form.reset();
    this.facade.clearFeedback();
    this.formOpen.set(true);
  }

  openEdit(tariff: Tariff): void {
    this.selected.set(tariff);
    this.form.reset({
      name: tariff.name,
      fixedCharge: Number(tariff.fixedCharge),
      pricePerCubicMeter: Number(tariff.pricePerCubicMeter),
      validFrom: tariff.validFrom.slice(0, 10),
      validTo: tariff.validTo?.slice(0, 10) ?? '',
    });
    this.facade.clearFeedback();
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.selected.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (raw.fixedCharge === null || raw.pricePerCubicMeter === null) return;
    const input: TariffInput = {
      name: raw.name.trim(),
      fixedCharge: raw.fixedCharge,
      pricePerCubicMeter: raw.pricePerCubicMeter,
      validFrom: raw.validFrom,
      ...(raw.validTo && { validTo: raw.validTo }),
    };
    this.facade.save(input, this.selected() ?? undefined);
    this.closeForm();
  }

  activate(tariff: Tariff): void {
    if (window.confirm(`¿Activar "${tariff.name}"? Su vigencia quedará disponible para facturar.`)) {
      this.facade.activate(tariff);
    }
  }

  retire(tariff: Tariff): void {
    if (window.confirm(`¿Retirar "${tariff.name}"? Se conservará su historial.`)) {
      this.facade.retire(tariff);
    }
  }

  statusLabel(status: TariffStatus): string {
    return TARIFF_STATUS_LABELS[status];
  }

}
