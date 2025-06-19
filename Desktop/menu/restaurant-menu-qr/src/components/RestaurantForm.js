// src/components/RestaurantForm.js
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import ImageUpload from './ImageUpload';

export default function RestaurantForm({ onRestaurantCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [imagePath, setImagePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Restaurant name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert([{
          ...formData,
          logo_url: imagePath || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setFormData({ name: '', description: '' });
      setImagePath('');
      onRestaurantCreated?.(data);
    } catch (err) {
      console.error('Restaurant creation failed:', err);
      setError('Failed to create restaurant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="restaurant-form" onSubmit={handleSubmit}>
      <h3>Create New Restaurant</h3>
      
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label>Restaurant Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter restaurant name"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter restaurant description"
        />
      </div>
      
      <div className="form-group">
        <label>Restaurant Logo</label>
        <ImageUpload
          itemId="restaurant"
          onUpload={(url) => setImagePath(url)}
          bucket="restaurants"
        />
      </div>
      
      <button type="submit" disabled={loading} className="submit-button">
        {loading ? 'Creating...' : 'Create Restaurant'}
      </button>
    </form>
  );
}