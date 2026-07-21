import { TestBed } from '@angular/core/testing';
import { AuthUser } from '../domain/auth.models';
import { AuthStorageService } from './auth-storage.service';

describe('AuthStorageService', () => {
  let service: AuthStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStorageService);
    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('persists and restores a session', () => {
    const user: AuthUser = {
      id: 1,
      email: 'admin@aquaerp.local',
      firstName: 'Administrador',
      lastName: 'Sistema',
      roles: ['ADMIN'],
    };
    const tokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    service.write(user, tokens);

    expect(service.read()).toEqual({ user, ...tokens });
  });

  it('clears corrupted session data', () => {
    sessionStorage.setItem('aquaerp.session', '{invalid-json');

    expect(service.read()).toEqual({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
    expect(sessionStorage.length).toBe(0);
  });
});
