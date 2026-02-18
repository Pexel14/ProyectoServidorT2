
import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);

  // Add token if available
  const token = localStorage.getItem('sb-access-token'); // Check Supabase token key
  // Or just rely on Supabase client handling it? 
  // If we are using Angular HttpClient to call an external API, we need this.
  // But if we use Supabase Client, it handles its own headers. 
  // HOWEVER, the user request says "Cuando se caduque la sesión por tiempo...".
  // Supabase client usually returns error objects, not 401 HttpResponses unless we wrap it or use Edge Functions.
  // If the app uses standard Angular HttpClient for some things, this interceptor applies.
  // BUT the project seems to use `supabase-js` directly in services (e.g. `order.service.ts`).
  // Direct supabase calls do NOT go through Angular HttpInterceptor.
  
  // Implication: I need to handle session expiration where Supabase calls happen or globally listen to auth state change.
  // Supabase has `onAuthStateChange`.
  // If the session expires, `onAuthStateChange` might fire with `SIGNED_OUT` or `TOKEN_REFRESHED`.
  // Or if a request fails with 401.
  
  // Let's modify `AuthService` to listen to state changes and handle expiration.
  // The user said "avisar con la tarjeta de alertas".
  
  return next(req);
}
