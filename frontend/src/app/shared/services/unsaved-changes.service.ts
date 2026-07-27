import { inject, Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ConfirmationDialogService } from '../components/confirmation-dialog/confirmation-dialog.service';

@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private readonly confirmation = inject(ConfirmationDialogService);

  canDiscard(form: AbstractControl): Promise<boolean> {
    if (!form.dirty) return Promise.resolve(true);

    return this.confirmation.confirm({
      title: 'Descartar cambios',
      message: 'Hay información sin guardar. ¿Deseas salir y perder los cambios realizados?',
      confirmLabel: 'Sí, salir',
      cancelLabel: 'Continuar editando',
      danger: true,
    });
  }
}
