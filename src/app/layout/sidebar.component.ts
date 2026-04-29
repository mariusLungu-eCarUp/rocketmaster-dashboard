import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../shared/icon.component';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; flex-shrink: 0; }
    nav { width: 56px; height: 100%; display: flex; flex-direction: column; align-items: center; background: #0D2035; border-right: 1px solid #29384A; }
    .logo { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #29384A; flex-shrink: 0; }
    .logo-mark { width: 28px; height: 28px; border-radius: 7px; background: #03A9F4; display: flex; align-items: center; justify-content: center; }
    .nav-area { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 8px 0; width: 100%; align-items: center; }
    .nav-item { position: relative; }
    .nav-btn { width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s, color 0.15s; text-decoration: none; }
    .tooltip { position: absolute; left: 48px; top: 50%; transform: translateY(-50%); background: #29384A; color: #fff; font-size: 12px; font-weight: 500; padding: 4px 8px; border-radius: 4px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 100; }
    .nav-item:hover .tooltip { opacity: 1; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #29384A; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #03A9F4; cursor: pointer; flex-shrink: 0; margin-bottom: 12px; }
  `],
  template: `
    <nav>
      <div class="logo">
        <div class="logo-mark">
          <app-icon name="zap" [size]="14" color="#fff" [strokeWidth]="2.2" />
        </div>
      </div>

      <div class="nav-area">
        @for (item of navItems; track item.id) {
          <div class="nav-item">
            <a [routerLink]="item.route" class="nav-btn"
              [style.background]="isActive(item.route) ? 'rgba(3,169,244,0.15)' : 'transparent'"
              [style.color]="isActive(item.route) ? '#03A9F4' : '#3B566B'">
              <app-icon [name]="item.icon" [size]="17" />
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
    { id: 'home', label: 'Dashboard', icon: 'home', route: '/dashboard' },
    { id: 'stations', label: 'Stations', icon: 'zap', route: '/stations' },
    { id: 'drivers', label: 'Drivers', icon: 'users', route: '/drivers' },
  ];

  isActive(route: string): boolean {
    const url = this.router.url;
    if (route === '/stations') return url === '/stations' || url.startsWith('/station/');
    if (route === '/drivers') return url === '/drivers' || url.startsWith('/driver/');
    return url === route;
  }
}
