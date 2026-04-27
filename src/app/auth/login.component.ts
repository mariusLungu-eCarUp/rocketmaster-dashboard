import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SupportDataStore } from '../store/support-data.store';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="min-h-screen flex items-center justify-center p-4" style="background: #F4F4F4">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style="background: #03A9F4">
            <app-icon name="zap" [size]="20" color="white" [strokeWidth]="2.2" />
          </div>
          <h1 class="text-xl font-semibold" style="color: #000000">Rocketmaster</h1>
          <p class="text-sm mt-1" style="color: #3B566B">Support Operations Dashboard</p>
        </div>

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="bg-white rounded-xl shadow-sm p-6 space-y-4"
          style="border: 1px solid #E2E8F0"
        >
          @if (errorMessage()) {
            <div class="text-sm px-3 py-2 rounded-md" style="color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA">
              {{ errorMessage() }}
            </div>
          }

          <div>
            <label for="username" class="block text-xs font-medium mb-1 uppercase tracking-wider" style="color: #3B566B">
              Username
            </label>
            <input
              id="username"
              type="text"
              formControlName="username"
              autocomplete="username"
              class="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2"
              style="border: 1.5px solid #E2E8F0; color: #000000; background: #F4F4F4"
              [style.border-color]="form.controls.username.invalid && form.controls.username.touched ? '#DC2626' : '#E2E8F0'"
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-medium mb-1 uppercase tracking-wider" style="color: #3B566B">
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2"
              style="border: 1.5px solid #E2E8F0; color: #000000; background: #F4F4F4"
              [style.border-color]="form.controls.password.invalid && form.controls.password.touched ? '#DC2626' : '#E2E8F0'"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading() || form.invalid"
            class="w-full py-2.5 px-4 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style="background: #03A9F4"
          >
            @if (loading()) {
              <span class="inline-flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Signing in...
              </span>
            } @else {
              Sign in
            }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly store = inject(SupportDataStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.form.getRawValue();

    this.auth.login(username, password).subscribe({
      next: () => {
        this.store.loadAll().subscribe();
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          err instanceof Error ? err.message : 'Login failed',
        );
      },
    });
  }
}
