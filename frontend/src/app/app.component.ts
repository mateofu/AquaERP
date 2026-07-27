import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationDialogComponent],
  template: '<router-outlet /><app-confirmation-dialog />',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
