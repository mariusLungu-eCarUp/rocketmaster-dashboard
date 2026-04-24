import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-1" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px 18px">
      <span class="text-xs font-medium uppercase tracking-wider" style="color: #64748B; letter-spacing: 0.06em">{{ label() }}</span>
      <span class="text-2xl font-bold leading-none" [style.color]="color() || '#0F172A'">{{ value() }}</span>
      @if (subtitle()) {
        <span class="text-xs" style="color: #64748B">{{ subtitle() }}</span>
      }
    </div>
  `,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly subtitle = input<string>('');
  readonly color = input<string>('');
}
