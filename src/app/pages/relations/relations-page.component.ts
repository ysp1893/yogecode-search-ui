import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ColDef } from 'ag-grid-community';
import { ResultTableComponent } from '../../components/result-table/result-table.component';
import { RelationService } from '../../core/services/relation.service';
import { Relation } from '../../models/relation.model';

@Component({
  selector: 'app-relations-page',
  standalone: true,
  imports: [CommonModule, ResultTableComponent],
  templateUrl: './relations-page.component.html',
  styleUrl: './relations-page.component.scss'
})
export class RelationsPageComponent {
  private readonly relationService = inject(RelationService);

  protected readonly columnDefs: ColDef[] = [
    { field: 'relationCode', headerName: 'Relation Code' },
    { field: 'fromEntityCode', headerName: 'From Entity' },
    { field: 'toEntityCode', headerName: 'To Entity' },
    { field: 'fromField', headerName: 'From Field' },
    { field: 'toField', headerName: 'To Field' },
    { field: 'relationType', headerName: 'Relation Type' },
    { field: 'joinStrategy', headerName: 'Join Strategy' }
  ];

  protected rows: Relation[] = [];

  constructor() {
    this.relationService
      .list()
      .pipe(catchError(() => of([])))
      .subscribe((rows) => {
        this.rows = rows;
      });
  }
}
