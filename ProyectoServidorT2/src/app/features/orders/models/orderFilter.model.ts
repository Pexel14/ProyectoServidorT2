// Filtros permitidos para buscar pedidos en listados
export interface OrderFilters {
  state?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
}