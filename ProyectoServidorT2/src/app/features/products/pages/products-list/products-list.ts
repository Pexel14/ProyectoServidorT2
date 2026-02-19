import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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

  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadProducts();
  }

  // Carga productos desde backend y mantiene estado de carga
  async loadProducts() {
    this.loading = true;
    try {
      this.products = await this.productService.getProducts();
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
