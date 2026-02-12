import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss'
})
export class ProductsList implements OnInit {
  products: Product[] = [];
  loading = true;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    try {
      console.log('Iniciando carga de productos...');
      const data = await this.productService.getProducts();
      console.log('Productos recibidos en componente:', data);
      this.products = data;
    } catch (error) {
      console.error('Error en ngOnInit:', error);
    } finally {
      console.log('Finalizando carga...');
      this.loading = false;
      this.cdr.detectChanges(); // Forzar detección de cambios si Angular "se duerme"
    }
  }
}
