// Contrato tipado del usuario usado en el front.
export type User = {
    id: string,
    email: string,
    full_name: string | null,
    avatar_url: string | null,
    role: 'admin' | 'user',
    updated_at: Date | null,
    created_at: Date,
}