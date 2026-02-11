import { Injectable } from "@angular/core";
import { supabase } from "../../../lib/supabase";

@Injectable({ providedIn: 'root' })

export class UserService {
    private userKey: string = 'user'

    constructor() {}

    getUser() {
        const userData = localStorage.getItem(this.userKey)
        if (userData) {
            return JSON.parse(userData)
        }
        return null
    }

    getUsers() {
        const users = supabase.from('users').select('*')
        return users
    }

    getUserById(id: string) {
        const user = supabase.from('users').select('*').eq('id', id).single()
        return user
    }

    updateUser(id: string, data: Partial<{ email: string, full_name: string, avatar_url: string }>) {
        const updatedUser = supabase.from('users').update(data).eq('id', id).single()
        return updatedUser
    }

    deleteUser(id: string) {
        const deletedUser = supabase.from('users').delete().eq('id', id).single()
        return deletedUser
    }

    setUser(user: any) {
        localStorage.setItem(this.userKey, JSON.stringify(user))
    }

    clearUser() {
        localStorage.removeItem(this.userKey)
    }
}