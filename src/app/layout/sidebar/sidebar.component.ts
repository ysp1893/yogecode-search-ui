import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface NavigationItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  protected readonly items: NavigationItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Search', route: '/search' },
    { label: 'Datasources', route: '/datasources' },
    { label: 'Entities', route: '/entities' },
    { label: 'Relations', route: '/relations' },
    { label: 'Keywords', route: '/keywords' }
  ];
}
