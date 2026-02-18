import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal';
import { OrderService } from '../../../../features/orders/services/order.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-order-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './admin-order-edit-modal.html',
  styleUrls: ['./admin-order-edit-modal.scss']
})
export class AdminOrderEditModal implements OnInit {
  @Input() order: any;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  selectedStatus: string = '';
  statusOptions = ['En espera', 'Cancelado', 'En envio', 'Recibido'];
  showConfirmModal = false;
  loading = false;
  loadingItems = false;
  error = '';
  orderItems: any[] = [];

  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    if (this.order) {
      this.selectedStatus = this.order.state;
      this.loadOrderItems();
    }
  }

  async loadOrderItems() {
    this.loadingItems = true;
    try {
      const full = await this.orderService.getOrderDetails(this.order.id);
      this.orderItems = full?.items || [];
    } catch (err) {
      console.error('Error cargando items del pedido:', err);
    } finally {
      this.loadingItems = false;
      this.cdr.detectChanges();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  save() {
    if (this.selectedStatus !== this.order.state) {
      this.showConfirmModal = true;
    } else {
      this.close.emit();
    }
  }

  async confirmSave() {
    this.showConfirmModal = false;
    this.loading = true;
    this.error = '';

    try {
      if (!this.order?.id) throw new Error('ID de pedido no válido');

      await this.orderService.updateOrderStatus(this.order.id, this.selectedStatus);

      this.order.state = this.selectedStatus;
      this.notificationService.show('Estado del pedido actualizado correctamente', 'success');
      this.saved.emit();
    } catch (err: any) {
      console.error('Update error:', err);
      this.error = 'Error al actualizar el estado: ' + (err.message || err);
      this.notificationService.show('Error al actualizar el estado', 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelSave() {
    this.showConfirmModal = false;
  }
}
