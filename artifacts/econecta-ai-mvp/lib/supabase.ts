import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Business = {
  id?: string;
  created_at?: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  category: string;
};
