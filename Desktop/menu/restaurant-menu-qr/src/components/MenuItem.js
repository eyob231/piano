import { useState } from 'react';
import FoodDetailModal from './FoodDetailModal';

function MenuItem({ item }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="menu-item" onClick={() => setShowModal(true)}>
        <img src={item.image_url} alt={item.name} />
        <h3>{item.name}</h3>
        <div className="item-rating">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < item.average_rating ? 'filled' : ''}>★</span>
          ))}
        </div>
        <p className="price">${item.price.toFixed(2)}</p>
      </div>
      
      {showModal && (
        <FoodDetailModal 
          item={item} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
export default MenuItem;