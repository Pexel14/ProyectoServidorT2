import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
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

  private searchTimeout: any;

  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit() {
    this.refreshOrders();
  }

  refreshOrders() {
    // Force loading state in zone
    this.ngZone.run(() => {
      this.loading = true;
      this.orders = []; // Clear list
    });

    const cleanFilters: OrderFilters = {};
    if (this.filters.state) cleanFilters.state = this.filters.state;
    if (this.filters.dateFrom) cleanFilters.dateFrom = this.filters.dateFrom;
    if (this.filters.dateTo) cleanFilters.dateTo = this.filters.dateTo;
    if (this.filters.minPrice !== null && this.filters.minPrice !== undefined) cleanFilters.minPrice = this.filters.minPrice;
    if (this.filters.maxPrice !== null && this.filters.maxPrice !== undefined) cleanFilters.maxPrice = this.filters.maxPrice;

    this.orderService.getOrders(cleanFilters).then(data => {
      this.ngZone.run(() => {
        this.orders = data;
        this.loading = false;
        // Optionally force check if OnPush
        this.cdr.detectChanges(); 
      });
    }).catch(error => {
      console.error('Error cargando pedidos:', error);
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  onFiltersChange(newFilters: OrderFilters) {
    // Break reference to ensure change detection
    this.filters = { ...newFilters };
    this.refreshOrders();
  } 

  trackById(index: number, item: any): any {
    return item.id;
  }

  getBadgeClass(state: string): string {
    return state?.toLowerCase().replace(' ', '-') || '';
  }

  async viewOrder(order: any) {
    // Show modal immediately with basic data
    this.selectedOrder = order;
    this.showDetails = true;

    // Then fetch details (products, etc.)
    try {
        const fullOrder = await this.orderService.getOrderDetails(order.id);
        this.selectedOrder = fullOrder;
        this.cdr.detectChanges();
    } catch(err) {
        console.error("Error loading order details", err);
    }
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedOrder = null;
  }
}
