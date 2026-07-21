import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../features/auth/application/auth.service';
import { AuthSessionService } from '../../features/auth/application/auth-session.service';
import {
  NavigationIcon,
  NavigationIconComponent,
} from './navigation-icon.component';

interface NavigationItem {
  label: string;
  icon: NavigationIcon;
  route?: string;
  status?: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    NavigationIconComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly authService = inject(AuthService);
  readonly session = inject(AuthSessionService);
  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(false);
  readonly isCompact = toSignal(
    this.breakpointObserver
      .observe('(max-width: 900px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );
  private readonly closeSidebarWhenCompact = effect(() => {
    if (this.isCompact()) {
      this.sidebarOpen.set(false);
    }
  });
  readonly navigation: NavigationItem[] = [
    { label: 'Inicio', icon: 'home', route: '/dashboard' },
    { label: 'Suscriptores', icon: 'customers', route: '/customers' },
    { label: 'Predios', icon: 'properties', route: '/properties' },
    { label: 'Medidores', icon: 'meters', route: '/meters' },
    { label: 'Periodos', icon: 'periods', route: '/billing-periods' },
    { label: 'Lecturas', icon: 'readings', route: '/meter-readings' },
    { label: 'Tarifas', icon: 'billing', route: '/tariffs' },
    { label: 'Facturación', icon: 'billing', route: '/invoices' },
    { label: 'Pagos y cartera', icon: 'payments', route: '/payments' },
  ];

  closeOnCompact(): void {
    if (this.isCompact()) {
      this.sidebarOpen.set(false);
    }
  }

  syncSidebarState(opened: boolean): void {
    if (this.isCompact()) {
      this.sidebarOpen.set(opened);
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
