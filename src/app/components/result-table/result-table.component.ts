import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-result-table',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './result-table.component.html',
  styleUrl: './result-table.component.scss'
})
export class ResultTableComponent {
  @Input({ required: true }) columnDefs: ColDef[] = [];
  @Input() rowData: any[] = [];
  @Input() height = 420;
  @Input() title = 'Results';

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
    suppressCellFocus: true,
    animateRows: true,
    theme: 'legacy'
  };

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
}
