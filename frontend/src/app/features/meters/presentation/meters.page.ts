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
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { ListFilterField } from '../../../shared/components/list-filters/list-filters.component';
import { AuthSessionService } from '../../auth/application/auth-session.service';
import { MetersFacade } from '../application/meters.facade';
import { Meter, MeterInput } from '../domain/meter.models';

@Component({
  selector: 'app-meters-page',
  imports: [
    ActionIconComponent,
    ModalComponent,
    NotificationComponent,
    DateFieldComponent,
    ListFiltersComponent,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
  providers: [MetersFacade],
  templateUrl: './meters.page.html',
  styleUrl: './meters.page.scss',
})
export class MetersPage implements OnInit {
  readonly facade = inject(MetersFacade);
  private readonly session = inject(AuthSessionService);
  readonly selected = signal<Meter | null>(null);
  readonly formOpen = signal(false);
  readonly canWrite = computed(() => {
    const roles = this.session.user()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('OPERADOR');
  });
  readonly filterFields = computed<ListFilterField[]>(() => [
    {
      key: 'propertyId',
      label: 'Predio',
      type: 'select',
      options: this.facade.properties().map((property) => ({
        value: property.id,
        label: `${property.code} · ${property.address}`,
      })),
    },
    { key: 'brand', label: 'Marca', type: 'text' },
    {
      key: 'hasInstallationDate',
      label: 'Fecha de instalación',
      type: 'select',
      options: [
        { value: 'true', label: 'Con fecha' },
        { value: 'false', label: 'Sin fecha' },
      ],
    },
  ]);
  readonly form = new FormGroup({
    propertyId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    serialNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    brand: new FormControl('', { nonNullable: true }),
    installationDate: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.facade.load();
    this.facade.loadProperties();
  }

  openCreate(): void {
    this.selected.set(null);
    this.form.reset();
    this.facade.clearFeedback();
    this.facade.loadProperties();
    this.formOpen.set(true);
  }

  openEdit(meter: Meter): void {
    this.selected.set(meter);
    this.form.reset({
      propertyId: meter.propertyId,
      serialNumber: meter.serialNumber,
      brand: meter.brand ?? '',
      installationDate: meter.installationDate?.slice(0, 10) ?? '',
    });
    this.facade.clearFeedback();
    this.facade.loadProperties();
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
    const input: MeterInput = {
      propertyId: raw.propertyId!,
      serialNumber: raw.serialNumber.trim(),
      ...(raw.brand.trim() && { brand: raw.brand.trim() }),
      ...(raw.installationDate && { installationDate: raw.installationDate }),
    };
    this.facade.save(input, this.selected() ?? undefined);
    this.closeForm();
  }

  deactivate(meter: Meter): void {
    if (window.confirm(`¿Desactivar el medidor ${meter.serialNumber}? Se ocultará del listado.`)) {
      this.facade.deactivate(meter);
    }
  }

  customerName(meter: Meter): string {
    return `${meter.property.customer.firstName} ${meter.property.customer.lastName}`;
  }
}
