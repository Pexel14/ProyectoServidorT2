import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertCard } from '../../../../shared/components/alert-card/alert-card';
import { getErrorMessage } from '../../../../core/utils/error-messages.util';

@Component({
  selector: 'app-register-form-component',
  imports: [CommonModule, ReactiveFormsModule, AlertCard],
  templateUrl: './register-form-component.html',
  styleUrls: ['./register-form-component.scss'],
})
export class RegisterFormComponent {
  formGroup: FormGroup
  alertMessage = signal<string | null>(null)
  alertType = signal<'success' | 'error'>('success')
  alertVisible = signal(false)

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.formGroup = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    }, { validators: this.passwordsMatch })
  }

  private passwordsMatch(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onRegister() {
    if (this.formGroup.valid) {
      const { name, email, password } = this.formGroup.value
      this.authService.register(email, password, name)
        .then(() => {
          this.showAlert('success', 'Registro exitoso, redirigiendo a login...')
          setTimeout(() => {
            this.router.navigate(['/login'], { queryParams: { email } })
          }, 3000)
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

  private showAlert(type: 'success' | 'error', message: string): void {
    this.alertType.set(type)
    this.alertMessage.set(message)
    this.alertVisible.set(true)
  }
}
