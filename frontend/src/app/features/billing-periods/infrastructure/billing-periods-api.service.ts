import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BillingPeriod,
  BillingPeriodInput,
  BillingPeriodPage,
} from '../domain/billing-period.models';

@Injectable({ providedIn: 'root' })
export class BillingPeriodsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/billing-periods`;

  list(
    page: number,
    limit: number,
    filters: Record<string, string>,
  ): Observable<BillingPeriodPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<BillingPeriodPage>(this.baseUrl, { params });
  }

  create(input: BillingPeriodInput): Observable<BillingPeriod> {
    return this.http.post<BillingPeriod>(this.baseUrl, input);
  }

  update(id: number, input: BillingPeriodInput): Observable<BillingPeriod> {
    return this.http.patch<BillingPeriod>(`${this.baseUrl}/${id}`, input);
  }

  open(id: number): Observable<BillingPeriod> {
    return this.http.post<BillingPeriod>(`${this.baseUrl}/${id}/open`, {});
  }

  close(id: number): Observable<BillingPeriod> {
    return this.http.post<BillingPeriod>(`${this.baseUrl}/${id}/close`, {});
  }
}
