export type DocumentType = 'CC' | 'NIT' | 'CE' | 'TI' | 'PASSPORT';

export interface Customer {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CustomerPage {
  data: Customer[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  NIT: 'NIT',
  CE: 'Cédula de extranjería',
  TI: 'Tarjeta de identidad',
  PASSPORT: 'Pasaporte',
};
