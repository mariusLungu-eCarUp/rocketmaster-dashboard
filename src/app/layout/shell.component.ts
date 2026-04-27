import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: flex; height: 100vh; overflow: hidden; background: #F4F4F4; }
    .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
    .main-area main { flex: 1; overflow: auto; }
  `],
  template: `
    <app-sidebar />
    <div class="main-area">
      <app-topbar />
      <main>
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {}
