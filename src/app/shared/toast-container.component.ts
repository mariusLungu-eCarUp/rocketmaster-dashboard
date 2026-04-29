import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="flex items-center gap-2 px-4 py-3 rounded-md shadow-lg text-sm font-medium pointer-events-auto cursor-pointer"
          [style.background]="toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#DC2626' : '#03A9F4'"
          [style.color]="'#fff'"
          [style.min-width]="'280px'"
          [style.max-width]="'420px'"
          [style.animation]="'slideIn 0.2s ease-out'"
          (click)="toastService.dismiss(toast.id)">
          <span>{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}</span>
          <span class="flex-1">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
