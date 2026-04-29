import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SupportDataStore } from '../store/support-data.store';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../shared/toast.service';
import { AdminPriceRuleDto } from '../store/models';

@Component({
  selector: 'app-price-rules',
  imports: [IconComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-4 p-5 pb-10" style="max-width: 100%">
      <div class="flex items-center justify-between">
        <h1 style="color: #000000; font-size: 22px; font-weight: 500; line-height: 30px; margin: 0">Price Rules</h1>
        <span class="text-xs" style="color: #3B566B">{{ filtered().length }} of {{ priceRules().length }} rules</span>
      </div>

      <!-- Search -->
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: #3B566B">
          <app-icon name="search" [size]="14" />
        </span>
        <input type="text" [value]="searchTerm()" (input)="searchTerm.set(asInput($event).value)"
          placeholder="Filter by ID, assignee, target, product type..."
          class="w-full text-sm outline-none"
          style="height: 36px; padding-left: 36px; border: 1.5px solid #E2E8F0; border-radius: 6px; background: #fff; color: #000; font-family: inherit" />
      </div>

      @if (loading()) {
        <div class="text-center py-16" style="color: #3B566B">
          <p class="text-sm">Loading price rules...</p>
        </div>
      } @else {
        <!-- Table -->
        <div class="bg-white overflow-auto" style="border: 1px solid #E2E8F0; border-radius: 6px">
          <table style="width: 100%; border-collapse: collapse">
            <thead>
              <tr style="border-bottom: 1px solid #E2E8F0">
                <th class="text-left text-xs font-semibold px-3 py-2.5" style="color: #3B566B">ID</th>
                <th class="text-left text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Product</th>
                <th class="text-left text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Assignee</th>
                <th class="text-left text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Target</th>
                <th class="text-right text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Price</th>
                <th class="text-left text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Created</th>
                <th class="text-right text-xs font-semibold px-3 py-2.5" style="color: #3B566B">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (r of paged(); track r.Id) {
                <tr class="hover:bg-blue-50/50 transition-colors" style="border-bottom: 1px solid #E2E8F0">
                  <td class="px-3 py-2 text-xs font-mono" style="color: #3B566B" [title]="r.Id">{{ r.Id.slice(0, 8) }}...</td>
                  <td class="px-3 py-2">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded"
                      [style.color]="r.ProductType === 'energy' ? '#03A9F4' : '#C55B00'"
                      [style.background]="r.ProductType === 'energy' ? '#E1F5FE' : '#FFF8F0'">
                      {{ r.ProductType }}
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="text-xs" style="color: #3B566B">{{ r.PriceAssigneeType }}</div>
                    <div class="text-xs font-mono cursor-pointer" style="color: #03A9F4" (click)="navigateToEntity(r.PriceAssigneeType, r.PriceAssigneeId)">{{ truncateId(r.PriceAssigneeId) }}</div>
                  </td>
                  <td class="px-3 py-2">
                    <div class="text-xs" style="color: #3B566B">{{ r.TargetType }}</div>
                    <div class="text-xs font-mono cursor-pointer" style="color: #03A9F4" (click)="navigateToEntity(r.TargetType, r.TargetId)">{{ truncateId(r.TargetId) }}</div>
                  </td>
                  <td class="px-3 py-2 text-right text-sm font-mono" style="color: #000000">{{ r.Price }} {{ r.Currency }}</td>
                  <td class="px-3 py-2">
                    <div class="text-xs" style="color: #3B566B">{{ formatTimestamp(r.CreatedAt) }}</div>
                    <div class="text-xs font-mono" style="color: #3B566B">{{ truncateId(r.CreatedBy) }}</div>
                  </td>
                  <td class="px-3 py-2 text-right">
                    <button class="text-xs font-medium px-2 py-1 rounded cursor-pointer" style="color: #DC2626; border: 1px solid #FECACA"
                      (click)="deletingRuleId.set(r.Id); showDeleteRule.set(true)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-3 py-8 text-center text-sm" style="color: #3B566B">No price rules found</td>
                </tr>
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
                <button class="text-xs px-2 py-0.5 rounded cursor-pointer"
                  [style.background]="pageSize() === size ? '#03A9F4' : 'transparent'"
                  [style.color]="pageSize() === size ? '#fff' : '#3B566B'"
                  [style.border]="pageSize() === size ? 'none' : '1px solid #E2E8F0'"
                  (click)="pageSize.set(size); currentPage.set(0)">{{ size }}</button>
              }
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs" style="color: #3B566B">Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
              <button class="text-xs px-2 py-1 rounded cursor-pointer" style="border: 1px solid #E2E8F0; color: #3B566B"
                [disabled]="currentPage() === 0" [style.opacity]="currentPage() === 0 ? '0.4' : '1'"
                (click)="currentPage.set(currentPage() - 1)">Prev</button>
              <button class="text-xs px-2 py-1 rounded cursor-pointer" style="border: 1px solid #E2E8F0; color: #3B566B"
                [disabled]="currentPage() >= totalPages() - 1" [style.opacity]="currentPage() >= totalPages() - 1 ? '0.4' : '1'"
                (click)="currentPage.set(currentPage() + 1)">Next</button>
            </div>
          </div>
        }
      }

      @if (showDeleteRule()) {
        <app-confirm-dialog
          title="Delete Price Rule"
          message="Are you sure you want to delete this price rule? This action cannot be undone."
          confirmLabel="Delete"
          (confirmed)="confirmDeleteRule()"
          (cancelled)="showDeleteRule.set(false)"
        />
      }
    </div>
  `,
})
export class PriceRulesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly store = inject(SupportDataStore);

  readonly priceRules = signal<AdminPriceRuleDto[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly pageSize = signal(50);
  readonly currentPage = signal(0);
  readonly showDeleteRule = signal(false);
  readonly deletingRuleId = signal('');

  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.priceRules();
    return this.priceRules().filter(
      (r) =>
        r.Id.toLowerCase().includes(term) ||
        r.ProductType.toLowerCase().includes(term) ||
        r.PriceAssigneeType.toLowerCase().includes(term) ||
        r.PriceAssigneeId.toLowerCase().includes(term) ||
        r.TargetType.toLowerCase().includes(term) ||
        r.TargetId.toLowerCase().includes(term) ||
        r.Currency.toLowerCase().includes(term) ||
        r.CreatedBy.toLowerCase().includes(term),
    );
  });

  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize()) || 1);

  readonly paged = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.loading.set(true);
    this.store.getPriceRules().subscribe({
      next: (rules) => { this.priceRules.set(rules); this.loading.set(false); },
      error: () => { this.priceRules.set([]); this.loading.set(false); this.toast.error('Failed to load price rules'); },
    });
  }

  formatTimestamp(ts: number): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString();
  }

  truncateId(id: string): string {
    if (!id) return '—';
    return id.length > 12 ? id.slice(0, 12) + '...' : id;
  }

  navigateToEntity(type: string, id: string): void {
    const t = type.toLowerCase();
    if (t === 'user' || t === 'owner') {
      this.router.navigate(['/driver', id]);
    } else if (t === 'station') {
      this.router.navigate(['/station', id]);
    }
  }

  confirmDeleteRule(): void {
    this.showDeleteRule.set(false);
    const id = this.deletingRuleId();
    if (!id) return;
    this.store.deletePriceRule(id).subscribe({
      next: () => { this.toast.success('Price rule deleted'); this.loadRules(); },
      error: () => this.toast.error('Failed to delete price rule'),
    });
  }

  asInput(event: Event): HTMLInputElement {
    return event.target as HTMLInputElement;
  }
}
