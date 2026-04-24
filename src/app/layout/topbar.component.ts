import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, SearchResult } from '../search/search.service';
import { AuthService } from '../auth/auth.service';
import { SupportDataStore } from '../store/support-data.store';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`:host { display: block; flex-shrink: 0; }`],
  template: `
    <header style="height: 52px; background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 0 20px; display: flex; align-items: center; gap: 12px">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 shrink-0 text-xs select-none" style="color: #64748B">
        <span class="cursor-pointer" style="color: #1275E2" (click)="goHome()">Dashboard</span>
        @if (breadcrumbLabel()) {
          <span style="color: #E2E8F0">/</span>
          <span class="font-medium" style="color: #0F172A">{{ breadcrumbLabel() }}</span>
        }
      </div>

      <!-- Search -->
      <div class="flex-1 relative" style="max-width: 540px; margin: 0 auto">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" [style.color]="focused() ? '#1275E2' : '#5F78A3'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        </span>
        <input
          type="text"
          [value]="search.query()"
          (input)="onSearch($event)"
          (focus)="focused.set(true)"
          (blur)="onBlur()"
          (keydown)="onKeydown($event)"
          placeholder="Search by Station ID, Email, RFID..."
          spellcheck="false"
          class="w-full text-sm outline-none transition-colors"
          style="height: 34px; padding-left: 38px; padding-right: 80px; border-radius: 6px; font-family: inherit"
          [style.border]="'1.5px solid ' + (focused() ? '#1275E2' : '#E2E8F0')"
          [style.background]="focused() ? '#fff' : '#F8FAFC'"
          [style.color]="'#0F172A'"
        />

        <!-- Results dropdown -->
        @if (focused() && search.results().length > 0) {
          <div class="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg overflow-hidden z-50"
            style="border: 1px solid #E2E8F0; border-radius: 6px; max-height: 400px; overflow-y: auto">

            @if (userResults().length > 0) {
              <div class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style="color: #64748B; background: #F8FAFC">Users</div>
              @for (r of userResults(); track r.id) {
                <button
                  class="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors cursor-pointer"
                  (mousedown)="navigate(r)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5F78A3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate" style="color: #0F172A">{{ r.label }}</div>
                    <div class="text-xs truncate" style="color: #64748B">{{ r.sublabel }}</div>
                  </div>
                </button>
              }
            }

            @if (stationResults().length > 0) {
              <div class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style="color: #64748B; background: #F8FAFC">Stations</div>
              @for (r of stationResults(); track r.id) {
                <button
                  class="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors cursor-pointer"
                  (mousedown)="navigate(r)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5F78A3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate" style="color: #0F172A">{{ r.label }}</div>
                    <div class="text-xs truncate" style="color: #64748B">{{ r.sublabel }}</div>
                  </div>
                </button>
              }
            }
          </div>
        }
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-2 shrink-0">
        @if (store.loading()) {
          <span class="text-xs" style="color: #64748B">Loading...</span>
        }
        <button
          (click)="reload()"
          [disabled]="store.loading()"
          class="flex items-center justify-center disabled:opacity-50 cursor-pointer"
          style="width: 32px; height: 32px; border-radius: 6px; color: #5F78A3"
          title="Refresh data"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          (click)="logout()"
          class="px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer"
          style="border: 1px solid #E2E8F0; color: #64748B"
        >
          Logout
        </button>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  readonly search = inject(SearchService);
  readonly store = inject(SupportDataStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly focused = signal(false);

  breadcrumbLabel(): string {
    const url = this.router.url;
    if (url.startsWith('/driver/')) return 'Driver Profile';
    if (url.startsWith('/station/')) return 'Station Profile';
    return '';
  }

  userResults(): SearchResult[] {
    return this.search.results().filter((r) => r.type === 'user');
  }

  stationResults(): SearchResult[] {
    return this.search.results().filter((r) => r.type === 'station');
  }

  onSearch(event: Event): void {
    this.search.query.set((event.target as HTMLInputElement).value);
  }

  onBlur(): void {
    setTimeout(() => this.focused.set(false), 200);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.search.query.set('');
      (event.target as HTMLInputElement).blur();
    }
    if (event.key === 'Enter' && this.search.results().length > 0) {
      this.navigate(this.search.results()[0]);
      (event.target as HTMLInputElement).blur();
    }
  }

  navigate(result: SearchResult): void {
    this.search.query.set('');
    this.router.navigate([result.route]);
  }

  reload(): void {
    this.store.loadAll().subscribe();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
