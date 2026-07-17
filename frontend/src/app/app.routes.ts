import { Routes } from '@angular/router';
import { authGuard } from './features/auth/presentation/guards/auth.guard';
import { guestGuard } from './features/auth/presentation/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (component) => component.MainLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        title: 'Inicio | AquaERP',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then(
            (component) => component.DashboardPage,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada | AquaERP',
    loadComponent: () =>
      import('./shared/pages/not-found.page').then(
        (component) => component.NotFoundPage,
      ),
  },
];
