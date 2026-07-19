import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Customer, CustomerInput, CustomerPage } from '../domain/customer.models';

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/customers`;

  list(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string> = {},
  ): Observable<CustomerPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search.trim()) params = params.set('search', search.trim());
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<CustomerPage>(this.baseUrl, { params });
  }

  create(input: CustomerInput): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, input);
  }

  update(id: string, input: CustomerInput): Observable<Customer> {
    return this.http.patch<Customer>(`${this.baseUrl}/${id}`, input);
  }

  deactivate(id: string): Observable<Customer> {
    return this.http.delete<Customer>(`${this.baseUrl}/${id}`);
  }
}
