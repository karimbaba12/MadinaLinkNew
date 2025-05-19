import { Component, Input, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import {
  MatDrawerContainer,
  MatDrawer,
  MatDrawerContent,
} from '@angular/material/sidenav';
import { MatNavList, MatListItem } from '@angular/material/list';
import { CommonModule, LocationStrategy, Location } from '@angular/common';
import { NavigationItem } from '../../data/menu/Navigation';
import { Router, RouterLink } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { NavigationService } from '../../../Services/navigation/navigation.service';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatDrawerContainer,
    MatDrawer,
    MatNavList,
    MatListItem,
    MatIcon,
    MatDrawerContent,
    RouterLink,
    CommonModule,
    MatExpansionModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() sidebarOpened: boolean = true;
  @Input() menus: NavigationItem[] = [];

  // private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  // private navigationService = inject(NavigationService);

  constructor(
    private location: Location,
    private router: Router,
    private navigationService: NavigationService
  ) {}
  // accountList = [
  //   { icon: 'ti ti-user', title: 'My Account' },
  //   { icon: 'ti ti-settings', title: 'Settings' },
  //   { icon: 'ti ti-lock', title: 'Lock Screen' },
  //   { icon: 'ti ti-power', title: 'Logout' },
  // ];

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }

    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);

    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;

      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger', 'active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger', 'active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger', 'active');
      }
    }
  }

  // Optional: method to fetch menus dynamically
  loadMenus() {
    this.navigationService.getMenu().subscribe((menu) => {
      this.menus = menu;
    });
  }
  isGroupActive(menu: NavigationItem): boolean {
    if (!menu.children) return false;
    return menu.children.some((child) =>
      this.router.isActive(child.url || '', false)
    );
  }
}
