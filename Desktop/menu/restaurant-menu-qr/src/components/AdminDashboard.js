// src/components/AdminDashboard.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import FoodForm from './FoodForm';
import RestaurantForm from './RestaurantForm'; // Import RestaurantForm

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [foods, setFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('foods');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchFoods(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRestaurants(data || []);
      
      if (data?.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  // src/components/AdminDashboard.js

// Update fetchFoods function to include category info
const fetchFoods = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        id, 
        name, 
        price, 
        image_url,
        category_id,
        menu_categories(name)
      `)
      .eq('restaurant_id', restaurantId);
    
    if (error) throw error;
    
    // Format data for display
    const formattedData = data.map(item => ({
      ...item,
      categoryName: item.menu_categories?.name || 'Uncategorized'
    }));
    
    setFoods(formattedData || []);
  } catch (err) {
    console.error('Failed to load foods:', err);
  }
};

// In your food list display

  const handleDeleteFood = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', foodId);
      
      if (error) throw error;
      
      setFoods(foods.filter(food => food.id !== foodId));
    } catch (err) {
      console.error('Failed to delete food:', err);
      alert('Failed to delete food item');
    }
  };

  const handleEditFood = (food) => {
    setEditingFood(food);
  };

  const handleFoodSaved = () => {
    setEditingFood(null);
    fetchFoods(selectedRestaurant);
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          onClick={() => setActiveTab('foods')} 
          className={activeTab === 'foods' ? 'active' : ''}
        >
          Manage Foods
        </button>
        <button 
          onClick={() => setActiveTab('restaurants')} 
          className={activeTab === 'restaurants' ? 'active' : ''}
        >
          Manage Restaurants
        </button>
      </div>

      {/* Food Management */}
      {activeTab === 'foods' && (
        <div className="foods-section">
          <div className="restaurant-selector">
            <label>Select Restaurant:</label>
            <select 
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
            >
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          <h2>{editingFood ? 'Edit Food Item' : 'Add New Food'}</h2>
          <FoodForm 
            restaurantId={selectedRestaurant}
            editingFood={editingFood}
            onFoodSaved={handleFoodSaved}
          />

          <div className="food-list">
            <h3>Current Menu Items</h3>
            {foods.length === 0 ? (
              <p>No food items found</p>
            ) : (
              <div className="food-grid">
                {foods.map(food => (
  <div key={food.id} className="food-card">
    {food.image_url && (
      <img src={food.image_url} alt={food.name} className="food-image" />
    )}
    <h4>{food.name}</h4>
    <p>Category: {food.categoryName}</p>
    <p>${food.price.toFixed(2)}</p>
    <div className="food-actions">
      <button onClick={() => handleEditFood(food)}>Edit</button>
      <button onClick={() => handleDeleteFood(food.id)} className="delete-btn">Delete</button>
    </div>
  </div>
))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Restaurant Management */}
      {activeTab === 'restaurants' && (
        <div className="restaurants-section">
          <h2>Manage Restaurants</h2>
          <RestaurantForm onRestaurantCreated={() => fetchRestaurants()} />
          
          <div className="restaurant-list">
            <h3>Existing Restaurants</h3>
            <div className="restaurant-grid">
              {restaurants.map(restaurant => (
                <div key={restaurant.id} className="restaurant-card">
                  {restaurant.image_url && (
                    <img 
                      src={restaurant.image_url} 
                      alt={restaurant.name} 
                      className="restaurant-image"
                    />
                  )}
                  <h4>{restaurant.name}</h4>
                  <p>{restaurant.description}</p>
                  <div className="restaurant-actions">
                    <button onClick={() => {
                      // Add edit functionality
                    }}>Edit</button>
                    <button onClick={() => {
                      // Add delete functionality
                    }} className="delete-btn">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}