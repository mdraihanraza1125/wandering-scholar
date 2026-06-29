import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqfzhmegssbaxuvlbrcq.supabase.co';
const supabaseAnonKey = 'sb_publishable_vWMF4_SDk6Vb3Mbu129V_w_nVXwvYZr';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
