import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [MatButtonModule, RouterLink],
  template: `
    <main class="not-found">
      <p>404</p>
      <h1>Esta página no existe</h1>
      <span>La dirección puede ser incorrecta o el contenido cambió.</span>
      <a mat-flat-button routerLink="/dashboard">Volver al inicio</a>
    </main>
  `,
  styles: `
    .not-found {
      display: grid;
      min-height: 100dvh;
      place-content: center;
      padding: 2rem;
      color: #31433e;
      background: #f5f7f5;
      text-align: center;
    }
    p {
      margin: 0;
      color: #287765;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.2em;
    }
    h1 {
      margin: 0.75rem 0;
      font-family: Georgia, serif;
      font-size: clamp(2rem, 5vw, 3.5rem);
    }
    span {
      margin-bottom: 1.5rem;
      color: #71807c;
    }
    a {
      justify-self: center;
      background: #176b5b;
    }
  `,
})
export class NotFoundPage {}
