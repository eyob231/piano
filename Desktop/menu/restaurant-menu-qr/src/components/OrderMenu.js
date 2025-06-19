import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function OrderMenu({ restaurantId }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, quantity) => {
    setCart(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
      ).filter(item => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          restaurant_id: restaurantId,
          items: cart,
          total_price: calculateTotal()
        }]);
      
      if (error) throw error;
      setSuccess(true);
      setCart([]);
    } catch (err) {
      console.error('Order failed:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-menu">
      <h2>Place Your Order</h2>
      
      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div className="cart">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <span>{item.name}</span>
              <div className="quantity-controls">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="total">
            <strong>Total:</strong> ${calculateTotal()}
          </div>
          <button 
            className="checkout-btn" 
            onClick={checkout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          Order placed successfully! Thank you 🙏
        </div>
      )}
    </div>
  );
}