import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MeterReading,
  MeterReadingInput,
  MeterReadingPage,
} from '../domain/meter-reading.models';

@Injectable({ providedIn: 'root' })
export class MeterReadingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/meter-readings`;

  list(page: number, limit: number, filters: Record<string, string>): Observable<MeterReadingPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<MeterReadingPage>(this.baseUrl, { params });
  }

  create(input: MeterReadingInput): Observable<MeterReading> {
    return this.http.post<MeterReading>(this.baseUrl, input);
  }

  update(id: string, input: MeterReadingInput): Observable<MeterReading> {
    return this.http.patch<MeterReading>(`${this.baseUrl}/${id}`, input);
  }
}
