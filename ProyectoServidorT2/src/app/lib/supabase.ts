import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const debugLock = {
  acquire: async () => {
    return () => {};
  },

  release: async () => {},
  update: async () => {}
};

export const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-session',
      lock: (() => ({
        acquire: async () => () => {},
        release: async () => {},
        update: async () => {},
      })) as any
    }
  }
);