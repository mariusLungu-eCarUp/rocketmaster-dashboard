import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminChargingDto,
  AdminRfidCardData,
  AdminStationDto,
  CarId,
  License,
  OcppLogEntry,
  Permission,
  RocketmasterUser,
} from './models';

@Injectable({ providedIn: 'root' })
export class SupportDataStore {
  private readonly http = inject(HttpClient);

  readonly users = signal<RocketmasterUser[]>([]);
  readonly stations = signal<AdminStationDto[]>([]);
  readonly rfidCards = signal<AdminRfidCardData[]>([]);
  readonly carIds = signal<CarId[]>([]);
  readonly chargings = signal<AdminChargingDto[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // --- Lookup Maps ---

  readonly userById = computed(
    () => new Map(this.users().map((u) => [u.Id, u])),
  );

  readonly stationById = computed(
    () => new Map(this.stations().map((s) => [s.Id, s])),
  );

  readonly stationsByUserId = computed(() => {
    const m = new Map<string, AdminStationDto[]>();
    for (const s of this.stations()) {
      const arr = m.get(s.UserId) ?? [];
      arr.push(s);
      m.set(s.UserId, arr);
    }
    return m;
  });

  readonly rfidCardsByUserId = computed(() => {
    const m = new Map<string, AdminRfidCardData[]>();
    for (const r of this.rfidCards()) {
      const arr = m.get(r.UserId) ?? [];
      arr.push(r);
      m.set(r.UserId, arr);
    }
    return m;
  });

  readonly carIdsByUserId = computed(() => {
    const m = new Map<string, CarId[]>();
    for (const c of this.carIds()) {
      const arr = m.get(c.UserId) ?? [];
      arr.push(c);
      m.set(c.UserId, arr);
    }
    return m;
  });

  readonly chargingsByDriverId = computed(() => {
    const m = new Map<string, AdminChargingDto[]>();
    for (const c of this.chargings()) {
      const arr = m.get(c.DriverId) ?? [];
      arr.push(c);
      m.set(c.DriverId, arr);
    }
    return m;
  });

  readonly chargingsByStationId = computed(() => {
    const m = new Map<string, AdminChargingDto[]>();
    for (const c of this.chargings()) {
      const arr = m.get(c.StationId) ?? [];
      arr.push(c);
      m.set(c.StationId, arr);
    }
    return m;
  });

  readonly permissionsByAssigneeId = computed(() => {
    const m = new Map<string, Permission[]>();
    for (const p of this.permissions()) {
      const arr = m.get(p.AssigneeId) ?? [];
      arr.push(p);
      m.set(p.AssigneeId, arr);
    }
    return m;
  });

  loadAll(): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    const base = `${environment.apiBaseUrl}/api/rocketmaster`;

    return forkJoin({
      users: this.http.get<RocketmasterUser[]>(`${base}/users`),
      stations: this.http.get<AdminStationDto[]>(`${base}/stations`),
      rfidCards: this.http.get<AdminRfidCardData[]>(`${base}/rfid`),
      carIds: this.http.get<CarId[]>(`${base}/car/all`),
      chargings: this.http.get<AdminChargingDto[]>(`${base}/charging`),
      permissions: this.http.get<Permission[]>(`${base}/permissions`),
    }).pipe(
      tap((data) => {
        this.users.set(data.users);
        this.stations.set(data.stations);
        this.rfidCards.set(data.rfidCards);
        this.carIds.set(data.carIds);
        this.chargings.set(data.chargings);
        this.permissions.set(data.permissions);
        this.loading.set(false);
      }),
      map(() => void 0),
      catchError((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to load data';
        this.error.set(message);
        this.loading.set(false);
        throw err;
      }),
    );
  }

  // --- User Actions ---

  changeEmail(userId: string, email: string): Observable<void> {
    return this.http
      .post<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/users/${userId}/email`,
        { email },
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }

  setFeatures(userId: string, features: { Type: string }[]): Observable<void> {
    return this.http
      .post<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/users/${userId}/features`,
        features,
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }

