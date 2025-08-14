// Supabase Service Functions
class SupabaseService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.tables = window.SUPABASE_TABLES;
  }

  // Orders Operations
  async getOrders() {
    try {
      const { data, error } = await this.supabase
        .from(this.tables.ORDERS)
        .select(`
          *,
          order_items (
            *,
            food_items (
              id,
              name,
              price
            )
          ),
          profiles (
            id,
            first_name,
            last_name,
            student_id,
            course,
            year
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await this.supabase
        .from(this.tables.ORDERS)
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating order status:', error);
      return null;
    }
  }

  // Food Items Operations
  async getFoodItems() {
    try {
      const { data, error } = await this.supabase
        .from(this.tables.FOOD_ITEMS)
        .select('*')
        .eq('is_available', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching food items:', error);
      return [];
    }
  }

  // Categories Operations
  async getCategories() {
    try {
      const { data, error } = await this.supabase
        .from(this.tables.CATEGORIES)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribeToOrders(callback) {
    return this.supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: this.tables.ORDERS }, 
        callback
      )
      .subscribe();
  }

  subscribeToOrderItems(callback) {
    return this.supabase
      .channel('order_items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: this.tables.ORDER_ITEMS }, 
        callback
      )
      .subscribe();
  }
}

// Export for use in other files
window.supabaseService = new SupabaseService();
