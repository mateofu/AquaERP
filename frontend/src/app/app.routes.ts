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
      {
        path: 'customers',
        title: 'Suscriptores | AquaERP',
        loadComponent: () =>
          import('./features/customers/presentation/customers.page').then(
            (component) => component.CustomersPage,
          ),
      },
      {
        path: 'properties',
        title: 'Predios | AquaERP',
        loadComponent: () =>
          import('./features/properties/presentation/properties.page').then(
            (component) => component.PropertiesPage,
          ),
      },
      {
        path: 'meters',
        title: 'Medidores | AquaERP',
        loadComponent: () =>
          import('./features/meters/presentation/meters.page').then(
            (component) => component.MetersPage,
          ),
      },
      {
        path: 'billing-periods',
        title: 'Periodos | AquaERP',
        loadComponent: () =>
          import('./features/billing-periods/presentation/billing-periods.page').then(
            (component) => component.BillingPeriodsPage,
          ),
      },
      {
        path: 'meter-readings',
        title: 'Lecturas | AquaERP',
        loadComponent: () =>
          import('./features/meter-readings/presentation/meter-readings.page').then(
            (component) => component.MeterReadingsPage,
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
