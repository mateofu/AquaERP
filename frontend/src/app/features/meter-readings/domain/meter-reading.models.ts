export interface MeterReading {
  id: number;
  meterId: number;
  billingPeriodId: number;
  readingValue: string;
  previousValue: string;
  consumption: string;
  readingDate: string;
  hasAnomaly: boolean;
  anomalyReason: string | null;
  notes: string | null;
  billingPeriod: { id: number; year: number; month: number; status: string };
  meter: {
    id: number;
    serialNumber: string;
    brand: string | null;
    property: {
      id: number;
      code: string;
      address: string;
      customer: {
        id: number;
        documentNumber: string;
        firstName: string;
        lastName: string;
      };
    };
  };
}

export interface MeterReadingInput {
  meterId: number;
  billingPeriodId: number;
  readingValue: number;
  readingDate: string;
  notes?: string;
}

export interface MeterReadingPage {
  data: MeterReading[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
