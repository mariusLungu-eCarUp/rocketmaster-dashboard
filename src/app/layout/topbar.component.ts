import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, SearchResult } from '../search/search.service';
import { AuthService } from '../auth/auth.service';
import { SupportDataStore } from '../store/support-data.store';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  encapsulation: ViewEncapsulation.None,
  styles: [`:host { display: block; flex-shrink: 0; }`],
  template: `
    <header style="height: 52px; background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 0 20px; display: flex; align-items: center; gap: 12px">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 shrink-0 text-xs select-none" style="color: #3B566B">
        <span class="cursor-pointer" style="color: #03A9F4" (click)="goHome()">Dashboard</span>
        @if (breadcrumbLabel()) {
          <span style="color: #E2E8F0">/</span>
          <span class="font-medium" style="color: #000000">{{ breadcrumbLabel() }}</span>
        }
      </div>

      <!-- Search -->
      <div class="flex-1 relative" style="max-width: 540px; margin: 0 auto">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" [style.color]="focused() ? '#03A9F4' : '#3B566B'">
          <app-icon name="search" [size]="15" />
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
          [style.border]="'1.5px solid ' + (focused() ? '#03A9F4' : '#E2E8F0')"
          [style.background]="focused() ? '#fff' : '#F4F4F4'"
          [style.color]="'#000000'"
        />

        <!-- Results dropdown -->
        @if (focused() && search.results().length > 0) {
          <div class="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg overflow-hidden z-50"
            style="border: 1px solid #E2E8F0; border-radius: 6px; max-height: 400px; overflow-y: auto">

            @if (userResults().length > 0) {
              <div class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style="color: #3B566B; background: #F4F4F4">Users</div>
              @for (r of userResults(); track r.id) {
                <button
                  class="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors cursor-pointer hover:bg-gray-100"
                  (mousedown)="navigate(r)"
                >
                  <app-icon name="user" [size]="14" color="#3B566B" />
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate" style="color: #000000">{{ r.label }}</div>
                    <div class="text-xs truncate" style="color: #3B566B">{{ r.sublabel }}</div>
                  </div>
                </button>
              }
            }

            @if (stationResults().length > 0) {
              <div class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style="color: #3B566B; background: #F4F4F4">Stations</div>
              @for (r of stationResults(); track r.id) {
                <button
                  class="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors cursor-pointer hover:bg-gray-100"
                  (mousedown)="navigate(r)"
                >
                  <app-icon name="zap" [size]="14" color="#3B566B" />
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate" style="color: #000000">{{ r.label }}</div>
                    <div class="text-xs truncate" style="color: #3B566B">{{ r.sublabel }}</div>
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
          <span class="text-xs" style="color: #3B566B">Loading...</span>
        }
        <button
          (click)="reload()"
          [disabled]="store.loading()"
          class="flex items-center justify-center disabled:opacity-50 cursor-pointer"
          style="width: 32px; height: 32px; border-radius: 6px; color: #3B566B"
          title="Refresh data"
        >
          <app-icon name="refresh-cw" [size]="15" />
        </button>
        <button
          (click)="logout()"
          class="px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer"
          style="border: 1px solid #E2E8F0; color: #3B566B"
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
