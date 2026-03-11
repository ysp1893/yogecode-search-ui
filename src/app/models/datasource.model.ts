export interface Datasource {
  id?: number;
  sourceCode: string;
  sourceName: string;
  dbType: 'MYSQL' | 'POSTGRESQL' | 'MONGODB' | string;
  host: string;
  port: number;
  databaseName: string;
  username?: string;
  connectionParams?: Record<string, unknown>;
  active?: boolean;
  status?: string;
}

export interface CreateDatasourceRequest {
  sourceCode: string;
  sourceName: string;
  dbType: 'MYSQL' | 'POSTGRESQL' | 'MONGODB' | string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  connectionParams?: Record<string, unknown>;
}

export interface ConnectionTestResponse {
  sourceId: number;
  status: string;
  message: string;
}
