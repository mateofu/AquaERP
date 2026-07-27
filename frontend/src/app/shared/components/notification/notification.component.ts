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
  readonly duration = input(4000);
  private readonly element = viewChild.required<ElementRef<HTMLDivElement>>('element');
  private hideTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    const element = this.element().nativeElement;
    element.showPopover();
    this.hideTimer = setTimeout(() => {
      if (element.matches(':popover-open')) element.hidePopover();
    }, this.duration());
  }

  ngOnDestroy(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    const element = this.element().nativeElement;
    if (element.matches(':popover-open')) element.hidePopover();
  }
}
