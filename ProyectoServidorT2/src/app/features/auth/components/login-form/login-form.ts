import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertCard } from '../../../../shared/components/alert-card/alert-card';
import { getErrorMessage } from '../../../../core/utils/error-messages.util';

@Component({
  selector: 'app-login-form',
  imports: [CommonModule, ReactiveFormsModule, AlertCard],
  templateUrl: './login-form.html',
  styleUrls: ['./login-form.scss'],
})
export class LoginForm implements OnChanges {
  @Input() prefilledEmail: string | null = null;
  loginForm: FormGroup
  alertMessage = signal<string | null>(null)
  alertType = signal<'success' | 'error'>('success')
  alertVisible = signal(false)

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    })
  }

  onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value
      this.authService.login(email, password)
        .then(({ token, user }) => {
          this.showAlert('success', 'Inicio de sesion correcto')
          console.log("Usuario" + user.name + " con rol " + user.role + " ha iniciado sesión.")
          if (user.role === 'admin') {
            this.router.navigate(['/admin/productos'])
          } else {
            this.router.navigate(['/productos'])
          }
        })
        .catch(err => {
          this.showAlert('error', getErrorMessage(err))
        })
    } else {
      this.showAlert('error', 'Rellena todos los campos correctamente')
    }
  }

  onAlertDismiss(): void {
    this.alertVisible.set(false)
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['prefilledEmail'] && this.prefilledEmail) {
      this.loginForm.patchValue({ email: this.prefilledEmail });
    }
  }

  private showAlert(type: 'success' | 'error', message: string): void {
    this.alertType.set(type)
    this.alertMessage.set(message)
    this.alertVisible.set(true)
  }
}
