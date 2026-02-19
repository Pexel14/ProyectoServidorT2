import { Injectable, inject } from "@angular/core"
import { supabase } from "../../lib/supabase"
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export type AuthUser = {
    id: string,
    name: string,
    email: string | undefined,
    role: "admin" | "user",
    avatar?: string,
    created_at?: string
}

export type AuthResponse = {
    token: string,
    user: AuthUser
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private user: AuthUser | null = null
    private router = inject(Router);
    private notificationService = inject(NotificationService);
    private isManualLogout = false;

    constructor() {
        supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                await this.updateLocalUserState(session);
            }

            if (event === 'SIGNED_OUT') {
                this.user = null;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (!this.isManualLogout) {
                    this.notificationService.show('Tu sesión ha expirado', 'error');
                }
                this.isManualLogout = false;
                this.router.navigate(['/login']);
            }
            
            if (event === 'TOKEN_REFRESHED' && session) {
                this.setUserSession(session.access_token, this.user!);
            }
        });

        this.initSession();
    }

    private async initSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await this.updateLocalUserState(session);
        } else {
            this.user = null;
        }
    }

    private async updateLocalUserState(session: Session) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        this.user = {
            id: session.user.id,
            name: profile?.full_name || session.user.user_metadata['name'] || '',
            email: session.user.email || '',
            role: profile?.role || 'user',
            avatar: profile?.avatar_url || session.user.user_metadata['avatar_url'],
            created_at: session.user.created_at
        };

        this.setUserSession(session.access_token, this.user);
    }

    async checkSession(): Promise<boolean> {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            this.user = null;
            return false;
        }
        return true;
    }

    async register(email: string, password: string, name: string | null = null): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password, 
            options: { 
                data: { 
                    name: name || email.split('@')[0]
                } 
            } 
        });

        if (error) throw new Error(error.message);

        if (data.user) {
            const fullName = name || email.split('@')[0];
            await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    role: 'user',
                    created_at: new Date().toISOString()
                });

            this.user = {
                id: data.user.id,
                name: fullName,
                email: data.user.email || '',
                role: 'user',
                created_at: data.user.created_at
            };
        }

        return {
            token: data.session?.access_token || '',
            user: this.user!
        };
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        this.user = {
            id: data.user.id,
            name: profile?.full_name || data.user.user_metadata['name'] || '',
            email: data.user.email || '',
            role: profile?.role || 'user',
            avatar: profile?.avatar_url || data.user.user_metadata['avatar_url'],
            created_at: data.user.created_at
        };
        
        this.setUserSession(data.session?.access_token || '', this.user);

        return {
            token: data.session?.access_token || '',
            user: this.user
        };
    }

    async updateProfile(name: string, avatar?: string): Promise<AuthUser> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const updatePayload: any = { full_name: name };
        if (avatar !== undefined) updatePayload.avatar_url = avatar;

        const { data, error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await supabase.auth.updateUser({
            data: { name, avatar_url: avatar }
        });

        this.user = {
            ...this.user!,
            name: data.full_name,
            avatar: data.avatar_url,
            role: data.role
        };

        localStorage.setItem('user', JSON.stringify(this.user));
        return this.user;
    }

    async logout() {
        this.isManualLogout = true;
        await supabase.auth.signOut();
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
    }

    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                this.user = {
                    id: session.user.id,
                    name: profile?.full_name || session.user.user_metadata['name'] || '',
                    email: session.user.email || '',
                    role: profile?.role || 'user',
                    avatar: profile?.avatar_url || session.user.user_metadata['avatar_url'],
                    created_at: session.user.created_at
                };
                callback(this.user);
            } else {
                this.user = null;
                callback(null);
            }
        });
    }

    async getCurrentUser(): Promise<AuthUser | null> {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        this.user = {
            id: user.id,
            name: profile?.full_name || user.user_metadata['name'] || '',
            email: user.email || '',
            role: profile?.role || 'user',
            avatar: profile?.avatar_url || user.user_metadata['avatar_url'],
            created_at: user.created_at
        };

        localStorage.setItem('user', JSON.stringify(this.user));
        return this.user;
    }

    setUserSession(token: string, user: AuthUser) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }
}