import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { catchError, of } from 'rxjs';
import { ResultGridComponent } from '../../components/result-grid/result-grid.component';
import { DatasourceService } from '../../core/services/datasource.service';
import { CreateDatasourceRequest, Datasource } from '../../models/datasource.model';

@Component({
  selector: 'app-datasources-page',
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
  templateUrl: './datasources-page.component.html',
  styleUrl: './datasources-page.component.scss'
})
export class DatasourcesPageComponent {
  private readonly datasourceService = inject(DatasourceService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly columnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name' },
    { field: 'type', headerName: 'Type', maxWidth: 140 },
    { field: 'host', headerName: 'Host' },
    { field: 'database', headerName: 'Database' },
    { field: 'status', headerName: 'Status', maxWidth: 140 },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 280,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right',
      cellRenderer: (params: ICellRendererParams<Record<string, unknown>>) => this.renderActionButtons(params)
    }
  ];

  protected readonly dbTypes = ['MYSQL', 'POSTGRESQL', 'MONGODB'];
  protected rows: Array<Record<string, unknown>> = [];
  protected datasources: Datasource[] = [];
  protected selectedDatasource: Datasource | null = null;
  protected statusMessage = 'Use the right-side form to register a new datasource.';
  protected creating = false;
  protected formMode: 'create' | 'edit' = 'create';

  protected readonly datasourceForm = this.formBuilder.group({
    sourceCode: ['', Validators.required],
    sourceName: ['', Validators.required],
    dbType: ['POSTGRESQL', Validators.required],
    host: ['localhost', Validators.required],
    port: [5432, Validators.required],
    databaseName: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor() {
    this.loadDatasources();
  }

  protected onDatasourceSelected(row: Record<string, unknown> | null): void {
    const rowId = Number(row?.['id'] ?? 0);
    this.selectedDatasource = this.datasources.find((source) => source.id === rowId) ?? null;
    if (this.selectedDatasource) {
      this.loadDatasourceIntoForm(this.selectedDatasource);
    }
  }

  protected createDatasource(): void {
    if (this.datasourceForm.invalid) {
      this.datasourceForm.markAllAsTouched();
      return;
    }

    this.creating = true;
    const payload = this.datasourceForm.getRawValue() as CreateDatasourceRequest;

    this.datasourceService.create(payload).subscribe({
      next: (datasource) => {
        this.statusMessage = `Datasource ${datasource.sourceName} created successfully.`;
        this.formMode = 'create';
        this.datasourceForm.reset({
          sourceCode: '',
          sourceName: '',
          dbType: 'POSTGRESQL',
          host: 'localhost',
          port: 5432,
          databaseName: '',
          username: '',
          password: ''
        });
        this.creating = false;
        this.loadDatasources();
      },
      error: (error) => {
        this.statusMessage = error?.error?.message ?? error?.message ?? 'Datasource creation failed.';
        this.creating = false;
      }
    });
  }

  protected testSelectedDatasource(): void {
    if (!this.selectedDatasource?.id) {
      this.statusMessage = 'Select a datasource from the grid to test the connection.';
      return;
    }

    this.datasourceService.testConnection(this.selectedDatasource.id).subscribe({
      next: (response) => {
        this.statusMessage = response.message || `Connection test returned ${response.status}.`;
      },
      error: (error) => {
        this.statusMessage = error?.error?.message ?? error?.message ?? 'Connection test failed.';
      }
      });
  }

  protected editSelectedDatasource(): void {
    if (!this.selectedDatasource) {
      this.statusMessage = 'Select a datasource to load it into the form.';
      return;
    }

    this.loadDatasourceIntoForm(this.selectedDatasource);
    this.statusMessage =
      'Datasource loaded into the form. Update APIs are not exposed in DatasourceService yet, so save remains create-only.';
  }

  protected deleteSelectedDatasource(): void {
    this.statusMessage =
      'Delete is not available because DatasourceService does not expose a delete API. The UI now shows this explicitly instead of a fake action.';
  }

  private loadDatasources(): void {
    this.datasourceService
      .list()
      .pipe(catchError(() => of([] as Datasource[])))
      .subscribe((rows) => {
        this.datasources = rows;
        this.rows = rows.map((row) => ({
          id: row.id,
          name: row.sourceName,
          type: row.dbType,
          host: `${row.host}:${row.port}`,
          database: row.databaseName,
          status: row.status ?? (row.active === false ? 'INACTIVE' : 'ACTIVE'),
          actions: ''
        }));
      });
  }

  private loadDatasourceIntoForm(datasource: Datasource): void {
    this.selectedDatasource = datasource;
    this.formMode = 'edit';
    this.datasourceForm.patchValue({
      sourceCode: datasource.sourceCode,
      sourceName: datasource.sourceName,
      dbType: datasource.dbType,
      host: datasource.host,
      port: datasource.port,
      databaseName: datasource.databaseName,
      username: datasource.username ?? '',
      password: ''
    });
  }

  private renderActionButtons(
    params: ICellRendererParams<Record<string, unknown>>
  ): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'datasource-actions-cell';

    const rowId = Number(params.data?.['id'] ?? 0);
    const datasource = this.datasources.find((source) => source.id === rowId) ?? null;

    const editButton = this.createActionButton('Edit', () => {
      if (datasource) {
        this.loadDatasourceIntoForm(datasource);
        this.statusMessage =
          'Datasource loaded into the form. Update APIs are not exposed in DatasourceService yet, so save remains create-only.';
      }
    });

    const deleteButton = this.createActionButton('Delete', () => {
      this.statusMessage =
        'Delete is not available because DatasourceService does not expose a delete API.';
    });

    const testButton = this.createActionButton('Test', () => {
      if (datasource?.id) {
        this.selectedDatasource = datasource;
        this.testSelectedDatasource();
      }
    });

    wrapper.append(editButton, deleteButton, testButton);
    return wrapper;
  }

  private createActionButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'datasource-actions-cell__button';
    button.textContent = label;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });

    return button;
  }
}
