import { Injectable } from "@angular/core"
import { supabase } from "../../lib/supabase"

export type StorageFile = {
    name: string,
    id: string,
    updated_at: string,
    metadata?: Record<string, any>
}

export type UploadResponse = {
    path: string,
    url: string
}

@Injectable({ providedIn: 'root' })
export class StorageService {
    private bucket: string = 'avatars'

    async uploadFile(file: File, path: string, options: { upsert?: boolean } = {}): Promise<UploadResponse> {
        const filePath = path ? `${path}/${file.name}` : file.name
        const { data, error } = await supabase.storage
            .from(this.bucket)
            .upload(filePath, file, { upsert: options.upsert ?? false })
        
        if (error) {
            throw new Error(error.message)
        }

        const url = this.getPublicUrl(data.path)
        return {
            path: data.path,
            url: url
        }
    }

    async deleteFile(path: string): Promise<void> {
        const { error } = await supabase.storage
            .from(this.bucket)
            .remove([path])
        
        if (error) {
            throw new Error(error.message)
        }
    }

    async listFiles(path: string): Promise<StorageFile[]> {
        const { data, error } = await supabase.storage
            .from(this.bucket)
            .list(path)
        
        if (error) {
            throw new Error(error.message)
        }

        return data.map(file => ({
            name: file.name,
            id: file.id,
            updated_at: file.updated_at,
            metadata: file.metadata
        }))
    }

    async downloadFile(path: string): Promise<Blob> {
        const { data, error } = await supabase.storage
            .from(this.bucket)
            .download(path)
        
        if (error) {
            throw new Error(error.message)
        }

        return data
    }

    getPublicUrl(path: string): string {
        const { data } = supabase.storage
            .from(this.bucket)
            .getPublicUrl(path)
        
        return data.publicUrl
    }

    async updateFile(oldPath: string, newFile: File): Promise<UploadResponse> {
        await this.deleteFile(oldPath)
        return this.uploadFile(newFile, oldPath.substring(0, oldPath.lastIndexOf('/')))
    }
}
