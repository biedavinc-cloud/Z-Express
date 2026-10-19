import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LanguageProvider from '@/components/LanguageProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Landing from './pages/Landing';
const Track = lazy(() => import('./pages/Track'));
const RateCalculator = lazy(() => import('./pages/RateCalculator'));
const CreateShipment = lazy(() => import('./pages/CreateShipment'));
const Solutions = lazy(() => import('./pages/Solutions'));
const BusinessPortal = lazy(() => import('./pages/BusinessPortal'));
const Developers = lazy(() => import('./pages/Developers'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Onboarding = lazy(() => import('./pages/portal/Onboarding'));
const PortalLayout = lazy(() => import('./components/portal/PortalLayout'));
const PortalOverview = lazy(() => import('./pages/portal/PortalOverview'));
const PortalShipments = lazy(() => import('./pages/portal/PortalShipments'));
const PortalShipmentDetail = lazy(() => import('./pages/portal/PortalShipmentDetail'));
const PortalDispatch = lazy(() => import('./pages/portal/PortalDispatch'));
const PortalFleet = lazy(() => import('./pages/portal/PortalFleet'));
const PortalPricing = lazy(() => import('./pages/portal/PortalPricing'));
const PortalCod = lazy(() => import('./pages/portal/PortalCod'));
const PortalHubs = lazy(() => import('./pages/portal/PortalHubs'));
const PortalTeam = lazy(() => import('./pages/portal/PortalTeam'));
const PortalApi = lazy(() => import('./pages/portal/PortalApi'));
const PortalMarketplaces = lazy(() => import('./pages/portal/PortalMarketplaces'));
const PortalAnalytics = lazy(() => import('./pages/portal/PortalAnalytics'));
const PortalSettings = lazy(() => import('./pages/portal/PortalSettings'));
const PortalMerchants = lazy(() => import('./pages/portal/PortalMerchants'));
const PortalTickets = lazy(() => import('./pages/portal/PortalTickets'));
const PortalSubscription = lazy(() => import('./pages/portal/PortalSubscription'));
const DriverHome = lazy(() => import('./pages/driver/DriverHome'));
const DriverStop = lazy(() => import('./pages/driver/DriverStop'));
const AdminConsole = lazy(() => import('./pages/admin/AdminConsole'));
const MerchantHome = lazy(() => import('./pages/merchant/MerchantHome'));
const ShipmentOverview = lazy(() => import('./pages/ShipmentOverview'));
const PricingZones = lazy(() => import('./pages/PricingZones'));
const ProofOfDelivery = lazy(() => import('./pages/ProofOfDelivery'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const MerchantDashboard = lazy(() => import('./pages/merchant/MerchantDashboard'));
const PortalWebhooks = lazy(() => import('./pages/portal/PortalWebhooks'));
const PortalPermissions = lazy(() => import('./pages/portal/PortalPermissions'));
const PortalPayments = lazy(() => import('./pages/portal/PortalPayments'));
const HelpCenter = lazy(() => import('./pages/support/HelpCenter'));
const InvoiceHistory = lazy(() => import('./pages/billing/InvoiceHistory'));
const Careers = lazy(() => import('./pages/Careers'));
const Surcharges = lazy(() => import('./pages/Surcharges'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/legal/TermsOfUse'));
const SdkPolicy = lazy(() => import('./pages/legal/SdkPolicy'));

const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageSpinner />}>
    <Routes>
      {/* Public site */}
      <Route path="/" element={<Landing />} />
      <Route path="/track" element={<Track />} />
      <Route path="/rate-calculator" element={<RateCalculator />} />
      <Route path="/send" element={<CreateShipment />} />
      <Route path="/business" element={<BusinessPortal />} />
      <Route path="/solutions" element={<Solutions />} />
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
      <Route element={<ProtectedRoute />}>
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
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
          <Toaster />
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App