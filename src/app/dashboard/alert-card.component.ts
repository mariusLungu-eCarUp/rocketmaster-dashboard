import { ChangeDetectionStrategy, Component, input, output, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export interface AlertItem {
  id: string;
  label: string;
  route: string;
}

export interface DashboardAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count: number;
  unit: string;
  items: AlertItem[];
}

@Component({
  selector: 'app-alert-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="flex flex-col gap-2 cursor-pointer transition-shadow"
      [style.background]="bgColor()"
      [style.border]="'1px solid ' + borderColor()"
      [style.border-left]="'3px solid ' + accentColor()"
      [style.border-radius]="'6px'"
      [style.padding]="'14px 16px'"
      (click)="onInvestigate()"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full shrink-0" [style.background]="accentColor()"
              [style.box-shadow]="alert().severity === 'critical' ? '0 0 0 3px ' + accentColor() + '22' : 'none'"></span>
            <span class="text-sm font-semibold" style="color: #000000; line-height: 1.3">{{ alert().title }}</span>
          </div>
          <div class="text-xs mt-1" style="color: #3B566B; line-height: 1.5; margin-left: 18px">{{ alert().description }}</div>
        </div>
        @if (alert().severity !== 'info' && alert().items.length > 0) {
          <button
            class="text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            [style.color]="accentColor()"
            [style.background]="'transparent'"
            [style.border]="'1px solid ' + accentColor()"
            [style.border-radius]="'4px'"
            [style.padding]="'4px 10px'"
            (click)="onInvestigate(); $event.stopPropagation()"
          >
            Investigate &rarr;
          </button>
        }
      </div>

      <div class="flex items-center gap-2" style="margin-left: 18px">
        <span class="text-xs font-semibold rounded-full px-2 py-0.5"
          [style.color]="accentColor()"
          [style.background]="pillBg()">
          {{ alert().count }} {{ alert().unit }}
        </span>
      </div>

      @if (alert().items.length > 0) {
        <div class="flex gap-1 flex-wrap" style="margin-left: 18px">
          @for (item of alert().items.slice(0, 4); track item.id) {
            <span
              class="text-xs font-medium px-2 py-0.5 rounded cursor-pointer"
              style="color: #03A9F4; background: #E1F5FE; border: 1px solid #B3E5FC"
              (click)="navigateTo(item.route); $event.stopPropagation()"
            >
              {{ item.label }}
            </span>
          }
          @if (alert().items.length > 4) {
            <span class="text-xs font-medium px-2 py-0.5 rounded" style="color: #3B566B; background: #E2E8F0; border: 1px solid #E2E8F0">
              +{{ alert().items.length - 4 }} more
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class AlertCardComponent {
  private readonly router = inject(Router);

  readonly alert = input.required<DashboardAlert>();

  accentColor(): string {
    const s = this.alert().severity;
    return s === 'critical' ? '#DC2626' : s === 'warning' ? '#C55B00' : '#3B566B';
  }

  bgColor(): string {
    const s = this.alert().severity;
    return s === 'critical' ? '#FFF5F5' : s === 'warning' ? '#FFF8F0' : '#FFFFFF';
  }

  borderColor(): string {
    const s = this.alert().severity;
    return s === 'critical' ? '#FECACA' : s === 'warning' ? '#FED7AA' : '#E2E8F0';
  }

  pillBg(): string {
    const s = this.alert().severity;
    return s === 'critical' ? '#FEE2E2' : s === 'warning' ? '#FFEDD5' : '#E2E8F0';
  }

  onInvestigate(): void {
    const items = this.alert().items;
    if (items.length > 0) {
      this.router.navigate([items[0].route]);
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
