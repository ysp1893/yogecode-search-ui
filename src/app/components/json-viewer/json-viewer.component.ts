import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@Component({
  selector: 'app-json-viewer',
  standalone: true,
  imports: [CommonModule, NgxJsonViewerModule],
  templateUrl: './json-viewer.component.html',
  styleUrl: './json-viewer.component.scss'
})
export class JsonViewerComponent {
  @Input({ required: true }) data: unknown;
  @Input() title = 'JSON Preview';
}
