import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import OrderMenu from './OrderMenu'; // Adjust the path if necessary
export default function RestaurantMenu() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ user_name: '', rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch restaurant, categories, and menu items
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setError(null);
        setLoading(true);
            
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch items based on categories
        let categoryIds = [];
        if (categoriesData?.length) {
          categoryIds = categoriesData.map(c => c.id);
          const { data: itemsData, error: itemsError } = await supabase
            .from('menu_items')
            .select('id,name,description,price,category_id,image_url,average_rating,is_popular,is_vegetarian,calories,protein,carbs')
            .in('category_id', categoryIds);

          if (itemsError) throw itemsError;
          setItems(itemsData || []);
        }
        const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          image_url,
          is_popular,
          is_vegetarian,
          reviews (
            rating
          )
        `)
        .in('category_id', categoryIds);

      // Calculate average rating for each item
      const itemsWithRatings = itemsData.map(item => ({
        ...item,
        average_rating: item.reviews?.length 
          ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length
          : null
      }));

      setItems(itemsWithRatings);
        
      } catch (err) {
        console.error('Error loading menu:', err);
        setError(err.message || 'Failed to load restaurant menu');
      } finally {
        setLoading(false);
      }
    };
    

    // In your fetchMenuData function:

    fetchMenuData();
  }, [restaurantId]);

  // Fetch reviews when selectedItem changes
  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedItem) return;

      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('menu_item_id', selectedItem.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviews([]);
      }
    };

    fetchReviews();
  }, [selectedItem]);

  // Submit review and update average rating
  const handlePlaceOrder = async () => {
  if (!selectedItem || !tableNumber.trim()) {
    alert('Please enter a table number');
    return;
  }
  
  setOrderLoading(true);
  setOrderSuccess(false);
  
  try {
    const { error } = await supabase
      .from('orders')
      .insert([{
        restaurant_id: restaurantId,
        table_number: tableNumber, // This now matches your DB column
        items: [{
          item_id: selectedItem.id,
          name: selectedItem.name,
          price: selectedItem.price,
          quantity: 1
        }],
        total_price: selectedItem.price
      }]);
    
    if (error) throw error;
    setOrderSuccess(true);
    setTableNumber('');
  } catch (err) {
    console.error('Order failed:', err);
    alert('Failed to place order. Please try again.');
  } finally {
    setOrderLoading(false);
  }
};

const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert([{ ...newReview, menu_item_id: selectedItem.id }]);

      if (reviewError) throw reviewError;

      // Re-fetch updated reviews
      const { data: newReviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('menu_item_id', selectedItem.id)
        .order('created_at', { ascending: false });

      // Re-fetch updated item to get new average rating (ensure backend updates average_rating)
      const { data: updatedItem } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', selectedItem.id)
        .single();

      setReviews(newReviews || []);
      setSelectedItem(updatedItem);
      setNewReview({ user_name: '', rating: 5, comment: '' });
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review');
    }
  };
const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    setSelectedItem(null); // Close the modal after adding to cart
  };

  // Remove from cart function
  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  // Update item quantity in cart
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Calculate cart total
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Submit order function
  const submitOrder = async () => {
    if (!tableNumber.trim()) {
      alert('Please enter a table number');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setOrderLoading(true);
    setOrderSuccess(false);

    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          restaurant_id: restaurantId,
          table_number: tableNumber,
          items: cart.map(item => ({
            item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total_price: cartTotal
        }]);

      if (error) throw error;
      
      setOrderSuccess(true);
      setCart([]);
      setTableNumber('');
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (err) {
      console.error('Order failed:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };
  // Helper to render star ratings
  const renderStars = (rating) => {
  const stars = [];
  const numericRating = Number(rating) || 0; // Ensure it's a number
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span 
        key={i} 
        className={i <= numericRating ? 'filled' : 'empty'}
        style={{color: i <= numericRating ? 'gold' : '#ccc'}}
      >
        ★
      </span>
    );
  }
  return stars;
};
  // Loading and error states
  if (loading) return <div className="loading">Loading menu...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!restaurant) return <div>Restaurant not found</div>;

  return (
    <div className="menu-container">
      <header className="menu-header">
        {restaurant.image_url && (
          <img
            src={restaurant.image_url}
            alt={`${restaurant.name} logo`}
            className="restaurant-logo"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
        <h1>{restaurant.name}</h1>
        <p className="restaurant-description">{restaurant.description}</p>
      </header>

      <div className="menu-content">
        {categories.map((category) => (
          <section key={category.id} className="menu-category">
            <h2>{category.name}</h2>
            <div className="menu-items">
              {items
                .filter((item) => item.category_id === category.id)
                
                .map((item) => (
                  <div
                    key={item.id}
                    className="menu-item"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Image Display */}
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="item-image"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="no-image-placeholder">No Image</div>
                    )}

                    {/* Text Content */}
                    <div className="item-info">
                      <h3>{item.name}</h3>
                      <div className="item-rating">
                        {renderStars(item.average_rating || 0)}
                        {item.average_rating ? (
                          <span className="rating-text">({item.average_rating.toFixed(1)})</span>
                        ) : (
                          <span className="rating-text">(No ratings)</span>
                        )}
                      </div>
                      {item.description && <p className="item-description">{item.description}</p>}
                      <div className="item-badges">
                        {item.is_popular && <span className="popular-badge">Popular</span>}
                        {item.is_vegetarian && <span className="vegetarian-badge">Vegetarian</span>}
                      </div>
                    </div>
                    <div className="item-price">${item.price.toFixed(2)}</div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
          <div className="cart-button-container">
        <button 
          className="cart-button"
          onClick={() => setShowCart(true)}
          disabled={cart.length === 0}
        >
          🛒 Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
        </button>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal-content cart-modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowCart(false)}>×</button>
            <h2>Your Order</h2>
            
            {cart.length === 0 ? (
              <p>your order is added</p>
              
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="cart-item-image"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        
                        <div className="cart-item-price">${item.price.toFixed(2)}</div>
                      </div>
                      <div className="cart-item-controls">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="cart-total">
                  <strong>Total:</strong> ${cartTotal.toFixed(2)}
                </div>
                
                <div className="cart-checkout">
                  <input
                    type="text"
                    placeholder="Table Number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="table-input"
                  />
                  <button
                    onClick={submitOrder}
                    disabled={orderLoading || !tableNumber.trim()}
                    className="submit-order-btn"
                  >
                    {orderLoading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
                
                {orderSuccess && (
                  <div className="order-success">
                    ✅ Order placed for Table {tableNumber}!
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal for selected item */}
      
      {/* Modal for selected item */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedItem(null)}>×</button>
            <div className="food-detail">
              {/* Image Display in Modal */}
              {selectedItem.image_url ? (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="detail-image"
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <div className="no-image-placeholder">No Image Available</div>
              )}

              <h2>{selectedItem.name}</h2>

              {/* Rating Display */}
              <div className="detail-rating">
                {renderStars(selectedItem.average_rating || 0)}
                <span>({selectedItem.average_rating?.toFixed(1) || 'No'} ratings)</span>
              </div>

              <p className="detail-description">{selectedItem.description}</p>

              {/* Price & Badges */}
              <div className="detail-meta">
                <span className="detail-price">${selectedItem.price.toFixed(2)}</span>
                <div className="detail-badges">
                  {selectedItem.is_popular && <span className="popular-badge">Popular</span>}
                  {selectedItem.is_vegetarian && <span className="vegetarian-badge">Vegetarian</span>}
                </div>
              </div>

              {/* Nutrition Info */}
              <div className="nutrition-info">
                <h3>Nutrition Facts</h3>
                <div className="nutrition-grid">
                  <div>Calories: {selectedItem.calories || 'N/A'}</div>
                  <div>Protein: {selectedItem.protein || 'N/A'}g</div>
                  <div>Carbs: {selectedItem.carbs || 'N/A'}g</div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="reviews-section">
                <h3>Customer Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="no-reviews">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="review">
                      <div className="review-header">
                        <span className="reviewer">{review.user_name}</span>
                        <span className="review-rating">{renderStars(review.rating)}</span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      <small className="review-date">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </small>
                    </div>
                  ))
                )}
              </div>
              <div className="item-actions">
                <button 
                  onClick={() => addToCart(selectedItem)}
                  className="add-to-cart-btn"
                >
                  Add to Cart - ${selectedItem.price.toFixed(2)}
                </button>
              </div>
              {/* <OrderMenu restaurantId={restaurantId} /> */}
              <div className="order-section">
              <h3>Order This Item</h3>
              <div className="order-form">
                <input
                  type="text"
                  placeholder="Table Number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="table-input"
                />
                <button
                  className="order-button"
                  onClick={handlePlaceOrder}
                  disabled={orderLoading || !tableNumber.trim()}
                >
                  {orderLoading ? 'Processing...' : `Order Now - $${selectedItem.price.toFixed(2)}`}
                </button>
              </div>
              
              {orderSuccess && (
                <div className="order-success">
                  ✅ Order placed for Table {tableNumber}! 
                  Your food will arrive shortly 🍽️
                </div>
              )}
            </div>
              {/* Add Review Form */}
              <form onSubmit={handleSubmitReview} className="review-form">
                <h3>Add Your Review</h3>
                <input
                  type="text"
                  placeholder="Your name"
                  value={newReview.user_name}
                  onChange={(e) => setNewReview({ ...newReview, user_name: e.target.value })}
                  required
                />
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                  required
                >
                  <option value="">Select rating</option>
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      {num} ★
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Share your experience..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  required
                />
                <button type="submit">Submit Review</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}