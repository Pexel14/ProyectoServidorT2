import { supabase } from './src/app/lib/supabase';

async function testUpdate(orderId: number) {
    try {
        console.log("Testing update for order:", orderId);
        
        // 1. Check if order exists
        const { data: order, error: readError } = await supabase
            .from('Pedidos')
            .select('*')
            .eq('id', orderId)
            .single();
            
        if (readError) {
            console.error("Error reading order:", readError);
            return;
        }
        console.log("Current order state:", order.state);

        // 2. Try update
        const newState = order.state === 'En espera' ? 'En envio' : 'En espera';
        console.log("Attempting to update to:", newState);
        
        const { data: updateData, error: updateError } = await supabase
            .from('Pedidos')
            .update({ state: newState })
            .eq('id', orderId)
            .select();

        if (updateError) {
            console.error("Error updating order:", updateError);
        } else {
            console.log("Update success. Returned data:", updateData);
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

// Replace 1 with a valid order ID from your DB if known, or I'll try to list one first
async function listAndTest() {
    const { data } = await supabase.from('Pedidos').select('id').limit(1);
    if (data && data.length > 0) {
        await testUpdate(data[0].id);
    } else {
        console.log("No orders found to test.");
    }
}

listAndTest();
