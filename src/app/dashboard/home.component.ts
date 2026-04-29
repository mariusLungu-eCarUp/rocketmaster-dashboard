import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { SupportDataStore } from '../store/support-data.store';
import { StatTileComponent } from './stat-tile.component';
import { AlertCardComponent, DashboardAlert } from './alert-card.component';
import { StationState } from '../store/models';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-home',
  imports: [StatTileComponent, AlertCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-5 p-5 pb-10" style="max-width: 100%">
      <!-- Header -->
      <div class="flex items-baseline justify-between">
        <div>
          <h1 style="color: #000000; font-size: 22px; font-weight: 500; line-height: 30px; margin: 0">Support Operations Center</h1>
          <p class="text-sm mt-0.5" style="color: #3B566B">{{ today }}</p>
        </div>
      </div>

      <!-- Stat tiles -->
      <div class="grid grid-cols-3 gap-3">
        <app-stat-tile label="Total Stations" [value]="store.stations().length" subtitle="across all CPOs" />
        <app-stat-tile label="Active Sessions" [value]="store.chargings().length" subtitle="right now" [color]="store.chargings().length > 0 ? '#03A9F4' : ''" />
        <app-stat-tile label="Total Users" [value]="store.users().length" subtitle="registered accounts" />
      </div>

      <!-- Alerts -->
      @if (alerts().length > 0) {
        <div class="flex flex-col gap-2.5">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B; letter-spacing: 0.07em">Active Alerts</span>
          @for (alert of alerts(); track alert.title) {
            <app-alert-card [alert]="alert" />
          }
        </div>
      }

      @if (alerts().length === 0 && !store.loading()) {
        <div class="text-center py-12" style="color: #3B566B">
          <span class="mx-auto mb-3 block" style="width: 40px"><app-icon name="check-circle" [size]="40" color="#E2E8F0" [strokeWidth]="1.5" /></span>
          <p class="text-sm font-medium">All systems operational</p>
          <p class="text-xs mt-1">No active alerts detected</p>
        </div>
      }
    </div>
  `,
})
export class HomeComponent {
  readonly store = inject(SupportDataStore);

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  readonly alerts = computed<DashboardAlert[]>(() => {
    const alerts: DashboardAlert[] = [];

    // Critical: stations with active chargings but faulted/offline connectors
    const chargingStationIds = new Set(this.store.chargings().map((c) => c.StationId));
    const problematicStations = this.store.stations().filter((s) => {
      if (!chargingStationIds.has(s.Id)) return false;
      return s.Connectors?.some(
        (c) => c.State === StationState.NotActive || c.State === StationState.Maintenance,
      );
    });
    if (problematicStations.length > 0) {
      alerts.push({
        severity: 'critical',
        title: 'Stations with Active Sessions & Faulted Connectors',
        description: `${problematicStations.length} station(s) have active charging sessions but report faulted or offline connectors.`,
        count: problematicStations.length,
        unit: 'stations',
        items: problematicStations.map((s) => ({
          id: s.Id,
          label: s.Name || s.Id,
          route: `/station/${s.Id}`,
        })),
      });
    }

    // Warning: exceeded license coverage
    const exceededUsers = this.store.users().filter(
      (u) => u.LicenseCoverage?.Status?.toLowerCase() === 'exceeded',
    );
    if (exceededUsers.length > 0) {
      alerts.push({
        severity: 'warning',
        title: 'Exceeded License Coverage',
        description: `${exceededUsers.length} user(s) have more connectors than their license allows.`,
        count: exceededUsers.length,
        unit: 'users',
        items: exceededUsers.slice(0, 8).map((u) => ({
          id: u.Id,
          label: u.Identification || u.Id,
          route: `/driver/${u.Id}`,
        })),
      });
    }

    // Info: expired RFID cards
    const now = new Date();
    const expiredRfid = this.store.rfidCards().filter((r) => {
      if (!r.ValidUntil) return false;
      return new Date(r.ValidUntil) < now;
    });
    if (expiredRfid.length > 0) {
      alerts.push({
        severity: 'info',
        title: 'Expired RFID Cards',
        description: `${expiredRfid.length} RFID card(s) have passed their validity date.`,
        count: expiredRfid.length,
        unit: 'cards',
        items: expiredRfid.slice(0, 8).map((r) => ({
          id: r.Identification,
          label: r.Name || r.Identification,
          route: `/driver/${r.UserId}`,
        })),
      });
    }

    return alerts;
  });

}
