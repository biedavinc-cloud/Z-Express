import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import LanguageProvider from '@/components/LanguageProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Landing from './pages/Landing';
import Track from './pages/Track';
import RateCalculator from './pages/RateCalculator';
import CreateShipment from './pages/CreateShipment';
import BusinessPortal from './pages/BusinessPortal';
import Developers from './pages/Developers';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/portal/Onboarding';
import PortalLayout from './components/portal/PortalLayout';
import PortalOverview from './pages/portal/PortalOverview';
import PortalShipments from './pages/portal/PortalShipments';
import PortalShipmentDetail from './pages/portal/PortalShipmentDetail';
import PortalDispatch from './pages/portal/PortalDispatch';
import PortalFleet from './pages/portal/PortalFleet';
import PortalPricing from './pages/portal/PortalPricing';
import PortalCod from './pages/portal/PortalCod';
import PortalHubs from './pages/portal/PortalHubs';
import PortalTeam from './pages/portal/PortalTeam';
import PortalApi from './pages/portal/PortalApi';
import PortalMarketplaces from './pages/portal/PortalMarketplaces';
import PortalAnalytics from './pages/portal/PortalAnalytics';
import PortalSettings from './pages/portal/PortalSettings';
import PortalMerchants from './pages/portal/PortalMerchants';
import PortalTickets from './pages/portal/PortalTickets';
import PortalSubscription from './pages/portal/PortalSubscription';
import DriverHome from './pages/driver/DriverHome';
import DriverStop from './pages/driver/DriverStop';
import AdminConsole from './pages/admin/AdminConsole';
import MerchantHome from './pages/merchant/MerchantHome';
import ShipmentOverview from './pages/ShipmentOverview';
import PricingZones from './pages/PricingZones';
import ProofOfDelivery from './pages/ProofOfDelivery';
import ActivityLogs from './pages/ActivityLogs';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import PortalWebhooks from './pages/portal/PortalWebhooks';
import PortalPermissions from './pages/portal/PortalPermissions';
import PortalPayments from './pages/portal/PortalPayments';
import HelpCenter from './pages/support/HelpCenter';
import InvoiceHistory from './pages/billing/InvoiceHistory';
import Careers from './pages/Careers';
import Surcharges from './pages/Surcharges';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfUse from './pages/legal/TermsOfUse';
import SdkPolicy from './pages/legal/SdkPolicy';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public site */}
      <Route path="/" element={<Landing />} />
      <Route path="/track" element={<Track />} />
      <Route path="/rate-calculator" element={<RateCalculator />} />
      <Route path="/send" element={<CreateShipment />} />
      <Route path="/business" element={<BusinessPortal />} />
      <Route path="/developers" element={<Developers />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/support/help-center" element={<HelpCenter />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/surcharges" element={<Surcharges />} />
      <Route path="/legal/privacy" element={<PrivacyPolicy />} />
      <Route path="/legal/terms" element={<TermsOfUse />} />
      <Route path="/legal/sdk-policy" element={<SdkPolicy />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated areas */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/portal/onboarding" element={<Onboarding />} />
        <Route path="/driver" element={<DriverHome />} />
        <Route path="/driver/:id" element={<DriverStop />} />
        <Route path="/admin" element={<AdminConsole />} />
        <Route path="/my-shipments" element={<MerchantHome />} />
        <Route path="/shipment-overview" element={<ShipmentOverview />} />
        <Route path="/pricing-zones" element={<PricingZones />} />
        <Route path="/proof-of-delivery" element={<ProofOfDelivery />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />
        <Route path="/billing/invoices" element={<InvoiceHistory />} />
        <Route path="/merchant/dashboard" element={<MerchantDashboard />} />

        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalOverview />} />
          <Route path="shipments" element={<PortalShipments />} />
          <Route path="shipments/:id" element={<PortalShipmentDetail />} />
          <Route path="dispatch" element={<PortalDispatch />} />
          <Route path="fleet" element={<PortalFleet />} />
          <Route path="pricing" element={<PortalPricing />} />
          <Route path="cod" element={<PortalCod />} />
          <Route path="hubs" element={<PortalHubs />} />
          <Route path="team" element={<PortalTeam />} />
          <Route path="api" element={<PortalApi />} />
          <Route path="marketplaces" element={<PortalMarketplaces />} />
          <Route path="analytics" element={<PortalAnalytics />} />
          <Route path="merchants" element={<PortalMerchants />} />
          <Route path="tickets" element={<PortalTickets />} />
          <Route path="settings" element={<PortalSettings />} />
          <Route path="subscription" element={<PortalSubscription />} />
          <Route path="webhooks" element={<PortalWebhooks />} />
          <Route path="permissions" element={<PortalPermissions />} />
          <Route path="payments" element={<PortalPayments />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App