import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Product } from '../models/product.model';
import { NotificationService } from '../../../core/services/notification.service';

export interface CartItem extends Product {
  quantityInCart: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private notificationService = inject(NotificationService);
  cartItems = signal<CartItem[]>(this.loadFromStorage());

  private hasAuthenticatedSession(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  constructor() {
    effect(() => {
      localStorage.setItem('cart', JSON.stringify(this.cartItems()));
    });
  }

  private loadFromStorage(): CartItem[] {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  }

  // Computed signal for total price
  totalPrice = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + (item.price * item.quantityInCart), 0);
  });

  // Computed signal for total items count (optional, good for badge)
  totalItems = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.quantityInCart, 0);
  });

  getCartItems() {
    return this.cartItems;
  }

  addToCart(product: Product) {
    if (!this.hasAuthenticatedSession()) {
      this.notificationService.show('Debes iniciar sesión para añadir productos al carrito', 'error');
      return;
    }

    this.cartItems.update(items => {
      const existingItem = items.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantityInCart < 5) { // Assuming global limit of 5 per item from usage
           this.notificationService.show('Cantidad actualizada en el carrito', 'success');
           return items.map(item => 
            item.id === product.id 
              ? { ...item, quantityInCart: item.quantityInCart + 1 } 
              : item
          );
        } else {
             this.notificationService.show('No puedes añadir más de este producto', 'error');
             return items;
        }
      } else {
        this.notificationService.show('Producto añadido al carrito', 'success');
        return [...items, { ...product, quantityInCart: 1 }];
      }
    });
  }

  removeFromCart(productId: number) {
    this.cartItems.update(items => items.filter(item => item.id !== productId));
    this.notificationService.show('Producto eliminado del carrito', 'success');
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity < 1 || quantity > 5) return;
    
    this.cartItems.update(items => 
      items.map(item => 
        item.id === productId ? { ...item, quantityInCart: quantity } : item
      )
    );
  }

  clearCart(notify: boolean = true) {
    this.cartItems.set([]);
    if (notify) {
      this.notificationService.show('Carrito vaciado correctamente', 'success');
    }
  }
}
