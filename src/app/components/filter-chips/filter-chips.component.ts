import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SearchFilter } from '../../models/search.model';

@Component({
  selector: 'app-filter-chips',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './filter-chips.component.html',
  styleUrl: './filter-chips.component.scss'
})
export class FilterChipsComponent {
  private readonly formBuilder = inject(FormBuilder);

  @Input() filters: SearchFilter[] = [];
  @Input() openComposer = false;

  @Output() filtersChange = new EventEmitter<SearchFilter[]>();
  @Output() composerToggled = new EventEmitter<boolean>();

  protected readonly operatorOptions = [
    'EQ',
    'NE',
    'LIKE',
    'IN',
    'NOT_IN',
    'IS_NULL',
    'IS_NOT_NULL'
  ];

  protected readonly composerForm = this.formBuilder.group({
    field: ['', Validators.required],
    operator: ['EQ', Validators.required],
    value: ['']
  });

  protected toggleComposer(force?: boolean): void {
    const nextState = force ?? !this.openComposer;
    this.composerToggled.emit(nextState);
  }

  protected removeFilter(index: number): void {
    const nextFilters = this.filters.filter((_, filterIndex) => filterIndex !== index);
    this.filtersChange.emit(nextFilters);
  }

  protected addFilter(): void {
    if (this.composerForm.invalid) {
      this.composerForm.markAllAsTouched();
      return;
    }

    const formValue = this.composerForm.getRawValue();
    const operator = formValue.operator ?? 'EQ';
    const trimmedValue = `${formValue.value ?? ''}`.trim();

    const nextFilter: SearchFilter =
      operator === 'IS_NULL' || operator === 'IS_NOT_NULL'
        ? {
            field: formValue.field ?? '',
            operator
          }
        : operator === 'IN' || operator === 'NOT_IN'
          ? {
              field: formValue.field ?? '',
              operator,
              value: trimmedValue
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean)
            }
          : {
              field: formValue.field ?? '',
              operator,
              value: trimmedValue
            };

    this.filtersChange.emit([...this.filters, nextFilter]);
    this.composerForm.reset({ field: '', operator: 'EQ', value: '' });
    this.toggleComposer(false);
  }

  protected formatFilter(filter: SearchFilter): string {
    const operatorLabel = this.getOperatorLabel(filter.operator);

    if (filter.operator === 'IS_NULL' || filter.operator === 'IS_NOT_NULL') {
      return `${filter.field} ${operatorLabel}`;
    }

    if (Array.isArray(filter.value)) {
      return `${filter.field} ${operatorLabel} ${filter.value.join(', ')}`;
    }

    return `${filter.field} ${operatorLabel} ${filter.value ?? ''}`;
  }

  private getOperatorLabel(operator: string): string {
    const labelMap: Record<string, string> = {
      EQ: '=',
      NE: '!=',
      LIKE: 'contains',
      IN: 'in',
      NOT_IN: 'not in',
      IS_NULL: 'is null',
      IS_NOT_NULL: 'is not null'
    };

    return labelMap[operator] ?? operator;
  }
}
