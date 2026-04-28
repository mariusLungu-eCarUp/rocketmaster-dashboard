import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import {
  Home, Zap, Users, Search, RefreshCw, LogOut,
  MapPin, User, RotateCcw, Lock, Unlock, Settings, Wrench,
  Shield, CreditCard, Key, Car, Trash2, Mail,
  CheckCircle, AlertTriangle, AlertCircle, Info,
  Building2, Activity, CircleDot, ChevronRight, ChevronDown,
  Download, Filter, Calendar, FileText, Eye,
  Plus, Pencil, X, Send, DollarSign, Clock,
  Wifi, WifiOff,
} from 'lucide';

type IconNode = [string, Record<string, string | number | undefined>][];

const ICONS: Record<string, IconNode> = {
  home: Home, zap: Zap, users: Users, search: Search,
  'refresh-cw': RefreshCw, 'log-out': LogOut,
  'map-pin': MapPin, user: User, 'rotate-ccw': RotateCcw,
  lock: Lock, unlock: Unlock, settings: Settings, wrench: Wrench,
  shield: Shield, 'credit-card': CreditCard, key: Key, car: Car,
  'trash-2': Trash2, mail: Mail,
  'check-circle': CheckCircle, 'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle, info: Info,
  'building-2': Building2, activity: Activity, 'circle-dot': CircleDot,
  'chevron-right': ChevronRight, 'chevron-down': ChevronDown,
  download: Download, filter: Filter, calendar: Calendar,
  'file-text': FileText, eye: Eye,
  plus: Plus, pencil: Pencil, x: X, send: Send,
  'dollar-sign': DollarSign, clock: Clock,
  wifi: Wifi, 'wifi-off': WifiOff,
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [innerHTML]="svgHtml()" [style.display]="'inline-flex'" [style.vertical-align]="'middle'"></span>`,
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<string>();
  readonly size = input<number>(16);
  readonly strokeWidth = input<number>(1.8);
  readonly color = input<string>('currentColor');

  readonly svgHtml = computed<SafeHtml>(() => {
    const iconData = ICONS[this.name()];
    if (!iconData) return '';

    const s = this.size();
    const sw = this.strokeWidth();
    const c = this.color();

    const children = iconData.map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${attrStr} />`;
    }).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;

    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });
}
