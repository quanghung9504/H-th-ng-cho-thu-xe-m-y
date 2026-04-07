import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile/Profile';
import MyOrders from './pages/Profile/MyOrders';
import Fleet from './pages/Fleet/Fleet';
import VehicleDetail from './pages/Fleet/VehicleDetail';
import WalletPage from './pages/Wallet/Wallet';
import ResetPassword from './pages/Auth/ResetPassword';
import BookingConfirm from './pages/Fleet/BookingConfirm';
import Marketplace from './pages/Marketplace/Marketplace';
import SimulatedPayment from './pages/Wallet/SimulatedPayment';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import KYCManagement from './pages/Admin/KYCManagement';
import VehicleManagement from './pages/Admin/VehicleManagement';
import CategoryManagement from './pages/Admin/CategoryManagement';
import OrderManagement from './pages/Admin/OrderManagement';
import MarketplaceManagement from './pages/Admin/MarketplaceManagement';
import FinancialStats from './pages/Admin/FinancialStats';
import TransactionManagement from './pages/Admin/TransactionManagement';

// Layout Wrapper
const RootLayout = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <Footer />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(10px)'
          }
        }}
      />
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" />;
  return children;
};

const router = createBrowserRouter([
  {
    path: "/simulate-payment/:id",
    element: <SimulatedPayment />
  },
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/reset-password/:token", element: <ResetPassword /> },
      { path: "/fleet", element: <Fleet /> },
      { path: "/vehicle/:id", element: <VehicleDetail /> },
      { path: "/booking-confirm", element: <BookingConfirm /> },
      { path: "/marketplace", element: <Marketplace /> },
      { 
        path: "/profile", 
        element: <ProtectedRoute><Profile /></ProtectedRoute> 
      },
      { 
        path: "/my-orders", 
        element: <ProtectedRoute><MyOrders /></ProtectedRoute> 
      },
      { 
        path: "/wallet", 
        element: <ProtectedRoute><WalletPage /></ProtectedRoute> 
      },
      { path: "*", element: <NotFound /> }
    ]
  },
  {
    path: "/admin",
    element: <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>,
    children: [
      { path: "", element: <AdminDashboard /> },
      { path: "users", element: <UserManagement /> },
      { path: "kyc", element: <KYCManagement /> },
      { path: "vehicles", element: <VehicleManagement /> },
      { path: "categories", element: <CategoryManagement /> },
      { path: "orders", element: <OrderManagement /> },
      { path: "marketplace", element: <MarketplaceManagement /> },
      { path: "stats", element: <FinancialStats /> },
      { path: "transactions", element: <TransactionManagement /> },
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  }
});

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider 
          router={router} 
          future={{ 
            v7_startTransition: true,
          }}
        />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
