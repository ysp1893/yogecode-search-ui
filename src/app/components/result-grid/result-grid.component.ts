import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SelectionChangedEvent
} from 'ag-grid-community';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

interface ChartDatum {
  label: string;
  value: number;
}

@Component({
  selector: 'app-result-grid',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatProgressBarModule,
    NgxJsonViewerModule
  ],
  templateUrl: './result-grid.component.html',
  styleUrl: './result-grid.component.scss'
})
export class ResultGridComponent {
  @Input() columnDefs: ColDef[] = [];
  @Input() rowData: Array<Record<string, unknown>> = [];
  @Input() title = 'Results';
  @Input() height = 480;
  @Input() loading = false;
  @Input() rowCountLabel = 'rows';
  @Input() totalRows = 0;

  @Output() selectedRowChange = new EventEmitter<Record<string, unknown> | null>();

  protected readonly isBrowser: boolean;
  protected readonly defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    minWidth: 140,
    flex: 1
  };

  protected readonly gridOptions: GridOptions = {
    rowSelection: {
      mode: 'singleRow'
    },
    animateRows: true,
    pagination: true,
    paginationPageSize: 20,
    suppressCellFocus: true,
    suppressFieldDotNotation: true,
    theme: 'legacy'
  };

  protected visibleColumns: Array<ColDef & { field: string }> = [];
  protected internalColumnDefs: ColDef[] = [];
  protected readonly pageSizeOptions = [20, 50, 100];
  protected selectedPageSize = 20;
  protected activeTab: 'table' | 'chart' | 'json' = 'table';

  private gridApi?: GridApi;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columnDefs']) {
      this.internalColumnDefs = this.columnDefs.map((columnDef) => ({
        ...columnDef,
        hide: columnDef.hide ?? false
      }));
      this.visibleColumns = this.internalColumnDefs
        .filter((columnDef): columnDef is ColDef & { field: string } => typeof columnDef.field === 'string')
        .map((columnDef) => columnDef as ColDef & { field: string });
      this.gridApi?.setGridOption('columnDefs', this.internalColumnDefs);
    }

    if (changes['rowData']) {
      this.gridApi?.setGridOption('rowData', this.rowData);
      this.gridApi?.redrawRows();
      this.gridApi?.refreshCells({ force: true });
      this.scheduleGridResize();

      if (!this.rowData.length) {
        this.selectedRowChange.emit(null);
      }
    }
  }

  protected get displayRowCount(): number {
    return this.totalRows || this.rowData.length;
  }

  protected onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.gridApi.setGridOption('paginationPageSize', this.selectedPageSize);
    this.scheduleGridResize();
  }

  protected onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedRow = (event.api.getSelectedRows()[0] as Record<string, unknown> | undefined) ?? null;
    this.selectedRowChange.emit(selectedRow);
  }

  protected setPageSize(size: number): void {
    this.selectedPageSize = size;
    this.gridApi?.setGridOption('paginationPageSize', size);
  }

  protected toggleColumn(field: string, visible: boolean): void {
    this.internalColumnDefs = this.internalColumnDefs.map((columnDef) =>
      columnDef.field === field ? { ...columnDef, hide: !visible } : columnDef
    );
    this.gridApi?.setColumnsVisible([field], visible);
  }

  protected pinColumn(field: string): void {
    this.gridApi?.applyColumnState({
      state: [{ colId: field, pinned: 'left' }],
      defaultState: { pinned: null }
    });
  }

  protected clearPinnedColumns(): void {
    this.gridApi?.applyColumnState({
      defaultState: { pinned: null }
    });
  }

  protected selectTab(tab: 'table' | 'chart' | 'json'): void {
    this.activeTab = tab;
    if (tab === 'table') {
      this.scheduleGridResize();
    }
  }

  protected get chartData(): ChartDatum[] {
    const field = this.internalColumnDefs.find((columnDef) => !columnDef.hide && columnDef.field)?.field;
    if (!field) {
      return [];
    }

    const counts = new Map<string, number>();
    this.rowData.forEach((row) => {
      const key = `${row[field] ?? 'null'}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }

  protected get chartMax(): number {
    return Math.max(...this.chartData.map((item) => item.value), 1);
  }

  private scheduleGridResize(): void {
    setTimeout(() => {
      this.gridApi?.sizeColumnsToFit();
    });
  }
}

