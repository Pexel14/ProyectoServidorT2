import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-form',
  imports: [],
  templateUrl: './login-form.html',
  styleUrls: ['./login-form.scss'],
})
export class LoginForm {
  loginForm: FormGroup
  errorMessage = signal<string | null>(null)

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    })
  }

  onLogin() {
    if (this.loginForm.valid) {
      const { email, password, remember } = this.loginForm.value
      this.authService.login(email, password)
        .then(({ token, user }) => {
          this.authService.setUserSession(token, user)
          this.errorMessage.set(null)
        })
        .catch(err => {
          this.errorMessage.set(err.message || 'Error al iniciar sesión')
        })
    } else {
      this.errorMessage.set('Rellena todos los campos correctamente')
    }
  }
}
