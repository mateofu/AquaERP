import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  INVOICE_STATUS_LABELS,
  InvoiceBatchSummary,
  InvoiceStatus,
} from '../domain/invoice.models';

@Component({
  selector: 'app-invoice-batch-preview',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, MatButtonModule],
  templateUrl: './invoice-batch-preview.component.html',
  styleUrl: './invoice-batch-preview.component.scss',
})
export class InvoiceBatchPreviewComponent {
  readonly summary = input.required<InvoiceBatchSummary>();
  readonly busy = input(false);
  readonly canIssue = input(false);
  readonly issue = output<void>();
  readonly printPart = output<number>();
  readonly downloadZip = output<void>();
  readonly previewInvoice = output<{ id: number; sequence: number }>();
  readonly closeRequested = output<void>();

  readonly parts = computed(() =>
    Array.from({ length: this.summary().printParts }, (_, index) => index + 1),
  );
  readonly draftCount = computed(() => this.summary().statuses.DRAFT ?? 0);
  readonly deliverableCount = computed(
    () =>
      (this.summary().statuses.ISSUED ?? 0) +
      (this.summary().statuses.PAID ?? 0) +
      (this.summary().statuses.OVERDUE ?? 0),
  );

  status(value: InvoiceStatus): string {
    return INVOICE_STATUS_LABELS[value];
  }
}
