import { Component, EventEmitter, Output } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../Services/Auth/auth.service';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbar, MatIconButton, MatIcon],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  @Output() isMenuButtonClicked = new EventEmitter<void>();

  constructor(private authService: AuthService, private router: Router) {}

  menuButtonClicked() {
    this.isMenuButtonClicked.emit();
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
