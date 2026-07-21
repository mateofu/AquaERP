export interface PropertyCustomer {
  id: number;
  documentNumber: string;
  firstName: string;
  lastName: string;
}

export interface Property {
  id: number;
  customerId: number;
  code: string;
  address: string;
  municipality: string;
  vereda: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer: PropertyCustomer;
}

export interface PropertyInput {
  customerId: number;
  code: string;
  address: string;
  municipality: string;
  vereda: string;
}

export interface PropertyPage {
  data: Property[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
