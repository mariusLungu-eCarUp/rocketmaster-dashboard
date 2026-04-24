import { ChangeDetectionStrategy, Component, input, output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="fixed inset-0 flex items-center justify-center z-50 p-4"
      style="background: rgba(15,23,42,0.28)"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" style="border: 1px solid #E2E8F0">
        <h2 class="text-base font-semibold mb-2" style="color: #0F172A">{{ title() }}</h2>
        @if (message()) {
          <p class="text-sm mb-6" style="color: #64748B">{{ message() }}</p>
        }
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="px-4 py-2 text-sm font-medium rounded-md"
            style="color: #64748B; border: 1px solid #E2E8F0"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="confirmed.emit()"
            class="px-4 py-2 text-sm font-medium text-white rounded-md"
            style="background: #DC2626"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly confirmLabel = input<string>('Confirm');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
