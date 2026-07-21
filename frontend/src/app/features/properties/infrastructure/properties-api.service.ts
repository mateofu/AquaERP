import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Property, PropertyInput, PropertyPage } from '../domain/property.models';

@Injectable({ providedIn: 'root' })
export class PropertiesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/properties`;

  list(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string> = {},
  ): Observable<PropertyPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search.trim()) params = params.set('search', search.trim());
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<PropertyPage>(this.baseUrl, { params });
  }

  create(input: PropertyInput): Observable<Property> {
    return this.http.post<Property>(this.baseUrl, input);
  }

  update(id: number, input: PropertyInput): Observable<Property> {
    return this.http.patch<Property>(`${this.baseUrl}/${id}`, input);
  }

  deactivate(id: number): Observable<Property> {
    return this.http.delete<Property>(`${this.baseUrl}/${id}`);
  }
}
