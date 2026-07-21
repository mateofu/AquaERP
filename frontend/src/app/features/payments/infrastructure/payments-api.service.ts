import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreatePaymentInput, Payment, PaymentPage, PortfolioInvoice } from '../domain/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/payments`;
  portfolio(): Observable<PortfolioInvoice[]> { return this.http.get<PortfolioInvoice[]>(`${this.base}/portfolio`); }
  list(page: number, limit: number, search = ''): Observable<PaymentPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    return this.http.get<PaymentPage>(this.base, { params });
  }
  create(input: CreatePaymentInput): Observable<Payment & { balance: string }> { return this.http.post<Payment & { balance: string }>(this.base, input); }
}
