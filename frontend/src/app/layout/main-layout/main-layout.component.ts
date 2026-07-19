import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
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
  readonly sidebarOpen = signal(true);
  readonly isCompact = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );
  readonly initials = computed(() => {
    const user = this.session.user();
    return user
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      : 'AU';
  });
  readonly navigation: NavigationItem[] = [
    { label: 'Inicio', icon: 'home', route: '/dashboard' },
    { label: 'Suscriptores', icon: 'customers', route: '/customers' },
    { label: 'Predios', icon: 'properties', route: '/properties' },
    { label: 'Medidores', icon: 'meters', route: '/meters' },
    { label: 'Lecturas', icon: 'readings', status: 'Fase 2' },
    { label: 'Facturación', icon: 'billing', status: 'Fase 3' },
    { label: 'Pagos y cartera', icon: 'payments', status: 'Fase 4' },
  ];

  closeOnCompact(): void {
    if (this.isCompact()) {
      this.sidebarOpen.set(false);
    }
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
