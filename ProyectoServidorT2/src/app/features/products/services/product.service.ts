import { Injectable } from '@angular/core';
import { supabase } from '../../../lib/supabase';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  /**
   * Obtiene todos los productos desde la base de datos.
   * Mapea los campos de español (DB) a inglés (Modelo).
   * @returns Promesa con Array de Productos
   */
  async getProducts(): Promise<Product[]> {
    // La tabla se llama 'Productos' (con mayúscula)
    const { data, error } = await supabase.from('Productos').select('*');

    if (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }

    const mappedData = (data || []).map((item: any) => ({
      id: Number(item.id),
      name: item.nombre || item.name,
      price: typeof item.precio === 'string' ? parseFloat(item.precio) : (item.precio || item.price || 0),
      quantity: item.cantidad ?? item.quantity ?? item.stock ?? 0,
      image: item.imagen || item.image || 'https://placehold.co/400x300?text=Sin+Imagen'
    }));

    console.log('Productos procesados:', mappedData);
    return mappedData;
  }

  /**
   * Obtiene un producto individual por su ID.
   * @param id ID del producto
   * @returns Promesa con el Producto o null si hay error
   */
  async getProductById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
      .from('Productos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener producto:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.nombre || data.name,
      price: typeof data.precio === 'string' ? parseFloat(data.precio) : (data.precio || 0),
      quantity: data.cantidad ?? data.quantity ?? 0,
      image: data.imagen || data.image || ''
    };
  }

  /**
   * Crea un nuevo producto en la base de datos.
   * @param product Objeto producto sin ID
   * @returns Promesa con el ID del nuevo producto
   */
  async createProduct(product: Omit<Product, 'id'>): Promise<number> {
    // Map to DB columns (Spanish)
    const dbProduct = {
      nombre: product.name,
      precio: product.price,
      cantidad: product.quantity,
      imagen: product.image
    };

    const { data, error } = await supabase
      .from('Productos')
      .insert([dbProduct])
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id;
  }

  /**
   * Actualiza un producto existente.
   * @param id ID del producto a actualizar
   * @param product Campos a actualizar
   */
  async updateProduct(id: number, product: Partial<Product>): Promise<void> {
    const dbProduct: any = {};
    if (product.name) dbProduct.nombre = product.name;
    if (product.price) dbProduct.precio = product.price;
    if (product.quantity !== undefined) dbProduct.cantidad = product.quantity;
    if (product.image) dbProduct.imagen = product.image;

    const { error } = await supabase
      .from('Productos')
      .update(dbProduct)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Elimina un producto de la base de datos por su ID.
   * @param id ID del producto
   */
  async deleteProduct(id: number): Promise<void> {
    console.log(id)
    const { error } = await supabase
      .from('Productos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
