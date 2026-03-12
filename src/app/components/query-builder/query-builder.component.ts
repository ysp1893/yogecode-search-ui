import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Entity } from '../../models/entity.model';

@Component({
  selector: 'app-query-builder',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './query-builder.component.html',
  styleUrl: './query-builder.component.scss'
})
export class QueryBuilderComponent {
  @Input() entities: Entity[] = [];
  @Input() selectedEntity = '';
  @Input() selectedIncludes: string[] = [];
  @Input() relationOptions: string[] = [];
  @Input() isSearching = false;
  @Input() relationsHint = '';

  @Output() entityChange = new EventEmitter<string>();
  @Output() includeChange = new EventEmitter<string[]>();
  @Output() addColumn = new EventEmitter<void>();
  @Output() addFilter = new EventEmitter<void>();
  @Output() runQuery = new EventEmitter<void>();

  protected onEntitySelection(event: MatSelectChange): void {
    this.entityChange.emit(event.value as string);
  }

  protected onIncludeSelection(event: MatSelectChange): void {
    this.includeChange.emit((event.value as string[]) ?? []);
  }
}
