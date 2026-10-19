import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Loader2, Plus, Truck, Bike, Car, Truck as TruckIcon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scopeForEntity } from '@/lib/session';
import { VEHICLE_TYPES } from '@/lib/logistics';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

const ICONS = { motorbike: Bike, car: Car, van: Truck, truck: TruckIcon, bicycle: Bike };

const emptyVehicle = { plate_number: '', type: 'van', make_model: '', capacity_kg: 100, hub_id: '' };

export default function PortalFleet() {
  const { tenant, t, session } = useOutletContext();
  const [tab, setTab] = useState('vehicles');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [performance, setPerformance] = useState({ delivered: {}, failed: {} });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [showDriver, setShowDriver] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const [driver, setDriver] = useState({ full_name: '', email: '', phone: '', role: 'driver', vehicle_id: '', hub_id: '' });

  const load = async () => {
    const [v, d, h, delivered, failed] = await Promise.all([
      api.entities.Vehicle.filter({ tenant_id: tenant.id }, { limit: 200 }),
      api.entities.TeamMember.filter({ tenant_id: tenant.id }, { limit: 200 }),
      api.entities.Hub.filter({ tenant_id: tenant.id }, { limit: 200 }),
      api.entities.Shipment.aggregate({
        query: { tenant_id: tenant.id, status: 'delivered' },
        groupBy: 'assigned_driver_email',
      }),
      api.entities.Shipment.aggregate({
        query: { tenant_id: tenant.id, status: { $in: ['failed', 'returned'] } },
        groupBy: 'assigned_driver_email',
      }),
    ]);
    const toMap = (rows) =>
      Object.fromEntries((rows || []).filter((r) => r.assigned_driver_email).map((r) => [r.assigned_driver_email, r.count || 0]));
    setVehicles(v.items || []);
    setDrivers(d.items || []);
    setHubs(h.items || []);
    setPerformance({ delivered: toMap(delivered?.rows), failed: toMap(failed?.rows) });
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const saveVehicle = async () => {
    if (!vehicle.plate_number) return;
    setBusy(true);
    const payload = { ...vehicle, capacity_kg: Number(vehicle.capacity_kg) || 0 };
    if (editingId) {
      await api.entities.Vehicle.update(editingId, payload);
    } else {
      await api.entities.Vehicle.create({
        ...payload,
        status: 'active',
        ...(await scopeForEntity(tenant, 'Vehicle', session?.user?.email)),
      });
    }
    setVehicle(emptyVehicle);
    setEditingId(null);
    setShowVehicle(false);
    setBusy(false);
    load();
  };

  const editVehicle = (record) => {
    setVehicle({
      plate_number: record.plate_number || '',
      type: record.type || 'van',
      make_model: record.make_model || '',
      capacity_kg: record.capacity_kg || 0,
      hub_id: record.hub_id || '',
    });
    setEditingId(record.id);
    setShowVehicle(true);
  };

  const toggleVehicle = async (record) => {
    await api.entities.Vehicle.update(record.id, {
      status: record.status === 'active' ? 'inactive' : 'active',
    });
    load();
  };

  const addDriver = async () => {
    if (!driver.email) return;
    setBusy(true);
    await api.functions.invoke('teamMember', {
      action: 'add',
      tenant_id: tenant.id,
      full_name: driver.full_name,
      email: driver.email,
      phone: driver.phone,
      role: driver.role,
      vehicle_id: driver.vehicle_id,
      hub_id: driver.hub_id,
    });
    setDriver({ full_name: '', email: '', phone: '', role: 'driver', vehicle_id: '', hub_id: '' });
    setShowDriver(false);
    setBusy(false);
    load();
  };

  const setAvailability = async (member, availability) => {
    await api.entities.TeamMember.update(member.id, { availability });
    setDrivers((prev) => prev.map((d) => (d.id === member.id ? { ...d, availability } : d)));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary">{t('portal.fleet')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {vehicles.length} {t('fleet.vehicles').toLowerCase()} · {drivers.length} {t('fleet.drivers').toLowerCase()}
          </p>
        </div>
        <Button
          onClick={() => {
            if (tab === 'vehicles') {
              setVehicle(emptyVehicle);
              setEditingId(null);
              setShowVehicle(true);
            } else {
              setShowDriver(true);
            }
          }}
          className="rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {tab === 'vehicles' ? t('fleet.addVehicle') : t('fleet.addDriver')}
        </Button>
      </div>

      <div className="flex gap-2">
        {['vehicles', 'drivers'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {t(`fleet.${key}`)}
          </button>
        ))}
      </div>

      {showVehicle && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <input
              placeholder={t('fleet.plate')}
              className={inputClass}
              value={vehicle.plate_number}
              onChange={(e) => setVehicle({ ...vehicle, plate_number: e.target.value })}
            />
            <select
              className={inputClass}
              value={vehicle.type}
              onChange={(e) => setVehicle({ ...vehicle, type: e.target.value })}
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`fleet.${type}`)}
                </option>
              ))}
            </select>
            <input
              placeholder={t('fleet.makeModel')}
              className={inputClass}
              value={vehicle.make_model}
              onChange={(e) => setVehicle({ ...vehicle, make_model: e.target.value })}
            />
            <input
              type="number"
              placeholder={t('fleet.capacity')}
              className={inputClass}
              value={vehicle.capacity_kg}
              onChange={(e) => setVehicle({ ...vehicle, capacity_kg: e.target.value })}
            />
            <select
              className={inputClass}
              value={vehicle.hub_id}
              onChange={(e) => setVehicle({ ...vehicle, hub_id: e.target.value })}
            >
              <option value="">{t('fleet.homeHub')}</option>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={saveVehicle} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
              {t('common.save')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowVehicle(false);
                setEditingId(null);
                setVehicle(emptyVehicle);
              }}
              className="rounded-xl"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {showDriver && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <input
              placeholder={t('common.name')}
              className={inputClass}
              value={driver.full_name}
              onChange={(e) => setDriver({ ...driver, full_name: e.target.value })}
            />
            <input
              placeholder={t('team.email')}
              className={inputClass}
              value={driver.email}
              onChange={(e) => setDriver({ ...driver, email: e.target.value })}
            />
            <input
              placeholder={t('common.phone')}
              className={inputClass}
              value={driver.phone}
              onChange={(e) => setDriver({ ...driver, phone: e.target.value })}
            />
            <select
              className={inputClass}
              value={driver.role}
              onChange={(e) => setDriver({ ...driver, role: e.target.value })}
            >
              {['driver', 'dispatcher', 'hub_supervisor', 'tenant_admin'].map((role) => (
                <option key={role} value={role}>
                  {t(`team.roles.${role}`)}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={driver.vehicle_id}
              onChange={(e) => setDriver({ ...driver, vehicle_id: e.target.value })}
            >
              <option value="">{t('fleet.unassigned')}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} · {t(`fleet.${v.type}`)}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={driver.hub_id}
              onChange={(e) => setDriver({ ...driver, hub_id: e.target.value })}
            >
              <option value="">{t('fleet.homeHub')}</option>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={addDriver} disabled={busy} className="rounded-xl bg-primary text-primary-foreground">
              {t('common.save')}
            </Button>
            <Button variant="ghost" onClick={() => setShowDriver(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {tab === 'vehicles' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.length === 0 && (
            <p className="rounded-3xl border border-border bg-card px-6 py-10 text-sm text-muted-foreground">
              {t('fleet.noVehicles')}
            </p>
          )}
          {vehicles.map((v) => {
            const Icon = ICONS[v.type] || Truck;
            return (
              <div key={v.id} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      v.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {v.status === 'active' ? t('common.active') : v.status}
                  </span>
                </div>
                <p className="mt-5 font-heading text-lg font-semibold text-primary">{v.plate_number}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`fleet.${v.type}`)} {v.make_model ? `· ${v.make_model}` : ''}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t('fleet.capacity')}: {v.capacity_kg || '—'} kg
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('fleet.assignedDriver')}: {v.assigned_driver_email || t('fleet.unassigned')}
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => editVehicle(v)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-primary transition hover:bg-secondary/70"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('fleet.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVehicle(v)}
                    className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition ${
                      v.status === 'active'
                        ? 'bg-secondary text-muted-foreground hover:text-primary'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {v.status === 'active' ? t('fleet.disable') : t('fleet.enable')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'drivers' && (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('common.name')}</th>
                  <th className="px-6 py-3 font-medium">{t('team.role')}</th>
                  <th className="px-6 py-3 font-medium">{t('common.phone')}</th>
                  <th className="px-6 py-3 font-medium">{t('fleet.performance')}</th>
                  <th className="px-6 py-3 font-medium">{t('fleet.availability')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-sm text-muted-foreground">
                      {t('fleet.noDrivers')}
                    </td>
                  </tr>
                )}
                {drivers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-primary">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{t(`team.roles.${member.role}`)}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{member.phone || '—'}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                        {performance.delivered[member.email] || 0} {t('fleet.deliveredCount').toLowerCase()}
                      </span>
                      <span className="ml-2 rounded-full bg-secondary px-3 py-1 font-semibold text-muted-foreground">
                        {performance.failed[member.email] || 0} {t('fleet.failedCount').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.availability || 'offline'}
                        onChange={(event) => setAvailability(member, event.target.value)}
                        className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs outline-none focus:border-accent"
                      >
                        <option value="available">{t('fleet.available')}</option>
                        <option value="on_delivery">{t('fleet.onDelivery')}</option>
                        <option value="offline">{t('fleet.offline')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}