import { Component, input } from '@angular/core';

export type ActionIcon = 'edit' | 'deactivate' | 'previous' | 'next';

@Component({
  selector: 'app-action-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      @if (name() === 'edit') {
        <path d="m4 20 4.2-1 10.7-10.7a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
        <path d="m14.5 6.7 2.8 2.8M13 20h7" />
      } @else if (name() === 'deactivate') {
        <circle cx="12" cy="12" r="9" />
        <path d="m8.8 8.8 6.4 6.4" />
      } @else if (name() === 'previous') {
        <path d="m14.5 5-7 7 7 7" />
      } @else {
        <path d="m9.5 5 7 7-7 7" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 18px;
      height: 18px;
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
export class ActionIconComponent {
  readonly name = input.required<ActionIcon>();
}
