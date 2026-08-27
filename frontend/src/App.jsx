import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import FarmerDashboard from './pages/FarmerDashboard.jsx';
import Marketplace from './pages/Marketplace.jsx';
import BulkPools from './pages/BulkPools.jsx';
import TransportDashboard from './pages/TransportDashboard.jsx';
import CartPage from './pages/CartPage.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import MarketPrices from './pages/MarketPrices.jsx';
import Notifications from './pages/Notifications.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Support from './pages/Support.jsx';
import AdminOverview from './pages/AdminOverview.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminListings from './pages/AdminListings.jsx';
import AdminOrders from './pages/AdminOrders.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/prices" element={<MarketPrices />} />
        <Route path="/pools" element={<BulkPools />} />

        <Route path="/farmer" element={<ProtectedRoute roles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/farmer/orders" element={<ProtectedRoute roles={['farmer']}><Orders /></ProtectedRoute>} />

        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/cart" element={<ProtectedRoute roles={['buyer']}><CartPage /></ProtectedRoute>} />
        <Route path="/buyer/orders" element={<ProtectedRoute roles={['buyer']}><Orders /></ProtectedRoute>} />

        <Route path="/orders/:id" element={<ProtectedRoute roles={['farmer', 'buyer']}><OrderDetail /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute roles={['farmer', 'buyer', 'admin']}><Notifications /></ProtectedRoute>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/support" element={<Support />} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminOverview /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/listings" element={<ProtectedRoute roles={['admin']}><AdminListings /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />

        <Route path="/transport" element={<ProtectedRoute roles={['transport']}><TransportDashboard/></ProtectedRoute>} />

        <Route path="*" element={<Landing />} />
      </Routes>
    </div>
  );
}
