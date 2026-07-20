import { Component, input } from '@angular/core';

export type NavigationIcon =
  | 'home'
  | 'customers'
  | 'properties'
  | 'meters'
  | 'readings'
  | 'billing'
  | 'payments'
  | 'periods';

@Component({
  selector: 'app-navigation-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      @switch (name()) {
        @case ('home') {
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v10h13V10M9.5 20v-6h5v6" />
        }
        @case ('customers') {
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c.4-3.4 2.3-5 5.5-5s5.1 1.6 5.5 5" />
          <path d="M16 6.5a2.5 2.5 0 0 1 0 5M16.5 14c2.4.2 3.8 1.7 4 4.5" />
        }
        @case ('properties') {
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v10h13V10M9 20v-5h6v5" />
          <path d="M16.5 7.8V5h2v4.5" />
        }
        @case ('meters') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M7.5 13a4.7 4.7 0 0 1 9 0M12 12l3-3M8 17h8" />
        }
        @case ('readings') {
          <path d="M5 20V10M10 20V5M15 20v-8M20 20V8" />
          <path d="M3 20h19" />
        }
        @case ('billing') {
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        }
        @case ('payments') {
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M7 15h3" />
        }
        @case ('periods') {
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 9h16M8 13h3M14 13h2M8 17h3" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 17px;
      height: 17px;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class NavigationIconComponent {
  readonly name = input.required<NavigationIcon>();
}
