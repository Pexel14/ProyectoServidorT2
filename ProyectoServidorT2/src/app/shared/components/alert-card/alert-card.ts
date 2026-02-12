import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';

export type AlertType = 'success' | 'error';

@Component({
  selector: 'app-alert-card',
  imports: [CommonModule],
  templateUrl: './alert-card.html',
  styleUrl: './alert-card.scss',
})
export class AlertCard implements OnChanges {
  @Input() message: string | null = null;
  @Input() type: AlertType = 'success';
  @Input() visible = false;
  @Output() dismissed = new EventEmitter<void>();

  isExiting = signal(false);
  private autoDismissTimeout: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.message) {
      this.isExiting.set(false);
      this.clearAutoDismiss();
      // Auto dismiss after 3 seconds
      this.autoDismissTimeout = setTimeout(() => {
        this.onDismiss();
      }, 3000);
    }
  }

  onDismiss(): void {
    this.isExiting.set(true);
    this.clearAutoDismiss();
    setTimeout(() => {
      this.dismissed.emit();
      this.isExiting.set(false);
    }, 300);
  }

  private clearAutoDismiss(): void {
    if (this.autoDismissTimeout) {
      clearTimeout(this.autoDismissTimeout);
      this.autoDismissTimeout = null;
    }
  }
}
