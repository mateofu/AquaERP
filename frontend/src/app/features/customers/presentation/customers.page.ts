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
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { ListFilterField } from '../../../shared/components/list-filters/list-filters.component';
import { AuthSessionService } from '../../auth/application/auth-session.service';
import { CustomersFacade } from '../application/customers.facade';
import {
  Customer,
  CustomerInput,
  DOCUMENT_TYPE_LABELS,
  DocumentType,
} from '../domain/customer.models';

@Component({
  selector: 'app-customers-page',
  imports: [
    ActionIconComponent,
    ModalComponent,
    NotificationComponent,
    ListFiltersComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
  providers: [CustomersFacade],
  templateUrl: './customers.page.html',
  styleUrl: './customers.page.scss',
})
export class CustomersPage implements OnInit {
  readonly facade = inject(CustomersFacade);
  private readonly session = inject(AuthSessionService);
  readonly selected = signal<Customer | null>(null);
  readonly formOpen = signal(false);
  readonly canWrite = computed(() => {
    const roles = this.session.user()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('OPERADOR');
  });
  readonly documentTypes = Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][];
  readonly filterFields: ListFilterField[] = [
    {
      key: 'documentType',
      label: 'Tipo de documento',
      type: 'select',
      options: this.documentTypes.map(([value, label]) => ({ value, label })),
    },
    {
      key: 'isActive',
      label: 'Estado',
      type: 'select',
      emptyLabel: 'Activos',
      options: [{ value: 'false', label: 'Inactivos' }],
    },
    {
      key: 'hasEmail',
      label: 'Correo electrónico',
      type: 'select',
      options: [
        { value: 'true', label: 'Con correo' },
        { value: 'false', label: 'Sin correo' },
      ],
    },
  ];
  readonly form = new FormGroup({
    documentType: new FormControl<DocumentType>('CC', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    documentNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.facade.load();
  }

  openCreate(): void {
    this.selected.set(null);
    this.form.reset({ documentType: 'CC' });
    this.facade.clearFeedback();
    this.formOpen.set(true);
  }

  openEdit(customer: Customer): void {
    this.selected.set(customer);
    this.form.reset({
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
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
    const input: CustomerInput = {
      documentType: raw.documentType,
      documentNumber: raw.documentNumber.trim(),
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      ...(raw.email.trim() && { email: raw.email.trim() }),
      ...(raw.phone.trim() && { phone: raw.phone.trim() }),
      ...(raw.address.trim() && { address: raw.address.trim() }),
    };
    this.facade.save(input, this.selected() ?? undefined);
    this.closeForm();
  }

  deactivate(customer: Customer): void {
    const name = `${customer.firstName} ${customer.lastName}`;
    if (window.confirm(`¿Desactivar a ${name}? Esta acción ocultará al suscriptor del listado.`)) {
      this.facade.deactivate(customer);
    }
  }

  documentLabel(type: DocumentType): string {
    return DOCUMENT_TYPE_LABELS[type];
  }
}
