export type BillingPeriodStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface BillingPeriod {
  id: number;
  year: number;
  month: number;
  status: BillingPeriodStatus;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPeriodInput {
  year: number;
  month: number;
}

export interface BillingPeriodPage {
  data: BillingPeriod[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
