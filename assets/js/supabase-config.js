// Supabase Configuration
// Replace these values with your actual Supabase project credentials
const SUPABASE_URL = 'https://znqhoohjugyblgwepovp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucWhvb2hqdWd5Ymxnd2Vwb3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTk0OTAsImV4cCI6MjA3MDA3NTQ5MH0.dEWUpJtDbzLKRv9UtxpJLEmSMT6M_QChI3eu8EjO3dY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table names
const TABLES = {
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  FOOD_ITEMS: 'food_items',
  CATEGORIES: 'categories',
  PROFILES: 'profiles',
  CART_ITEMS: 'cart_items',
  FAVORITES: 'favorites',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
  FEEDBACK: 'feedback'
};

// Export for use in other files
window.supabaseClient = supabase;
window.SUPABASE_TABLES = TABLES;
