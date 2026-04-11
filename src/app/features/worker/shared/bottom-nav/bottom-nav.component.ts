import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  iconActive: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent {
  navItems: NavItem[] = [
    {
      path: '/worker/equipment',
      label: 'EQUIPOS',
      icon: 'bi-gear',
      iconActive: 'bi-gear-fill'
    },
    {
      path: '/worker/reports',
      label: 'INFORMES',
      icon: 'bi-file-earmark-text',
      iconActive: 'bi-file-earmark-text-fill'
    },
    {
      path: '/worker/routes',
      label: 'RUTAS',
      icon: 'bi-geo-alt',
      iconActive: 'bi-geo-alt-fill'
    },
    {
      path: '/worker/profile',
      label: 'PERFIL',
      icon: 'bi-person',
      iconActive: 'bi-person-fill'
    }
  ];
}
