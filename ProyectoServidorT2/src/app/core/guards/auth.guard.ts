import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = () => {
    const auth = localStorage.getItem('token')
    const router = inject(Router)
    const authService = inject(AuthService)

    if (!auth) {
        router.navigate(['/login'])
        return false
    }

    return authService.checkSession();
}

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