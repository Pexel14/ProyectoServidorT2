import { Component } from '@angular/core';
import { RegisterFormComponent } from '../../components/register-form-component/register-form-component';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-register',
  imports: [RegisterFormComponent, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {

}
