import { Injectable, computed, inject, signal } from '@angular/core';
import { SupportDataStore } from '../store/support-data.store';

export interface SearchResult {
  type: 'user' | 'station';
  id: string;
  label: string;
  sublabel: string;
  route: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly store = inject(SupportDataStore);

  readonly query = signal('');

  readonly results = computed<SearchResult[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (q.length < 2) return [];

    const userResults: SearchResult[] = this.store
      .users()
      .filter(
        (u) =>
          u.Identification?.toLowerCase().includes(q) ||
          u.AnonymizedEmail?.toLowerCase().includes(q) ||
          String(u.Id).toLowerCase().includes(q),
      )
      .slice(0, 10)
      .map((u) => ({
        type: 'user' as const,
        id: u.Id,
        label: u.Identification || u.AnonymizedEmail || u.Id,
        sublabel: `User ID: ${u.Id}`,
        route: `/driver/${u.Id}`,
      }));

    const stationResults: SearchResult[] = this.store
      .stations()
      .filter(
        (s) =>
          s.Name?.toLowerCase().includes(q) ||
          s.Id?.toLowerCase().includes(q) ||
          s.Address?.toLowerCase().includes(q),
      )
      .slice(0, 10)
      .map((s) => ({
        type: 'station' as const,
        id: s.Id,
        label: s.Name || s.Id,
        sublabel: s.Address || `Station ID: ${s.Id}`,
        route: `/station/${s.Id}`,
      }));

    return [...userResults, ...stationResults];
  });
}
