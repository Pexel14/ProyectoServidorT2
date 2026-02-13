import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-card.html',
    styleUrl: './product-card.scss'
})
export class ProductCardComponent {
    @Input() product!: Product;

    constructor(private cartService: CartService) {}

    addToCart() {
        this.cartService.addToCart(this.product);
    }

    onImageError(event: any) {
        event.target.src = 'https://placehold.co/400x300?text=Sin+Imagen';
    }
}
