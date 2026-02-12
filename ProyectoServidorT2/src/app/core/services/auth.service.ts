import { Injectable } from "@angular/core"
import { supabase } from "../../lib/supabase"

export type AuthUser = {
    id: string,
    name: string,
    email: string | undefined,
    role: "admin" | "user",
    avatar?: string
}

export type AuthResponse = {
    token: string,
    user: AuthUser
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private user: AuthUser | null = null

    async register(email: string, password: string, name: string | null = null): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name || email.split('@')[0], role: 'user' } } })
        if (error) {
            throw new Error(error.message)
        }
        this.user = {
            id: data.user?.id || '',
            name: data.user?.user_metadata['name'] || '',
            email: data.user?.email || '',
            role: data.user?.user_metadata['role'] || 'user',
            avatar: data.user?.user_metadata['avatar_url']
        }
        return {
            token: data.session?.access_token || '',
            user: this.user
        }
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            throw new Error(error.message)
        }
        this.user = {
            id: data.user?.id || '',
            name: data.user?.user_metadata['name'] || '',
            email: data.user?.email || '',
            role: data.user?.user_metadata['role'] || 'user',
            avatar: data.user?.user_metadata['avatar_url']
        }
        return {
            token: data.session?.access_token || '',
            user: this.user
        }
    }

    async updateProfile(name: string, avatar?: string): Promise<AuthUser> {
        const { data, error } = await supabase.auth.updateUser({
            data: { name, avatar_url: avatar }
        });

        if (error) throw new Error(error.message);
        
        if (data.user) {
             this.user = {
                id: data.user.id,
                name: data.user.user_metadata['name'] || '',
                email: data.user.email,
                role: data.user.user_metadata['role'] || 'user',
                avatar: data.user.user_metadata['avatar_url']
            };
            const currentToken = localStorage.getItem('token');
            if (currentToken) {
                this.setUserSession(currentToken, this.user);
            }
            return this.user;
        }
        throw new Error('No user updated');
    }

    async logout() {
        const { error } = await supabase.auth.signOut()
        if (error) {
            throw new Error(error.message)
        }
        this.user = null
    }

    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                this.user = {
                    id: session.user.id,
                    name: session.user.user_metadata['name'] || '',
                    email: session.user.email || '',
                    role: session.user.user_metadata['role'] || 'user',
                    avatar: session.user.user_metadata['avatar_url']
                }
                callback(this.user)
            } else {
                this.user = null
                callback(null)
            }
        })
    }

    async getCurrentUser(): Promise<AuthUser | null> {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
            throw new Error(error.message)
        }
        if (data.user) {
            this.user = {
                id: data.user.id,
                name: data.user.user_metadata['name'] || '',
                email: data.user.email || '',
                role: data.user.user_metadata['role'] || 'user',
                avatar: data.user.user_metadata['avatar_url']
            }
            return this.user
        }
        return null
    }

    setUserSession(token: string, user: AuthUser) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
    }
}