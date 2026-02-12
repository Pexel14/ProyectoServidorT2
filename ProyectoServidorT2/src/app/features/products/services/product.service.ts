import { Injectable } from '@angular/core';
import { supabase } from '../../../lib/supabase';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  async getProducts(): Promise<Product[]> {
    // La tabla se llama 'Productos' (con mayúscula)
    const { data, error } = await supabase.from('Productos').select('*');

    if (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }

    const mappedData = (data || []).map((item: any) => ({
      id: item.id,
      name: item.nombre || item.name,
      description: item.descripcion || item.description,
      price: typeof item.precio === 'string' ? parseFloat(item.precio) : (item.precio || item.price || 0),
      quantity: item.cantidad ?? item.quantity ?? item.stock ?? 0,
      image: item.imagen || item.image || 'https://placehold.co/400x300?text=Sin+Imagen'
    }));

    console.log('Productos procesados:', mappedData);
    return mappedData;
  }
}
