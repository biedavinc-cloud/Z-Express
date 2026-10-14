import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SiteShell from '@/components/site/SiteShell';
import HeroTracker from '@/components/site/HeroTracker';
import HeroTraffic from '@/components/site/HeroTraffic';
import QuickActions from '@/components/site/QuickActions';
import SolutionsSection from '@/components/site/SolutionsSection';
import NetworkMap from '@/components/site/NetworkMap';
import AppPromo from '@/components/site/AppPromo';

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <SiteShell>
      <HeroTracker />
      <HeroTraffic />
      <QuickActions />
      <SolutionsSection />
      <NetworkMap />
      <AppPromo />
    </SiteShell>
  );
}