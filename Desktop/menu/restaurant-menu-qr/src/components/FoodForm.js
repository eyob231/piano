// src/components/FoodForm.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ImageUpload from './ImageUpload';

export default function FoodForm({ restaurantId, editingFood, onFoodSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_popular: false,
    is_vegetarian: false,
    calories: '',
    protein: '',
    carbs: ''
  });
  const [imagePath, setImagePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Initialize form when editing
  useEffect(() => {
    if (editingFood) {
      setFormData({
        name: editingFood.name,
        description: editingFood.description,
        price: editingFood.price,
        is_popular: editingFood.is_popular,
        is_vegetarian: editingFood.is_vegetarian,
        calories: editingFood.calories || '',
        protein: editingFood.protein || '',
        carbs: editingFood.carbs || ''
      });
      setImagePath(editingFood.image_url || '');
    }
  }, [editingFood]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      setError('Name and price are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const foodData = {
        ...formData,
        price: parseFloat(formData.price),
        calories: parseInt(formData.calories) || null,
        protein: parseInt(formData.protein) || null,
        carbs: parseInt(formData.carbs) || null,
        restaurant_id: restaurantId,
        image_url: imagePath || null
      };

      let result;
      if (editingFood) {
        // Update existing food
        const { data, error } = await supabase
          .from('menu_items')
          .update(foodData)
          .eq('id', editingFood.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new food
        const { data, error } = await supabase
          .from('menu_items')
          .insert([foodData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      // Reset form and notify parent
      if (result) {
        setFormData({
          name: '',
          description: '',
          price: '',
          is_popular: false,
          is_vegetarian: false,
          calories: '',
          protein: '',
          carbs: ''
        });
        setImagePath('');
        onFoodSaved?.();
      }
    } catch (err) {
      console.error(editingFood ? 'Update failed:' : 'Creation failed:', err);
      setError(`Failed to ${editingFood ? 'update' : 'create'} food item`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="food-form" onSubmit={handleSubmit}>
      <h3>{editingFood ? 'Edit Food Item' : 'Add New Food'}</h3>
      
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label>Item Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter item name"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Price *</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter item description"
        />
      </div>
      
      <div className="form-group checkboxes">
        <label>
          <input
            type="checkbox"
            name="is_popular"
            checked={formData.is_popular}
            onChange={handleChange}
          />
          Popular Item
        </label>
        <label>
          <input
            type="checkbox"
            name="is_vegetarian"
            checked={formData.is_vegetarian}
            onChange={handleChange}
          />
          Vegetarian
        </label>
      </div>
      
      
      <div className="form-group">
        <label>Image</label>
        <ImageUpload
          itemId={editingFood?.id || 'new-food'}
          onUpload={(url) => setImagePath(url)}
          bucket="menu-items"
        />
      </div>
      
      <div className="nutrition-section">
        <h4>Nutrition Facts</h4>
        <div className="nutrition-grid">
          <div className="form-group">
            <label>Calories</label>
            <input
              type="number"
              name="calories"
              value={formData.calories}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Protein (g)</label>
            <input
              type="number"
              name="protein"
              value={formData.protein}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Carbs (g)</label>
            <input
              type="number"
              name="carbs"
              value={formData.carbs}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
      
      <button type="submit" disabled={loading} className="submit-button">
        {loading ? (editingFood ? 'Updating...' : 'Adding...') : (editingFood ? 'Update Item' : 'Add Item')}
      </button>
    </form>
  );
}