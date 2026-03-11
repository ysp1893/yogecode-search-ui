import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Relation } from '../../models/relation.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class RelationService {
  private readonly api = inject(ApiService);

  list(fromEntityCode?: string): Observable<Relation[]> {
    if (fromEntityCode) {
      return this.api.get<Relation[]>(`/api/admin/relations?fromEntityCode=${encodeURIComponent(fromEntityCode)}`);
    }

    return this.api.get<Relation[]>('/api/admin/relations');
  }
}
