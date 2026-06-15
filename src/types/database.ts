export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      boutiques: {
        Row: { id: string; owner_id: string; name: string; created_at: string };
        Insert: { id?: string; owner_id: string; name: string; created_at?: string };
        Update: { id?: string; owner_id?: string; name?: string; created_at?: string };
      };
      products: {
        Row: {
          id: string;
          boutique_id: string;
          created_at: string;
          name: string;
          brand: string | null;
          season: string | null;
          purchase_price: number;
          sale_price: number;
          stock: number;
        };
        Insert: {
          id?: string;
          boutique_id: string;
          created_at?: string;
          name: string;
          brand?: string | null;
          season?: string | null;
          purchase_price: number;
          sale_price: number;
          stock?: number;
        };
        Update: {
          id?: string;
          boutique_id?: string;
          created_at?: string;
          name?: string;
          brand?: string | null;
          season?: string | null;
          purchase_price?: number;
          sale_price?: number;
          stock?: number;
        };
      };
      sales: {
        Row: {
          id: string;
          boutique_id: string;
          created_at: string;
          total_amount: number;
          payment_method: 'Efectivo' | 'Transferencia' | 'Tarjeta';
          notes: string | null;
        };
        Insert: {
          id?: string;
          boutique_id: string;
          created_at?: string;
          total_amount: number;
          payment_method: 'Efectivo' | 'Transferencia' | 'Tarjeta';
          notes?: string | null;
        };
        Update: {
          id?: string;
          boutique_id?: string;
          created_at?: string;
          total_amount?: number;
          payment_method?: 'Efectivo' | 'Transferencia' | 'Tarjeta';
          notes?: string | null;
        };
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          price_at_sale: number;
          cost_at_sale: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          price_at_sale: number;
          cost_at_sale: number;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string;
          quantity?: number;
          price_at_sale?: number;
          cost_at_sale?: number;
        };
      };
    };
  };
}