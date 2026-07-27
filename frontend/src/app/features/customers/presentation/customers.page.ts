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
    EmptyStateComponent,
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
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly unsavedChanges = inject(UnsavedChangesService);
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
      options: [
        { value: 'true', label: 'Activos' },
        { value: 'false', label: 'Inactivos' },
      ],
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
    const customer = this.selected();
    if (customer) {
      const confirmed = await this.confirmation.confirm({
        title: 'Guardar cambios',
        message: `¿Deseas actualizar los datos de ${customer.firstName} ${customer.lastName}?`,
        confirmLabel: 'Sí, actualizar',
      });
      if (!confirmed) return;
    }
    this.facade.save(input, customer ?? undefined);
    await this.closeForm(true);
  }

  async deactivate(customer: Customer): Promise<void> {
    const name = `${customer.firstName} ${customer.lastName}`;
    const confirmed = await this.confirmation.confirm({
      title: 'Desactivar suscriptor',
      message: `¿Deseas desactivar a ${name}? El suscriptor se ocultará del listado activo.`,
      confirmLabel: 'Sí, desactivar',
      danger: true,
    });
    if (confirmed) {
      this.facade.deactivate(customer);
    }
  }

  async activate(customer: Customer): Promise<void> {
    const name = `${customer.firstName} ${customer.lastName}`;
    const confirmed = await this.confirmation.confirm({
      title: 'Reactivar suscriptor',
      message: `¿Deseas reactivar a ${name}? Volverá a estar disponible para las operaciones del sistema.`,
      confirmLabel: 'Sí, reactivar',
    });
    if (confirmed) {
      this.facade.activate(customer);
    }
  }

  documentLabel(type: DocumentType): string {
    return DOCUMENT_TYPE_LABELS[type];
  }
}
