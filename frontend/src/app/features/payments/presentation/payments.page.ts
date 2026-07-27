import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';
import { UnsavedChangesService } from '../../../shared/services/unsaved-changes.service';
import { AuthSessionService } from '../../auth/application/auth-session.service';
import { PaymentsFacade } from '../application/payments.facade';
import { PAYMENT_METHOD_LABELS, PaymentMethod, PortfolioInvoice } from '../domain/payment.models';

@Component({ selector: 'app-payments-page', imports: [CurrencyPipe, DateFieldComponent, DatePipe, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, ModalComponent, NotificationComponent, ReactiveFormsModule], providers: [PaymentsFacade], templateUrl: './payments.page.html', styleUrl: './payments.page.scss' })
export class PaymentsPage implements OnInit {
  readonly facade = inject(PaymentsFacade); private readonly session = inject(AuthSessionService); private readonly unsavedChanges = inject(UnsavedChangesService);
  readonly formOpen = signal(false); readonly selected = signal<PortfolioInvoice | null>(null);
  readonly canRegister = computed(() => { const roles = this.session.user()?.roles ?? []; return roles.includes('ADMIN') || roles.includes('CAJERO'); });
  readonly methods = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
  readonly methodsMap = PAYMENT_METHOD_LABELS;
  readonly form = new FormGroup({ amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]), paymentDate: new FormControl('', Validators.required), method: new FormControl<PaymentMethod>('CASH', Validators.required), reference: new FormControl(''), notes: new FormControl('') });
  ngOnInit(): void { this.facade.load(); }
  open(invoice: PortfolioInvoice): void { this.selected.set(invoice); this.form.reset({ amount: Number(invoice.balance), paymentDate: new Date().toISOString().slice(0, 10), method: 'CASH', reference: '', notes: '' }); this.formOpen.set(true); }
  async close(force = false): Promise<void> { if (!force && !(await this.unsavedChanges.canDiscard(this.form))) return; this.formOpen.set(false); this.selected.set(null); }
  submit(): void { const invoice = this.selected(); if (!invoice || this.form.invalid) { this.form.markAllAsTouched(); return; } const value = this.form.getRawValue(); this.facade.create({ invoiceId: invoice.id, amount: Number(value.amount), paymentDate: value.paymentDate!, method: value.method!, ...(value.reference && { reference: value.reference }), ...(value.notes && { notes: value.notes }) }, () => { void this.close(true); }); }
}
