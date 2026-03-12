import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SearchFilter } from '../../models/search.model';

@Component({
  selector: 'app-filter-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './filter-builder.component.html',
  styleUrl: './filter-builder.component.scss'
})
export class FilterBuilderComponent {
  private readonly formBuilder = inject(FormBuilder);

  @Output() filtersChanged = new EventEmitter<SearchFilter[]>();

  protected readonly operatorOptions = [
    'GT',
    'GTE',
    'LT',
    'LTE',
    'EQ',
    'NE',
    'LIKE',
    'IN',
    'NOT_IN',
    'IS_NULL',
    'IS_NOT_NULL'
  ];

  protected readonly form = this.formBuilder.group({
    filters: this.formBuilder.array([this.createFilterGroup()])
  });

  get filters(): FormArray {
    return this.form.get('filters') as FormArray;
  }

  addFilter(): void {
    this.filters.push(this.createFilterGroup());
    this.emitFilters();
  }

  removeFilter(index: number): void {
    if (this.filters.length === 1) {
      this.filters.at(0).reset({ field: '', operator: 'EQ', value: '' });
    } else {
      this.filters.removeAt(index);
    }
    this.emitFilters();
  }

  emitFilters(): void {
    const filters = this.filters.controls
      .map((control) => control.getRawValue())
      .filter((filter) => filter.field)
      .map((filter) => {
        const rawValue = `${filter.value ?? ''}`.trim();
        const operator = filter.operator as string;

        if (operator === 'IS_NULL' || operator === 'IS_NOT_NULL') {
          return {
            field: filter.field,
            operator
          };
        }

        if (operator === 'IN' || operator === 'NOT_IN') {
          return {
            field: filter.field,
            operator,
            value: rawValue
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          };
        }

        return {
          field: filter.field,
          operator,
          value: rawValue
        };
      })
      .filter((filter) =>
        filter.operator === 'IS_NULL' ||
        filter.operator === 'IS_NOT_NULL' ||
        (Array.isArray(filter.value) ? filter.value.length > 0 : `${filter.value ?? ''}`.length > 0)
      );

    this.filtersChanged.emit(filters);
  }

  private createFilterGroup() {
    return this.formBuilder.group({
      field: ['', Validators.required],
      operator: ['EQ', Validators.required],
      value: ['']
    });
  }
}
