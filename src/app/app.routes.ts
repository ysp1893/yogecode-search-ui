import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          ),
        data: { title: 'Dashboard' }
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./pages/search/search-page.component').then(
            (m) => m.SearchPageComponent
          ),
        data: { title: 'Search' }
      },
      {
        path: 'datasources',
        loadComponent: () =>
          import('./pages/datasources/datasources-page.component').then(
            (m) => m.DatasourcesPageComponent
          ),
        data: { title: 'Datasources' }
      },
      {
        path: 'entities',
        loadComponent: () =>
          import('./pages/entities/entities-page.component').then(
            (m) => m.EntitiesPageComponent
          ),
        data: { title: 'Entities' }
      },
      {
        path: 'relations',
        loadComponent: () =>
          import('./pages/relations/relations-page.component').then(
            (m) => m.RelationsPageComponent
          ),
        data: { title: 'Relations' }
      },
      {
        path: 'keywords',
        loadComponent: () =>
          import('./pages/keywords/keywords-page.component').then(
            (m) => m.KeywordsPageComponent
          ),
        data: { title: 'Keywords' }
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
