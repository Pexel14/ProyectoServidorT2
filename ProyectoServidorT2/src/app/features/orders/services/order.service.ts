import { Injectable } from '@angular/core';
import { supabase } from '../../../lib/supabase';
import { CartItem } from '../../products/services/cart.service';
import { OrderFormDetails } from '../models/orderFormDetails.model';
import { OrderFilters } from '../models/orderFilter.model';



@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
  async createOrder(items: CartItem[], totalAmount: number, details: OrderFormDetails): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // 1. Prepare address fields
    // Append piso/puerta to numero since they don't have dedicated columns
    let numeroCompleto = details.numero;
    if (details.piso?.trim()) numeroCompleto += `, Piso ${details.piso}`;
    if (details.puerta?.trim()) numeroCompleto += `, Puerta ${details.puerta}`;

    // 2. Insert Header (Pedidos)
    // Using columns from the provided schema: id_user, state, calle, numero, etc.
    const { data: orderData, error: orderError } = await supabase
      .from('Pedidos')
      .insert({
        id_user: user.id,
        state: 'En espera',
        total: totalAmount,
        calle: details.calle,
        numero: numeroCompleto,
        codigo_postal: details.codigo_postal,
        provincia: details.provincia,
        ciudad: details.ciudad,
        observaciones: details.observaciones
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order header:', orderError);
      throw orderError;
    }

    const orderId = orderData.id;

    // 3. Insert Details (Pedido_items)
    // Mapping CartItem to Pedido_items columns: pedido_id, producto_id, cantidad, precio_unitario
    const lineItems = items.map(item => ({
      pedido_id: orderId,
      producto_id: item.id,
      cantidad: item.quantityInCart,
      precio_unitario: item.price
    }));

    const { error: detailsError } = await supabase
      .from('Pedido_items')
      .insert(lineItems);

    if (detailsError) {
      console.error('Error creating order details:', detailsError);
      // Ideally rollback order header here
      throw detailsError;
    }
  }

  async getOrders(filters?: OrderFilters): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('Pedidos')
      .select('id, created_at, total, state')
      .eq('id_user', user.id);

    if (filters) {
      if (filters.state) {
        query = query.eq('state', filters.state);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        // Add one day to include the end date fully if it's just a date string, 
        // or just rely on the user providing specific timestamp. 
        // Assuming YYYY-MM-DD from input, we might want to extend it to end of day.
        // For simplicity, let's just use user input.
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.minPrice !== undefined && filters.minPrice !== null) {
        query = query.gte('total', filters.minPrice);
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
        query = query.lte('total', filters.maxPrice);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
    return data || [];
  }

  async getOrderDetails(orderId: number): Promise<any> {
    const { data, error } = await supabase
      .from('Pedidos')
      .select(`
        *,
        items:Pedido_items (
          *,
          product:Productos (*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
    return data;
  }

  async cancelOrder(orderId: number): Promise<void> {
    const { error } = await supabase
      .from('Pedidos')
      .update({ state: 'Cancelado' })
      .eq('id', orderId);

    if (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }
}
