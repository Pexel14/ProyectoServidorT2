import { Component, OnInit } from '@angular/core';
import { LoginForm } from "../../components/login-form/login-form";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [LoginForm, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit {
  email: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  // Escucha query params para recuperar email tras registrar
  ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });

    void this.authService.clearSessionForLogin();
  }

  // Permite navegación pública al catálogo de productos sin sesión activa
  async enterAsGuest(): Promise<void> {
    await this.authService.clearSessionForLogin();
    this.router.navigate(['/productos']);
  }
}
