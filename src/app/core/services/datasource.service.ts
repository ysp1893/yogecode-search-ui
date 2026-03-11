import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ConnectionTestResponse,
  CreateDatasourceRequest,
  Datasource
} from '../../models/datasource.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DatasourceService {
  private readonly api = inject(ApiService);

  list(): Observable<Datasource[]> {
    return this.api.get<Datasource[]>('/api/admin/datasources');
  }

  get(id: number): Observable<Datasource> {
    return this.api.get<Datasource>(`/api/admin/datasources/${id}`);
  }

  create(payload: CreateDatasourceRequest): Observable<Datasource> {
    return this.api.post<Datasource>('/api/admin/datasources', payload);
  }

  testConnection(id: number): Observable<ConnectionTestResponse> {
    return this.api.post<ConnectionTestResponse>(`/api/admin/datasources/${id}/test`, {});
  }
}
