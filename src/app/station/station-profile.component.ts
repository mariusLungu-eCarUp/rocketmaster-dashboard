import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportDataStore } from '../store/support-data.store';
import { StatusBadgeComponent } from '../shared/status-badge.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../shared/toast.service';
import {
  AdminConnectorDto,
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
  Permission,
  StatusNotificationPayload,
  StopTransactionPayload,
  ConnectorDiagnostic,
  HeartbeatInfo,
  parseOcppPayload,
} from '../store/models';

const OCPP_CONFIG_KEYS = [
  'AllowOfflineTxForUnknownId', 'AuthorizationCacheEnabled', 'AuthorizeRemoteTxRequests',
  'BlinkRepeat', 'ClockAlignedDataInterval', 'ConnectionTimeOut', 'GetConfigurationMaxKeys',
  'HeartbeatInterval', 'LightIntensity', 'LocalAuthorizeOffline', 'LocalPreAuthorize',
  'MaxEnergyOnInvalidId', 'MeterValuesAlignedData', 'MeterValuesAlignedDataMaxLength',
  'MeterValuesSampledData', 'MeterValuesSampledDataMaxLength', 'MeterValueSampleInterval',
  'MinimumStatusDuration', 'NumberOfConnectors', 'ResetRetries', 'ConnectorPhaseRotation',
  'ConnectorPhaseRotationMaxLength', 'StopTransactionOnEVSideDisconnect',
  'StopTransactionOnInvalidId', 'StopTxnAlignedData', 'StopTxnAlignedDataMaxLength',
  'StopTxnSampledData', 'StopTxnSampledDataMaxLength', 'SupportedFeatureProfiles',
  'SupportedFeatureProfilesMaxLength', 'TransactionMessageAttempts',
  'TransactionMessageRetryInterval', 'UnlockConnectorOnEVSideDisconnect',
  'WebSocketPingInterval', 'LocalAuthListEnabled', 'LocalAuthListMaxLength',
  'SendLocalListMaxLength', 'ReserveConnectorZeroSupported', 'ChargeProfileMaxStackLevel',
  'ChargingScheduleAllowedChargingRateUnit', 'ChargingScheduleMaxPeriods',
  'ConnectorSwitch3to1PhaseSupported', 'MaxChargingProfilesInstalled',
];

