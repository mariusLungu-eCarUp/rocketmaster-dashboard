import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { SupportDataStore } from '../store/support-data.store';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../shared/toast.service';
import { HubjectPricingProduct } from '../store/models';

@Component({
  selector: 'app-hubject-actions',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col gap-5 p-5 pb-10" style="max-width: 100%">
      <h1 style="color: #000000; font-size: 22px; font-weight: 500; line-height: 30px; margin: 0">Hubject Actions</h1>

      <!-- Action Buttons -->
      <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
        <div class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: #3B566B; letter-spacing: 0.07em">Push Operations</div>
        <div class="flex flex-wrap gap-3">
          <button class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md cursor-pointer disabled:opacity-50"
            style="color: #fff; background: #03A9F4"
            [disabled]="pushingEvseData()"
            (click)="pushEvseData()">
            <app-icon name="upload" [size]="15" color="#fff" />
            {{ pushingEvseData() ? 'Pushing...' : 'Push EVSE Data' }}
          </button>
          <button class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md cursor-pointer disabled:opacity-50"
            style="color: #fff; background: #03A9F4"
            [disabled]="pushingEvseStatus()"
            (click)="pushEvseStatus()">
            <app-icon name="radio" [size]="15" color="#fff" />
            {{ pushingEvseStatus() ? 'Pushing...' : 'Push EVSE Status' }}
          </button>
          <button class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md cursor-pointer disabled:opacity-50"
            style="color: #fff; background: #03A9F4"
            [disabled]="pushingPricingProducts()"
            (click)="pushPricingProducts()">
            <app-icon name="package" [size]="15" color="#fff" />
            {{ pushingPricingProducts() ? 'Pushing...' : 'Push Pricing Products' }}
          </button>
          <button class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md cursor-pointer disabled:opacity-50"
            style="color: #fff; background: #03A9F4"
            [disabled]="pushingPricing()"
            (click)="pushPricing()">
            <app-icon name="dollar-sign" [size]="15" color="#fff" />
            {{ pushingPricing() ? 'Pushing...' : 'Push Pricing' }}
          </button>
          <button class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md cursor-pointer"
            style="color: #03A9F4; border: 1px solid #B3E5FC; background: #E1F5FE"
            (click)="openSendCdr()">
            <app-icon name="send" [size]="15" />
            Send CDR
          </button>
        </div>
      </div>

      <!-- Pricing Products Table -->
      <div class="bg-white" style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px 20px">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color: #3B566B; letter-spacing: 0.07em">Pricing Products</span>
          <span class="text-xs" style="color: #3B566B">{{ pricingProducts().length }} product(s)</span>
        </div>
        @if (productsLoading()) {
          <p class="text-xs text-center py-8" style="color: #3B566B">Loading pricing products...</p>
        } @else if (pricingProducts().length === 0) {
          <p class="text-xs text-center py-8" style="color: #3B566B">No pricing products</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full" style="border-collapse: collapse">
              <thead>
                <tr style="background: #F4F4F4">
                  <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Product ID</th>
                  <th class="text-right text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Unit Price</th>
                  <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Currency</th>
                  <th class="text-left text-xs font-semibold uppercase tracking-wider px-3 py-2" style="color: #3B566B; border-bottom: 1px solid #E2E8F0">Reference Unit</th>
                </tr>
              </thead>
              <tbody>
                @for (p of pricingProducts(); track p.ProductID) {
                  <tr>
                    <td class="px-3 py-2 text-sm font-mono" style="border-bottom: 1px solid #E2E8F0; color: #000000">{{ p.ProductID }}</td>
                    <td class="px-3 py-2 text-sm font-mono text-right" style="border-bottom: 1px solid #E2E8F0; color: #000000">{{ p.PricePerReferenceUnit }}</td>
                    <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0; color: #3B566B">{{ p.ProductPriceCurrency }}</td>
                    <td class="px-3 py-2 text-sm" style="border-bottom: 1px solid #E2E8F0; color: #3B566B">{{ p.ReferenceUnit }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Send CDR Dialog -->
      @if (showSendCdr()) {
        <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0,0,0,0.28)"
          (click)="showSendCdr.set(false)">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" style="border: 1px solid #E2E8F0"
            (click)="$event.stopPropagation()">
            <h2 class="text-base font-semibold mb-4" style="color: #000000">Send Hubject CDR</h2>
            <div class="flex flex-col gap-3">
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Session ID</label>
                <input type="text" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                  placeholder="Charging session ID"
                  [value]="cdrSessionId()" (input)="cdrSessionId.set(asInput($event).value)" />
              </div>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Hubject User ID</label>
                <input type="text" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                  placeholder="Hubject user ID"
                  [value]="cdrHubjectUserId()" (input)="cdrHubjectUserId.set(asInput($event).value)" />
              </div>
              <div>
                <label class="text-xs font-medium mb-1 block" style="color: #3B566B">Date</label>
                <input type="date" class="w-full text-sm px-3 py-2 rounded-md" style="border: 1px solid #E2E8F0; outline: none"
                  [value]="cdrDate()" (change)="cdrDate.set(asInput($event).value)" />
              </div>
            </div>
            <div class="flex gap-3 justify-end mt-5">
              <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer"
                style="color: #3B566B; border: 1px solid #E2E8F0" (click)="showSendCdr.set(false)">Cancel</button>
              <button class="px-4 py-2 text-sm font-medium text-white rounded-md cursor-pointer"
                style="background: #03A9F4"
                [disabled]="!cdrSessionId().trim() || !cdrHubjectUserId().trim() || !cdrDate().trim() || cdrSending()"
                [style.opacity]="cdrSessionId().trim() && cdrHubjectUserId().trim() && cdrDate().trim() && !cdrSending() ? '1' : '0.4'"
                (click)="sendCdr()">{{ cdrSending() ? 'Sending...' : 'Send CDR' }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class HubjectActionsComponent implements OnInit {
  private readonly toast = inject(ToastService);
  readonly store = inject(SupportDataStore);

  readonly pushingEvseData = signal(false);
  readonly pushingEvseStatus = signal(false);
  readonly pushingPricingProducts = signal(false);
  readonly pushingPricing = signal(false);

  readonly pricingProducts = signal<HubjectPricingProduct[]>([]);
  readonly productsLoading = signal(false);

  readonly showSendCdr = signal(false);
  readonly cdrSessionId = signal('');
  readonly cdrHubjectUserId = signal('');
  readonly cdrDate = signal(new Date().toISOString().slice(0, 10));
  readonly cdrSending = signal(false);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productsLoading.set(true);
    this.store.getHubjectPricingProducts().subscribe({
      next: (products) => { this.pricingProducts.set(products); this.productsLoading.set(false); },
      error: () => { this.pricingProducts.set([]); this.productsLoading.set(false); },
    });
  }

  pushEvseData(): void {
    this.pushingEvseData.set(true);
    this.store.pushHubjectEvseData().subscribe({
      next: () => { this.pushingEvseData.set(false); this.toast.success('EVSE data pushed successfully'); },
      error: () => { this.pushingEvseData.set(false); this.toast.error('Failed to push EVSE data'); },
    });
  }

  pushEvseStatus(): void {
    this.pushingEvseStatus.set(true);
    this.store.pushHubjectEvseStatus().subscribe({
      next: () => { this.pushingEvseStatus.set(false); this.toast.success('EVSE status pushed successfully'); },
      error: () => { this.pushingEvseStatus.set(false); this.toast.error('Failed to push EVSE status'); },
    });
  }

  pushPricingProducts(): void {
    this.pushingPricingProducts.set(true);
    this.store.pushHubjectPricingProducts().subscribe({
      next: () => { this.pushingPricingProducts.set(false); this.toast.success('Pricing products pushed successfully'); },
      error: () => { this.pushingPricingProducts.set(false); this.toast.error('Failed to push pricing products'); },
    });
  }

  pushPricing(): void {
    this.pushingPricing.set(true);
    this.store.pushHubjectPricing().subscribe({
      next: () => { this.pushingPricing.set(false); this.toast.success('Pricing pushed successfully'); },
      error: () => { this.pushingPricing.set(false); this.toast.error('Failed to push pricing'); },
    });
  }

  openSendCdr(): void {
    this.cdrSessionId.set('');
    this.cdrHubjectUserId.set('');
    this.cdrDate.set(new Date().toISOString().slice(0, 10));
    this.cdrSending.set(false);
    this.showSendCdr.set(true);
  }

  sendCdr(): void {
    this.cdrSending.set(true);
    this.store.sendHubjectCdr(
      this.cdrSessionId().trim(),
      this.cdrHubjectUserId().trim(),
      new Date(this.cdrDate()).toISOString(),
    ).subscribe({
      next: () => { this.cdrSending.set(false); this.showSendCdr.set(false); this.toast.success('CDR sent successfully'); },
      error: () => { this.cdrSending.set(false); this.toast.error('Failed to send CDR'); },
    });
  }

  asInput(event: Event): HTMLInputElement {
    return event.target as HTMLInputElement;
  }
}
