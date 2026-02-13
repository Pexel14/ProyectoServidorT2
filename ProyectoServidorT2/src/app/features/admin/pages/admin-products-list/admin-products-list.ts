import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../products/services/product.service';
import { Product } from '../../../products/models/product.model';
import { AdminProductForm } from '../admin-product-form/admin-product-form';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  imports: [CommonModule, AdminProductForm, ConfirmationModalComponent],
  templateUrl: './admin-products-list.html',
  styleUrls: ['./admin-products-list.scss']
})
export class AdminProductsList implements OnInit {
  products: Product[] = [];
  showModal = false;
  selectedProduct: Product | null = null;
  
  showDeleteModal = false;
  productToDelete: number | null = null;
  
  private productService = inject(ProductService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    try {
      this.products = await this.productService.getProducts();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading products', error);
    }
  }

  createNew() {
    this.selectedProduct = null;
    this.showModal = true;
  }

  editProduct(id: number) {
    const product = this.products.find(p => p.id === id);
    if (product) {
      this.selectedProduct = product;
      this.showModal = true;
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedProduct = null;
  }

  onProductSaved() {
    this.closeModal();
    this.loadProducts();
  }

  deleteProduct(id: number) {
    this.productToDelete = id;
    this.showDeleteModal = true;
  }

  async confirmDelete() {
    if (this.productToDelete !== null) {
      try {
        await this.productService.deleteProduct(this.productToDelete);
        this.loadProducts();
      } catch (error) {
        alert('Error al eliminar producto');
        console.error(error);
      }
    }
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  onImageError(event: any) {
    event.target.src = 'https://placehold.co/400x300?text=Sin+Imagen';
  }
}
