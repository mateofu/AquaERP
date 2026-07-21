export interface CatalogOption {
  value: string | number;
  label: string;
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CatalogResponse {
  data: CatalogOption[];
}
