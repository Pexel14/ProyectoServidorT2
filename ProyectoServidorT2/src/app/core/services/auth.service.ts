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
        // Escucha de cambios de estado segura
        supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                await this.updateLocalUserState(session);
            }

            if (event === 'SIGNED_OUT') {
                this.handleLogoutCleanup();
            }
        });

        this.initSession();
    }

    private async initSession() {
        try {
            // Obtenemos la respuesta completa sin desestructurar para evitar el crash
            const response = await supabase.auth.getSession();
            
            if (response && response.data && response.data.session) {
                await this.updateLocalUserState(response.data.session);
            }
        } catch (error) {
            console.error('Error al inicializar sesión:', error);
        }
    }

    private async updateLocalUserState(session: Session) {
        try {
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
        } catch (err) {
            console.error('Error actualizando estado de usuario:', err);
        }
    }

    private handleLogoutCleanup() {
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!this.isManualLogout) {
            this.notificationService.show('Tu sesión ha expirado', 'error');
        }
        this.isManualLogout = false;
        this.router.navigate(['/login']);
    }

    /**
     * Verifica si existe una sesión activa en Supabase.
     * @returns `true` si hay sesión válida, `false` en caso contrario.
     */
    async checkSession(): Promise<boolean> {
        try {
            const { data } = await supabase.auth.getSession();
            return !!(data && data.session);
        } catch {
            return false;
        }
    }

    /**
     * Alias de `checkSession()`. Comprueba si el usuario está autenticado.
     * @returns `true` si hay sesión activa, `false` en caso contrario.
     */
    async isAuthenticated(): Promise<boolean> {
        return this.checkSession();
    }

    /**
     * Registra un nuevo usuario en Supabase Auth y crea su perfil en la tabla `profiles`.
     * @param email - Correo electrónico del usuario.
     * @param password - Contraseña (mínimo 6 caracteres).
     * @param name - Nombre opcional. Si se omite, se deduce del email.
     * @returns `AuthResponse` con el token JWT y los datos del usuario creado.
     * @throws Error si Supabase devuelve un error de registro.
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

    /**
     * Autentica al usuario contra Supabase Auth.
     * Recupera el perfil de la tabla `profiles` y almacena el token en localStorage.
     * @param email - Correo electrónico del usuario.
     * @param password - Contraseña del usuario.
     * @returns `AuthResponse` con el token JWT y los datos del usuario autenticado.
     * @throws Error si las credenciales son incorrectas o Supabase falla.
     */
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

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.setUserSession(data.session?.access_token || '', this.user);

        return {
            token: data.session?.access_token || '',
            user: this.user
        };
    }

    /**
     * Actualiza el nombre y/o avatar del usuario autenticado.
     * Modifica tanto la tabla `profiles` como los metadatos de Supabase Auth.
     * @param name - Nuevo nombre completo del usuario.
     * @param avatar - URL pública del nuevo avatar (opcional).
     * @returns `AuthUser` actualizado con los nuevos datos.
     * @throws Error si no hay usuario autenticado o falla la actualización en BD.
     */
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

    /**
     * Cierra la sesión del usuario en Supabase y limpia el localStorage.
     * Redirige automáticamente a `/login`.
     */
    async logout() {
        this.isManualLogout = true;
        await supabase.auth.signOut();
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
    }

    /**
     * Suscribe un callback a los cambios de estado de autenticación de Supabase.
     * Se invoca al iniciar sesión, cerrar sesión o refrescar el token.
     * @param callback - Función que recibe el `AuthUser` actualizado o `null` si no hay sesión.
     */
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

    /**
     * Obtiene el usuario actualmente autenticado consultando Supabase Auth y la tabla `profiles`.
     * Actualiza el estado local y el localStorage con los datos más recientes.
     * @returns `AuthUser` si hay sesión activa, `null` en caso contrario.
     */
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

    /**
     * Persiste el token JWT y los datos del usuario en localStorage.
     * @param token - Token de acceso JWT de la sesión de Supabase.
     * @param user - Objeto `AuthUser` con los datos del usuario autenticado.
     */
    setUserSession(token: string, user: AuthUser) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }
}