import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface UserResponse {
  IdAsString: string;
  Username: string;
  Email: string;
  PriceUnit: string;
  Features: { Type: string }[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly _user = signal<UserResponse | null>(null);

  readonly user = this._user.asReadonly();

  login(username: string, password: string): Observable<void> {
    const token = btoa(`${username}:${password}`);
    sessionStorage.setItem('token', token);

    return this.http
      .get<UserResponse>(`${environment.apiBaseUrl}/api/users`)
      .pipe(
        tap((user) => {
          const hasAccess = user.Features.some(
            (f) => f.Type === 'access-rocketmaster-feature',
          );
          if (!hasAccess) {
            sessionStorage.removeItem('token');
            throw new Error('Access denied: No Rocketmaster permission');
          }
          this._user.set(user);
        }),
        map(() => void 0),
      );
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this._user.set(null);
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('token');
  }
}
