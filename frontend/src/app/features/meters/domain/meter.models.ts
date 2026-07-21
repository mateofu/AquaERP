export interface MeterProperty {
  id: number;
  code: string;
  address: string;
  customer: {
    id: number;
    documentNumber: string;
    firstName: string;
    lastName: string;
  };
}

export interface Meter {
  id: number;
  propertyId: number;
  serialNumber: string;
  brand: string | null;
  installationDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  property: MeterProperty;
}

export interface MeterInput {
  propertyId: number;
  serialNumber: string;
  brand?: string;
  installationDate?: string;
}

export interface MeterPage {
  data: Meter[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
