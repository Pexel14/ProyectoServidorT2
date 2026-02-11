import { Injectable } from "@angular/core"
import { supabase } from "../../lib/supabase"

export type AuthUser = {
    id: string,
    name: string,
    email: string | undefined,
    role: "admin" | "user"
}

export type AuthResponse = {
    token: string,
    user: AuthUser
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private user: AuthUser | null = null

    async register(email: string, password: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: email.split('@')[0], role: 'user' } } })
        if (error) {
            throw new Error(error.message)
        }
        this.user = {
            id: data.user?.id || '',
            name: data.user?.user_metadata['name'] || '',
            email: data.user?.email || '',
            role: data.user?.user_metadata['role'] || 'user'
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
            role: data.user?.user_metadata['role'] || 'user'
        }
        return {
            token: data.session?.access_token || '',
            user: this.user
        }
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
                    role: session.user.user_metadata['role'] || 'user'
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
                role: data.user.user_metadata['role'] || 'user'
            }
            return this.user
        }
        return null
    }
}