import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportDataStore } from '../store/support-data.store';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { License } from '../store/models';

@Component({
  selector: 'app-driver-profile',
  imports: [ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-5 p-5 pb-10" style="max-width: 1200px">
      @if (!user()) {
        <div class="text-center py-16" style="color: #64748B">
          <p class="text-sm">User not found</p>
          <button class="text-sm font-medium mt-2 cursor-pointer" style="color: #1275E2" (click)="goBack()">Back to Dashboard</button>
        </div>
      } @else {
        <!-- Header card -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-left: 3px solid #1275E2; border-radius: 6px; padding: 16px 20px">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <span class="text-xl font-bold font-mono" style="color: #0F172A">{{ user()!.Identification || user()!.Id }}</span>
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  [style.color]="user()!.VerificationStatus === 'Verified' ? '#059669' : '#64748B'"
                  [style.background]="user()!.VerificationStatus === 'Verified' ? '#ECFDF5' : '#F1F5F9'"
                  [style.border]="'1px solid ' + (user()!.VerificationStatus === 'Verified' ? '#6EE7B7' : '#E2E8F0')">
                  {{ user()!.VerificationStatus || 'Unknown' }}
                </span>
              </div>
              <div class="flex gap-4 flex-wrap mt-1">
                <span class="text-xs" style="color: #64748B">ID: {{ user()!.Id }}</span>
                <span class="text-xs" style="color: #64748B">Email: {{ user()!.AnonymizedEmail || '—' }}</span>
                @if (user()!.LicenseCoverage) {
                  <span class="text-xs font-medium"
                    [style.color]="user()!.LicenseCoverage.Status?.toLowerCase() === 'exceeded' ? '#DC2626' : '#059669'">
                    License: {{ user()!.LicenseCoverage.Status }} ({{ user()!.LicenseCoverage.LicenseCount }}/{{ user()!.LicenseCoverage.ConnectorCount }})
                  </span>
                }
              </div>
              @if (user()!.Features?.length) {
                <div class="flex gap-1.5 flex-wrap mt-2">
                  @for (f of user()!.Features; track f.Type) {
                    <span class="text-xs px-2 py-0.5 rounded" style="background: #F1F5F9; color: #64748B; border: 1px solid #E2E8F0">{{ f.Type }}</span>
                  }
                </div>
              }
            </div>
            <div class="flex gap-2 flex-wrap shrink-0">
              <button class="text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer" style="color: #DC2626; border: 1px solid #FECACA; background: #FFF5F5"
                (click)="showDeleteConfirm.set(true)">
                Delete User
              </button>
            </div>
          </div>
        </div>

        <!-- Active Sessions -->
        <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider" style="color: #64748B">Active Sessions</span>
            <span class="text-xs" style="color: #64748B">{{ activeSessions().length }} session(s)</span>
          </div>
          @if (activeSessions().length === 0) {
            <p class="text-xs text-center py-4" style="color: #64748B">No active sessions</p>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F8FAFC">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Station</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Started</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Duration</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of activeSessions(); track s.Id) {
                    <tr class="hover:bg-blue-50/50">
                      <td class="px-3 py-2 text-sm cursor-pointer" style="border-bottom: 1px solid #E2E8F0; color: #1275E2" (click)="goToStation(s.StationId)">{{ s.StationName || s.StationId }}</td>
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
            <span class="text-xs font-semibold uppercase tracking-wider" style="color: #64748B">Licenses</span>
          </div>
          @if (licensesLoading()) {
            <p class="text-xs text-center py-4" style="color: #64748B">Loading...</p>
          } @else if (licenses().length === 0) {
            <p class="text-xs text-center py-4" style="color: #64748B">No licenses</p>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F8FAFC">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Tier</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Qty</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Start</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">End</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Status</th>
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
                          [style.color]="isLicenseActive(l) ? '#059669' : '#64748B'"
                          [style.background]="isLicenseActive(l) ? '#ECFDF5' : '#F1F5F9'">
                          {{ isLicenseActive(l) ? 'Active' : 'Expired' }}
                        </span>
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
          <span class="text-xs font-semibold uppercase tracking-wider" style="color: #64748B">RFID Cards</span>
          @if (rfidCards().length === 0) {
            <p class="text-xs text-center py-4" style="color: #64748B">No RFID cards</p>
          } @else {
            <div class="overflow-x-auto mt-3">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F8FAFC">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">ID</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Name</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Valid Until</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Action</th>
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
          <span class="text-xs font-semibold uppercase tracking-wider" style="color: #64748B">Car IDs</span>
          @if (carIds().length === 0) {
            <p class="text-xs text-center py-4" style="color: #64748B">No car IDs</p>
          } @else {
            <div class="overflow-x-auto mt-3">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F8FAFC">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">ID</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Name</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Valid Until</th>
                    <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Action</th>
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
          <span class="text-xs font-semibold uppercase tracking-wider" style="color: #64748B">Permissions</span>
          @if (permissions().length === 0) {
            <p class="text-xs text-center py-4" style="color: #64748B">No permissions</p>
          } @else {
            <div class="overflow-x-auto mt-3">
              <table class="w-full" style="border-collapse: collapse">
                <thead>
                  <tr style="background: #F8FAFC">
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Type</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Target Type</th>
                    <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #64748B; border-bottom: 1px solid #E2E8F0">Target ID</th>
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

        @if (showDeleteConfirm()) {
          <app-confirm-dialog
            title="Delete User"
            message="This action cannot be undone. All user data will be permanently removed."
            confirmLabel="Delete"
            (confirmed)="deleteUser()"
            (cancelled)="showDeleteConfirm.set(false)"
          />
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
    return new Date(l.StartDate) <= now && new Date(l.EndDate) >= now && !l.IsCanceled;
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

  goToStation(id: string): void {
    this.router.navigate(['/station', id]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
