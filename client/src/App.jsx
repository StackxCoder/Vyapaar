import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useServerWakeup } from './hooks/useServerWakeup';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import SalesList from './pages/sales/SalesList';
import NewSale from './pages/sales/NewSale';
import InvoicePrint from './pages/sales/InvoicePrint';
import CustomersList from './pages/customers/CustomersList';
import CustomerDetail from './pages/customers/CustomerDetail';
import BatchesList from './pages/batches/BatchesList';
import BatchDetail from './pages/batches/BatchDetail';
import Settings from './pages/Settings';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import PricingDashboard from './pages/pricing/PricingDashboard';
import StockOverview from './pages/stock/StockOverview';
import StockHistory from './pages/stock/StockHistory';
import CustomerScores from './pages/customers/CustomerScores';
import StubPage from './pages/StubPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import OnboardingTour from './pages/OnboardingTour';

function App() {
  const { waking } = useServerWakeup();
  
  return (
    <BrowserRouter>
      {waking && <div style={{background:'#FAEEDA',color:'#854F0B',textAlign:'center',padding:'8px',fontSize:13,position:'fixed',top:0,width:'100%',zIndex:9999}}>Server shuru ho raha hai... 20-30 seconds mein ready hoga</div>}
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* PROTECTED ROUTES */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingTour /></ProtectedRoute>} />
        <Route path="/sales/print/:id" element={<ProtectedRoute><InvoicePrint /></ProtectedRoute>} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/new" element={<NewSale />} />
          <Route path="customers" element={<CustomersList />} />
          <Route path="customers/scores" element={<CustomerScores />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="pricing" element={<PricingDashboard />} />
          <Route path="stock" element={<StockOverview />} />
          <Route path="stock/:id" element={<StockHistory />} />
          <Route path="payments" element={<StubPage title="Payments / भुगतान" />} />
          <Route path="batches" element={<BatchesList />} />
          <Route path="batches/:id" element={<BatchDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
