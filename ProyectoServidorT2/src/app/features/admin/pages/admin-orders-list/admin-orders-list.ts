import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../features/orders/services/order.service';
import { OrderFilters } from '../../../../features/orders/models/orderFilter.model';
import { AdminOrderEditModal } from '../../components/admin-order-edit-modal/admin-order-edit-modal';
import { OrderFiltersComponent } from '../../../../shared/components/order-filters/order-filters';

@Component({
  selector: 'app-admin-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminOrderEditModal, OrderFiltersComponent],
  templateUrl: './admin-orders-list.html',
  styleUrls: ['./admin-orders-list.scss']
})
export class AdminOrdersList implements OnInit {
  orders: any[] = [];
  loading = false;
  private cdr = inject(ChangeDetectorRef);
  
  filters: OrderFilters = {
    state: '',
    dateFrom: '',
    dateTo: '',
    minPrice: undefined,
    maxPrice: undefined
  }

  // Modal
  selectedOrder: any = null;
  showEditModal = false;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    this.orders = []; // Clear list to avoid showing old data
    this.cdr.detectChanges();
    try {
      // Clean undefined filters
      const filters = {
        state: this.filters.state || undefined,
        dateFrom: this.filters.dateFrom || undefined,
        dateTo: this.filters.dateTo || undefined,
        minPrice: this.filters.minPrice || undefined,
        maxPrice: this.filters.maxPrice || undefined
      };
      
      this.orders = await this.orderService.getAllOrders(filters);
      // Force update immediately after data arrives
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading orders', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onFilterChange(newFilters: OrderFilters) {
    // Break reference to ensure change detection works
    this.filters = { ...newFilters };
    this.loadOrders();
  }

  trackById(index: number, item: any): any {
    return item.id;
  }

  updateView() {
    this.loadOrders();
  }

  openEditModal(order: any) {
    this.selectedOrder = { ...order }; // Clone
    this.showEditModal = true;
  }

  closeModal() {
    this.showEditModal = false;
    this.selectedOrder = null;
  }

  onModalSaved() {
    this.closeModal();
    this.loadOrders(); // Reload list
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'En espera': return 'status-pending';
      case 'En envio': return 'status-shipping';
      case 'Recibido': return 'status-received';
      case 'Cancelado': return 'status-cancelled';
      default: return '';
    }
  }
}
