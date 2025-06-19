import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function FoodDetailModal({ item, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('menu_item_id', item.id)
        .order('created_at', { ascending: false });
      
      if (!error) setReviews(data);
    };
    
    fetchReviews();
  }, [item.id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('reviews')
      .insert([{ ...newReview, menu_item_id: item.id }]);
    
    if (!error) {
      // Update average rating
      await supabase.rpc('update_average_rating', { item_id: item.id });
      onClose(); // Refresh parent component
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="food-details">
          <img src={item.image_url} alt={item.name} />
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <div className="rating">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < item.average_rating ? 'filled' : ''}>★</span>
            ))}
            <span>({item.average_rating?.toFixed(1) || 'No ratings'})</span>
          </div>
          <p className="price">${item.price.toFixed(2)}</p>
        </div>

        <div className="reviews-section">
          <h3>Reviews</h3>
          {reviews.length === 0 ? (
            <p>No reviews yet</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="review">
                <div className="review-header">
                  <span className="reviewer">{review.user_name}</span>
                  <span className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < review.rating ? 'filled' : ''}>★</span>
                    ))}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
                <small>{new Date(review.created_at).toLocaleDateString()}</small>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmitReview} className="review-form">
          <h3>Add Your Review</h3>
          <input
            type="text"
            placeholder="Your name"
            value={newReview.name}
            onChange={(e) => setNewReview({...newReview, name: e.target.value})}
            required
          />
          <select
            value={newReview.rating}
            onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
          >
            {[5,4,3,2,1].map(num => (
              <option key={num} value={num}>{num} ★</option>
            ))}
          </select>
          <textarea
            placeholder="Your review..."
            value={newReview.comment}
            onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
            required
          />
          <button type="submit">Submit Review</button>
        </form>
      </div>
    </div>
  );
}