import { useEffect, useState } from 'react';
import { resolveSession } from '@/lib/session';

// Resolves the signed-in person once, for the operator pages that live outside
// the portal sidebar. Returns null until the session is known.
export default function useStaffScope() {
  const [scope, setScope] = useState(null);

  useEffect(() => {
    let cancelled = false;
    resolveSession().then((session) => {
      if (!cancelled) setScope(session);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return scope;
}