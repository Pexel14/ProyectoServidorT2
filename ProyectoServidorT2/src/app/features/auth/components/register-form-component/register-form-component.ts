import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register-form-component',
  imports: [],
  templateUrl: './register-form-component.html',
  styleUrls: ['./register-form-component.scss'],
})
export class RegisterFormComponent {
  formGroup: FormGroup

  constructor(private fb: FormBuilder, private authService: AuthService) {
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
          alert('Registro exitoso, ahora puedes iniciar sesión')
          this.formGroup.reset()
        })
        .catch(err => {
          alert(err.message || 'Error al registrar usuario')
        })
    } else {
      alert('Rellena todos los campos correctamente')
    }
  }
}
