import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SupportDataStore } from '../store/support-data.store';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-drivers-list',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-4 p-5 pb-10" style="max-width: 100%">
      <div class="flex items-center justify-between">
        <h1 style="color: #000000; font-size: 22px; font-weight: 500; line-height: 30px; margin: 0">Drivers</h1>
        <span class="text-xs" style="color: #3B566B">{{ filtered().length }} of {{ store.users().length }} users</span>
      </div>

      <!-- Search -->
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: #3B566B">
          <app-icon name="search" [size]="14" />
        </span>
        <input type="text" [value]="searchTerm()" (input)="searchTerm.set(asInput($event).value)"
          placeholder="Filter by email, user ID, verification status..."
          class="w-full text-sm outline-none"
          style="height: 36px; padding-left: 36px; border: 1.5px solid #E2E8F0; border-radius: 6px; background: #fff; color: #000; font-family: inherit" />
      </div>

      <!-- Table -->
      <div class="bg-white overflow-auto" style="border: 1px solid #E2E8F0; border-radius: 6px">
        <table style="width: 100%; border-collapse: collapse">
          <thead>
            <tr style="border-bottom: 1px solid #E2E8F0">
              <th class="text-left text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Identification</th>
              <th class="text-left text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Verification</th>
              <th class="text-left text-xs font-semibold px-3 py-2.5" style="color: #3B566B">License</th>
              <th class="text-right text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Features</th>
              <th class="text-right text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Stations</th>
            </tr>
          </thead>
          <tbody>
            @for (u of paged(); track u.Id) {
              <tr class="cursor-pointer hover:bg-gray-50 transition-colors"
                style="border-bottom: 1px solid #E2E8F0"
                (click)="goToDriver(u.Id)">
                <td class="px-3 py-2.5">
                  <div class="text-sm font-medium" style="color: #000">{{ u.Identification || u.AnonymizedEmail || '(unknown)' }}</div>
                  <div class="text-xs font-mono" style="color: #3B566B">{{ u.Id }}</div>
                </td>
                <td class="px-3 py-2.5">
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                    [style.color]="u.VerificationStatus === 'Verified' ? '#059669' : '#3B566B'"
                    [style.background]="u.VerificationStatus === 'Verified' ? '#ECFDF5' : '#F1F5F9'"
                    [style.border]="'1px solid ' + (u.VerificationStatus === 'Verified' ? '#6EE7B7' : '#E2E8F0')">
                    {{ u.VerificationStatus || 'Unknown' }}
                  </span>
                </td>
                <td class="px-3 py-2.5">
                  @if (u.LicenseCoverage) {
                    <span class="text-xs font-medium"
                      [style.color]="u.LicenseCoverage.Status?.toLowerCase() === 'exceeded' ? '#DC2626' : u.LicenseCoverage.Status?.toLowerCase() === 'compliant' ? '#059669' : '#3B566B'">
                      {{ u.LicenseCoverage.Tier || 'free' }} ({{ u.LicenseCoverage.LicenseCount }}/{{ u.LicenseCoverage.ConnectorCount }})
                    </span>
                  } @else {
                    <span class="text-xs" style="color: #3B566B">—</span>
                  }
                </td>
                <td class="px-3 py-2.5 text-xs text-right" style="color: #3B566B">{{ u.Features?.length || 0 }}</td>
                <td class="px-3 py-2.5 text-xs text-right" style="color: #3B566B">{{ stationCount(u.Id) }}</td>
              </tr>
            }
            @if (paged().length === 0) {
              <tr><td colspan="5" class="text-center py-8 text-sm" style="color: #3B566B">No users found</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs" style="color: #3B566B">Rows per page:</span>
            @for (size of [25, 50, 100]; track size) {
              <button class="text-xs px-2 py-1 rounded cursor-pointer"
                [style.background]="pageSize() === size ? '#E1F5FE' : 'transparent'"
                [style.color]="pageSize() === size ? '#03A9F4' : '#3B566B'"
                [style.border]="pageSize() === size ? '1px solid #B3E5FC' : '1px solid transparent'"
                (click)="pageSize.set(size); currentPage.set(0)">{{ size }}</button>
            }
          </div>
          <div class="flex items-center gap-2">
            <button class="text-xs px-2 py-1 rounded cursor-pointer"
              style="border: 1px solid #E2E8F0; color: #3B566B"
              [style.opacity]="currentPage() === 0 ? '0.4' : '1'"
              [disabled]="currentPage() === 0"
              (click)="currentPage.set(currentPage() - 1)">&larr; Prev</button>
            <span class="text-xs" style="color: #3B566B">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
            <button class="text-xs px-2 py-1 rounded cursor-pointer"
              style="border: 1px solid #E2E8F0; color: #3B566B"
              [style.opacity]="currentPage() >= totalPages() - 1 ? '0.4' : '1'"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="currentPage.set(currentPage() + 1)">Next &rarr;</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class DriversListComponent {
  readonly store = inject(SupportDataStore);
  private readonly router = inject(Router);

  readonly searchTerm = signal('');
  readonly pageSize = signal(50);
  readonly currentPage = signal(0);

  readonly filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const all = this.store.users();
    if (!q) return all;
    return all.filter(
      (u) =>
        u.Identification?.toLowerCase().includes(q) ||
        u.AnonymizedEmail?.toLowerCase().includes(q) ||
        String(u.Id).toLowerCase().includes(q) ||
        u.VerificationStatus?.toLowerCase().includes(q),
    );
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));

  readonly paged = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  stationCount(userId: string): number {
    return this.store.stationsByUserId().get(userId)?.length ?? 0;
  }

  goToDriver(id: string): void {
    this.router.navigate(['/driver', id]);
  }

  asInput(event: Event): HTMLInputElement {
    return event.target as HTMLInputElement;
  }
}
