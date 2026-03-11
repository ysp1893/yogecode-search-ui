import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { KeywordMapping } from '../../models/keyword.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class KeywordService {
  private readonly api = inject(ApiService);

  list(): Observable<KeywordMapping[]> {
    return this.api.get<KeywordMapping[]>('/api/admin/keywords');
  }
}
