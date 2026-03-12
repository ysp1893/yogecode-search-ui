import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavigationItem {
  label: string;
  route: string;
  tag: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  protected readonly items: NavigationItem[] = [
    { label: 'Dashboard', route: '/dashboard', tag: 'DB' },
    { label: 'Search', route: '/search', tag: 'SR' },
    { label: 'Datasources', route: '/datasources', tag: 'DS' },
    { label: 'Entities', route: '/entities', tag: 'EN' },
    { label: 'Relations', route: '/relations', tag: 'RL' },
    { label: 'Keywords', route: '/keywords', tag: 'KW' }
  ];
}
