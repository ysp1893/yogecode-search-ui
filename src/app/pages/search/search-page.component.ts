import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ColDef } from 'ag-grid-community';
import { catchError, of } from 'rxjs';
import { FilterBuilderComponent } from '../../components/filter-builder/filter-builder.component';
import { JsonViewerComponent } from '../../components/json-viewer/json-viewer.component';
import { ResultTableComponent } from '../../components/result-table/result-table.component';
import { EntityService } from '../../core/services/entity.service';
import { RelationService } from '../../core/services/relation.service';
import { SearchService } from '../../core/services/search.service';
import { Entity } from '../../models/entity.model';
import { Relation } from '../../models/relation.model';
import { PartialFailureResponse, SearchFilter, SearchRequest } from '../../models/search.model';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FilterBuilderComponent,
    JsonViewerComponent,
    ResultTableComponent
  ],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly searchService = inject(SearchService);
  private readonly entityService = inject(EntityService);
  private readonly relationService = inject(RelationService);
  private readonly ngZone = inject(NgZone);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  protected entities: Entity[] = [];
  protected relationOptions: string[] = [];
  protected entityFieldInputs: Record<string, string> = {
    cdr: ''
  };
  protected isSearching = false;
  protected requestPreview: SearchRequest = {
    entity: 'cdr',
    include: ['customer'],
    page: 0,
    size: 20
  };
  protected results: Array<Record<string, unknown>> = [];
  protected columnDefs: ColDef[] = [];
  protected partialFailures: string[] = [];
  protected searchError = '';
  protected relationsHint = 'Loading relations...';
  protected responseMeta = {
    total: 0,
    rawCount: 0,
    flattenedCount: 0,
    columnCount: 0
  };
  protected lastFirstRow: Record<string, unknown> | null = null;

  protected readonly searchForm = this.formBuilder.group({
    entity: ['cdr'],
    include: [[] as string[]],
    page: [0],
    size: [20]
  });

  private filters: SearchFilter[] = [];

  constructor() {
    this.loadEntities();
    this.loadRelations('cdr');
  }

  protected onEntityChange(): void {
    const entityCode = this.searchForm.getRawValue().entity ?? 'cdr';
    this.searchForm.patchValue({ include: [] });
    this.ensureEntityFieldInput(entityCode);
    this.loadRelations(entityCode);
    this.updatePreview();
  }

  protected onFiltersChanged(filters: SearchFilter[]): void {
    this.filters = filters;
    this.requestPreview = this.buildPayload();
  }

  protected onEntityFieldsChanged(entityCode: string, value: string): void {
    this.entityFieldInputs[entityCode] = value;
    this.updatePreview();
  }

  protected get entityFieldTargets(): string[] {
    const formValue = this.searchForm.getRawValue();
    const rootEntity = formValue.entity ?? 'cdr';
    const includes = formValue.include ?? [];

    return [rootEntity, ...includes.filter((entity) => entity !== rootEntity)];
  }

  protected executeSearch(): void {
    this.searchError = '';
    this.partialFailures = [];
    this.isSearching = true;
    this.requestPreview = this.buildPayload();
    this.changeDetectorRef.detectChanges();

    this.searchService.search(this.requestPreview).subscribe({
      next: (response) => {
        console.log('Search response:', response);

        this.ngZone.run(() => {
          const rawResults = Array.isArray(response.results)
            ? (response.results as Array<Record<string, unknown>>)
            : [];
          const normalizedRows = rawResults.map((result) =>
            this.normalizeRow(result)
          );

          this.isSearching = false;
          this.results = normalizedRows;
          this.lastFirstRow = this.results[0] ?? null;
          this.partialFailures = this.formatPartialFailures(response.partialFailures);
          this.columnDefs = this.buildColumns(this.results);
          this.responseMeta = {
            total: Number(response.total ?? rawResults.length ?? 0),
            rawCount: rawResults.length,
            flattenedCount: this.results.length,
            columnCount: this.columnDefs.length
          };
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (error) => {
        console.error('Search error:', error);

        this.ngZone.run(() => {
          this.isSearching = false;
          this.results = [];
          this.columnDefs = [];
          this.lastFirstRow = null;
          this.responseMeta = {
            total: 0,
            rawCount: 0,
            flattenedCount: 0,
            columnCount: 0
          };
          this.searchError =
            error?.error?.message ??
            error?.message ??
            'Search request failed. Please verify filters and selected relations.';
          this.changeDetectorRef.detectChanges();
        });
      },
      complete: () => {
        this.ngZone.run(() => {
          this.isSearching = false;
          this.changeDetectorRef.detectChanges();
        });
      }
    });
  }

  protected updatePreview(): void {
    this.requestPreview = this.buildPayload();
  }

  private loadEntities(): void {
    this.entityService
      .list()
      .pipe(catchError(() => of([])))
      .subscribe((entities) => {
        this.entities = entities;
        if (entities.length > 0) {
          const selected = this.searchForm.getRawValue().entity;
          const exists = entities.some((entity) => entity.entityCode === selected);
          const nextEntity = exists ? selected : entities[0].entityCode;

          if (!exists) {
            this.searchForm.patchValue({ entity: nextEntity });
          }

          this.ensureEntityFieldInput(nextEntity ?? 'cdr');
          this.loadRelations(nextEntity ?? 'cdr');
          this.updatePreview();
        }
      });
  }

  private loadRelations(entityCode: string): void {
    this.relationService
      .list(entityCode)
      .pipe(catchError(() => of([] as Relation[])))
      .subscribe((relations) => {
        this.relationOptions = relations.map((relation) => relation.toEntityCode);
        this.relationsHint = this.relationOptions.length
          ? `Available relations for ${entityCode}: ${this.relationOptions.join(', ')}`
          : `No include relations are configured for ${entityCode}.`;

        if (this.relationOptions.length === 1) {
          this.searchForm.patchValue({ include: [this.relationOptions[0]] }, { emitEvent: false });
        }

        this.entityFieldTargets.forEach((entity) => this.ensureEntityFieldInput(entity));
        this.updatePreview();
      });
  }

  private buildPayload(): SearchRequest {
    const formValue = this.searchForm.getRawValue();
    const entityFields = this.buildEntityFields();

    return {
      entity: formValue.entity ?? undefined,
      filters: this.filters.length ? this.filters : undefined,
      entityFields: Object.keys(entityFields).length ? entityFields : undefined,
      include: formValue.include?.length ? formValue.include : undefined,
      page: formValue.page ?? 0,
      size: formValue.size ?? 20
    };
  }

  private buildEntityFields(): Record<string, string[]> {
    return this.entityFieldTargets.reduce<Record<string, string[]>>((accumulator, entityCode) => {
      const fields = this.parseFieldInput(this.entityFieldInputs[entityCode] ?? '');

      if (fields.length) {
        accumulator[entityCode] = fields;
      }

      return accumulator;
    }, {});
  }

  private formatPartialFailures(failures: PartialFailureResponse[] | unknown): string[] {
    if (!Array.isArray(failures)) {
      return [];
    }

    return failures.map((failure) => {
      if (typeof failure === 'string') {
        return failure;
      }

      const entity = typeof failure?.entity === 'string' ? failure.entity : 'unknown';
      const message = typeof failure?.message === 'string' ? failure.message : 'Unknown partial failure';
      return `${entity}: ${message}`;
    });
  }

  private parseFieldInput(value: string): string[] {
    return value
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean);
  }

  private ensureEntityFieldInput(entityCode: string): void {
    this.entityFieldInputs[entityCode] ??= '';
  }

  private buildColumns(rows: Record<string, unknown>[]): ColDef[] {
    const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

    return keys.map((key) => ({
      field: key,
      headerName: key,
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 160
    }));
  }

  private normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return { value: row };
    }

    const flattened = this.flattenNestedRow(row);
    return Object.keys(flattened).length ? flattened : row;
  }

  private flattenNestedRow(row: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    Object.entries(row).forEach(([entity, entityValue]) => {
      if (!this.isPlainObject(entityValue)) {
        return;
      }

      Object.entries(entityValue).forEach(([field, value]) => {
        result[`${entity}.${field}`] = value;
      });
    });

    return result;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}
