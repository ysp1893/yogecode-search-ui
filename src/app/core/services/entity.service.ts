import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Entity } from '../../models/entity.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class EntityService {
  private readonly api = inject(ApiService);

  list(): Observable<Entity[]> {
    return this.api.get<Entity[]>('/api/admin/entities');
  }

  get(entityId: number): Observable<Entity> {
    return this.api.get<Entity>(`/api/admin/entities/${entityId}`);
  }
}
