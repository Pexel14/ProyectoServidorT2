import { Routes } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { ProductsList } from './features/products/pages/products-list/products-list';
import { Register } from './features/auth/pages/register/register';
import { OrdersList } from './features/orders/pages/orders-list/orders-list';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { AdminProductsList } from './features/admin/pages/admin-products-list/admin-products-list';
import { AdminOrdersList } from './features/admin/pages/admin-orders-list/admin-orders-list';
import { ManageUsers } from './features/admin/pages/manage-users/manage-users';
import { NotFound } from './core/pages/not-found/not-found';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'login', component: Login },
	{ path: 'register', component: Register },
	{ path: 'productos', component: ProductsList, canActivate: [authGuard] },
    { path: 'pedidos', component: OrdersList, canActivate: [authGuard] },
    { 
        path: 'admin/productos', 
        component: AdminProductsList, 
        canActivate: [authGuard, roleGuard] 
    },
    { 
        path: 'admin/pedidos', 
        component: AdminOrdersList, 
        canActivate: [authGuard, roleGuard] 
    },
    { 
        path: 'admin/usuarios', 
        component: ManageUsers, 
        canActivate: [authGuard, roleGuard] 
    },
	{ path: '**', component: NotFound },
];
