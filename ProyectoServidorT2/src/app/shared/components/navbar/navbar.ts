import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from '../../../features/products/services/cart.service';
import { CheckoutModalComponent } from '../../../features/orders/components/checkout-modal/checkout-modal';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal';
import { AuthUser } from '../../../core/services/auth.service';

type NavItem = {
  label: string;
  path: string;
};

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive, CheckoutModalComponent, EditProfileModalComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  cartService = inject(CartService);
  menuOpen = false;
  role: 'admin' | 'user' = 'user';
  userName = 'Usuario';
  userInitials = 'US';
  avatarUrl: string | undefined;
  currentUser: AuthUser | null = null;

  navItems: NavItem[] = [];
  showCart = false;
  isCartOpen = false;
  showCheckoutModal = false;
  cartPath = '/carrito';
  isUserMenuOpen = false;
  showEditProfileModal = false;

  private router = inject(Router);

  ngOnInit(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        this.currentUser = parsed;
        if (parsed.role) {
          this.role = parsed.role;
        }
        if (parsed.name) {
          this.userName = parsed.name;
          this.userInitials = this.getInitials(parsed.name);
        }
        if (parsed.avatar) {
            this.avatarUrl = parsed.avatar;
        }
      } catch {
        this.userName = 'Usuario';
      }
    }

    this.setNavItems();

    // Listen to router events
    this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
        this.updateCartVisibility(event.urlAfterRedirects || event.url);
    });

    // Initial check
    this.updateCartVisibility(this.router.url);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }
  
  openCheckout(): void {
    this.isCartOpen = false;
    this.showCheckoutModal = true;
  }

  closeCheckout(): void {
    this.showCheckoutModal = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  goToOrders(): void {
    this.isUserMenuOpen = false;
    this.router.navigate(['/pedidos']);
  }

  openEditProfile(): void {
    this.isUserMenuOpen = false;
    this.showEditProfileModal = true;
  }

  closeEditProfile(): void {
    this.showEditProfileModal = false;
  }

  onProfileUpdated(updatedUser: AuthUser): void {
    this.currentUser = updatedUser;
    this.userName = updatedUser.name;
    this.userInitials = this.getInitials(updatedUser.name);
    this.avatarUrl = updatedUser.avatar;
    this.role = updatedUser.role;
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    this.router.navigate(['/auth/login']);
  }

  private updateCartVisibility(url: string): void {
    if (this.role === 'admin') {
      this.showCart = false;
      return;
    }
    // Hide cart if we are in the orders page
    if (url.includes('/pedidos')) {
      this.showCart = false;
    } else {
      this.showCart = true;
    }
  }

  private setNavItems(): void {
    if (this.role === 'admin') {
      this.navItems = [
        { label: 'Ver productos', path: '/productos' },
        { label: 'Registrar productos', path: '/admin/productos' },
        { label: 'Ver pedidos', path: '/admin/pedidos' },
        { label: 'Ver usuarios', path: '/admin/usuarios' },
      ];
      this.showCart = false;
      return;
    }

    this.navItems = [
      { label: 'Ver productos', path: '/productos' },
      { label: 'Ver pedidos', path: '/pedidos' },
    ];
    this.showCart = true;
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(' ').filter(Boolean);
    if (!parts.length) {
      return 'US';
    }
    const first = parts[0][0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] || '' : '';
    return (first + last).toUpperCase();
  }

}
