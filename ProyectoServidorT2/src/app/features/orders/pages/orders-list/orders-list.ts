import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { OrderDetailsModalComponent } from '../../components/order-details-modal/order-details-modal';
import { OrderFiltersComponent } from '../../../../shared/components/order-filters/order-filters';
import { OrderFilters } from '../../models/orderFilter.model';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrderDetailsModalComponent, OrderFiltersComponent],
  templateUrl: './orders-list.html',
  styleUrls: ['./orders-list.scss']
})
export class OrdersList implements OnInit {
  orders: any[] = [];
  loading = true;
  selectedOrder: any = null;
  showDetails = false;
  
  filters: OrderFilters = {
    state: '',
    dateFrom: '',
    dateTo: '',
    minPrice: undefined,
    maxPrice: undefined
  };

  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.refreshOrders();
  }

  // Limpia y recarga pedidos con los filtros actualmente seleccionados
  async refreshOrders() {
    this.loading = true;
    this.orders = [];
    try {
      const cleanFilters: OrderFilters = {};
      if (this.filters.state) cleanFilters.state = this.filters.state;
      if (this.filters.dateFrom) cleanFilters.dateFrom = this.filters.dateFrom;
      if (this.filters.dateTo) cleanFilters.dateTo = this.filters.dateTo;
      if (this.filters.minPrice !== null && this.filters.minPrice !== undefined) cleanFilters.minPrice = this.filters.minPrice;
      if (this.filters.maxPrice !== null && this.filters.maxPrice !== undefined) cleanFilters.maxPrice = this.filters.maxPrice;

      this.orders = await this.orderService.getOrders(cleanFilters);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onFiltersChange(newFilters: OrderFilters) {
    this.filters = { ...newFilters };
    this.refreshOrders();
  }

  trackById(index: number, item: any): any {
    return item.id;
  }

  getBadgeClass(state: string): string {
    if (!state) return '';
    return state
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // Muestra modal inmediatamente y luego sustituye por detalle completo
  async viewOrder(order: any) {
    this.selectedOrder = order;
    this.showDetails = true;
    this.cdr.detectChanges();
    try {
      const full = await this.orderService.getOrderDetails(order.id);
      this.selectedOrder = full;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error cargando detalles del pedido:', err);
    }
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedOrder = null;
  }
}
