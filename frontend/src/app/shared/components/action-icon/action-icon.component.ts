import { Component, input } from '@angular/core';

export type ActionIcon =
  | 'edit'
  | 'deactivate'
  | 'activate'
  | 'previous'
  | 'next'
  | 'open'
  | 'visibility'
  | 'visibility-off'
  | 'close';

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
      } @else if (name() === 'activate') {
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.7 2.7L16.5 9" />
      } @else if (name() === 'previous') {
        <path d="m14.5 5-7 7 7 7" />
      } @else if (name() === 'next') {
        <path d="m9.5 5 7 7-7 7" />
      } @else if (name() === 'open') {
        <path d="M7 10V7a5 5 0 0 1 9.6-2" />
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M12 14v2" />
      } @else if (name() === 'visibility') {
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      } @else if (name() === 'visibility-off') {
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8" />
        <path d="M6.5 6.5C3.8 8.3 2.5 12 2.5 12s3.5 6 9.5 6a10 10 0 0 0 4-.8" />
      } @else {
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
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
