import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  message = signal<string | null>(null);
  type = signal<NotificationType>('success');
  visible = signal(false);

  // Activa la alerta
  show(message: string, type: NotificationType = 'success') {
    this.message.set(message);
    this.type.set(type);
    this.visible.set(true);
  }

  // Oculta sin perder el último mensaje hasta limpiarlo
  dismiss() {
    this.visible.set(false);
    setTimeout(() => {
      this.message.set(null);
    }, 300);
  }
}
