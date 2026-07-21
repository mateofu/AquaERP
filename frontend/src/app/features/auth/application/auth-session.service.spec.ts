import { TestBed } from '@angular/core/testing';
import { AuthState } from '../domain/auth.models';
import { AuthSessionService } from './auth-session.service';
import {
  AUTH_STORAGE,
  AuthStoragePort,
} from './ports/auth-storage.port';

describe('AuthSessionService', () => {
  const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
  };
  let persistedState: AuthState = initialState;
  let service: AuthSessionService;

  const storage: AuthStoragePort = {
    read: () => initialState,
    write: (user, tokens) => {
      persistedState = { user, ...tokens };
    },
    clear: () => {
      persistedState = initialState;
    },
  };

  beforeEach(() => {
    persistedState = initialState;
    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        { provide: AUTH_STORAGE, useValue: storage },
      ],
    });
    service = TestBed.inject(AuthSessionService);
  });

  it('creates an authenticated session', () => {
    service.create({
      user: {
        id: 1,
        email: 'admin@aquaerp.local',
        firstName: 'Administrador',
        lastName: 'Sistema',
        roles: ['ADMIN'],
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.displayName()).toBe('Administrador Sistema');
    expect(service.hasAnyRole(['ADMIN'])).toBeTrue();
    expect(persistedState.accessToken).toBe('access-token');
  });

  it('replaces rotated tokens and clears the session', () => {
    service.create({
      user: {
        id: 1,
        email: 'admin@aquaerp.local',
        firstName: 'Administrador',
        lastName: 'Sistema',
        roles: ['ADMIN'],
      },
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
    });

    service.updateTokens({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    expect(service.accessToken()).toBe('new-access');
    expect(service.refreshToken()).toBe('new-refresh');

    service.clear();

    expect(service.isAuthenticated()).toBeFalse();
    expect(persistedState).toEqual(initialState);
  });
});
