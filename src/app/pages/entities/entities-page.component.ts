import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ColDef } from 'ag-grid-community';
import { ResultTableComponent } from '../../components/result-table/result-table.component';
import { DatasourceService } from '../../core/services/datasource.service';
import { EntityService } from '../../core/services/entity.service';
import { Datasource } from '../../models/datasource.model';
import { Entity } from '../../models/entity.model';

@Component({
  selector: 'app-entities-page',
  standalone: true,
  imports: [CommonModule, ResultTableComponent],
  templateUrl: './entities-page.component.html',
  styleUrl: './entities-page.component.scss'
})
export class EntitiesPageComponent {
  private readonly entityService = inject(EntityService);
  private readonly datasourceService = inject(DatasourceService);

  protected readonly columnDefs: ColDef[] = [
    { field: 'entityCode', headerName: 'Entity Code' },
    { field: 'sourceName', headerName: 'Datasource' },
    { field: 'objectName', headerName: 'Table Name' },
    { field: 'primaryKeyField', headerName: 'Primary Key' },
    { field: 'rootSearchable', headerName: 'Root Searchable' }
  ];

  protected rows: Array<Entity & { sourceName: string }> = [];

  constructor() {
    this.datasourceService
      .list()
      .pipe(catchError(() => of([] as Datasource[])))
      .subscribe((datasources) => {
        const datasourceMap = new Map(datasources.map((source) => [source.id, source.sourceCode]));

        this.entityService
          .list()
          .pipe(catchError(() => of([] as Entity[])))
          .subscribe((rows) => {
            this.rows = rows.map((row) => ({
              ...row,
              sourceName: datasourceMap.get(row.sourceId) ?? `${row.sourceId}`
            }));
          });
      });
  }
}
