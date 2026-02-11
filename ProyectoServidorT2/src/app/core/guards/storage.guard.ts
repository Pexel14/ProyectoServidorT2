import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

export const storageGuard: CanActivateFn = () => {
    const token = localStorage.getItem('token')
    const router = inject(Router)
    if (!token) {
        router.navigate(['/login'])
        return false
    } else {
        return true
    }
}

export const storageAdminGuard: CanActivateFn = () => {
    const role = localStorage.getItem('role')
    const router = inject(Router)
    if (role !== 'admin') {
        router.navigate(['/'])
        return false
    } else {
        return true
    }
}
