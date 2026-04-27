import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportDataStore } from '../store/support-data.store';
import { StatusBadgeComponent } from '../shared/status-badge.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { IconComponent } from '../shared/icon.component';
import {
  AdminConnectorDto,
  AdminStationDto,
  StationState,
  STATION_TYPE_LABELS,
  STATION_SUBTYPE_LABELS,
  PLUG_TYPE_LABELS,
  ACCESS_TYPE_LABELS,
  StationType,
  StationSubType,
  StationPlugType,
  StationAccessType,
  OcppLogEntry,
} from '../store/models';

@Component({
  selector: 'app-station-profile',
  imports: [StatusBadgeComponent, ConfirmDialogComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-5 p-5 pb-10" style="max-width: 1200px">
      @if (!station()) {
        <div class="text-center py-16" style="color: #3B566B">
          <p class="text-sm">Station not found</p>
          <button class="text-sm font-medium mt-2 cursor-pointer" style="color: #03A9F4" (click)="goBack()">Back to Dashboard</button>
        </div>
      } @else {
        <!-- Header card -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px"
          [style.border-left]="'3px solid ' + headerBorderColor()">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <span class="font-mono" style="color: #000000; font-size: 22px; font-weight: 500; line-height: 30px">{{ station()!.Name || station()!.Id }}</span>
                <app-status-badge [state]="overallState()" />
              </div>
              <div class="flex gap-4 flex-wrap mt-1">
                <span class="flex items-center gap-1 text-xs" style="color: #3B566B">
                  <app-icon name="map-pin" [size]="12" color="#3B566B" />
                  {{ station()!.Address || 'No address' }}
                </span>
                <span class="flex items-center gap-1 text-xs cursor-pointer" style="color: #03A9F4" (click)="goToOwner()">
                  <app-icon name="user" [size]="12" />
                  Owner: {{ station()!.UserId }}
                </span>
                <span class="text-xs" style="color: #3B566B">{{ typeLabel() }} / {{ subtypeLabel() }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 flex-wrap shrink-0">
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #3B566B; border: 1px solid #E2E8F0"
                (click)="softReset()">
                <app-icon name="rotate-ccw" [size]="13" />
                Soft Reset
              </button>
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #DC2626; border: 1px solid #FECACA; background: #FFF5F5"
                (click)="showHardReset.set(true)">
                Hard Reset
              </button>
              @for (conn of station()!.Connectors; track conn.Position) {
                <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                  style="color: #03A9F4; border: 1px solid #B3E5FC; background: #E1F5FE"
                  (click)="unlockConnector(conn.Position)">
                  Unlock C{{ conn.Position }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- Left: Connectors -->
          <div class="flex flex-col gap-5">
            <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
              <div class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: #3B566B; letter-spacing: 0.07em">Connectors</div>
              <div class="flex flex-col gap-2">
                @for (conn of station()!.Connectors; track conn.Position) {
                  <div class="flex items-center justify-between gap-3 p-3 rounded-md"
                    [style.border]="'1px solid ' + connBorderColor(conn)"
                    [style.border-left]="'3px solid ' + connAccentColor(conn)"
                    [style.background]="conn.State === 3 ? '#FFF5F5' : '#FFFFFF'">
                    <div class="flex items-center gap-3">
                      <div class="flex items-center justify-center shrink-0"
                        style="width: 32px; height: 32px; border-radius: 4px"
                        [style.background]="connIconBg(conn)">
                        <app-icon name="zap" [size]="14" [color]="connAccentColor(conn)" />
                      </div>
                      <div>
                        <div class="text-sm font-semibold" style="color: #000000">C{{ conn.Position }} &mdash; {{ plugLabel(conn.PlugType) }}</div>
                        <div class="text-xs mt-0.5" style="color: #3B566B">{{ accessLabel(conn.AccessType) }} &middot; {{ conn.EnergyPrice }} {{ conn.Currency }}/kWh</div>
                      </div>
                    </div>
                    @if (conn.State !== undefined && conn.State !== null) {
                      <app-status-badge [state]="conn.State" />
                    }
                  </div>
                }
                @if (!station()!.Connectors || station()!.Connectors.length === 0) {
                  <p class="text-xs py-4 text-center" style="color: #3B566B">No connectors</p>
                }
              </div>
            </div>
          </div>

          <!-- Right: Hardware Details -->
          <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
            <div class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: #3B566B; letter-spacing: 0.07em">Hardware Details</div>
            @for (row of hardwareRows(); track row.label) {
              <div class="flex justify-between py-1.5" style="border-bottom: 1px solid #E2E8F0">
                <span class="text-xs font-medium uppercase tracking-wider" style="color: #3B566B; letter-spacing: 0.05em">{{ row.label }}</span>
                <span class="text-xs font-mono" style="color: #000000">{{ row.value }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Active Sessions -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B">Active Sessions</span>
            <span class="text-xs" style="color: #3B566B">{{ activeSessions().length }} session(s)</span>
          </div>
          @if (activeSessions().length === 0) {
            <p class="text-xs text-center py-4" style="color: #3B566B">No active sessions</p>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F4F4F4">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2 whitespace-nowrap" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Driver</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2 whitespace-nowrap" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Started</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2 whitespace-nowrap" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Duration</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2 whitespace-nowrap" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of activeSessions(); track s.Id) {
                    <tr class="hover:bg-blue-50/50 transition-colors">
                      <td class="px-3 py-2 text-sm cursor-pointer" style="border-bottom: 1px solid #E2E8F0; color: #03A9F4" (click)="goToDriver(s.DriverId)">{{ s.DriverName || s.DriverId }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ s.ActivatedAt }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ s.Duration }}</td>
                      <td class="px-3 py-2 text-right" style="border-bottom: 1px solid #E2E8F0">
                        <button class="text-xs font-medium px-2 py-1 rounded cursor-pointer" style="color: #DC2626; border: 1px solid #FECACA"
                          (click)="stopCharging(s.Id)">Stop</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- OCPP Logs -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B">OCPP Logs (Last 24h)</span>
            <button class="text-xs font-medium cursor-pointer" style="color: #03A9F4" (click)="loadLogs()">Refresh</button>
          </div>
          @if (logsLoading()) {
            <p class="text-xs text-center py-4" style="color: #3B566B">Loading logs...</p>
          } @else if (logs().length === 0) {
            <p class="text-xs text-center py-4" style="color: #3B566B">No logs available</p>
          } @else {
            <div class="overflow-x-auto" style="max-height: 300px; overflow-y: auto">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F4F4F4; position: sticky; top: 0">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Time</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Direction</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of logs().slice(0, 50); track $index) {
                    <tr>
                      <td class="px-3 py-1.5 text-xs font-mono" style="border-bottom: 1px solid #E2E8F0; color: #3B566B">{{ log.timestamp }}</td>
                      <td class="px-3 py-1.5 text-xs" style="border-bottom: 1px solid #E2E8F0">{{ log.direction }}</td>
                      <td class="px-3 py-1.5 text-xs font-medium" style="border-bottom: 1px solid #E2E8F0; color: #000000">{{ log.action }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        @if (showHardReset()) {
          <app-confirm-dialog
            title="Hard Reset Station"
            message="This will perform a hard reset on the station. Active sessions may be interrupted."
            confirmLabel="Hard Reset"
            (confirmed)="hardReset()"
            (cancelled)="showHardReset.set(false)"
          />
        }
      }
    </div>
  `,
})
export class StationProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(SupportDataStore);

  readonly stationId = signal('');
  readonly logs = signal<OcppLogEntry[]>([]);
  readonly logsLoading = signal(false);
  readonly showHardReset = signal(false);

  readonly station = computed(() => this.store.stationById().get(this.stationId()));

  readonly activeSessions = computed(() =>
    this.store.chargingsByStationId().get(this.stationId()) ?? [],
  );

  readonly overallState = computed<StationState>(() => {
    const s = this.station();
    if (!s?.Connectors?.length) return StationState.Unknown;
    if (s.Connectors.some((c) => c.State === StationState.Maintenance)) return StationState.Maintenance;
    if (s.Connectors.some((c) => c.State === StationState.Occupied)) return StationState.Occupied;
    if (s.Connectors.every((c) => c.State === StationState.Free)) return StationState.Free;
    if (s.Connectors.every((c) => c.State === StationState.NotActive)) return StationState.NotActive;
    return StationState.Unknown;
  });

  readonly hardwareRows = computed(() => {
    const s = this.station();
    if (!s) return [];
    return [
      { label: 'Station ID', value: s.Id },
      { label: 'Type', value: this.typeLabel() },
      { label: 'SubType', value: this.subtypeLabel() },
      { label: 'Address', value: s.Address || '—' },
      { label: 'Created', value: s.CreatedAt ? new Date(s.CreatedAt).toLocaleDateString() : '—' },
      { label: 'Connectors', value: String(s.Connectors?.length ?? 0) },
      { label: 'Owner ID', value: s.UserId },
      ...(s.HubjectEvseIds?.length ? [{ label: 'Hubject EVSE', value: s.HubjectEvseIds.join(', ') }] : []),
    ];
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.stationId.set(params['stationId']);
      this.loadLogs();
    });
  }

  headerBorderColor(): string {
    const state = this.overallState();
    return state === StationState.NotActive || state === StationState.Maintenance ? '#DC2626' : '#03A9F4';
  }

  typeLabel(): string {
    return STATION_TYPE_LABELS[this.station()?.Type as StationType] ?? 'Unknown';
  }

  subtypeLabel(): string {
    return STATION_SUBTYPE_LABELS[this.station()?.SubType as StationSubType] ?? 'Unknown';
  }

  plugLabel(type: number): string {
    return PLUG_TYPE_LABELS[type as StationPlugType] ?? 'Unknown';
  }

  accessLabel(type: number): string {
    return ACCESS_TYPE_LABELS[type as StationAccessType] ?? 'Unknown';
  }

  connAccentColor(conn: AdminConnectorDto): string {
    if (conn.State === StationState.Maintenance) return '#DC2626';
    if (conn.State === StationState.Occupied) return '#03A9F4';
    return '#E2E8F0';
  }

  connBorderColor(conn: AdminConnectorDto): string {
    if (conn.State === StationState.Maintenance) return '#FECACA';
    return '#E2E8F0';
  }

  connIconBg(conn: AdminConnectorDto): string {
    if (conn.State === StationState.Maintenance) return '#FEE2E2';
    if (conn.State === StationState.Occupied) return '#E1F5FE';
    return '#E2E8F0';
  }

  loadLogs(): void {
    const id = this.stationId();
    if (!id) return;
    this.logsLoading.set(true);
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 86400;
    this.store.getStationLogs(id, dayAgo, now).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.logsLoading.set(false);
      },
      error: () => {
        this.logs.set([]);
        this.logsLoading.set(false);
      },
    });
  }

  softReset(): void {
    this.store.resetStation(this.stationId(), true).subscribe();
  }

  hardReset(): void {
    this.showHardReset.set(false);
    this.store.resetStation(this.stationId(), false).subscribe();
  }

  unlockConnector(position: number): void {
    this.store.unlockConnector(this.stationId(), position).subscribe();
  }

  stopCharging(id: string): void {
    this.store.stopCharging(id).subscribe();
  }

  goToOwner(): void {
    const s = this.station();
    if (s) this.router.navigate(['/driver', s.UserId]);
  }

  goToDriver(driverId: string): void {
    this.router.navigate(['/driver', driverId]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
