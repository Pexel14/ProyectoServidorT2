import { Component, OnInit } from '@angular/core';
import { LoginForm } from "../../components/login-form/login-form";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Router } from '@angular/router';
import { supabase } from '../../../../lib/supabase';

@Component({
  selector: 'app-login',
  imports: [LoginForm, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit {
  email: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }

  async enterAsGuest(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    this.router.navigate(['/productos']);
  }
}
