import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  message = signal<string | null>(null);
  type = signal<NotificationType>('success');
  visible = signal(false);

  show(message: string, type: NotificationType = 'success') {
    this.message.set(message);
    this.type.set(type);
    this.visible.set(true);
  }

  dismiss() {
    this.visible.set(false);
    // Give time for animation before clearing message
    setTimeout(() => {
      this.message.set(null);
    }, 300);
  }
}
