import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-1" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px 18px">
      <span class="text-xs font-medium uppercase tracking-wider" style="color: #3B566B; letter-spacing: 0.06em">{{ label() }}</span>
      <span style="font-size: 22px; font-weight: 500; line-height: 30px" [style.color]="color() || '#000000'">{{ value() }}</span>
      @if (subtitle()) {
        <span class="text-xs" style="color: #3B566B">{{ subtitle() }}</span>
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
