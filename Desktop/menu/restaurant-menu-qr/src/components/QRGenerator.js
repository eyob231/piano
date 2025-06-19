import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';  // Changed this line

export default function QRGenerator() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*');
        
        if (error) throw error;
        setRestaurants(data || []);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (loading) return <div>Loading restaurants...</div>;

  return (
    <div className="qr-generator">
      <h1>QR Code Generator</h1>
      <div className="restaurant-selector">
        <label htmlFor="restaurant">Select Restaurant:</label>
        <select
          id="restaurant"
          onChange={(e) => setSelectedRestaurant(e.target.value)}
          value={selectedRestaurant || ''}
        >
          <option value="">-- Select a restaurant --</option>
          {restaurants.map(restaurant => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      {selectedRestaurant && (
        <div className="qr-code-container">
          <h2>QR Code for {restaurants.find(r => r.id === selectedRestaurant).name}</h2>
          <div className="qr-code">
            <QRCodeSVG  // Changed this component
              value={`${window.location.origin}/menu/${selectedRestaurant}`}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="qr-instructions">
            Print this QR code and display it in your restaurant. 
            Customers can scan it to view your menu.
          </p>
          <div className="download-options">
            <button onClick={() => {
              const canvas = document.querySelector('canvas');
              const pngUrl = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.href = pngUrl;
              link.download = `${restaurants.find(r => r.id === selectedRestaurant).name}-menu-qr.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}