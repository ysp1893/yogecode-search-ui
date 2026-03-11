export interface SearchFilter {
  field: string;
  operator: 'EQ' | 'NE' | 'LIKE' | 'IN' | 'NOT_IN' | 'IS_NULL' | 'IS_NOT_NULL' | string;
  value?: unknown;
}

export interface SearchRequest {
  entity?: string;
  keyword?: string;
  filters?: SearchFilter[];
  include?: string[];
  fields?: string[];
  entityFields?: Record<string, string[]>;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  size?: number;
}

export interface PartialFailureResponse {
  entity: string;
  source: string;
  message: string;
}

export interface SearchResponse<T = Record<string, unknown>> {
  requestId?: string;
  rootEntity?: string;
  page: number;
  size: number;
  total: number;
  results: T[];
  partialFailures?: PartialFailureResponse[];
}
