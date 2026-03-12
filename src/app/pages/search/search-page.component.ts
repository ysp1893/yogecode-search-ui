import { CommonModule } from '@angular/common';
import { Component, ElementRef, NgZone, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ColDef } from 'ag-grid-community';
import { catchError, of } from 'rxjs';
import { ColumnSelectorComponent } from '../../components/column-selector/column-selector.component';
import { FilterChipsComponent } from '../../components/filter-chips/filter-chips.component';
import { InspectorPanelComponent } from '../../components/inspector-panel/inspector-panel.component';
import { QueryBuilderComponent } from '../../components/query-builder/query-builder.component';
import { ResultGridComponent } from '../../components/result-grid/result-grid.component';
import { EntityService } from '../../core/services/entity.service';
import { RelationService } from '../../core/services/relation.service';
import { SearchService } from '../../core/services/search.service';
import { Entity } from '../../models/entity.model';
import { Relation } from '../../models/relation.model';
import { PartialFailureResponse, SearchFilter, SearchRequest, SearchResponse } from '../../models/search.model';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    QueryBuilderComponent,
    ColumnSelectorComponent,
    FilterChipsComponent,
    ResultGridComponent,
    InspectorPanelComponent
  ],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly searchService = inject(SearchService);
  private readonly entityService = inject(EntityService);
  private readonly relationService = inject(RelationService);
  private readonly ngZone = inject(NgZone);

  protected isReady = false;
  protected entities: Entity[] = [];
  protected relationOptions: string[] = [];
  protected selectedEntity = 'cdr';
  protected selectedIncludes: string[] = [];
  protected entityColumns: Record<string, string[]> = {
    cdr: []
  };
  protected isSearching = false;
  protected requestPreview: SearchRequest = {
    entity: 'cdr',
    page: 0,
    size: 20
  };
  protected responsePreview: SearchResponse | { message: string } = {
    page: 0,
    size: 20,
    total: 0,
    results: []
  };
  protected results: Array<Record<string, unknown>> = [];
  protected columnDefs: ColDef[] = [];
  protected partialFailures: string[] = [];
  protected searchError = '';
  protected relationsHint = 'Loading relations...';
  protected selectedDateField = 'createdate';
  protected selectedDateFieldTarget = 'cdr';
  protected selectedTimeRange = 'Last 24 hours';
  protected timeRangeMode: 'preset' | 'custom' = 'preset';
  protected customDateFrom = '';
  protected customDateTo = this.toDateTimeLocal(new Date());
  protected showFilterComposer = false;
  protected inspectorOpen = false;
  protected selectedResultRow: Record<string, unknown> | null = null;
  protected responseMeta = {
    total: 0,
    rawCount: 0,
    flattenedCount: 0,
    columnCount: 0
  };

  protected readonly searchForm = this.formBuilder.group({
    entity: ['cdr'],
    include: [[] as string[]],
    page: [0],
    size: [20]
  });

  private filters: SearchFilter[] = [];

  @ViewChild('columnSelectorSection')
  private columnSelectorSection?: ElementRef<HTMLElement>;

  @ViewChild('filterBuilderSection')
  private filterBuilderSection?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    setTimeout(() => {
      this.loadEntities();
    });
  }

  protected get entityFieldTargets(): string[] {
    return [
      this.selectedEntity,
      ...this.selectedIncludes.filter((entity) => entity !== this.selectedEntity)
    ];
  }

  protected get activeFilters(): SearchFilter[] {
    return this.filters;
  }

  protected onEntitySelected(entityCode: string): void {
    this.selectedEntity = entityCode;
    this.selectedDateFieldTarget = entityCode;
    this.selectedIncludes = [];
    this.searchForm.patchValue({ entity: entityCode, include: [] }, { emitEvent: false });
    this.loadRelations(entityCode);
    this.ensureEntityColumnBucket(entityCode);
    this.updatePreview();
  }

  protected onIncludeChanged(include: string[]): void {
    this.selectedIncludes = [...include];
    this.searchForm.patchValue({ include }, { emitEvent: false });
    this.entityFieldTargets.forEach((entity) => this.ensureEntityColumnBucket(entity));
    this.updatePreview();
  }

  protected onFiltersChanged(filters: SearchFilter[]): void {
    this.filters = filters;
    this.updatePreview();
  }

  protected onAddColumnChip(event: { entity: string; field: string }): void {
    this.ensureEntityColumnBucket(event.entity);
    const nextColumns = new Set(this.entityColumns[event.entity] ?? []);
    nextColumns.add(event.field);
    this.entityColumns[event.entity] = Array.from(nextColumns);
    this.updatePreview();
  }

  protected onRemoveColumnChip(event: { entity: string; field: string }): void {
    this.entityColumns[event.entity] = (this.entityColumns[event.entity] ?? []).filter(
      (field) => field !== event.field
    );
    this.updatePreview();
  }

  protected onTimeRangeChanged(range: string): void {
    this.selectedTimeRange = range;
    this.updatePreview();
  }

  protected onDateFieldChanged(field: string): void {
    this.selectedDateField = field.trim();
    this.updatePreview();
  }

  protected onDateFieldTargetChanged(entityCode: string): void {
    this.selectedDateFieldTarget = entityCode;
    this.updatePreview();
  }

  protected onTimeRangeModeChanged(mode: 'preset' | 'custom'): void {
    this.timeRangeMode = mode;
    if (mode === 'custom' && !this.customDateTo) {
      this.customDateTo = this.toDateTimeLocal(new Date());
    }
    this.updatePreview();
  }

  protected onCustomDateFromChanged(value: string): void {
    this.customDateFrom = value;
    this.updatePreview();
  }

  protected onCustomDateToChanged(value: string): void {
    this.customDateTo = value;
    this.updatePreview();
  }

  protected focusColumnBuilder(): void {
    this.scrollToSection(this.columnSelectorSection);
  }

  protected openFilterBuilder(): void {
    this.showFilterComposer = true;
    setTimeout(() => this.scrollToSection(this.filterBuilderSection));
  }

  protected executeSearch(): void {
    this.searchError = '';
    this.partialFailures = [];
    this.isSearching = true;
    this.requestPreview = this.buildPayload();

    this.searchService.search(this.requestPreview).subscribe({
      next: (response) => {
        this.deferUiUpdate(() => {
          const rawResults = Array.isArray(response.results)
            ? (response.results as Array<Record<string, unknown>>)
            : [];
          const normalizedRows = rawResults.map((result) => this.normalizeRow(result));

          this.isSearching = false;
          this.results = normalizedRows;
          this.selectedResultRow = this.results[0] ?? null;
          this.partialFailures = this.formatPartialFailures(response.partialFailures);
          this.columnDefs = this.buildColumns(this.results);
          this.responsePreview = response;
          this.responseMeta = {
            total: Number(response.total ?? rawResults.length ?? 0),
            rawCount: rawResults.length,
            flattenedCount: this.results.length,
            columnCount: this.columnDefs.length
          };
        });
      },
      error: (error) => {
        this.deferUiUpdate(() => {
          const responseError = this.normalizeErrorResponse(error?.error);
          const errorMessage =
            (typeof responseError?.['message'] === 'string' ? responseError['message'] : undefined) ??
            error?.error?.message ??
            error?.message ??
            'Search request failed. Please verify filters and selected relations.';

          this.isSearching = false;
          this.results = [];
          this.columnDefs = [];
          this.selectedResultRow = null;
          this.responseMeta = {
            total: 0,
            rawCount: 0,
            flattenedCount: 0,
            columnCount: 0
          };
          this.responsePreview = { ...(responseError ?? {}), message: errorMessage };
          this.searchError = errorMessage;
        });
      },
    });
  }

  protected updatePreview(): void {
    this.requestPreview = this.buildPayload();
  }

  protected toggleInspector(): void {
    this.inspectorOpen = !this.inspectorOpen;
  }

  private scrollToSection(section?: ElementRef<HTMLElement>): void {
    section?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  private loadEntities(): void {
    this.entityService
      .list()
      .pipe(catchError(() => of([])))
      .subscribe((entities) => {
        this.deferUiUpdate(() => {
          this.entities = entities;
          if (entities.length > 0) {
            const selected = this.selectedEntity;
            const exists = entities.some((entity) => entity.entityCode === selected);
            const nextEntity = exists ? selected : entities[0].entityCode;

            if (!exists) {
              this.searchForm.patchValue({ entity: nextEntity }, { emitEvent: false });
            }

            this.selectedEntity = nextEntity ?? 'cdr';
            this.searchForm.patchValue({ include: [] }, { emitEvent: false });
            this.ensureEntityColumnBucket(nextEntity ?? 'cdr');
            this.loadRelations(nextEntity ?? 'cdr');
            this.updatePreview();
          } else {
            this.isReady = true;
          }
        });
      });
  }

  private loadRelations(entityCode: string): void {
    this.relationService
      .list(entityCode)
      .pipe(catchError(() => of([] as Relation[])))
      .subscribe((relations) => {
        this.deferUiUpdate(() => {
          this.relationOptions = relations.map((relation) => relation.toEntityCode);
          this.relationsHint = this.relationOptions.length
            ? `Available relations for ${entityCode}: ${this.relationOptions.join(', ')}`
            : `No include relations are configured for ${entityCode}.`;

          this.selectedIncludes = this.selectedIncludes.filter((include) =>
            this.relationOptions.includes(include)
          );
          this.searchForm.patchValue({ include: this.selectedIncludes }, { emitEvent: false });

          this.entityFieldTargets.forEach((entity) => this.ensureEntityColumnBucket(entity));
          this.updatePreview();
          this.isReady = true;
        });
      });
  }

  private deferUiUpdate(callback: () => void): void {
    this.ngZone.run(() => {
      setTimeout(() => {
        callback();
      });
    });
  }

  private buildPayload(): SearchRequest {
    const formValue = this.searchForm.getRawValue();
    const entityFields = this.buildEntityFields();
    const filters = this.buildRequestFilters();

    return {
      entity: formValue.entity ?? undefined,
      filters: filters.length ? filters : undefined,
      entityFields: Object.keys(entityFields).length ? entityFields : undefined,
      include: formValue.include?.length ? formValue.include : undefined,
      page: formValue.page ?? 0,
      size: formValue.size ?? 20
    };
  }

  private buildRequestFilters(): SearchFilter[] {
    return [...this.buildDateFilters(), ...this.filters];
  }

  private buildEntityFields(): Record<string, string[]> {
    return this.entityFieldTargets.reduce<Record<string, string[]>>((accumulator, entityCode) => {
      const fields = this.entityColumns[entityCode] ?? [];

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

  private ensureEntityColumnBucket(entityCode: string): void {
    this.entityColumns[entityCode] ??= [];
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

  private buildDateFilters(now = new Date()): SearchFilter[] {
    const field = this.buildScopedDateField();
    if (!field) {
      return [];
    }

    return this.timeRangeMode === 'custom'
      ? this.buildCustomDateFilters(field)
      : this.buildPresetDateFilters(field, now);
  }

  private buildPresetDateFilters(field: string, now: Date): SearchFilter[] {
    const rangeStart = this.getPresetRangeStart(now);
    if (!rangeStart) {
      return [];
    }

    return [
      {
        field,
        operator: 'GTE',
        value: this.formatDateTime(rangeStart)
      },
      {
        field,
        operator: 'LTE',
        value: this.formatDateTime(now)
      }
    ];
  }

  private buildCustomDateFilters(field: string): SearchFilter[] {
    const fromDate = this.parseDateTimeLocal(this.customDateFrom);
    const toDate = this.parseDateTimeLocal(this.customDateTo);
    const filters: SearchFilter[] = [];

    if (fromDate) {
      filters.push({
        field,
        operator: 'GTE',
        value: this.formatDateTime(fromDate)
      });
    }

    if (toDate) {
      filters.push({
        field,
        operator: 'LTE',
        value: this.formatDateTime(toDate)
      });
    }

    return filters;
  }

  private getPresetRangeStart(now: Date): Date | null {
    const rangeMap: Record<string, number> = {
      'Last 15 minutes': 15 * 60 * 1000,
      'Last 1 hour': 60 * 60 * 1000,
      'Last 6 hours': 6 * 60 * 60 * 1000,
      'Last 24 hours': 24 * 60 * 60 * 1000,
      'Last 7 days': 7 * 24 * 60 * 60 * 1000
    };

    const duration = rangeMap[this.selectedTimeRange];
    return typeof duration === 'number' ? new Date(now.getTime() - duration) : null;
  }

  private formatDateTime(value: Date): string {
    const pad = (part: number) => `${part}`.padStart(2, '0');

    return [
      value.getFullYear(),
      pad(value.getMonth() + 1),
      pad(value.getDate())
    ].join('-') +
      ` ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  private parseDateTimeLocal(value: string): Date | null {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    const parsed = new Date(trimmedValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDateTimeLocal(value: Date): string {
    const pad = (part: number) => `${part}`.padStart(2, '0');

    return [
      value.getFullYear(),
      pad(value.getMonth() + 1),
      pad(value.getDate())
    ].join('-') +
      `T${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }

  private normalizeErrorResponse(error: unknown): Record<string, unknown> | null {
    if (!error) {
      return null;
    }

    if (typeof error === 'string') {
      try {
        return this.normalizeErrorResponse(JSON.parse(error));
      } catch {
        return { message: error };
      }
    }

    if (typeof error === 'object' && !Array.isArray(error)) {
      return error as Record<string, unknown>;
    }

    return { message: `${error}` };
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

  private buildScopedDateField(): string {
    const field = this.selectedDateField.trim();
    if (!field) {
      return '';
    }

    return this.selectedDateFieldTarget && this.selectedDateFieldTarget !== this.selectedEntity
      ? `${this.selectedDateFieldTarget}.${field}`
      : field;
  }
}

