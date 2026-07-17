import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión | AquaERP',
    loadComponent: () =>
      import('./presentation/login/login.page').then(
        (component) => component.LoginPage,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
