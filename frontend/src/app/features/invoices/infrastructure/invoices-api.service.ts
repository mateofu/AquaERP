import { HttpClient,HttpParams } from '@angular/common/http'; import { inject,Injectable } from '@angular/core'; import { Observable } from 'rxjs'; import { environment } from '../../../../environments/environment';
import { BatchResult,EligibleReading,GenerateBatchInput,GenerateInvoiceInput,Invoice,InvoiceBatchSummary,InvoicePage,IssueBatchResult } from '../domain/invoice.models';
@Injectable({providedIn:'root'}) export class InvoicesApiService {private readonly http=inject(HttpClient);private readonly base=`${environment.apiUrl}/invoices`;
  list(page:number,limit:number,filters:Record<string,string>):Observable<InvoicePage>{let params=new HttpParams().set('page',page).set('limit',limit);Object.entries(filters).forEach(([k,v])=>{if(v)params=params.set(k,v)});return this.http.get<InvoicePage>(this.base,{params})}
  one(id:number):Observable<Invoice>{return this.http.get<Invoice>(`${this.base}/${id}`)}
  pdf(id:number):Observable<Blob>{return this.http.get(`${this.base}/${id}/pdf`,{responseType:'blob'})}
  eligible(periodId:number):Observable<{data:EligibleReading[]}>{return this.http.get<{data:EligibleReading[]}>(`${this.base}/eligible-readings/${periodId}`)}
  generate(input:GenerateInvoiceInput):Observable<Invoice>{return this.http.post<Invoice>(`${this.base}/generate`,input)}
  batch(input:GenerateBatchInput):Observable<BatchResult>{return this.http.post<BatchResult>(`${this.base}/generate-batch`,input)}
  batchSummary(billingPeriodId:number):Observable<InvoiceBatchSummary>{return this.http.get<InvoiceBatchSummary>(`${this.base}/batch/summary`,{params:{billingPeriodId}})}
  issueBatch(billingPeriodId:number):Observable<IssueBatchResult>{return this.http.post<IssueBatchResult>(`${this.base}/batch/issue`,{billingPeriodId})}
  printBatch(billingPeriodId:number,part:number,size=200):Observable<Blob>{return this.http.get(`${this.base}/batch/print`,{params:{billingPeriodId,part,size},responseType:'blob'})}
  batchZip(billingPeriodId:number):Observable<Blob>{return this.http.get(`${this.base}/batch/zip`,{params:{billingPeriodId},responseType:'blob'})}
  issue(id:number):Observable<Invoice>{return this.http.post<Invoice>(`${this.base}/${id}/issue`,{})}
  void(id:number,reason:string):Observable<Invoice>{return this.http.post<Invoice>(`${this.base}/${id}/void`,{reason})}
}
