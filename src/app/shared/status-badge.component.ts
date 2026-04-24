import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { StationState } from '../store/models';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <span
      class="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5"
      [style.color]="color()"
      [style.background]="bg()"
      [style.border]="'1px solid ' + border()"
    >
      @if (showDot()) {
        <span class="w-1.5 h-1.5 rounded-full" [style.background]="color()"></span>
      }
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly state = input.required<StationState>();

  showDot(): boolean {
    const s = this.state();
    return s === StationState.Free || s === StationState.Occupied;
  }

  label(): string {
    return STATE_LABELS[this.state()] ?? 'Unknown';
  }

  color(): string {
    return STATE_STYLES[this.state()]?.color ?? '#64748B';
  }

  bg(): string {
    return STATE_STYLES[this.state()]?.bg ?? '#F1F5F9';
  }

  border(): string {
    return STATE_STYLES[this.state()]?.border ?? '#E2E8F0';
  }
}

const STATE_LABELS: Record<StationState, string> = {
  [StationState.NotActive]: 'Offline',
  [StationState.Free]: 'Available',
  [StationState.Occupied]: 'Charging',
  [StationState.Maintenance]: 'Faulted',
  [StationState.Reserved]: 'Reserved',
  [StationState.Unknown]: 'Unknown',
  [StationState.Preparing]: 'Preparing',
};

const STATE_STYLES: Record<StationState, { color: string; bg: string; border: string }> = {
  [StationState.NotActive]: { color: '#DC2626', bg: '#FFF5F5', border: '#FECACA' },
  [StationState.Free]: { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
  [StationState.Occupied]: { color: '#1275E2', bg: '#EFF6FF', border: '#BFDBFE' },
  [StationState.Maintenance]: { color: '#DC2626', bg: '#FFF5F5', border: '#FECACA' },
  [StationState.Reserved]: { color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD' },
  [StationState.Unknown]: { color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' },
  [StationState.Preparing]: { color: '#C55B00', bg: '#FFF8F0', border: '#FED7AA' },
};
