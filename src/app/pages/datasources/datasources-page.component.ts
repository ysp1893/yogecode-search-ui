import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { catchError, of } from 'rxjs';
import { ColDef } from 'ag-grid-community';
import { ResultTableComponent } from '../../components/result-table/result-table.component';
import { DatasourceService } from '../../core/services/datasource.service';
import { Datasource } from '../../models/datasource.model';

@Component({
  selector: 'app-datasources-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, ResultTableComponent],
  templateUrl: './datasources-page.component.html',
  styleUrl: './datasources-page.component.scss'
})
export class DatasourcesPageComponent {
  private readonly datasourceService = inject(DatasourceService);

  protected readonly columnDefs: ColDef[] = [
    { field: 'sourceCode', headerName: 'Source Code' },
    { field: 'sourceName', headerName: 'Source Name' },
    { field: 'dbType', headerName: 'DB Type' },
    { field: 'host', headerName: 'Host' },
    { field: 'port', headerName: 'Port', maxWidth: 110 },
    { field: 'databaseName', headerName: 'Database Name' },
    { field: 'active', headerName: 'Active', maxWidth: 110 }
  ];

  protected rows: Datasource[] = [];

  constructor() {
    this.datasourceService
      .list()
      .pipe(catchError(() => of([])))
      .subscribe((rows) => {
        this.rows = rows;
      });
  }

  protected testFirstDatasource(): void {
    const firstId = this.rows[0]?.id;
    if (!firstId) {
      return;
    }

    this.datasourceService.testConnection(firstId).subscribe();
  }
}
