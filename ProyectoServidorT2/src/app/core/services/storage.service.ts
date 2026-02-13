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
    public readonly BUCKET_AVATARS = 'avatars'
    public readonly BUCKET_PRODUCTS = 'products'
    private bucket: string = this.BUCKET_AVATARS

    async uploadFile(file: File, path: string, options: { upsert?: boolean, bucket?: string, fileName?: string } = {}): Promise<UploadResponse> {
        let fileName = options.fileName ?? file.name;
        // Sanitize filename to avoid spaces if not provided explicitly
        if (!options.fileName) {
            fileName = fileName.replace(/\s+/g, '_');
        }

        const filePath = path ? `${path}/${fileName}` : fileName;
        const bucket = options.bucket ?? this.bucket;
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { upsert: options.upsert ?? false })
        
        if (error) {
            throw new Error(error.message)
        }

        const url = this.getPublicUrl(data.path, bucket)
        return {
            path: data.path,
            url: url
        }
    }

    async deleteFile(path: string, bucket?: string): Promise<void> {
        const targetBucket = bucket ?? this.bucket;
        const { error } = await supabase.storage
            .from(targetBucket)
            .remove([path])
        
        if (error) {
            throw new Error(error.message)
        }
    }

    async listFiles(path: string, bucket?: string): Promise<StorageFile[]> {
        const targetBucket = bucket ?? this.bucket;
        const { data, error } = await supabase.storage
            .from(targetBucket)
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

    async downloadFile(path: string, bucket?: string): Promise<Blob> {
        const targetBucket = bucket ?? this.bucket;
        const { data, error } = await supabase.storage
            .from(targetBucket)
            .download(path)
        
        if (error) {
            throw new Error(error.message)
        }

        return data
    }

    getPublicUrl(path: string, bucket?: string): string {
        const targetBucket = bucket ?? this.bucket;
        const { data } = supabase.storage
            .from(targetBucket)
            .getPublicUrl(path)
        
        return data.publicUrl
    }

    async updateFile(oldPath: string, newFile: File, bucket?: string): Promise<UploadResponse> {
        await this.deleteFile(oldPath, bucket)
        return this.uploadFile(newFile, oldPath.substring(0, oldPath.lastIndexOf('/')), { bucket })
    }
}
