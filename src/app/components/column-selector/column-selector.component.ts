import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-column-selector',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './column-selector.component.html',
  styleUrl: './column-selector.component.scss'
})
export class ColumnSelectorComponent {
  @Input() entityTargets: string[] = [];
  @Input() columnsByEntity: Record<string, string[]> = {};

  @Output() addColumn = new EventEmitter<{ entity: string; field: string }>();
  @Output() removeColumn = new EventEmitter<{ entity: string; field: string }>();

  protected draftValues: Record<string, string> = {};

  protected addDraftColumn(entity: string): void {
    const value = (this.draftValues[entity] ?? '').trim();
    if (!value) {
      return;
    }

    value
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean)
      .forEach((field) => this.addColumn.emit({ entity, field }));

    this.draftValues[entity] = '';
  }
}
