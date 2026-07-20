import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogOption, CatalogResponse } from './catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/catalogs`;

  get(
    catalog: string,
    query: Record<string, string> = {},
  ): Observable<CatalogOption[]> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http
      .get<CatalogResponse>(`${this.baseUrl}/${catalog}`, { params })
      .pipe(map((response) => response.data));
  }
}
