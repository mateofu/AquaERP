import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Meter, MeterInput, MeterPage } from '../domain/meter.models';

@Injectable({ providedIn: 'root' })
export class MetersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/meters`;

  list(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string> = {},
  ): Observable<MeterPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search.trim()) params = params.set('search', search.trim());
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<MeterPage>(this.baseUrl, { params });
  }

  create(input: MeterInput): Observable<Meter> {
    return this.http.post<Meter>(this.baseUrl, input);
  }

  update(id: string, input: MeterInput): Observable<Meter> {
    return this.http.patch<Meter>(`${this.baseUrl}/${id}`, input);
  }

  deactivate(id: string): Observable<Meter> {
    return this.http.delete<Meter>(`${this.baseUrl}/${id}`);
  }
}
