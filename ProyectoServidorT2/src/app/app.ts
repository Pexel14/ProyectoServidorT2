import { Component, signal, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './shared/components/navbar/navbar';
import { AlertCard } from './shared/components/alert-card/alert-card';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Navbar, AlertCard],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ProyectoServidorT2');
  protected showNavbar = signal(false);
  notificationService = inject(NotificationService);
  
  authService = inject(AuthService);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      const path = url.split('?')[0];
      const isHidden = ['/login', '/register', '/not-found', '/'].some(route => path === route || path.startsWith(route + '/'));
      this.showNavbar.set(!isHidden);
    });
  }
}
