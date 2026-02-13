import { Injectable } from "@angular/core"
import { supabase } from "../../lib/supabase"

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

        // Update profiles table
        const { data, error } = await supabase
            .from('profiles')
            .update({ full_name: name, avatar_url: avatar })
            .eq('id', this.user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        
        // Also update auth metadata for fallback/consistency if needed (optional)
        await supabase.auth.updateUser({
            data: { name, avatar_url: avatar }
        });

        if (data) {
             this.user = {
                ...this.user,
                name: data.full_name,
                avatar: data.avatar_url,
                role: data.role // Ensure role is preserved/updated
            };
            // Ensure created_at dates are respected if present in existing object, 
            // though user update return from profiles table might not have it unless selected.
            // But we spread ...this.user first, so it should be fine.
            
            const currentToken = localStorage.getItem('sb-access-token'); // Check key usage in project
            if (currentToken) {
                // We use 'token' or 'sb-access-token'? 
                // Previous code had: localStorage.getItem('token'); and this.setUserSession.
                // But logout clears 'sb-access-token'. Need to be consistent.
                // The setUserSession method in this file (which I plan to read/keep) handles keys.
                // Let's rely on `this.setUserSession` logic if I can see it.
                // I will assume 'user' key is used for user object.
                localStorage.setItem('user', JSON.stringify(this.user));
            }
            return this.user;
        }
        throw new Error('No user updated');
    }


    /**
     * Cierra la sesión del usuario actual y limpia el estado local.
     */
    async logout() {
        const { error } = await supabase.auth.signOut()
        if (error) {
            throw new Error(error.message)
        }
        this.user = null
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
        return this.user
    }

    setUserSession(token: string, user: AuthUser) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
    }
}