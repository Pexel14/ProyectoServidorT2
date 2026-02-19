import { Injectable } from "@angular/core";
import { supabase } from "../../../lib/supabase";

@Injectable({ providedIn: 'root' })

export class UserService {
    private userKey: string = 'user'

    constructor() {}

    getUser() {
        // Recupera el usuario del localStorage.
        const userData = localStorage.getItem(this.userKey)
        if (userData) {
            return JSON.parse(userData)
        }
        return null
    }

    // Lista usuarios para la administracion
    getUsers() {
        const users = supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, role, created_at')
        return users
    }

    //Busca un usuario por id
    getUserById(id: string) {
        const user = supabase.from('profiles').select('*').eq('id', id).single()
        return user
    }

    // Actualiza el perfil de un usuario concreto por id
    updateUser(id: string, data: Partial<{ email: string, full_name: string, avatar_url: string | null, role: 'admin' | 'user' }>) {
        const updatedUser = supabase.from('profiles').update(data).eq('id', id).select().single()
        return updatedUser
    }

    // Elimina un usuario por id
    deleteUser(id: string) {
        const deletedUser = supabase.from('profiles').delete().eq('id', id).single()
        return deletedUser
    }

    //Mete un usuario en el localStorage
    setUser(user: any) {
        localStorage.setItem(this.userKey, JSON.stringify(user))
    }

    clearUser() {
        localStorage.removeItem(this.userKey)
    }
}