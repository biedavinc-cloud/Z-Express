import { useCallback, useEffect, useState } from 'react';
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/logistics';

const KEY = 'zx_country';

// Small shared helper so the header, rate calculator and shipment form
// all default to the same country the visitor picked.
export function useCountry() {
  const [country, setCountryState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_COUNTRY;
    const stored = window.localStorage.getItem(KEY);
    return COUNTRIES.includes(stored) ? stored : DEFAULT_COUNTRY;
  });

  useEffect(() => {
    window.localStorage.setItem(KEY, country);
  }, [country]);

  const setCountry = useCallback((value) => {
    setCountryState(COUNTRIES.includes(value) ? value : DEFAULT_COUNTRY);
  }, []);

  return { country, setCountry };
}

export default useCountry;