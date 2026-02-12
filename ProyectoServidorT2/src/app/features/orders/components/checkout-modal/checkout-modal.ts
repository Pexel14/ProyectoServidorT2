import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal';
import { OrderService } from '../../services/order.service';
import { CartItem, CartService } from '../../../products/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationModalComponent],
  templateUrl: './checkout-modal.html',
  styleUrl: './checkout-modal.scss'
})
export class CheckoutModalComponent {
  @Input() isOpen = false;
  @Input() cartItems: CartItem[] = [];
  @Input() totalAmount: number = 0;
  
  @Output() close = new EventEmitter<void>();
  @Output() orderCompleted = new EventEmitter<void>();

  checkoutForm: FormGroup;
  showConfirmation = false;
  showRemoveConfirmation = false;
  itemToRemove: number | null = null;
  isSubmitting = false;

  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  private cartService = inject(CartService); // Inject to clear cart
  private notificationService = inject(NotificationService);

  constructor() {
    this.checkoutForm = this.fb.group({
      calle: ['', Validators.required],
      numero: ['', Validators.required],
      piso: [''],
      puerta: [''],
      codigo_postal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      ciudad: ['', Validators.required],
      provincia: ['', Validators.required],
      observaciones: ['']
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.checkoutForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).className === 'modal-overlay') {
      this.onCloseRequest();
    }
  }

  onCloseRequest() {
    if (this.checkoutForm.dirty && !this.isSubmitting) {
      this.showConfirmation = true;
    } else {
      this.close.emit();
    }
  }

  onConfirmClose() {
    this.showConfirmation = false;
    this.close.emit();
    this.checkoutForm.reset();
  }

  onCancelClose() {
    this.showConfirmation = false;
  }

  askRemoveItem(productId: number) {
    this.itemToRemove = productId;
    this.showRemoveConfirmation = true;
  }

  confirmRemoveItem() {
    if (this.itemToRemove !== null) {
      this.cartService.removeFromCart(this.itemToRemove);
      this.itemToRemove = null;
    }
    this.showRemoveConfirmation = false;
    
    if (this.cartService.cartItems().length === 0) {
        this.close.emit();
    }
  }

  cancelRemoveItem() {
    this.itemToRemove = null;
    this.showRemoveConfirmation = false;
  }

  increaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantityInCart + 1);
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantityInCart > 1) {
      this.cartService.updateQuantity(item.id, item.quantityInCart - 1);
    } else {
      this.askRemoveItem(item.id);
    }
  }

  async onSubmit() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      await this.orderService.createOrder(this.cartItems, this.totalAmount, this.checkoutForm.value);
      this.notificationService.show('¡Pedido realizado con éxito!', 'success');
      this.cartService.clearCart(false);
      this.checkoutForm.reset();
      this.orderCompleted.emit();
      this.close.emit();
    } catch (error) {
      this.notificationService.show('Error al procesar el pedido. Inténtalo de nuevo.', 'error');
      console.error(error);
    } finally {
      this.isSubmitting = false;
    }
  }
}
