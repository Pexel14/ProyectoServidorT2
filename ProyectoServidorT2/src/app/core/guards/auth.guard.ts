import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

export const authGuard: CanActivateFn = () => {
    const auth = localStorage.getItem('token')
    const router = inject(Router)
    if (!auth) {
        router.navigate(['/login'])
        return false
    } else {
        return true
    }
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