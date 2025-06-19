import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../App.css';

export default function Home() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    cuisineType: '',
    openingHours: ''
  });
  const [menuItems, setMenuItems] = useState([{ name: '', price: '', category: '' }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMenuItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...menuItems];
    updatedItems[index] = { ...updatedItems[index], [name]: value };
    setMenuItems(updatedItems);
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', price: '', category: '' }]);
  };

  const removeMenuItem = (index) => {
    const updatedItems = [...menuItems];
    updatedItems.splice(index, 1);
    setMenuItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, insert the restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert([{
          name: formData.restaurantName,
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          cuisine_type: formData.cuisineType,
          opening_hours: formData.openingHours
        }])
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      // Then insert menu items
      const menuItemsWithRestaurantId = menuItems.map(item => ({
        ...item,
        restaurant_id: restaurant.id,
        price: parseFloat(item.price),
        category_id: 1 // You might want to implement categories properly
      }));

      const { error: menuError } = await supabase
        .from('menu_items')
        .insert(menuItemsWithRestaurantId);

      if (menuError) throw menuError;

      setSuccess(true);
      setFormData({
        restaurantName: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        cuisineType: '',
        openingHours: ''
      });
      setMenuItems([{ name: '', price: '', category: '' }]);
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <h1>Welcome to QR Menu</h1>
      <p>Scan a restaurant's QR code to view their menu</p>
      
      <div className="admin-actions">
        <button 
          onClick={() => setShowRegistration(!showRegistration)}
          className="register-btn"
        >
          {showRegistration ? 'Hide Registration' : 'Register Your Restaurant'}
        </button>
        
        <div className="admin-link">
          <Link to="/admin/qr-generator">Restaurant owners: Generate your QR code here</Link>
        </div>
      </div>

      {showRegistration && (
        <div className="registration-form">
          <h2>Restaurant Registration</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Restaurant Name</label>
              <input
                type="text"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cuisine Type</label>
                <input
                  type="text"
                  name="cuisineType"
                  value={formData.cuisineType}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Opening Hours</label>
              <input
                type="text"
                name="openingHours"
                value={formData.openingHours}
                onChange={handleInputChange}
                placeholder="e.g., 9AM - 10PM"
                required
              />
            </div>

            <h3>Menu Items</h3>
            {menuItems.map((item, index) => (
              <div key={index} className="menu-item-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Item Name</label>
                    <input
                      type="text"
                      name="name"
                      value={item.name}
                      onChange={(e) => handleMenuItemChange(index, e)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={item.price}
                      onChange={(e) => handleMenuItemChange(index, e)}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      name="category"
                      value={item.category}
                      onChange={(e) => handleMenuItemChange(index, e)}
                      required
                    />
                  </div>

                  {menuItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMenuItem(index)}
                      className="remove-item-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addMenuItem}
              className="add-item-btn"
            >
              Add Another Menu Item
            </button>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Registering...' : 'Register Restaurant'}
            </button>

            {success && (
              <div className="success-message">
                Restaurant registered successfully! You can now generate your QR code.
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}