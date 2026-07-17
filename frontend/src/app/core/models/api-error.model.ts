export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
}
