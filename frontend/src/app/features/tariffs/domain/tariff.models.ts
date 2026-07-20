export type TariffStatus = 'DRAFT' | 'ACTIVE' | 'RETIRED';

export interface Tariff {
  id: string;
  name: string;
  fixedCharge: string;
  pricePerCubicMeter: string;
  validFrom: string;
  validTo: string | null;
  status: TariffStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TariffInput {
  name: string;
  fixedCharge: number;
  pricePerCubicMeter: number;
  validFrom: string;
  validTo?: string;
}

export interface TariffPage {
  data: Tariff[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const TARIFF_STATUS_LABELS: Record<TariffStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  RETIRED: 'Retirada',
};
