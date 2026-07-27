import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ExcelReport =
  | 'customers'
  | 'properties'
  | 'meters'
  | 'meter-readings'
  | 'invoices'
  | 'payments';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  private readonly http = inject(HttpClient);

  download(
    report: ExcelReport,
    fileName: string,
    filters: Record<string, string> = {},
  ): Observable<void> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '') params = params.set(key, value);
    }

    return this.http
      .get(`${environment.apiUrl}/reports/${report}/excel`, {
        params,
        responseType: 'blob',
      })
      .pipe(
        tap((file) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.xlsx`;
          link.click();
          URL.revokeObjectURL(url);
        }),
        map(() => undefined),
      );
  }
}
