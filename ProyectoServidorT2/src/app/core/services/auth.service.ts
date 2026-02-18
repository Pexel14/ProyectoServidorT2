import { Injectable, inject } from "@angular/core"
import { supabase } from "../../lib/supabase"
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

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
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                this.user = null;
                if (!this.isManualLogout) {
                     this.notificationService.show('Tu sesión ha expirado', 'error');
                }
                this.isManualLogout = false; // Reset flag
                this.router.navigate(['/login']);
            }
        });

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If we are on a protected route, we might want to redirect.
                // But Guards handle that.
                // This is mainly to set internal state if needed.
                this.user = null;
            } else {
                 // Set user if valid
                 this.getCurrentUser();
            }
        });
    }

    /**
     * Check session validity.
     * To be called by guards or interceptors.
     */
    async checkSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
             this.notificationService.show('Tu sesión ha expirado', 'error');
             this.logout();
             return false;
        }
        return true;
    }



    // Helper to start monitoring session
    initSessionCheck() {
       // This checks if the session is valid on app start
       supabase.auth.getSession().then(({ data: { session } }) => {
           if (!session) {
               // No session logic
           } 
       });
    }

    /**
     * Registra un nuevo usuario en la aplicación y crea su perfil asociado.
     * @param email Email del usuario
     * @param password Contraseña
     * @param name Nombre opcional (si no se provee se deriva del email)
     * @returns Una promesa con la respuesta de autenticación (token y usuario)
     */
    async register(email: string, password: string, name: string | null = null): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password, 
            options: { 
                data: { 
                    name: name || email.split('@')[0]
                } 
            } 
        })
        if (error) {
            throw new Error(error.message)
        }

        // Create Profile explicitly
        if (data.user) {
            const fullName = name || email.split('@')[0];
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    role: 'user', // Default role
                    avatar_url: null,
                    created_at: new Date().toISOString()
                });
            
            if (profileError) {
                console.error('Error creating profile entry:', profileError);
                // Continue anyway, maybe it was created by a trigger?
            }

            this.user = {
                id: data.user.id,
                name: fullName,
                email: data.user.email || '',
                role: 'user',
                avatar: undefined,
                created_at: data.user.created_at
            }
        }

        return {
            token: data.session?.access_token || '',
            user: this.user!
        }
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            throw new Error(error.message)
        }

        // Fetch user profile from 'profiles' table
        let profileData = null;
        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            profileData = profile;
        }

        this.user = {
            id: data.user?.id || '',
            name: profileData?.full_name || data.user?.user_metadata['name'] || '',
            email: data.user?.email || '',
            role: profileData?.role || 'user',
            avatar: profileData?.avatar_url || data.user?.user_metadata['avatar_url'],
            created_at: data.user?.created_at
        }
        
        // Update local storage
        this.setUserSession(data.session?.access_token || '', this.user);

        return {
            token: data.session?.access_token || '',
            user: this.user
        }
    }

    async updateProfile(name: string, avatar?: string): Promise<AuthUser> {
        if (!this.user?.id) {
            // Try to recover user from session
            await this.getCurrentUser();
        }

        if (!this.user?.id) throw new Error('No user logged in');

        const updatePayload: { full_name: string; avatar_url?: string | null } = {
            full_name: name
        };

        if (avatar !== undefined) {
            updatePayload.avatar_url = avatar;
        }

        // Update profiles table
        const { data, error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', this.user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        
        // Optional sync to auth metadata; do not block profile update UX if this fails.
        const metadataPayload: Record<string, string | undefined> = { name };
        if (avatar !== undefined) {
            metadataPayload['avatar_url'] = avatar;
        }

        supabase.auth.updateUser({
            data: metadataPayload
        }).catch((metadataError) => {
            console.error('Auth metadata sync error:', metadataError);
        });

        if (data) {
             this.user = {
                ...this.user,
                name: data.full_name,
                avatar: data.avatar_url,
                role: data.role // Ensure role is preserved/updated
            };

            localStorage.setItem('user', JSON.stringify(this.user));
            return this.user;
        }
        throw new Error('No user updated');
    }


    /**
     * Cierra la sesión del usuario actual y limpia el estado local.
     */
    async logout() {
        this.isManualLogout = true;
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Logout error', error);
        }
        this.user = null;
        // Navigation is handled by onAuthStateChange, but we can force it here too just in case
        this.router.navigate(['/login']);
    }

    /**
     * Se suscribe a cambios en el estado de autenticación (login, logout, token refresh).
     * @param callback Función a ejecutar cuando cambia el estado
     */
    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Try to get profile data if possible, otherwise fall back to metadata
                // Since this callback is often used for redirects, we might want to be fast or accurate.
                // Doing an async call here is fine.
                
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                this.user = {
                    id: session.user.id,
                    name: profile?.full_name || session.user.user_metadata['name'] || '',
                    email: session.user.email || '',
                    role: profile?.role || session.user.app_metadata['role'] || 'user',
                    avatar: profile?.avatar_url || session.user.user_metadata['avatar_url'],
                    created_at: session.user.created_at
                }
                callback(this.user)
            } else {
                this.user = null
                callback(null)
            }
        })
    }

    async getCurrentUser(): Promise<AuthUser | null> {
        const { data: authData, error } = await supabase.auth.getUser()
        if (error || !authData.user) {
            return null
        }
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        this.user = {
            id: authData.user.id,
            name: profile?.full_name || authData.user.user_metadata['name'] || '',
            email: authData.user.email || '',
            role: profile?.role || authData.user.app_metadata['role'] || 'user',
            avatar: profile?.avatar_url || authData.user.user_metadata['avatar_url'],
            created_at: authData.user.created_at
        }

        localStorage.setItem('user', JSON.stringify(this.user))
        return this.user
    }

    setUserSession(token: string, user: AuthUser) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
    }
}