import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './order-details-modal.html',
  styleUrl: './order-details-modal.scss'
})
export class OrderDetailsModalComponent {
  @Input() isOpen = false;
  @Input() order: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<void>();

  showCancelConfirmation = false;
  private orderService = inject(OrderService);
  private notificationService = inject(NotificationService);

  onCloseRequest() {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).className === 'modal-overlay') {
      this.close.emit();
    }
  }

  canCancel(state: string): boolean {
    return state === 'En espera';
  }

  askCancelOrder() {
    this.showCancelConfirmation = true;
  }

  cancelCancel() {
    this.showCancelConfirmation = false;
  }

  async confirmCancel() {
    this.showCancelConfirmation = false;
    if (!this.order) return;

    try {
        await this.orderService.cancelOrder(this.order.id);
        this.notificationService.show('Pedido cancelado correctamente', 'success');
        this.order.state = 'Cancelado'; // Optimistic update
        this.orderUpdated.emit();
    } catch (error) {
        this.notificationService.show('No se pudo cancelar el pedido', 'error');
    }
  }
}
