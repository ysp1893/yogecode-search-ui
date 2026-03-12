import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ColDef } from 'ag-grid-community';
import { catchError, of } from 'rxjs';
import { ResultGridComponent } from '../../components/result-grid/result-grid.component';
import { EntityService } from '../../core/services/entity.service';
import { RelationService } from '../../core/services/relation.service';
import { Entity } from '../../models/entity.model';
import { Relation } from '../../models/relation.model';

@Component({
  selector: 'app-relations-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ResultGridComponent
  ],
  templateUrl: './relations-page.component.html',
  styleUrl: './relations-page.component.scss'
})
export class RelationsPageComponent {
  private readonly relationService = inject(RelationService);
  private readonly entityService = inject(EntityService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly columnDefs: ColDef[] = [
    { field: 'relationCode', headerName: 'Relation Code' },
    { field: 'fromEntityCode', headerName: 'From Entity' },
    { field: 'toEntityCode', headerName: 'To Entity' },
    { field: 'relationType', headerName: 'Relation Type' },
    { field: 'joinStrategy', headerName: 'Join Strategy' }
  ];

  protected rows: Array<Record<string, unknown>> = [];
  protected relations: Relation[] = [];
  protected entityCodes: string[] = [];

  protected readonly relationTypes = ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE'];
  protected readonly joinStrategies = ['IN', 'JOIN', 'EXACT', 'LOOKUP'];
  protected readonly relationForm = this.formBuilder.group({
    relationCode: [''],
    fromEntityCode: [''],
    fromField: [''],
    toEntityCode: [''],
    toField: [''],
    relationType: ['ONE_TO_MANY'],
    joinStrategy: ['IN']
  });

  constructor() {
    this.entityService
      .list()
      .pipe(catchError(() => of([] as Entity[])))
      .subscribe((entities) => {
        this.entityCodes = entities.map((entity) => entity.entityCode);
      });

    this.relationService
      .list()
      .pipe(catchError(() => of([] as Relation[])))
      .subscribe((rows) => {
        this.relations = rows;
        this.rows = rows.map((row) => ({
          id: row.id,
          relationCode: row.relationCode,
          fromEntityCode: row.fromEntityCode,
          toEntityCode: row.toEntityCode,
          relationType: row.relationType,
          joinStrategy: row.joinStrategy ?? 'JOIN'
        }));
      });
  }

  protected onRelationSelected(row: Record<string, unknown> | null): void {
    const rowId = Number(row?.['id'] ?? 0);
    const relation = this.relations.find((item) => item.id === rowId) ?? null;

    this.relationForm.patchValue({
      relationCode: relation?.relationCode ?? '',
      fromEntityCode: relation?.fromEntityCode ?? '',
      fromField: relation?.fromField ?? '',
      toEntityCode: relation?.toEntityCode ?? '',
      toField: relation?.toField ?? '',
      relationType: relation?.relationType ?? 'ONE_TO_MANY',
      joinStrategy: relation?.joinStrategy ?? 'IN'
    });
  }
}