@Component({
  selector: 'app-station-profile',
  imports: [StatusBadgeComponent, ConfirmDialogComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-5 p-5 pb-10" style="max-width: 100%">
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

              <!-- B1 + B2: Diagnostic indicators -->
              <div class="flex gap-3 flex-wrap mt-2">
                @if (heartbeatInfo(); as hb) {
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5"
                    [style.color]="hb.level === 'green' ? '#059669' : hb.level === 'yellow' ? '#C55B00' : '#DC2626'"
                    [style.background]="hb.level === 'green' ? '#ECFDF5' : hb.level === 'yellow' ? '#FFF8F0' : '#FFF5F5'"
                    [style.border]="'1px solid ' + (hb.level === 'green' ? '#6EE7B7' : hb.level === 'yellow' ? '#FED7AA' : '#FECACA')">
                    <app-icon [name]="hb.level === 'red' ? 'wifi-off' : 'wifi'" [size]="12" />
                    {{ hb.level === 'red' ? 'Offline' : 'Online' }} ({{ hb.label }})
                  </span>
                }
                @if (lastStationStatus(); as status) {
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5"
                    [style.color]="status.errorCode !== 'NoError' ? '#DC2626' : '#3B566B'"
                    [style.background]="status.errorCode !== 'NoError' ? '#FFF5F5' : '#F1F5F9'"
                    [style.border]="'1px solid ' + (status.errorCode !== 'NoError' ? '#FECACA' : '#E2E8F0')">
                    <app-icon [name]="status.errorCode !== 'NoError' ? 'alert-triangle' : 'activity'" [size]="12" />
                    Last: {{ status.status }}{{ status.errorCode !== 'NoError' ? ' — ' + status.errorCode : '' }}
                    @if (status.info) { ({{ status.info }}) }
                  </span>
                }
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 flex-wrap shrink-0">
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #3B566B; border: 1px solid #E2E8F0"
                (click)="openEditStation()">
                <app-icon name="pencil" [size]="13" />
                Edit
              </button>
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
              @if (station()!.Type === 1) {
                <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0"
                  (click)="openGetConfig()">
                  <app-icon name="settings" [size]="13" />
                  Get Config
                </button>
                <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0"
                  (click)="openSetConfig()">
                  <app-icon name="wrench" [size]="13" />
                  Set Config
                </button>
              }
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #DC2626; border: 1px solid #FECACA; background: #FFF5F5"
                (click)="showDeleteStation.set(true)">
                <app-icon name="trash-2" [size]="13" />
                Delete
              </button>
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
                        <div class="flex items-center gap-2 mt-0.5">
                          <span class="text-xs font-semibold px-1.5 py-0.5 rounded"
                            [style.color]="conn.AccessType === 0 ? '#059669' : conn.AccessType === 1 ? '#C55B00' : '#DC2626'"
                            [style.background]="conn.AccessType === 0 ? '#ECFDF5' : conn.AccessType === 1 ? '#FFF8F0' : '#FFF5F5'"
                            [style.border]="'1px solid ' + (conn.AccessType === 0 ? '#6EE7B7' : conn.AccessType === 1 ? '#FED7AA' : '#FECACA')">
                            <app-icon [name]="conn.AccessType === 0 ? 'unlock' : 'lock'" [size]="10" />
                            {{ accessLabel(conn.AccessType) }}
                          </span>
                          <span class="text-xs" style="color: #3B566B">{{ conn.EnergyPrice }} {{ conn.Currency }}/kWh</span>
                        </div>
                        @if (conn.AccessType === 1) {
                          <div class="text-xs mt-0.5" style="color: #C55B00">Requires user/group permission</div>
                        }
                        @if (conn.AccessType === 2) {
                          <div class="text-xs mt-0.5" style="color: #DC2626">Private — owner only</div>
                        }
                      </div>
                    </div>
                    @if (conn.State !== undefined && conn.State !== null) {
                      <div class="flex flex-col items-end gap-1">
                        <app-status-badge [state]="conn.State" />
                        @if (connectorDiagnostics().get(conn.Position); as diag) {
                          @if (diag.errorCode !== 'NoError') {
                            <span class="text-xs font-mono" style="color: #DC2626">{{ diag.errorCode }}</span>
                            @if (diag.vendorErrorCode) {
                              <span class="text-xs font-mono" style="color: #3B566B">{{ diag.vendorErrorCode }}</span>
                            }
                          }
                        }
                      </div>
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
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2 whitespace-nowrap" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Stop Reason</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2 whitespace-nowrap" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of activeSessions(); track s.Id) {
                    <tr class="hover:bg-blue-50/50 transition-colors">
                      <td class="px-3 py-2 text-sm cursor-pointer" style="border-bottom: 1px solid #E2E8F0; color: #03A9F4" (click)="goToDriver(s.DriverId)">{{ s.DriverName || s.DriverId }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ s.ActivatedAt }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ s.Duration }}</td>
                      <td class="px-3 py-2 text-xs font-mono" style="border-bottom: 1px solid #E2E8F0; color: #3B566B">{{ stopReasons().get(s.Id) || '—' }}</td>
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

        <!-- C2: Owner access warning -->
        @if (ownerAccessWarning()) {
          <div class="flex items-start gap-3 p-3 rounded-md" style="background: #FFF8F0; border: 1px solid #FED7AA; border-left: 3px solid #C55B00">
            <app-icon name="alert-triangle" [size]="16" color="#C55B00" style="flex-shrink: 0; margin-top: 1px" />
            <div>
              <div class="text-sm font-semibold" style="color: #C55B00">Owner has no access permission</div>
              <div class="text-xs mt-0.5" style="color: #3B566B">
                This station has Limited-access connectors, but owner
                <span class="font-mono cursor-pointer" style="color: #03A9F4" (click)="goToOwner()">{{ station()!.UserId }}</span>
                is not listed in the access permissions. The owner may be unable to charge.
              </div>
            </div>
          </div>
        }

        <!-- C3: Access Permissions -->
        @if (stationPermissions().length > 0 || hasLimitedConnectors()) {
          <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B">Access Permissions</span>
              <span class="text-xs" style="color: #3B566B">{{ stationPermissions().length }} permission(s)</span>
            </div>
            @if (stationPermissions().length === 0) {
              <p class="text-xs text-center py-4" style="color: #3B566B">No permissions configured for this station</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full" style="border-collapse: collapse">
                  <thead>
                    <tr style="background: #F4F4F4">
                      <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Assignee</th>
                      <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Type</th>
                      <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Permission</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of stationPermissions(); track $index) {
                      <tr>
                        <td class="px-3 py-2 text-sm font-mono" style="border-bottom: 1px solid #E2E8F0">
                          @if (p.AssigneeType === 'user') {
                            <span class="cursor-pointer" style="color: #03A9F4" (click)="goToDriver(p.AssigneeId)">{{ p.AssigneeId }}</span>
                          } @else {
                            <span style="color: #000000">{{ p.AssigneeId }}</span>
                          }
                        </td>
                        <td class="px-3 py-2 text-xs" style="border-bottom: 1px solid #E2E8F0">
                          <span class="text-xs font-medium px-1.5 py-0.5 rounded"
                            [style.color]="p.AssigneeType === 'user' ? '#03A9F4' : '#7C3AED'"
                            [style.background]="p.AssigneeType === 'user' ? '#E1F5FE' : '#F5F3FF'">
                            {{ p.AssigneeType }}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-xs" style="border-bottom: 1px solid #E2E8F0; color: #3B566B">{{ p.Type }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- OCPP Logs (Enhanced) -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B">OCPP Logs</span>
            <div class="flex items-center gap-2">
              <span class="text-xs" style="color: #3B566B">{{ filteredLogs().length }} entries</span>
              <button class="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded cursor-pointer"
                style="color: #03A9F4; border: 1px solid #B3E5FC"
                (click)="exportLogsCsv()">
                <app-icon name="download" [size]="12" />
                CSV
              </button>
              <button class="flex items-center justify-center cursor-pointer"
                style="width: 28px; height: 28px; border-radius: 4px; color: #3B566B"
                (click)="loadLogs()" title="Refresh logs">
                <app-icon name="refresh-cw" [size]="13" />
              </button>
            </div>
          </div>

          <!-- Controls bar -->
          <div class="flex flex-wrap gap-2 mb-3 items-center">
            <div class="flex items-center gap-1">
              <app-icon name="calendar" [size]="12" color="#3B566B" />
              <input type="date" class="text-xs px-2 py-1 rounded"
                style="border: 1px solid #E2E8F0; color: #3B566B; outline: none"
                [value]="logFrom()"
                (change)="logFrom.set($any($event.target).value)" />
              <span class="text-xs" style="color: #3B566B">to</span>
              <input type="date" class="text-xs px-2 py-1 rounded"
                style="border: 1px solid #E2E8F0; color: #3B566B; outline: none"
                [value]="logTo()"
                (change)="logTo.set($any($event.target).value)" />
              <button class="text-xs font-medium px-2 py-1 rounded cursor-pointer"
                style="color: #FFFFFF; background: #03A9F4"
                (click)="loadLogs()">Load</button>
            </div>
            <div class="flex items-center gap-1">
              <app-icon name="filter" [size]="12" color="#3B566B" />
              <select class="text-xs px-2 py-1 rounded"
                style="border: 1px solid #E2E8F0; color: #3B566B; outline: none; min-width: 140px"
                [value]="logActionFilter()"
                (change)="logActionFilter.set($any($event.target).value)">
                <option value="">All Actions</option>
                @for (action of logActionTypes(); track action) {
                  <option [value]="action">{{ action }}</option>
                }
              </select>
            </div>
            <div class="flex items-center gap-1">
              <app-icon name="search" [size]="12" color="#3B566B" />
              <input type="text" placeholder="Search logs..."
                class="text-xs px-2 py-1 rounded"
                style="border: 1px solid #E2E8F0; color: #3B566B; outline: none; min-width: 160px"
                [value]="logSearch()"
                (input)="logSearch.set($any($event.target).value)" />
            </div>
          </div>

          @if (logsLoading()) {
            <p class="text-xs text-center py-4" style="color: #3B566B">Loading logs...</p>
          } @else if (filteredLogs().length === 0) {
            <p class="text-xs text-center py-4" style="color: #3B566B">No logs available</p>
          } @else {
            <div class="overflow-x-auto" style="max-height: 500px; overflow-y: auto">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F4F4F4; position: sticky; top: 0; z-index: 1">
                    <th style="width: 24px; border-bottom: 1px solid #E2E8F0"></th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Time</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Direction</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of filteredLogs(); track $index) {
                    <tr class="cursor-pointer hover:bg-blue-50/50" (click)="expandedLogIndex.set(expandedLogIndex() === $index ? null : $index)">
                      <td class="px-1 py-1.5 text-center" style="border-bottom: 1px solid #E2E8F0">
                        <app-icon name="chevron-right" [size]="12" color="#3B566B"
                          [style.transform]="expandedLogIndex() === $index ? 'rotate(90deg)' : 'none'"
                          [style.transition]="'transform 0.15s'" />
                      </td>
                      <td class="px-3 py-1.5 text-xs font-mono whitespace-nowrap" style="border-bottom: 1px solid #E2E8F0; color: #3B566B">{{ log.Timestamp }}</td>
                      <td class="px-3 py-1.5 text-xs" style="border-bottom: 1px solid #E2E8F0">
                        <span class="inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded"
                          [style.color]="log.Direction === 'IN' ? '#059669' : '#03A9F4'"
                          [style.background]="log.Direction === 'IN' ? '#ECFDF5' : '#E1F5FE'">
                          {{ log.Direction }}
                        </span>
                      </td>
                      <td class="px-3 py-1.5 text-xs font-medium" style="border-bottom: 1px solid #E2E8F0; color: #000000">{{ log.Action }}</td>
                    </tr>
                    @if (expandedLogIndex() === $index) {
                      <tr>
                        <td colspan="4" style="background: #F4F4F4; border-bottom: 1px solid #E2E8F0; padding: 12px 16px">
                          <pre class="text-xs font-mono whitespace-pre-wrap" style="color: #3B566B; margin: 0; max-height: 300px; overflow-y: auto">{{ formatPayload(log.Payload) }}</pre>
                        </td>
                      </tr>
                    }
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

        <!-- D6: Edit Station -->
        @if (showEditStation()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showEditStation.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style="border: 1px solid #E2E8F0"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-4" style="color: #000000">Edit Station</h2>
              <div class="flex flex-col gap-3">
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Name</label>
                  <input type="text" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="editStationName()" (input)="editStationName.set($any($event.target).value)" />
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Address</label>
                  <input type="text" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="editStationAddress()" (input)="editStationAddress.set($any($event.target).value)" />
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Type</label>
                  <select class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="editStationType()" (change)="editStationType.set(+$any($event.target).value)">
                    <option [value]="0">Smart-me (Meter)</option>
                    <option [value]="1">OCPP</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">SubType</label>
                  <select class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="editStationSubType()" (change)="editStationSubType.set(+$any($event.target).value)">
                    <option [value]="0">On/Off</option>
                    <option [value]="1">WallBe V1</option>
                    <option [value]="2">Juice Booster V1</option>
                    <option [value]="3">Enercab Wallbox T2</option>
                    <option [value]="4">LadE V1</option>
                    <option [value]="5">WallBe V2</option>
                    <option [value]="6">Pico V1</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-3 justify-end mt-5">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showEditStation.set(false)">Cancel</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #03A9F4" (click)="saveStationEdit()">Save</button>
              </div>
            </div>
          </div>
        }

        <!-- D7: Delete Station -->
        @if (showDeleteStation()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showDeleteStation.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" style="border: 1px solid #E2E8F0"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-2" style="color: #DC2626">Delete Station</h2>
              <p class="text-sm mb-1" style="color: #3B566B">This action cannot be undone. All station data will be permanently removed.</p>
              <p class="text-sm mb-3" style="color: #3B566B">Type <strong>{{ station()!.Name || station()!.Id }}</strong> to confirm:</p>
              <input type="text" class="w-full text-sm px-3 py-2 rounded-md mb-4" style="border: 1px solid #E2E8F0; outline: none"
                [value]="deleteStationConfirmName()" (input)="deleteStationConfirmName.set($any($event.target).value)" />
              <div class="flex gap-3 justify-end">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showDeleteStation.set(false)">Cancel</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #DC2626"
                  [style.opacity]="deleteStationConfirmName().trim() === (station()!.Name || station()!.Id)?.trim() ? '1' : '0.4'"
                  [disabled]="deleteStationConfirmName().trim() !== (station()!.Name || station()!.Id)?.trim()"
                  (click)="confirmDeleteStation()">Delete</button>
              </div>
            </div>
          </div>
        }

        <!-- D8: Get Config -->
        @if (showGetConfig()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showGetConfig.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style="border: 1px solid #E2E8F0"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-4" style="color: #000000">Get OCPP Configuration</h2>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Configuration Key</label>
                <input type="text" list="ocpp-keys" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                  placeholder="e.g. HeartbeatInterval"
                  [value]="configKey()" (input)="configKey.set($any($event.target).value)" />
                <datalist id="ocpp-keys">
                  @for (k of ocppKeys; track k) { <option [value]="k">{{ k }}</option> }
                </datalist>
              </div>
              @if (configResult() !== null) {
                <div class="mt-3 p-3 rounded-md text-sm font-mono" style="background: #F4F4F4; border: 1px solid #E2E8F0; color: #000000; word-break: break-all">
                  {{ configResult() }}
                </div>
              }
              <div class="flex gap-3 justify-end mt-5">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showGetConfig.set(false)">Close</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #03A9F4"
                  [disabled]="!configKey().trim() || configLoading()"
                  [style.opacity]="!configKey().trim() || configLoading() ? '0.4' : '1'"
                  (click)="executeGetConfig()">{{ configLoading() ? 'Loading...' : 'Get' }}</button>
              </div>
            </div>
          </div>
        }

        <!-- D8: Set Config -->
        @if (showSetConfig()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showSetConfig.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style="border: 1px solid #E2E8F0"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-4" style="color: #000000">Set OCPP Configuration</h2>
              <div class="flex flex-col gap-3">
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Configuration Key</label>
                  <input type="text" list="ocpp-keys-set" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    placeholder="e.g. HeartbeatInterval"
                    [value]="configKey()" (input)="configKey.set($any($event.target).value)" />
                  <datalist id="ocpp-keys-set">
                    @for (k of ocppKeys; track k) { <option [value]="k">{{ k }}</option> }
                  </datalist>
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Value</label>
                  <input type="text" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="configValue()" (input)="configValue.set($any($event.target).value)" />
                </div>
              </div>
              <div class="flex gap-3 justify-end mt-5">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showSetConfig.set(false)">Cancel</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #03A9F4"
                  [disabled]="!configKey().trim() || configLoading()"
                  [style.opacity]="!configKey().trim() || configLoading() ? '0.4' : '1'"
                  (click)="executeSetConfig()">{{ configLoading() ? 'Saving...' : 'Set' }}</button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class StationProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly store = inject(SupportDataStore);

  readonly stationId = signal('');
  readonly logs = signal<OcppLogEntry[]>([]);
  readonly logsLoading = signal(false);
  readonly showHardReset = signal(false);

  // --- D6/D7/D8: Dialog state ---
  readonly showEditStation = signal(false);
  readonly editStationName = signal('');
  readonly editStationAddress = signal('');
  readonly editStationType = signal(0);
  readonly editStationSubType = signal(0);
  readonly showDeleteStation = signal(false);
  readonly deleteStationConfirmName = signal('');
  readonly showGetConfig = signal(false);
  readonly showSetConfig = signal(false);
  readonly configKey = signal('');
  readonly configValue = signal('');
  readonly configResult = signal<string | null>(null);
  readonly configLoading = signal(false);
  readonly ocppKeys = OCPP_CONFIG_KEYS;

  // --- B3: Log viewer state ---
  readonly logFrom = signal(this.defaultFromDate());
  readonly logTo = signal(this.defaultToDate());
  readonly logSearch = signal('');
  readonly logActionFilter = signal('');
  readonly expandedLogIndex = signal<number | null>(null);

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

  // --- B3: Log filtering ---
  readonly logActionTypes = computed(() => {
    const actions = new Set(this.logs().map((l) => l.Action));
    return Array.from(actions).sort();
  });

  readonly filteredLogs = computed(() => {
    let result = this.logs();
    const search = this.logSearch().toLowerCase().trim();
    const actionFilter = this.logActionFilter();

    if (actionFilter) {
      result = result.filter((l) => l.Action === actionFilter);
    }
    if (search) {
      result = result.filter(
        (l) =>
          l.Action.toLowerCase().includes(search) ||
          l.Direction.toLowerCase().includes(search) ||
          l.Timestamp.toLowerCase().includes(search) ||
          JSON.stringify(l.Payload).toLowerCase().includes(search),
      );
    }
    return result;
  });

  // --- B1: StatusNotification diagnostics ---
  readonly connectorDiagnostics = computed<Map<number, ConnectorDiagnostic>>(() => {
    const map = new Map<number, ConnectorDiagnostic>();
    const statusLogs = this.logs()
      .filter((l) => l.Action === 'StatusNotification')
      .reverse();

    for (const log of statusLogs) {
      const p = parseOcppPayload<StatusNotificationPayload>(log.Payload, [
        'connectorId',
        'status',
        'errorCode',
      ]);
      if (!p || p.connectorId == null) continue;
      map.set(p.connectorId, {
        connectorId: p.connectorId,
        status: p.status ?? 'Unknown',
        errorCode: p.errorCode ?? 'NoError',
        info: p.info ?? '',
        vendorErrorCode: p.vendorErrorCode ?? '',
        timestamp: p.timestamp ?? log.Timestamp,
      });
    }
    return map;
  });

  readonly lastStationStatus = computed(() => {
    const diag = this.connectorDiagnostics();
    const stationLevel = diag.get(0);
    if (stationLevel && stationLevel.errorCode !== 'NoError') return stationLevel;
    for (const [, d] of diag) {
      if (d.errorCode !== 'NoError') return d;
    }
    return stationLevel ?? null;
  });

  // --- B2: Heartbeat connectivity ---
  readonly heartbeatInfo = computed<HeartbeatInfo | null>(() => {
    const heartbeats = this.logs().filter((l) => l.Action === 'Heartbeat');
    if (heartbeats.length === 0) return null;

    const latest = heartbeats[0];
    const lastSeen = new Date(latest.Timestamp);
    const ageMs = Date.now() - lastSeen.getTime();

    const label = this.formatAge(ageMs);
    let level: 'green' | 'yellow' | 'red';
    if (ageMs < 5 * 60 * 1000) level = 'green';
    else if (ageMs < 30 * 60 * 1000) level = 'yellow';
    else level = 'red';

    return { lastSeen, ageMs, label, level };
  });

  // --- C1/C2/C3: Access & Permissions ---
  readonly hasLimitedConnectors = computed(() => {
    const s = this.station();
    return s?.Connectors?.some((c) => c.AccessType === StationAccessType.Limited) ?? false;
  });

  readonly stationPermissions = computed<Permission[]>(() => {
    const id = this.stationId();
    if (!id) return [];
    return this.store.permissions().filter((p) => p.TargetResourceId === id);
  });

  readonly ownerAccessWarning = computed(() => {
    if (!this.hasLimitedConnectors()) return false;
    const ownerId = this.station()?.UserId;
    if (!ownerId) return false;
    const perms = this.stationPermissions();
    return !perms.some((p) => p.AssigneeId === ownerId);
  });

  // --- B4: Stop reasons ---
  readonly stopReasons = computed<Map<string, string>>(() => {
    const map = new Map<string, string>();
    const stopLogs = this.logs().filter((l) => l.Action === 'StopTransaction');
    for (const log of stopLogs) {
      const p = parseOcppPayload<StopTransactionPayload>(log.Payload, [
        'reason',
        'transactionId',
      ]);
      if (!p) continue;
      const key = p.transactionId != null ? String(p.transactionId) : log.Timestamp;
      if (p.reason) {
        map.set(key, p.reason);
      }
    }
    return map;
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
    this.expandedLogIndex.set(null);

    const from = Math.floor(new Date(this.logFrom()).getTime() / 1000);
    const to = Math.floor(new Date(this.logTo() + 'T23:59:59').getTime() / 1000);

    this.store.getStationLogs(id, from, to).subscribe({
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

  formatAge(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  formatPayload(payload: unknown): string {
    if (payload == null) return 'null';
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  }

  exportLogsCsv(): void {
    const rows = this.filteredLogs();
    const header = 'Timestamp,Direction,Action,Payload\n';
    const csv =
      header +
      rows
        .map(
          (l) =>
            `"${l.Timestamp}","${l.Direction}","${l.Action}","${JSON.stringify(l.Payload).replace(/"/g, '""')}"`,
        )
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocpp-logs-${this.stationId()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private defaultFromDate(): string {
    const d = new Date(Date.now() - 7 * 86400000);
    return d.toISOString().slice(0, 10);
  }

  private defaultToDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  softReset(): void {
    this.store.resetStation(this.stationId(), true).subscribe({
      next: () => this.toast.success('Soft reset sent'),
      error: () => this.toast.error('Soft reset failed'),
    });
  }

  hardReset(): void {
    this.showHardReset.set(false);
    this.store.resetStation(this.stationId(), false).subscribe({
      next: () => this.toast.success('Hard reset sent'),
      error: () => this.toast.error('Hard reset failed'),
    });
  }

  unlockConnector(position: number): void {
    this.store.unlockConnector(this.stationId(), position).subscribe({
      next: () => this.toast.success(`Connector ${position} unlocked`),
      error: () => this.toast.error(`Failed to unlock connector ${position}`),
    });
  }

  stopCharging(id: string): void {
    this.store.stopCharging(id).subscribe({
      next: () => this.toast.success('Charging session stopped'),
      error: () => this.toast.error('Failed to stop charging'),
    });
  }

  // --- D6: Edit Station ---
  openEditStation(): void {
    const s = this.station();
    if (!s) return;
    this.editStationName.set(s.Name ?? '');
    this.editStationAddress.set(s.Address ?? '');
    this.editStationType.set(s.Type);
    this.editStationSubType.set(s.SubType);
    this.showEditStation.set(true);
  }

  saveStationEdit(): void {
    this.showEditStation.set(false);
    this.store.updateStation(this.stationId(), {
      Name: this.editStationName(),
      Address: this.editStationAddress(),
      Type: this.editStationType(),
      SubType: this.editStationSubType(),
    }).subscribe({
      next: () => this.toast.success('Station updated'),
      error: () => this.toast.error('Failed to update station'),
    });
  }

  // --- D7: Delete Station ---
  confirmDeleteStation(): void {
    this.showDeleteStation.set(false);
    this.store.deleteStation(this.stationId()).subscribe({
      next: () => { this.toast.success('Station deleted'); this.router.navigate(['/dashboard']); },
      error: () => this.toast.error('Failed to delete station'),
    });
  }

  // --- D8: Get/Set Config ---
  openGetConfig(): void {
    this.configKey.set('');
    this.configResult.set(null);
    this.configLoading.set(false);
    this.showGetConfig.set(true);
  }

  openSetConfig(): void {
    this.configKey.set('');
    this.configValue.set('');
    this.configLoading.set(false);
    this.showSetConfig.set(true);
  }

  executeGetConfig(): void {
    const key = this.configKey().trim();
    if (!key) return;
    this.configLoading.set(true);
    this.configResult.set(null);
    this.store.getOcppConfig(this.stationId(), key).subscribe({
      next: (res) => {
        this.configResult.set(res.Value || 'Key not found or empty');
        this.configLoading.set(false);
      },
      error: () => {
        this.configResult.set('Error: failed to get configuration');
        this.configLoading.set(false);
        this.toast.error('Failed to get configuration');
      },
    });
  }

  executeSetConfig(): void {
    const key = this.configKey().trim();
    if (!key) return;
    this.configLoading.set(true);
    this.store.setOcppConfig(this.stationId(), key, this.configValue()).subscribe({
      next: () => {
        this.configLoading.set(false);
        this.showSetConfig.set(false);
        this.toast.success('Configuration updated');
      },
      error: () => {
        this.configLoading.set(false);
        this.toast.error('Failed to set configuration');
      },
    });
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
