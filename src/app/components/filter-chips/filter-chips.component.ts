import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
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
export class FilterChipsComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input() filters: SearchFilter[] = [];
  @Input() openComposer = false;
  @Input() rootEntity = '';
  @Input() entityTargets: string[] = [];
  @Input() dateField = '';
  @Input() dateFieldTarget = '';
  @Input() timeRangeMode: 'preset' | 'custom' = 'preset';
  @Input() selectedTimeRange = 'Last 24 hours';
  @Input() customFrom = '';
  @Input() customTo = '';

  @Output() filtersChange = new EventEmitter<SearchFilter[]>();
  @Output() composerToggled = new EventEmitter<boolean>();
  @Output() dateFieldChange = new EventEmitter<string>();
  @Output() dateFieldTargetChange = new EventEmitter<string>();
  @Output() timeRangeModeChange = new EventEmitter<'preset' | 'custom'>();
  @Output() timeRangeChange = new EventEmitter<string>();
  @Output() customFromChange = new EventEmitter<string>();
  @Output() customToChange = new EventEmitter<string>();

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
  protected readonly timeRanges = [
    'Last 15 minutes',
    'Last 1 hour',
    'Last 6 hours',
    'Last 24 hours',
    'Last 7 days'
  ];
  protected readonly timeRangeModes: Array<'preset' | 'custom'> = ['preset', 'custom'];

  protected readonly composerForm = this.formBuilder.group({
    targetEntity: [''],
    field: ['', Validators.required],
    operator: ['EQ', Validators.required],
    value: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rootEntity'] || changes['entityTargets']) {
      const availableTargets = this.availableEntityTargets;
      const selectedTarget = this.composerForm.getRawValue().targetEntity ?? '';

      if (availableTargets.length === 0) {
        this.composerForm.patchValue({ targetEntity: '' }, { emitEvent: false });
        return;
      }

      if (!selectedTarget || !availableTargets.includes(selectedTarget)) {
        this.composerForm.patchValue({ targetEntity: this.defaultTargetEntity }, { emitEvent: false });
      }

      if (!this.dateFieldTarget || !availableTargets.includes(this.dateFieldTarget)) {
        this.dateFieldTargetChange.emit(this.defaultTargetEntity);
      }
    }
  }

  protected get availableEntityTargets(): string[] {
    return this.entityTargets.length
      ? this.entityTargets
      : this.rootEntity
        ? [this.rootEntity]
        : [];
  }

  protected get defaultTargetEntity(): string {
    return this.rootEntity || this.availableEntityTargets[0] || '';
  }

  protected formatEntityOption(entityCode: string): string {
    return entityCode === this.rootEntity ? `${entityCode} (root)` : entityCode;
  }

  protected get activeDateTarget(): string {
    return this.dateFieldTarget || this.defaultTargetEntity;
  }

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
    const field = this.buildScopedField(
      formValue.targetEntity ?? this.defaultTargetEntity,
      formValue.field ?? ''
    );
    const operator = formValue.operator ?? 'EQ';
    const trimmedValue = `${formValue.value ?? ''}`.trim();

    const nextFilter: SearchFilter =
      operator === 'IS_NULL' || operator === 'IS_NOT_NULL'
        ? {
            field,
            operator
          }
        : operator === 'IN' || operator === 'NOT_IN'
          ? {
              field,
              operator,
              value: trimmedValue
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean)
            }
          : {
              field,
              operator,
              value: trimmedValue
            };

    this.filtersChange.emit([...this.filters, nextFilter]);
    this.composerForm.reset({
      targetEntity: this.defaultTargetEntity,
      field: '',
      operator: 'EQ',
      value: ''
    });
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

  protected onDateFieldTargetSelection(targetEntity: string): void {
    this.dateFieldTargetChange.emit(targetEntity);
  }

  protected onDateFieldInput(value: string): void {
    this.dateFieldChange.emit(value);
  }

  protected onTimeRangeModeSelection(mode: 'preset' | 'custom'): void {
    this.timeRangeModeChange.emit(mode);
  }

  protected onTimeRangeSelection(range: string): void {
    this.timeRangeChange.emit(range);
  }

  protected onCustomFromInput(value: string): void {
    this.customFromChange.emit(value);
  }

  protected onCustomToInput(value: string): void {
    this.customToChange.emit(value);
  }

  private getOperatorLabel(operator: string): string {
    const labelMap: Record<string, string> = {
      GT: '>',
      GTE: '>=',
      LT: '<',
      LTE: '<=',
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

  private buildScopedField(targetEntity: string, field: string): string {
    const trimmedField = field.trim();

    if (!trimmedField) {
      return '';
    }

    return targetEntity && targetEntity !== this.rootEntity
      ? `${targetEntity}.${trimmedField}`
      : trimmedField;
  }
}
