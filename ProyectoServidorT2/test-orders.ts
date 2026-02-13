import { supabase } from './src/app/lib/supabase';

async function testQuery() {
    try {
        console.log("Testing user orders query...");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            console.log("User logged in:", user.id);
            const { data, error } = await supabase
                .from('Pedidos')
                .select('id, created_at, total, state')
                .eq('id_user', user.id)
                .order('created_at', { ascending: true });
            
            if (error) console.error("User orders error:", error);
            else console.log("User orders count:", data?.length);
        } else {
            console.log("No user logged in for user query test.");
        }

        console.log("Testing admin all orders query...");
        // Test without auth first? RLS might block it. But let's see syntax error.
        const { data: adminOrders, error: adminError } = await supabase
            .from('Pedidos')
            .select('*, users:id_user ( full_name, avatar_url )')
            .order('created_at', { ascending: false });
            
        if (adminError) {
             console.error("Admin orders error:", adminError);
             // Try alternate syntax
             const { error: altError } = await supabase
                .from('Pedidos')
                .select('*, profiles:id_user ( full_name, avatar_url )');
             if (altError) console.error("Alternate syntax error:", altError);
             else console.log("Alternate syntax worked!");
        }
        else console.log("Admin orders count:", adminOrders?.length);

    } catch (e) {
        console.error("Exception:", e);
    }
}

testQuery();
