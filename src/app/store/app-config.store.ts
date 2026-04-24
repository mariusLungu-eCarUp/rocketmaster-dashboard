import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppConfigStore {
  readonly readOnly = signal(false);
}
