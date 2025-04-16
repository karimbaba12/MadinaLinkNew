import { Component, Input } from '@angular/core';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { ToolbarComponent } from '../../../layout/toolbar/toolbar.component';
import { RouterOutlet } from '@angular/router';
import { Navigation } from '../../../data/menu/Navigation';
import { NavigationService } from '../../../../Services/navigation/navigation.service';
import { BreadCrumbComponent } from '../../../layout/bread-crumb/bread-crumb.component';

@Component({
  selector: 'app-admin',
  imports: [SidebarComponent, ToolbarComponent, RouterOutlet ,BreadCrumbComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  sidebarOpened: boolean = true;
  menus: Navigation[] = [];

  constructor(private navigationService: NavigationService) {
    this.loadMenus();
  }

  loadMenus() {
    this.navigationService.getMenu().subscribe((menus) => {
      this.menus = menus;
    });
  }

  menuButtonClicked() {
    this.sidebarOpened = !this.sidebarOpened;
  }
}
