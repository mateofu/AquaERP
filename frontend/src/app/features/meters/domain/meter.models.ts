export interface MeterProperty {
  id: string;
  code: string;
  address: string;
  customer: {
    id: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
  };
}

export interface Meter {
  id: string;
  propertyId: string;
  serialNumber: string;
  brand: string | null;
  installationDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  property: MeterProperty;
}

export interface MeterInput {
  propertyId: string;
  serialNumber: string;
  brand?: string;
  installationDate?: string;
}

export interface MeterPage {
  data: Meter[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
