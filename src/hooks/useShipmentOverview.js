import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const ACTIVE_STATUSES = ['created', 'picked_up', 'in_transit', 'at_hub', 'out_for_delivery'];

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

// Every number on the overview comes from the server: one aggregate for the
// pipeline, one for the COD ledger, then the counts and pages the panels need.
export function useShipmentOverview(tenant) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.id) return undefined;
    let cancelled = false;
    setLoading(true);

    const tenantId = tenant.id;
    const base = { tenant_id: tenantId };

    Promise.all([
      base44.entities.Shipment.aggregate({
        query: base,
        groupBy: 'status',
        sum: ['total_amount'],
        sort: 'status',
      }),
      base44.entities.CodEntry.aggregate({
        query: { ...base, status: 'pending' },
        sum: 'amount',
      }),
      base44.entities.ShipmentEvent.filter(base, {
        sort: '-occurred_at',
        limit: 8,
        fields: ['tracking_number', 'status', 'event_type', 'location', 'note', 'occurred_at', 'driver_email'],
      }),
      base44.entities.Shipment.filter(
        { ...base, status: { $in: ['created', 'at_hub'] }, assigned_driver_email: { $exists: false } },
        { sort: 'created_date', limit: 5, fields: ['tracking_number', 'receiver_city', 'created_date'] }
      ),
      base44.entities.Shipment.count({
        ...base,
        status: { $in: ACTIVE_STATUSES },
        assigned_driver_email: { $exists: false },
      }),
      base44.entities.Shipment.count({ ...base, status: 'delivered', pod_at: { $exists: false } }),
      base44.entities.Shipment.count({ ...base, pod_at: { $gte: startOfToday() } }),
      base44.entities.Shipment.count({ ...base, status: 'failed' }),
      base44.entities.Shipment.count(base),
    ]).then(
      ([statusAgg, codAgg, eventPage, unassignedPage, unassigned, podMissing, deliveredToday, failed, total]) => {
        if (cancelled) return;
        const statusRows = statusAgg.rows || [];
        setData({
          statusRows,
          codPendingAmount: codAgg.rows?.[0]?.sum_amount || 0,
          codPendingCount: codAgg.rows?.[0]?.count || 0,
          events: eventPage.items || [],
          unassignedList: unassignedPage.items || [],
          unassigned,
          podMissing,
          deliveredToday,
          failed,
          total,
        });
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [tenant?.id]);

  return { data, loading };
}