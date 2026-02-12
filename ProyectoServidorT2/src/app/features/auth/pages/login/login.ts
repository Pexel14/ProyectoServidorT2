import { Component, OnInit } from '@angular/core';
import { LoginForm } from "../../components/login-form/login-form";
import { ActivatedRoute, RouterLink } from "@angular/router";

@Component({
  selector: 'app-login',
  imports: [LoginForm, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit {
  email: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }
}
