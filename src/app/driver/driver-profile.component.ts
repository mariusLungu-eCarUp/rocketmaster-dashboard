import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportDataStore } from '../store/support-data.store';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { IconComponent } from '../shared/icon.component';
import { License } from '../store/models';

const FEATURE_GROUPS: { label: string; features: string[] }[] = [
  {
    label: 'Premium',
    features: [
      'advanced-user-management-feature',
      'access-hubject-feature',
      'access-reports-feature',
      'access-station-maintenance-feature',
      'access-price-plans-feature',
    ],
  },
  {
    label: 'Gold',
    features: ['access-permissions-feature', 'access-autoexport-feature'],
  },
  {
    label: 'Deprecated',
    features: ['access-load-management-feature'],
  },
  {
    label: 'Rocketmaster',
    features: ['access-rocketmaster-feature'],
  },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'app-driver-profile',
  imports: [ConfirmDialogComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-5 p-5 pb-10" style="max-width: 100%">
      @if (!user()) {
        <div class="text-center py-16" style="color: #3B566B">
          <p class="text-sm">User not found</p>
          <button class="text-sm font-medium mt-2 cursor-pointer" style="color: #03A9F4" (click)="goBack()">Back to Dashboard</button>
        </div>
      } @else {
        <!-- Header card -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-left: 3px solid #03A9F4; border-radius: 6px; padding: 16px 20px">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <span class="font-mono" style="color: #000000; font-size: 22px; font-weight: 500; line-height: 30px">{{ user()!.Identification || user()!.Id }}</span>
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  [style.color]="user()!.VerificationStatus === 'Verified' ? '#059669' : '#3B566B'"
                  [style.background]="user()!.VerificationStatus === 'Verified' ? '#ECFDF5' : '#F1F5F9'"
                  [style.border]="'1px solid ' + (user()!.VerificationStatus === 'Verified' ? '#6EE7B7' : '#E2E8F0')">
                  {{ user()!.VerificationStatus || 'Unknown' }}
                </span>
              </div>
              <div class="flex gap-4 flex-wrap mt-1">
                <span class="text-xs" style="color: #3B566B">ID: {{ user()!.Id }}</span>
                <span class="text-xs" style="color: #3B566B">Email: {{ user()!.AnonymizedEmail || '—' }}</span>
                @if (user()!.LicenseCoverage) {
                  <span class="text-xs font-medium"
                    [style.color]="user()!.LicenseCoverage?.Status?.toLowerCase() === 'exceeded' ? '#DC2626' : '#059669'">
                    License: {{ user()!.LicenseCoverage.Status }} ({{ user()!.LicenseCoverage.LicenseCount }}/{{ user()!.LicenseCoverage.ConnectorCount }})
                  </span>
                }
              </div>
              @if (user()!.Features?.length) {
                <div class="flex gap-1.5 flex-wrap mt-2">
                  @for (f of user()!.Features; track f.Type) {
                    <span class="text-xs px-2 py-0.5 rounded" style="background: #F1F5F9; color: #3B566B; border: 1px solid #E2E8F0">{{ f.Type }}</span>
                  }
                </div>
              }
            </div>
            <div class="flex gap-2 flex-wrap shrink-0">
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #3B566B; border: 1px solid #E2E8F0"
                (click)="openEditFeatures()">
                <app-icon name="shield" [size]="13" />
                Edit Features
              </button>
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #3B566B; border: 1px solid #E2E8F0"
                (click)="openChangeEmail()">
                <app-icon name="mail" [size]="13" />
                Change Email
              </button>
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #C55B00; border: 1px solid #FED7AA; background: #FFF8F0"
                (click)="showCancelPayment.set(true); cancelPaymentEmail.set('')">
                <app-icon name="dollar-sign" [size]="13" />
                Cancel Payment
              </button>
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #3B566B; border: 1px solid #E2E8F0"
                (click)="openResendOverview()">
                <app-icon name="send" [size]="13" />
                Resend Overview
              </button>
              <button class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer"
                style="color: #DC2626; border: 1px solid #FECACA; background: #FFF5F5"
                (click)="showDeleteConfirm.set(true)">
                <app-icon name="trash-2" [size]="13" />
                Delete User
              </button>
            </div>
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
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Station</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Started</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Duration</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of activeSessions(); track s.Id) {
                    <tr class="hover:bg-blue-50/50">
                      <td class="px-3 py-2 text-sm cursor-pointer" style="border-bottom: 1px solid #E2E8F0; color: #03A9F4" (click)="goToStation(s.StationId)">{{ s.StationName || s.StationId }}</td>
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

        <!-- Licenses -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B">Licenses</span>
            <button class="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded cursor-pointer"
              style="color: #03A9F4; border: 1px solid #B3E5FC"
              (click)="openAddLicense()">
              <app-icon name="plus" [size]="12" />
              Add License
            </button>
          </div>
          @if (licensesLoading()) {
            <p class="text-xs text-center py-4" style="color: #3B566B">Loading...</p>
          } @else if (licenses().length === 0) {
            <p class="text-xs text-center py-4" style="color: #3B566B">No licenses</p>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F4F4F4">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Tier</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Qty</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Start</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">End</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Status</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (l of licenses(); track l.Id) {
                    <tr>
                      <td class="px-3 py-2 text-sm font-medium" style="border-bottom: 1px solid #E2E8F0">{{ l.Tier }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ l.Quantity }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ formatDate(l.StartDate) }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ formatDate(l.EndDate) }}</td>
                      <td class="px-3 py-2" style="border-bottom: 1px solid #E2E8F0">
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                          [style.color]="isLicenseActive(l) ? (l.IsCanceled ? '#C55B00' : '#059669') : '#3B566B'"
                          [style.background]="isLicenseActive(l) ? (l.IsCanceled ? '#FFF8F0' : '#ECFDF5') : '#F1F5F9'">
                          {{ isLicenseActive(l) ? (l.IsCanceled ? 'Active (Canceled)' : 'Active') : 'Expired' }}
                        </span>
                      </td>
                      <td class="px-3 py-2 text-right" style="border-bottom: 1px solid #E2E8F0">
                        <div class="flex gap-1 justify-end">
                          <button class="text-xs font-medium px-2 py-1 rounded cursor-pointer" style="color: #03A9F4; border: 1px solid #B3E5FC"
                            (click)="openEditLicense(l)">Edit</button>
                          <button class="text-xs font-medium px-2 py-1 rounded cursor-pointer" style="color: #DC2626; border: 1px solid #FECACA"
                            (click)="deletingLicenseId.set(l.Id); showDeleteLicense.set(true)">Delete</button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- RFID Cards -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B">RFID Cards</span>
          @if (rfidCards().length === 0) {
            <p class="text-xs text-center py-4" style="color: #3B566B">No RFID cards</p>
          } @else {
            <div class="overflow-x-auto mt-3">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F4F4F4">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">ID</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Name</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Valid Until</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of rfidCards(); track r.Identification) {
                    <tr>
                      <td class="px-3 py-2 text-sm font-mono" style="border-bottom: 1px solid #E2E8F0">{{ r.Identification }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ r.Name || '—' }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ r.ValidUntil ? formatDate(r.ValidUntil) : '—' }}</td>
                      <td class="px-3 py-2 text-right" style="border-bottom: 1px solid #E2E8F0">
                        <button class="text-xs font-medium px-2 py-1 rounded cursor-pointer" style="color: #DC2626; border: 1px solid #FECACA"
                          (click)="deleteRfid(r.Identification)">Delete</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Car IDs -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B">Car IDs</span>
          @if (carIds().length === 0) {
            <p class="text-xs text-center py-4" style="color: #3B566B">No car IDs</p>
          } @else {
            <div class="overflow-x-auto mt-3">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F4F4F4">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">ID</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Name</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Valid Until</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of carIds(); track c.Identification) {
                    <tr>
                      <td class="px-3 py-2 text-sm font-mono" style="border-bottom: 1px solid #E2E8F0">{{ c.Identification }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ c.Name || '—' }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ c.ValidUntil ? formatDate(c.ValidUntil) : '—' }}</td>
                      <td class="px-3 py-2 text-right" style="border-bottom: 1px solid #E2E8F0">
                        <button class="text-xs font-medium px-2 py-1 rounded cursor-pointer" style="color: #DC2626; border: 1px solid #FECACA"
                          (click)="deleteCarId(c.Identification)">Delete</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Permissions -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B">Permissions</span>
          @if (permissions().length === 0) {
            <p class="text-xs text-center py-4" style="color: #3B566B">No permissions</p>
          } @else {
            <div class="overflow-x-auto mt-3">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F4F4F4">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Type</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Target Type</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Target ID</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of permissions(); track $index) {
                    <tr>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ p.Type }}</td>
                      <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0">{{ p.TargetResourceType }}</td>
                      <td class="px-3 py-2 text-sm font-mono" style="border-bottom: 1px solid #E2E8F0">{{ p.TargetResourceId }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Delete User Confirm -->
        @if (showDeleteConfirm()) {
          <app-confirm-dialog
            title="Delete User"
            message="This action cannot be undone. All user data will be permanently removed."
            confirmLabel="Delete"
            (confirmed)="deleteUser()"
            (cancelled)="showDeleteConfirm.set(false)"
          />
        }

        <!-- D5: Delete License Confirm -->
        @if (showDeleteLicense()) {
          <app-confirm-dialog
            title="Delete License"
            message="Are you sure you want to delete this license?"
            confirmLabel="Delete"
            (confirmed)="confirmDeleteLicense()"
            (cancelled)="showDeleteLicense.set(false)"
          />
        }

        <!-- D1: Edit Features -->
        @if (showEditFeatures()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showEditFeatures.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style="border: 1px solid #E2E8F0; max-height: 80vh; overflow-y: auto"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-4" style="color: #000000">Edit Features</h2>
              @for (group of featureGroups; track group.label) {
                <div class="mb-3">
                  <div class="text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: #3B566B">{{ group.label }}</div>
                  @for (feat of group.features; track feat) {
                    <label class="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox"
                        [checked]="selectedFeatures().has(feat)"
                        (change)="toggleFeature(feat)" />
                      <span class="text-sm" style="color: #000000">{{ feat }}</span>
                    </label>
                  }
                </div>
              }
              <div class="flex gap-3 justify-end mt-4">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showEditFeatures.set(false)">Cancel</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #03A9F4" (click)="saveFeatures()">Save</button>
              </div>
            </div>
          </div>
        }

        <!-- D2: Change Email -->
        @if (showChangeEmail()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showChangeEmail.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" style="border: 1px solid #E2E8F0"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-4" style="color: #000000">Change Email</h2>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: #3B566B">New Email</label>
                <input type="email" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                  placeholder="new@example.com"
                  [value]="newEmail()" (input)="newEmail.set($any($event.target).value)" />
              </div>
              <div class="flex gap-3 justify-end mt-5">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showChangeEmail.set(false)">Cancel</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #03A9F4"
                  [disabled]="!isValidEmail(newEmail())"
                  [style.opacity]="isValidEmail(newEmail()) ? '1' : '0.4'"
                  (click)="saveChangeEmail()">Save</button>
              </div>
            </div>
          </div>
        }

        <!-- D3: Cancel Payment -->
        @if (showCancelPayment()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showCancelPayment.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" style="border: 1px solid #E2E8F0"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-2" style="color: #C55B00">Cancel Payment</h2>
              <p class="text-sm mb-3" style="color: #3B566B">Type the user's email <strong>{{ user()!.Identification }}</strong> to confirm:</p>
              <input type="email" class="w-full text-sm px-3 py-2 rounded-md mb-4" style="border: 1px solid #E2E8F0; outline: none"
                [value]="cancelPaymentEmail()" (input)="cancelPaymentEmail.set($any($event.target).value)" />
              <div class="flex gap-3 justify-end">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showCancelPayment.set(false)">Cancel</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #C55B00"
                  [disabled]="cancelPaymentEmail().toLowerCase().trim() !== user()!.Identification.toLowerCase().trim()"
                  [style.opacity]="cancelPaymentEmail().toLowerCase().trim() === user()!.Identification.toLowerCase().trim() ? '1' : '0.4'"
                  (click)="confirmCancelPayment()">Cancel Payment</button>
              </div>
            </div>
          </div>
        }

        <!-- D4: Resend Monthly Overview -->
        @if (showResendOverview()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showResendOverview.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" style="border: 1px solid #E2E8F0"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-4" style="color: #000000">Resend Monthly Overview</h2>
              <div class="flex flex-col gap-3">
                <div class="flex gap-3">
                  <div class="flex-1">
                    <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Year</label>
                    <select class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                      [value]="overviewYear()" (change)="overviewYear.set(+$any($event.target).value)">
                      @for (y of availableYears; track y) {
                        <option [value]="y">{{ y }}</option>
                      }
                    </select>
                  </div>
                  <div class="flex-1">
                    <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Month</label>
                    <select class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                      [value]="overviewMonth()" (change)="overviewMonth.set(+$any($event.target).value)">
                      @for (m of availableMonths; track m) {
                        <option [value]="m">{{ m }} — {{ monthName(m) }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Send To (optional)</label>
                  <input type="email" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    placeholder="alternate@example.com"
                    [value]="overviewSendTo()" (input)="overviewSendTo.set($any($event.target).value)" />
                </div>
              </div>
              <div class="flex gap-3 justify-end mt-5">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showResendOverview.set(false)">Cancel</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #03A9F4" (click)="sendOverview()">Resend</button>
              </div>
            </div>
          </div>
        }

        <!-- D5: Add/Edit License -->
        @if (showLicenseForm()) {
          <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
            (click)="showLicenseForm.set(false)">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style="border: 1px solid #E2E8F0"
              (click)="$event.stopPropagation()">
              <h2 class="text-base font-semibold mb-4" style="color: #000000">{{ editingLicenseId() ? 'Edit License' : 'Add License' }}</h2>
              <div class="flex flex-col gap-3">
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Tier</label>
                  <select class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="licTier()" (change)="licTier.set($any($event.target).value)">
                    <option value="premium">Premium</option>
                    <option value="gold-partner">Gold Partner</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Quantity</label>
                  <input type="number" min="1" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="licQuantity()" (input)="licQuantity.set(+$any($event.target).value)" />
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Start Date</label>
                  <input type="date" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="licStartDate()" (change)="licStartDate.set($any($event.target).value)" />
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">End Date</label>
                  <input type="date" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="licEndDate()" (change)="licEndDate.set($any($event.target).value)" />
                  <div class="flex gap-2 mt-1.5">
                    <button class="text-xs px-2 py-0.5 rounded cursor-pointer" style="color: #03A9F4; border: 1px solid #B3E5FC"
                      (click)="setLicEndDate(1)">+1 Month</button>
                    <button class="text-xs px-2 py-0.5 rounded cursor-pointer" style="color: #03A9F4; border: 1px solid #B3E5FC"
                      (click)="setLicEndDate(120)">+10 Years</button>
                    <button class="text-xs px-2 py-0.5 rounded cursor-pointer" style="color: #03A9F4; border: 1px solid #B3E5FC"
                      (click)="setLicEndDate(1200)">Lifetime</button>
                  </div>
                </div>
                <div>
                  <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Comment (optional)</label>
                  <input type="text" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                    [value]="licComment()" (input)="licComment.set($any($event.target).value)" />
                </div>
              </div>
              <div class="flex gap-3 justify-end mt-5">
                <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                  style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showLicenseForm.set(false)">Cancel</button>
                <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                  style="background: #03A9F4"
                  [disabled]="licQuantity() < 1 || licEndDate() < licStartDate()"
                  [style.opacity]="licQuantity() >= 1 && licEndDate() >= licStartDate() ? '1' : '0.4'"
                  (click)="saveLicense()">Save</button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class DriverProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(SupportDataStore);

  readonly userId = signal('');
  readonly licenses = signal<License[]>([]);
  readonly licensesLoading = signal(false);
  readonly showDeleteConfirm = signal(false);

  // --- D1: Edit Features ---
  readonly showEditFeatures = signal(false);
  readonly selectedFeatures = signal<Set<string>>(new Set());
  readonly featureGroups = FEATURE_GROUPS;

  // --- D2: Change Email ---
  readonly showChangeEmail = signal(false);
  readonly newEmail = signal('');

  // --- D3: Cancel Payment ---
  readonly showCancelPayment = signal(false);
  readonly cancelPaymentEmail = signal('');

  // --- D4: Resend Monthly Overview ---
  readonly showResendOverview = signal(false);
  readonly overviewYear = signal(new Date().getFullYear());
  readonly overviewMonth = signal(new Date().getMonth() + 1);
  readonly overviewSendTo = signal('');
  readonly availableYears = Array.from({ length: new Date().getFullYear() - 2023 }, (_, i) => 2024 + i);
  readonly availableMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  // --- D5: License Management ---
  readonly showLicenseForm = signal(false);
  readonly editingLicenseId = signal<string | null>(null);
  readonly licTier = signal('premium');
  readonly licQuantity = signal(1);
  readonly licStartDate = signal(new Date().toISOString().slice(0, 10));
  readonly licEndDate = signal(this.addMonths(new Date(), 1).toISOString().slice(0, 10));
  readonly licComment = signal('');
  readonly showDeleteLicense = signal(false);
  readonly deletingLicenseId = signal('');

  readonly user = computed(() => this.store.userById().get(this.userId()));
  readonly activeSessions = computed(() => this.store.chargingsByDriverId().get(this.userId()) ?? []);
  readonly rfidCards = computed(() => this.store.rfidCardsByUserId().get(this.userId()) ?? []);
  readonly carIds = computed(() => this.store.carIdsByUserId().get(this.userId()) ?? []);
  readonly permissions = computed(() => this.store.permissionsByAssigneeId().get(this.userId()) ?? []);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId.set(params['userId']);
      this.loadLicenses();
    });
  }

  loadLicenses(): void {
    const id = this.userId();
    if (!id) return;
    this.licensesLoading.set(true);
    this.store.getLicenses(id).subscribe({
      next: (l) => { this.licenses.set(l); this.licensesLoading.set(false); },
      error: () => { this.licenses.set([]); this.licensesLoading.set(false); },
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
  }

  isLicenseActive(l: License): boolean {
    const now = new Date();
    return new Date(l.StartDate) <= now && new Date(l.EndDate) >= now;
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  monthName(m: number): string {
    return MONTH_NAMES[m - 1] ?? '';
  }

  stopCharging(id: string): void {
    this.store.stopCharging(id).subscribe();
  }

  deleteRfid(id: string): void {
    this.store.deleteRfidCard(id).subscribe();
  }

  deleteCarId(id: string): void {
    this.store.deleteCarId(id).subscribe();
  }

  deleteUser(): void {
    this.showDeleteConfirm.set(false);
    this.store.deleteUser(this.userId()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
    });
  }

  // --- D1: Edit Features ---
  openEditFeatures(): void {
    const current = new Set(this.user()?.Features?.map((f) => f.Type) ?? []);
    this.selectedFeatures.set(current);
    this.showEditFeatures.set(true);
  }

  toggleFeature(feat: string): void {
    const s = new Set(this.selectedFeatures());
    if (s.has(feat)) s.delete(feat);
    else s.add(feat);
    this.selectedFeatures.set(s);
  }

  saveFeatures(): void {
    this.showEditFeatures.set(false);
    const features = Array.from(this.selectedFeatures()).map((t) => ({ Type: t }));
    this.store.setFeatures(this.userId(), features).subscribe();
  }

  // --- D2: Change Email ---
  openChangeEmail(): void {
    this.newEmail.set('');
    this.showChangeEmail.set(true);
  }

  saveChangeEmail(): void {
    this.showChangeEmail.set(false);
    this.store.changeEmail(this.userId(), this.newEmail()).subscribe();
  }

  // --- D3: Cancel Payment ---
  confirmCancelPayment(): void {
    this.showCancelPayment.set(false);
    this.store.cancelPayment(this.userId()).subscribe();
  }

  // --- D4: Resend Monthly Overview ---
  openResendOverview(): void {
    this.overviewYear.set(new Date().getFullYear());
    this.overviewMonth.set(new Date().getMonth() + 1);
    this.overviewSendTo.set('');
    this.showResendOverview.set(true);
  }

  sendOverview(): void {
    this.showResendOverview.set(false);
    const sendTo = this.overviewSendTo().trim() || undefined;
    this.store.sendMonthlyOverview(this.userId(), this.overviewYear(), this.overviewMonth(), sendTo).subscribe();
  }

  // --- D5: License Management ---
  openAddLicense(): void {
    this.editingLicenseId.set(null);
    this.licTier.set('premium');
    this.licQuantity.set(1);
    this.licStartDate.set(new Date().toISOString().slice(0, 10));
    this.licEndDate.set(this.addMonths(new Date(), 1).toISOString().slice(0, 10));
    this.licComment.set('');
    this.showLicenseForm.set(true);
  }

  openEditLicense(l: License): void {
    this.editingLicenseId.set(l.Id);
    this.licTier.set(l.Tier);
    this.licQuantity.set(l.Quantity);
    this.licStartDate.set(new Date(l.StartDate).toISOString().slice(0, 10));
    this.licEndDate.set(new Date(l.EndDate).toISOString().slice(0, 10));
    this.licComment.set(l.Comment ?? '');
    this.showLicenseForm.set(true);
  }

  saveLicense(): void {
    this.showLicenseForm.set(false);
    const dto = {
      tier: this.licTier(),
      quantity: this.licQuantity(),
      startDate: new Date(this.licStartDate()).toISOString(),
      endDate: new Date(this.licEndDate()).toISOString(),
      comment: this.licComment() || undefined,
    };
    const id = this.editingLicenseId();
    const obs = id
      ? this.store.updateLicense(this.userId(), id, dto)
      : this.store.addLicense(this.userId(), dto as { tier: string; quantity: number; startDate: string; endDate: string });
    obs.subscribe({ next: () => this.loadLicenses() });
  }

  confirmDeleteLicense(): void {
    this.showDeleteLicense.set(false);
    const id = this.deletingLicenseId();
    if (!id) return;
    this.store.deleteLicense(this.userId(), id).subscribe({
      next: () => this.loadLicenses(),
    });
  }

  setLicEndDate(months: number): void {
    const start = new Date(this.licStartDate());
    const end = this.addMonths(start, months);
    this.licEndDate.set(end.toISOString().slice(0, 10));
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  goToStation(id: string): void {
    this.router.navigate(['/station', id]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
