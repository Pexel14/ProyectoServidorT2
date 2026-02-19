import { Injectable } from '@angular/core';
import { supabase } from '../../../lib/supabase';
import { CartItem } from '../../products/services/cart.service';
import { OrderFormDetails } from '../models/orderFormDetails.model';
import { OrderFilters } from '../models/orderFilter.model';



@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
  // Persiste primero la cabecera y después las líneas del pedido
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

  // Obtiene pedidos del usuario autenticado aplicando filtros opcionales
  async getOrders(filters?: OrderFilters): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];
    const user = session.user;

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

  async getOrdersByUserId(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('Pedidos')
      .select('id, created_at, total, state')
      .eq('id_user', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
    return data || [];
  }

  // Vista admin: enriquece pedidos con datos de perfil del comprador
  async getAllOrders(filters?: OrderFilters): Promise<any[]> {
    let query = supabase
      .from('Pedidos')
      .select('*');

    if (filters) {
      if (filters.state) {
        query = query.eq('state', filters.state);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.minPrice !== undefined && filters.minPrice !== null) {
        query = query.gte('total', filters.minPrice);
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
        query = query.lte('total', filters.maxPrice);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
       console.error('Error fetching all orders:', error);
       throw error;
    }

    const orders = data || [];
    const userIds = [...new Set(orders.map((order: any) => order.id_user).filter(Boolean))];

    const profilesById = new Map<string, { full_name?: string | null; avatar_url?: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles for orders:', profilesError);
      } else {
        (profiles || []).forEach((profile: any) => {
          profilesById.set(profile.id, {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          });
        });
      }
    }

    return orders.map((order: any) => {
      const profile = profilesById.get(order.id_user);
      return {
        ...order,
        user_name: profile?.full_name || 'Usuario desconocido',
        user_avatar: profile?.avatar_url || 'https://placehold.co/100x100?text=?'
      };
    });
  }

  async updateOrderStatus(orderId: number, status: string): Promise<void> {
    console.log('Updating order status:', orderId, status);
    const { data, error } = await supabase
      .from('Pedidos')
      .update({ state: status })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    if (data && data.length === 0) {
      console.warn('No order updated. Check RLS policies or if ID exists.');
      // Optionally throw an error if you want the UI to know
      throw new Error('No se pudo actualizar el pedido. Verifique permisos o existencia.');
    }
    
    console.log('Order updated successfully:', data);
  }
}
