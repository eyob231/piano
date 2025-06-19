// Updated ChefDashboard.js
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

export default function ChefDashboard() {
  const { restaurantId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [dailyStats, setDailyStats] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // Combine orders from same table (different foods)
  const combineTableOrders = (orders) => {
    const combined = orders.reduce((acc, order) => {
      // Find existing order for this table with same status
      const existingOrderIndex = acc.findIndex(
        o => o.table_number === order.table_number && 
             o.status === order.status &&
             o.status === 'pending' // Only combine pending orders
      );

      if (existingOrderIndex >= 0) {
        // Combine items
        const updatedOrder = {
          ...acc[existingOrderIndex],
          items: [...acc[existingOrderIndex].items, ...order.items],
          total_price: acc[existingOrderIndex].total_price + order.total_price,
          // Keep the earliest created_at time
          created_at: new Date(acc[existingOrderIndex].created_at) < new Date(order.created_at) 
            ? acc[existingOrderIndex].created_at 
            : order.created_at,
          // Track original order IDs for status updates
          original_order_ids: [
            ...(acc[existingOrderIndex].original_order_ids || [acc[existingOrderIndex].id]),
            order.id
          ]
        };

        // Replace the existing order with the combined one
        acc[existingOrderIndex] = updatedOrder;
      } else {
        // Add new order with original_order_ids array
        acc.push({
          ...order,
          original_order_ids: [order.id]
        });
      }
      return acc;
    }, []);

    return combined;
  };
  const fetchDailySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (error) throw error;

      const stats = {
        totalOrders: data.length,
        completedOrders: data.filter(o => o.status === 'completed').length,
        totalRevenue: data.reduce((sum, order) => sum + order.total_price, 0),
        averageOrderValue: data.length > 0 
          ? data.reduce((sum, order) => sum + order.total_price, 0) / data.length
          : 0
      };

      setDailyStats(stats);
      setShowDailySummary(true);
    } catch (err) {
      console.error('Failed to load daily summary:', err);
      setError('Could not load daily summary');
    }
  };

  // Clear all orders (end of day)
  const clearAllOrders = async () => {
  if (!window.confirm('Are you sure you want to clear all orders? This cannot be undone.')) return;
  
  setIsClosing(true);
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Check if archive table exists
    let archiveTableExists = true;
    const { error: tableCheckError } = await supabase
      .from('order_archive')
      .select('*')
      .limit(1);
    
    if (tableCheckError) {
      if (tableCheckError.code === '42P01') { // Table doesn't exist
        archiveTableExists = false;
        toast.warning('Archive table not found - clearing without archiving');
      } else {
        throw tableCheckError;
      }
    }

    // 2. Get current orders
    const { data: ordersToArchive, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .lte('created_at', `${today}T23:59:59`);
    
    if (fetchError) throw fetchError;

    // 3. Archive if possible
    if (archiveTableExists && ordersToArchive.length > 0) {
      const { error: archiveError } = await supabase
  .from('order_archive')
  .insert(ordersToArchive.map(order => ({
    id: order.id,
    restaurant_id: order.restaurant_id,
    table_number: order.table_number,
    items: order.items,
    total_price: order.total_price,
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    // Only include these if they exist in the source orders
    ...(order.customer_name && { customer_name: order.customer_name }),
    ...(order.customer_notes && { customer_notes: order.customer_notes })
  })));
      
      if (archiveError) throw archiveError;
    }

    // 4. Delete orders
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('restaurant_id', restaurantId)
      .lte('created_at', `${today}T23:59:59`);
    
    if (deleteError) throw deleteError;
    
    // 5. Update state
    setOrders([]);
    setDailyStats(null);
    toast.success(ordersToArchive.length > 0 
      ? `Cleared ${ordersToArchive.length} orders successfully`
      : 'No orders to clear');
  } catch (err) {
    console.error('Failed to clear orders:', err);
    toast.error(err.message || 'Failed to clear orders');
  } finally {
    setIsClosing(false);
    setShowDailySummary(false);
  }
};
  // Fetch and combine orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setOrders(combineTableOrders(data || []));
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError('Could not load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    
    // Real-time updates with combining
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          setOrders(prev => {
            let updatedOrders;
            if (payload.eventType === 'DELETE') {
              updatedOrders = prev.filter(o => 
                !o.original_order_ids?.includes(payload.old.id)
              );
            } else {
              updatedOrders = [...prev, payload.new];
            }
            return combineTableOrders(updatedOrders);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  // Update status for all original orders
  const updateStatus = async (combinedOrderId, newStatus) => {
    try {
      const orderToUpdate = orders.find(o => o.id === combinedOrderId);
      if (!orderToUpdate) return;

      // Update all original orders
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', orderToUpdate.original_order_ids);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prev =>
        prev.map(order =>
          order.id === combinedOrderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to update order status');
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="chef-dashboard">
      <h1>Order Management</h1>
      
      <div className="controls">
        <button onClick={() => setOrders(combineTableOrders([...orders]))}>
          Refresh Orders
        </button>
        <button onClick={fetchDailySummary} className="summary-btn">
          View Daily Summary
        </button>
        <button onClick={clearAllOrders} className="close-btn" disabled={isClosing}>
          {isClosing ? 'Closing...' : 'Close Restaurant'}
        </button>
      </div>

      {showDailySummary && dailyStats && (
        <div className="daily-summary">
          <h2>Today's Summary</h2>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Orders:</span>
              <span className="stat-value">{dailyStats.totalOrders}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed Orders:</span>
              <span className="stat-value">{dailyStats.completedOrders}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Revenue:</span>
              <span className="stat-value">${dailyStats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Order Value:</span>
              <span className="stat-value">${dailyStats.averageOrderValue.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowDailySummary(false)}
            className="close-summary"
          >
            Close Summary
          </button>
        </div>
      )}
      <div className="order-list">
        {orders.length === 0 ? (
          <p>No orders yet</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className={`order-card status-${order.status}`}>
              <div className="order-header">
                <span>Table {order.table_number}</span>
                <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                <span className="order-count">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="order-item">
                    <div className="item-main">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                    {item.notes && (
                      <div className="item-notes">Note: {item.notes}</div>
                    )}
                    <div className="item-price">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              
              <div className="order-footer">
                <div className="order-total">
                  <strong>Total:</strong> ${order.total_price.toFixed(2)}
                </div>
                
                <div className="order-actions">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}