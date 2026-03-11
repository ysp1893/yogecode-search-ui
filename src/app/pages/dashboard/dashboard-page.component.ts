import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { DatasourceService } from '../../core/services/datasource.service';
import { EntityService } from '../../core/services/entity.service';
import { RelationService } from '../../core/services/relation.service';
import { KeywordService } from '../../core/services/keyword.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  private readonly datasourceService = inject(DatasourceService);
  private readonly entityService = inject(EntityService);
  private readonly relationService = inject(RelationService);
  private readonly keywordService = inject(KeywordService);

  protected stats = {
    datasources: 0,
    entities: 0,
    relations: 0,
    keywords: 0
  };

  protected readonly activity = [
    { title: 'Live datasource metadata loaded', time: 'Realtime' },
    { title: 'Entity catalog synced from backend', time: 'Realtime' },
    { title: 'Relation registry refreshed', time: 'Realtime' },
    { title: 'Keyword mappings available', time: 'Realtime' }
  ];

  constructor() {
    forkJoin({
      datasources: this.datasourceService.list().pipe(catchError(() => of([]))),
      entities: this.entityService.list().pipe(catchError(() => of([]))),
      relations: this.relationService.list().pipe(catchError(() => of([]))),
      keywords: this.keywordService.list().pipe(catchError(() => of([])))
    }).subscribe((response) => {
      this.stats = {
        datasources: response.datasources.length,
        entities: response.entities.length,
        relations: response.relations.length,
        keywords: response.keywords.length
      };
    });
  }
}
