import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderFilters } from '../../../features/orders/models/orderFilter.model';

@Component({
  selector: 'app-order-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-filters.html',
  styleUrls: ['./order-filters.scss']
})
export class OrderFiltersComponent {
  @Input() filters: OrderFilters = {};
  @Output() filtersChange = new EventEmitter<OrderFilters>();

  states = ['En espera', 'En envio', 'Recibido', 'Cancelado'];

  onFilterChange() {

    this.filtersChange.emit({ ...this.filters });
  }

  clearFilters() {
    this.filters = {
        state: '',
        dateFrom: '',
        dateTo: '',
        minPrice: undefined,
        maxPrice: undefined
    };
    this.filtersChange.emit({ ...this.filters });
  }
}
