import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';
import { ToastContainerComponent } from '../shared/toast-container.component';
import { SupportDataStore } from '../store/support-data.store';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastContainerComponent],
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
    <app-toast-container />
  `,
})
export class ShellComponent implements OnInit {
  private readonly store = inject(SupportDataStore);

  ngOnInit(): void {
    if (this.store.users().length === 0 && !this.store.loading()) {
      this.store.loadAll().subscribe();
    }
  }
}
