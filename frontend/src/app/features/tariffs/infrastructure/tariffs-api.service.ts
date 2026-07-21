import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Tariff, TariffInput, TariffPage } from '../domain/tariff.models';

@Injectable({ providedIn: 'root' })
export class TariffsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tariffs`;

  list(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
  ): Observable<TariffPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<TariffPage>(this.baseUrl, { params });
  }

  create(input: TariffInput): Observable<Tariff> {
    return this.http.post<Tariff>(this.baseUrl, input);
  }

  update(id: number, input: TariffInput): Observable<Tariff> {
    return this.http.patch<Tariff>(`${this.baseUrl}/${id}`, input);
  }

  activate(id: number): Observable<Tariff> {
    return this.http.post<Tariff>(`${this.baseUrl}/${id}/activate`, {});
  }

  retire(id: number): Observable<Tariff> {
    return this.http.post<Tariff>(`${this.baseUrl}/${id}/retire`, {});
  }
}
