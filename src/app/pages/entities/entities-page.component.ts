import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ColDef } from 'ag-grid-community';
import { catchError, of } from 'rxjs';
import { ResultGridComponent } from '../../components/result-grid/result-grid.component';
import { DatasourceService } from '../../core/services/datasource.service';
import { EntityService } from '../../core/services/entity.service';
import { Datasource } from '../../models/datasource.model';
import { Entity } from '../../models/entity.model';

@Component({
  selector: 'app-entities-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ResultGridComponent
  ],
  templateUrl: './entities-page.component.html',
  styleUrl: './entities-page.component.scss'
})
export class EntitiesPageComponent {
  private readonly entityService = inject(EntityService);
  private readonly datasourceService = inject(DatasourceService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly columnDefs: ColDef[] = [
    { field: 'entityCode', headerName: 'Entity Code' },
    { field: 'table', headerName: 'Table' },
    { field: 'datasource', headerName: 'Datasource' },
    { field: 'rootSearchable', headerName: 'Root Searchable', maxWidth: 160 }
  ];

  protected rows: Array<Record<string, unknown>> = [];
  protected entities: Array<Entity & { sourceName: string }> = [];
  protected selectedEntity: (Entity & { sourceName: string }) | null = null;

  protected readonly entityForm = this.formBuilder.group({
    entityCode: [''],
    entityName: [''],
    sourceName: [''],
    storageType: [''],
    objectSchema: [''],
    objectName: [''],
    primaryKeyField: [''],
    businessLabel: [''],
    rootSearchable: [''],
    fieldsConfiguration: ['Primary key, business label, and field metadata can be configured here once admin write APIs are exposed.']
  });

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
            this.entities = rows.map((row) => ({
              ...row,
              sourceName: datasourceMap.get(row.sourceId) ?? `${row.sourceId}`
            }));

            this.rows = this.entities.map((row) => ({
              id: row.id,
              entityCode: row.entityCode,
              table: row.objectName,
              datasource: row.sourceName,
              rootSearchable: row.rootSearchable ? 'Yes' : 'No'
            }));
          });
      });
  }

  protected onEntitySelected(row: Record<string, unknown> | null): void {
    const rowId = Number(row?.['id'] ?? 0);
    this.selectedEntity = this.entities.find((entity) => entity.id === rowId) ?? null;

    this.entityForm.patchValue({
      entityCode: this.selectedEntity?.entityCode ?? '',
      entityName: this.selectedEntity?.entityName ?? '',
      sourceName: this.selectedEntity?.sourceName ?? '',
      storageType: this.selectedEntity?.storageType ?? '',
      objectSchema: this.selectedEntity?.objectSchema ?? '',
      objectName: this.selectedEntity?.objectName ?? '',
      primaryKeyField: this.selectedEntity?.primaryKeyField ?? '',
      businessLabel: this.selectedEntity?.businessLabel ?? '',
      rootSearchable: this.selectedEntity?.rootSearchable ? 'Yes' : 'No',
      fieldsConfiguration: this.selectedEntity
        ? `entityCode: ${this.selectedEntity.entityCode}\nprimaryKeyField: ${this.selectedEntity.primaryKeyField ?? 'n/a'}\nbusinessLabel: ${this.selectedEntity.businessLabel}`
        : ''
    });
  }
}
