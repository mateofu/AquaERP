import { AfterViewInit, Component, ElementRef, input, OnDestroy, viewChild } from '@angular/core';

export type NotificationKind = 'success' | 'error';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent implements AfterViewInit, OnDestroy {
  readonly message = input.required<string>();
  readonly kind = input.required<NotificationKind>();
  private readonly element = viewChild.required<ElementRef<HTMLDivElement>>('element');

  ngAfterViewInit(): void {
    this.element().nativeElement.showPopover();
  }

  ngOnDestroy(): void {
    const element = this.element().nativeElement;
    if (element.matches(':popover-open')) element.hidePopover();
  }
}
