import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ColDef } from 'ag-grid-community';
import { ResultTableComponent } from '../../components/result-table/result-table.component';
import { KeywordService } from '../../core/services/keyword.service';
import { KeywordMapping } from '../../models/keyword.model';

@Component({
  selector: 'app-keywords-page',
  standalone: true,
  imports: [CommonModule, ResultTableComponent],
  templateUrl: './keywords-page.component.html',
  styleUrl: './keywords-page.component.scss'
})
export class KeywordsPageComponent {
  private readonly keywordService = inject(KeywordService);

  protected readonly columnDefs: ColDef[] = [
    { field: 'keyword', headerName: 'Keyword' },
    { field: 'entityCode', headerName: 'Entity Code' },
    { field: 'description', headerName: 'Description' },
    { field: 'active', headerName: 'Active', maxWidth: 110 }
  ];

  protected rows: KeywordMapping[] = [];

  constructor() {
    this.keywordService
      .list()
      .pipe(catchError(() => of([])))
      .subscribe((rows) => {
        this.rows = rows;
      });
  }
}
