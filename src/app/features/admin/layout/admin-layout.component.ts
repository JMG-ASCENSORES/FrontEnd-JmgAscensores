import { Component, inject } from '@angular/core';

import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, SidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);

  showLogoutModal = false;

  logout() {
    this.showLogoutModal = true;
  }

  confirmLogout() {
    this.authService.logout();
    this.showLogoutModal = false;
  }

  cancelLogout() {
    this.showLogoutModal = false;
  }
}
