import { Component, EventEmitter, Output } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/Auth/auth.service';
import { UsersClient } from '../../../Services/api/api-client.service';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbar, MatIconButton, MatIcon, MatMenuTrigger, MatMenu],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  @Output() isMenuButtonClicked = new EventEmitter<void>();
  userInitial: string = 'A';

  constructor(
    private authService: AuthService,
    private router: Router,
    private userClient: UsersClient
  ) {
    const userId = this.authService.getUserId();
    if (userId) {
      const userName = this.userClient.getById(userId).subscribe((result) => {
        this.userInitial =
          result && result.data?.name
            ? result.data.name.charAt(0).toUpperCase()
            : 'A';
      });
    } else {
      this.userInitial = 'A';
    }
  }

  menuButtonClicked() {
    this.isMenuButtonClicked.emit();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToAdminSettings() {
    this.router.navigate(['/admin/settings']);
  }
}
