import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; flex-shrink: 0; }
    nav { width: 56px; height: 100%; display: flex; flex-direction: column; align-items: center; background: #FFFFFF; border-right: 1px solid #E2E8F0; }
    .logo { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #E2E8F0; flex-shrink: 0; }
    .logo-mark { width: 28px; height: 28px; border-radius: 7px; background: #1275E2; display: flex; align-items: center; justify-content: center; }
    .nav-area { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 8px 0; width: 100%; align-items: center; }
    .nav-item { position: relative; }
    .nav-btn { width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s, color 0.15s; text-decoration: none; }
    .tooltip { position: absolute; left: 48px; top: 50%; transform: translateY(-50%); background: #0F172A; color: #fff; font-size: 12px; font-weight: 500; padding: 4px 8px; border-radius: 4px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 100; }
    .nav-item:hover .tooltip { opacity: 1; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #E0E7FF; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #1275E2; cursor: pointer; flex-shrink: 0; margin-bottom: 12px; }
  `],
  template: `
    <nav>
      <div class="logo">
        <div class="logo-mark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
      </div>

      <div class="nav-area">
        @for (item of navItems; track item.id) {
          <div class="nav-item">
            <a [routerLink]="item.route" class="nav-btn"
              [style.background]="isActive(item.route) ? '#EFF6FF' : 'transparent'"
              [style.color]="isActive(item.route) ? '#1275E2' : '#5F78A3'">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="item.icon" />
              </svg>
            </a>
            <span class="tooltip">{{ item.label }}</span>
          </div>
        }
      </div>

      <div class="avatar">RM</div>
    </nav>
  `,
})
export class SidebarComponent {
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { id: 'home', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', route: '/dashboard' },
    { id: 'stations', label: 'Stations', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', route: '/dashboard' },
    { id: 'drivers', label: 'Drivers', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z', route: '/dashboard' },
  ];

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
