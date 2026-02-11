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
    const role = localStorage.getItem('role')
    const router = inject(Router)
    if (role !== 'admin') {
        router.navigate(['/'])
        return false
    } else {
        return true
    }
}