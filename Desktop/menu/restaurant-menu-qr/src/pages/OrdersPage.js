import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import OrderDashboard from '../components/OrderDashboard';

export default function OrdersPage() {
  const { restaurantId } = useParams();
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', restaurantId)
          .single();
        
        if (error) throw error;
        setRestaurantName(data.name);
      } catch (err) {
        console.error('Failed to load restaurant:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="orders-page">
      <h1>{restaurantName} - Orders</h1>
      <OrderDashboard restaurantId={restaurantId} />
    </div>
  );
}