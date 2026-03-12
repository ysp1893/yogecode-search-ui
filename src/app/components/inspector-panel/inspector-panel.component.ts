import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@Component({
  selector: 'app-inspector-panel',
  standalone: true,
  imports: [CommonModule, NgxJsonViewerModule],
  templateUrl: './inspector-panel.component.html',
  styleUrl: './inspector-panel.component.scss'
})
export class InspectorPanelComponent {
  @Input() requestData: unknown;
  @Input() responseData: unknown;
  @Input() open = false;

  protected activeTab: 'request' | 'response' = 'request';
}
