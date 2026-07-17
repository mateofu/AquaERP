import { Component, inject } from '@angular/core';
import { AuthSessionService } from '../auth/application/auth-session.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  readonly session = inject(AuthSessionService);
}
