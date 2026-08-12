import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Business = {
  // Core (existing)
  id?: string;
  created_at?: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  category: string;

  // Location (new)
  address?: string;
  neighborhood?: string;
  postal_code?: string;

  // Digital contact (new)
  whatsapp?: string;
  instagram?: string;
  website?: string;

  // Business info (new)
  description?: string;
  opening_hours?: string;

  // Promotion (new)
  promotion_title?: string;
  promotion_description?: string;
  discount_percentage?: number | null;
  promotion_expiration?: string;
};
