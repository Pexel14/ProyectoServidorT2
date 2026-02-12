import { Routes } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { ProductsList } from './features/products/pages/products-list/products-list';
import { Register } from './features/auth/pages/register/register';
import { OrdersList } from './features/orders/pages/orders-list/orders-list';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'login', component: Login },
	{ path: 'register', component: Register },
	{ path: 'productos', component: ProductsList, canActivate: [authGuard] },
    { path: 'pedidos', component: OrdersList, canActivate: [authGuard] },
	{ path: '**', redirectTo: 'login' },
];
