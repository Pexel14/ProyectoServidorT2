import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

/**
 * Guard de autenticación. Protege rutas que requieren sesión activa.
 * Comprueba el token JWT almacenado en localStorage y valida la sesión con Supabase.
 * Si no hay sesión activa, redirige al usuario a `/login`.
 *
 * @returns `true` si hay sesión activa, `false` (+ redirección) en caso contrario.
 */
export const authGuard: CanActivateFn = () => {
    const router = inject(Router)
    const authService = inject(AuthService)

    return authService.checkSession().then((hasSession) => {
        if (!hasSession) {
            router.navigate(['/login']);
            return false;
        }
        return true;
    });
}

/**
 * Guard de rol. Protege rutas exclusivas de administrador.
 * Lee el rol del usuario desde localStorage y verifica que sea `'admin'`.
 * Si el rol no es admin, redirige a `/productos`.
 *
 * @returns `true` si el usuario tiene rol admin, `false` (+ redirección) en caso contrario.
 */
export const roleGuard: CanActivateFn = () => {
    const userStr = localStorage.getItem('user');
    const router = inject(Router);
    
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
            return true;
        }
    }
    
    // Redirect to home or products if not admin
    router.navigate(['/productos']);
    return false;
}