  cancelPayment(userId: string): Observable<void> {
    return this.http
      .put<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/users/cancelPayment/${userId}`,
        userId,
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }

  deleteUser(userId: string): Observable<void> {
    return this.http
      .delete<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/users/${userId}`,
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }

  getLicenses(userId: string): Observable<License[]> {
    return this.http.get<License[]>(
      `${environment.apiBaseUrl}/api/rocketmaster/users/${userId}/licenses`,
    );
  }

  addLicense(
    userId: string,
    dto: { tier: string; quantity: number; startDate: string; endDate: string; comment?: string },
  ): Observable<void> {
    return this.http.post<void>(
      `${environment.apiBaseUrl}/api/rocketmaster/users/${userId}/licenses`,
      dto,
    );
  }

  updateLicense(
    userId: string,
    licenseId: string,
    dto: Partial<{ tier: string; quantity: number; startDate: string; endDate: string; comment: string }>,
  ): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiBaseUrl}/api/rocketmaster/users/${userId}/licenses/${licenseId}`,
      dto,
    );
  }

  deleteLicense(userId: string, licenseId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/api/rocketmaster/users/${userId}/licenses/${licenseId}`,
    );
  }

  sendMonthlyOverview(
    userId: string,
    year: number,
    month: number,
    sendTo?: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${environment.apiBaseUrl}/api/rocketmaster/users/${userId}/monthly-overview`,
      { year, month, sendTo },
    );
  }

  // --- Station Actions ---

  getOcppConfig(stationId: string, key: string): Observable<{ Value: string }> {
    return this.http.get<{ Value: string }>(
      `${environment.apiBaseUrl}/api/rocketmaster/stations/${stationId}/configuration?key=${encodeURIComponent(key)}`,
    );
  }

  setOcppConfig(stationId: string, key: string, value: string): Observable<void> {
    return this.http.post<void>(
      `${environment.apiBaseUrl}/api/rocketmaster/stations/${stationId}/configuration`,
      { Key: key, Value: value },
    );
  }

  unlockConnector(stationId: string, connectorId: number): Observable<void> {
    return this.http.post<void>(
      `${environment.apiBaseUrl}/api/rocketmaster/stations/${stationId}/unlock?connectorId=${connectorId}`,
      null,
    );
  }

  resetStation(stationId: string, soft: boolean): Observable<void> {
    return this.http.post<void>(
      `${environment.apiBaseUrl}/api/rocketmaster/stations/${stationId}/reset?soft=${soft}`,
      '',
    );
  }

  getStationLogs(
    stationId: string,
    from: number,
    to: number,
    options?: { limit?: number; offset?: number; searchTerm?: string },
  ): Observable<OcppLogEntry[]> {
    let url = `${environment.apiBaseUrl}/api/rocketmaster/stations/${stationId}/logs?from=${from}&to=${to}`;
    if (options?.limit != null) url += `&limit=${options.limit}`;
    if (options?.offset != null) url += `&offset=${options.offset}`;
    if (options?.searchTerm) url += `&searchTerm=${encodeURIComponent(options.searchTerm)}`;
    return this.http.get<OcppLogEntry[]>(url);
  }

  updateStation(stationId: string, dto: { Name?: string; Address?: string; Type?: number; SubType?: number }): Observable<void> {
    return this.http
      .patch<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/stations/${stationId}`,
        dto,
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }

  deleteStation(stationId: string): Observable<void> {
    return this.http
      .delete<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/stations/${stationId}`,
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }

  // --- RFID / CarID / Charging ---

  deleteRfidCard(identification: string): Observable<void> {
    return this.http
      .delete<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/rfid?identification=${encodeURIComponent(identification)}`,
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }

  deleteCarId(identifier: string): Observable<void> {
    return this.http
      .delete<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/car/${encodeURIComponent(identifier)}`,
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }

  stopCharging(chargingId: string): Observable<void> {
    return this.http
      .delete<void>(
        `${environment.apiBaseUrl}/api/rocketmaster/charging/${chargingId}`,
      )
      .pipe(tap(() => this.loadAll().subscribe()));
  }
}
