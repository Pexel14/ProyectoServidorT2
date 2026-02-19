import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from '../../../features/products/services/cart.service';
import { CheckoutModalComponent } from '../../../features/orders/components/checkout-modal/checkout-modal';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal';
import { AuthUser, AuthService } from '../../../core/services/auth.service';

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
export class Navbar implements OnInit, OnDestroy {
  cartService = inject(CartService);
  authService = inject(AuthService);
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
  private authStateUnsubscribe: (() => void) | null = null;
  private profileUpdatedHandler = () => {
    this.refreshCurrentUserFromDb();
  };

  ngOnInit(): void {
    // Check initial user from localStorage or Service
    // Better to use AuthService to check current state from Supabase if possible, 
    // but synchronous local storage is faster for UI rendering.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        this.updateUserFromStorage(JSON.parse(storedUser));
    }

    // Subscribe to Auth Changes
    this.authStateUnsubscribe = this.authService.onAuthStateChange((user) => {
        if (user) {
            this.updateUserFromStorage(user);
        } else {
             this.currentUser = null;
             this.role = 'user';
             this.setNavItems();
        }
    });

    this.setNavItems();

    // Listen to router events
    this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
        this.updateCartVisibility(event.urlAfterRedirects || event.url);
    });

    // Initial check
    this.updateCartVisibility(this.router.url);

    this.refreshCurrentUserFromDb();
    window.addEventListener('user-profile-updated', this.profileUpdatedHandler);
  }

  ngOnDestroy(): void {
    this.authStateUnsubscribe?.();
    window.removeEventListener('user-profile-updated', this.profileUpdatedHandler);
  }

  updateUserFromStorage(user: AuthUser) {
      this.currentUser = user;
      if (user.role) {
          this.role = user.role;
      }
      if (user.name) {
          this.userName = user.name;
          this.userInitials = this.getInitials(user.name);
      }
      if (user.avatar) {
          this.avatarUrl = user.avatar;
      } else {
          this.avatarUrl = undefined;
      }
      this.setNavItems();
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
    // Refresh user data in background so modal gets fresh info
    this.refreshCurrentUserFromDb();
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
    this.refreshCurrentUserFromDb();
  }

  async logout() {
    this.cartService.clearCart(false);
    await this.authService.logout(); // Use service to logout properly
    localStorage.removeItem('user');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    
    this.currentUser = null; // Explicitly clear state
    this.setNavItems();
    
    this.router.navigate(['/login']);
  }

  private updateCartVisibility(url: string): void {
    if (url.includes('/admin') || url.includes('/login') || url.includes('/register')) {
      this.showCart = false;
    } else if (url.includes('/pedidos')) {
      this.showCart = false;
    } else {
      this.showCart = true;
    }
  }

  private setNavItems(): void {
    if (this.currentUser && this.role === 'admin') {
      this.navItems = [
        { label: 'Ver productos', path: '/productos' },
        { label: 'Gestión Productos', path: '/admin/productos' },
        { label: 'Gestionar Pedidos', path: '/admin/pedidos' },
        { label: 'Gestionar Usuarios', path: '/admin/usuarios' },
      ];
      // Allow cart for admin in non-admin pages
      return;
    } else if (this.currentUser) {
        this.navItems = [
            { label: 'Ver productos', path: '/productos' },
            { label: 'Ver pedidos', path: '/pedidos' },
        ];
    } else {
        // Guest
        this.navItems = [
            { label: 'Ver productos', path: '/productos' },
        ];
    }
    
    // Logic for cart visibility depends on URL, not just items
    this.updateCartVisibility(this.router.url);
  }

  private getInitials(name: string): string {
    if (!name) {
      return 'US';
    }

    const parts = name.trim().split(' ').filter(Boolean);
    if (!parts.length) {
      return 'US';
    }
    const first = parts[0][0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] || '' : '';
    return (first + last).toUpperCase();
  }

  private async refreshCurrentUserFromDb(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.updateUserFromStorage(user);
    }
  }

}
