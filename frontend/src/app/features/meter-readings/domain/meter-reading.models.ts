export interface MeterReading {
  id: string;
  meterId: string;
  billingPeriodId: string;
  readingValue: string;
  previousValue: string;
  consumption: string;
  readingDate: string;
  hasAnomaly: boolean;
  anomalyReason: string | null;
  notes: string | null;
  billingPeriod: { id: string; year: number; month: number; status: string };
  meter: {
    id: string;
    serialNumber: string;
    brand: string | null;
    property: {
      id: string;
      code: string;
      address: string;
      customer: {
        id: string;
        documentNumber: string;
        firstName: string;
        lastName: string;
      };
    };
  };
}

export interface MeterReadingInput {
  meterId: string;
  billingPeriodId: string;
  readingValue: number;
  readingDate: string;
  notes?: string;
}

export interface MeterReadingPage {
  data: MeterReading[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
