import { Component, inject, Input } from '@angular/core';
import {
  Router,
  NavigationEnd,
  RouterOutlet,
  RouterLink,
} from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UserMenus } from '../../data/menu/menu';
import { NavigationItem } from '../../data/menu/Navigation';
import { CommonModule } from '@angular/common';

interface TitleType {
  url: string | boolean;
  title: string;
  breadcrumbs: boolean;
  type: string;
}

@Component({
  selector: 'app-bread-crumb',
  templateUrl: './bread-crumb.component.html',
  styleUrls: ['./bread-crumb.component.scss'],
  imports: [RouterLink, CommonModule],
})
export class BreadCrumbComponent {
  @Input() Component: boolean = false;
  @Input() dashboard: boolean = true;

  private route = inject(Router);
  private titleService = inject(Title);

  navigations: NavigationItem[] = UserMenus;
  navigationList: TitleType[] = [];

  constructor() {
    this.route.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const activeUrl = event.url.split('?')[0].split('#')[0];
        const breadcrumbList = this.filterNavigation(
          this.navigations,
          activeUrl
        );
        this.navigationList = breadcrumbList;
        const pageTitle = breadcrumbList.at(-1)?.title || 'ML';
        this.titleService.setTitle(`${pageTitle} | Madina Link`);
      }
    });
  }

  private filterNavigation(
    navItems: NavigationItem[],
    activeLink: string
  ): TitleType[] {
    for (const navItem of navItems) {
      if (navItem.type === 'item' && navItem.url === activeLink) {
        return [
          {
            url: navItem.url ?? false,
            title: navItem.title,
            breadcrumbs: navItem.breadcrumbs ?? true,
            type: navItem.type,
          },
        ];
      }

      if (
        (navItem.type === 'group' || navItem.type === 'collapse') &&
        navItem.children
      ) {
        const childBreadcrumbs = this.filterNavigation(
          navItem.children,
          activeLink
        );
        if (childBreadcrumbs.length > 0) {
          return [
            {
              url: navItem.url ?? false,
              title: navItem.title,
              breadcrumbs: navItem.breadcrumbs ?? true,
              type: navItem.type,
            },
            ...childBreadcrumbs,
          ];
        }
      }
    }
    return [];
  }
}
