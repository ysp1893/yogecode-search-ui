import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SearchRequest, SearchResponse } from '../../models/search.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly http = inject(HttpClient);

  search<T = Record<string, unknown>>(
    payload: SearchRequest
  ): Observable<SearchResponse<T>> {
    return this.http
      .post('/api/search', payload, {
        responseType: 'text'
      })
      .pipe(map((response) => this.normalizeResponse<T>(response)));
  }

  private normalizeResponse<T>(response: unknown): SearchResponse<T> {
    if (typeof response === 'string') {
      try {
        return this.normalizeResponse<T>(JSON.parse(response));
      } catch {
        return {
          page: 0,
          size: 0,
          total: 0,
          results: []
        };
      }
    }

    if (Array.isArray(response)) {
      return {
        page: 0,
        size: response.length,
        total: response.length,
        results: response as T[],
        partialFailures: []
      };
    }

    const parsed = (response as SearchResponse<T>) ?? {
      page: 0,
      size: 0,
      total: 0,
      results: []
    };

    return {
      page: parsed.page ?? 0,
      size: parsed.size ?? 0,
      total: parsed.total ?? 0,
      results: Array.isArray(parsed.results) ? parsed.results : [],
      requestId: parsed.requestId,
      rootEntity: parsed.rootEntity,
      partialFailures: parsed.partialFailures ?? []
    };
  }
}
