import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './features/auth/infrastructure/http/auth.interceptor';
import { AUTH_GATEWAY } from './features/auth/application/ports/auth.gateway';
import { AUTH_STORAGE } from './features/auth/application/ports/auth-storage.port';
import { AuthApiService } from './features/auth/infrastructure/auth-api.service';
import { AuthStorageService } from './features/auth/infrastructure/auth-storage.service';
import { routes } from './app.routes';

registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-CO' },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: AUTH_GATEWAY, useExisting: AuthApiService },
    { provide: AUTH_STORAGE, useExisting: AuthStorageService },
  ],
};
