import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import RestaurantMenu from './components/RestaurantMenu';
import QRGenerator from './components/QRGenerator';
import NotFound from './components/NotFound';
import './App.css';
import AdminDashboard from './components/AdminDashboard';
import OrdersPage from './pages/OrdersPage';
import OrderDashboard from './components/OrderDashboard';
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu/:restaurantId" element={<RestaurantMenu />} />
          <Route path="/admin/qr-generator" element={<QRGenerator />} />
          <Route path="*" element={<NotFound />} /> {/* 404 Fallback */}
            <Route path="/admin" element={<AdminDashboard />} />
         <Route path="/admin/orders/:restaurantId" element={<OrderDashboard />} />
          <Route path="/orders/:restaurantId" element={<OrdersPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;