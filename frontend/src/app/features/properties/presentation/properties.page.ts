import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActionIconComponent } from '../../../shared/components/action-icon/action-icon.component';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { ListFilterField } from '../../../shared/components/list-filters/list-filters.component';
import { AuthSessionService } from '../../auth/application/auth-session.service';
import { PropertiesFacade } from '../application/properties.facade';
import { Property, PropertyInput } from '../domain/property.models';

@Component({
  selector: 'app-properties-page',
  imports: [
    ActionIconComponent,
    ListFiltersComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
  providers: [PropertiesFacade],
  templateUrl: './properties.page.html',
  styleUrl: './properties.page.scss',
})
export class PropertiesPage implements OnInit {
  readonly facade = inject(PropertiesFacade);
  private readonly session = inject(AuthSessionService);
  readonly selected = signal<Property | null>(null);
  readonly formOpen = signal(false);
  readonly canWrite = computed(() => {
    const roles = this.session.user()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('OPERADOR');
  });
  readonly filterFields = computed<ListFilterField[]>(() => [
    {
      key: 'customerId',
      label: 'Suscriptor',
      type: 'select',
      options: this.facade.customers().map((customer) => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`,
      })),
    },
    { key: 'municipality', label: 'Municipio', type: 'text' },
    { key: 'vereda', label: 'Vereda', type: 'text' },
  ]);
  readonly form = new FormGroup({
    customerId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    municipality: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    vereda: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.facade.load();
    this.facade.loadCustomers();
  }

  openCreate(): void {
    this.selected.set(null);
    this.form.reset();
    this.facade.clearFeedback();
    this.facade.loadCustomers();
    this.formOpen.set(true);
  }

  openEdit(property: Property): void {
    this.selected.set(property);
    this.form.reset({
      customerId: property.customerId,
      code: property.code,
      address: property.address,
      municipality: property.municipality,
      vereda: property.vereda,
    });
    this.facade.clearFeedback();
    this.facade.loadCustomers();
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
    const input: PropertyInput = {
      customerId: raw.customerId,
      code: raw.code.trim(),
      address: raw.address.trim(),
      municipality: raw.municipality.trim(),
      vereda: raw.vereda.trim(),
    };
    this.facade.save(input, this.selected() ?? undefined);
    this.closeForm();
  }

  deactivate(property: Property): void {
    if (window.confirm(`¿Desactivar el predio ${property.code}? Se ocultará del listado.`)) {
      this.facade.deactivate(property);
    }
  }

  customerName(property: Property): string {
    return `${property.customer.firstName} ${property.customer.lastName}`;
  }
}
