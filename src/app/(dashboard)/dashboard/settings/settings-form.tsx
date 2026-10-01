'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateClinicSettings, updateOperatingHours } from '@/actions/clinic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, Building2, Receipt, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ClinicSettings {
  id: string;
  clinic_name: string;
  clinic_phone: string;
  clinic_email: string | null;
  clinic_address: string;
  default_tax_label: string | null;
  default_tax_rate: number;
  ntn: string | null;
  strn: string | null;
}

interface OperatingHour {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

interface StaffInfo {
  name: string;
  email: string;
  role: string;
}

interface SettingsFormProps {
  settings: ClinicSettings | null;
  operatingHours: OperatingHour[];
  staff: StaffInfo;
  isAdmin: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function SettingsForm({ settings, operatingHours, staff, isAdmin }: SettingsFormProps) {
  const router = useRouter();

  // Settings form state
  const [form, setForm] = useState({
    clinic_name: settings?.clinic_name || 'Brimish Skin Clinic & Aesthetic Studio',
    clinic_phone: settings?.clinic_phone || '+92 300 0000000',
    clinic_email: settings?.clinic_email || 'info@brimishclinic.com',
    clinic_address: settings?.clinic_address || 'Peshawar, Pakistan',
    default_tax_label: settings?.default_tax_label || 'GST',
    default_tax_rate: settings?.default_tax_rate ?? 0,
    ntn: settings?.ntn || '',
    strn: settings?.strn || '',
  });

  // Operating hours state
  const [hours, setHours] = useState(
    (operatingHours || []).map((h) => ({
      id: h.id,
      day_of_week: h.day_of_week,
      open_time: h.open_time?.slice(0, 5) || '10:00',
      close_time: h.close_time?.slice(0, 5) || '19:00',
      is_closed: !!h.is_closed,
    }))
  );

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSavingSettings(true);
    const res = await updateClinicSettings({
      clinic_name: form.clinic_name,
      clinic_phone: form.clinic_phone,
      clinic_email: form.clinic_email,
      clinic_address: form.clinic_address,
      default_tax_label: form.default_tax_label,
      default_tax_rate: Number(form.default_tax_rate) || 0,
      ntn: form.ntn,
      strn: form.strn,
    });
    setSavingSettings(false);

    if (res.success) {
      toast.success('Clinic settings saved successfully!');
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to save settings');
    }
  };

  const handleSaveHours = async () => {
    if (!isAdmin) return;

    setSavingHours(true);
    const formattedHours = hours.map((h) => ({
      id: h.id,
      open_time: `${h.open_time}:00`,
      close_time: `${h.close_time}:00`,
      is_closed: h.is_closed,
    }));

    const res = await updateOperatingHours(formattedHours);
    setSavingHours(false);

    if (res.success) {
      toast.success('Operating hours updated successfully!');
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to save operating hours');
    }
  };

  return (
    <div className="space-y-6">
      {/* Clinic Details & Tax Form */}
      <form onSubmit={handleSaveSettings}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clinic Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-rose-600" />
                <CardTitle className="text-base">Clinic Information</CardTitle>
              </div>
              <CardDescription>Official clinic name, contact phone, and location address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Clinic Name *</Label>
                <Input
                  value={form.clinic_name}
                  onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                  disabled={!isAdmin}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phone Number *</Label>
                  <Input
                    value={form.clinic_phone}
                    onChange={(e) => setForm({ ...form, clinic_phone: e.target.value })}
                    disabled={!isAdmin}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Official Email</Label>
                  <Input
                    type="email"
                    value={form.clinic_email}
                    onChange={(e) => setForm({ ...form, clinic_email: e.target.value })}
                    disabled={!isAdmin}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Clinic Physical Address *</Label>
                <Textarea
                  value={form.clinic_address}
                  onChange={(e) => setForm({ ...form, clinic_address: e.target.value })}
                  disabled={!isAdmin}
                  rows={2}
                  className="text-xs"
                />
              </div>

              {isAdmin && (
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingSettings}
                    className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Clinic Info
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax & Compliance */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base">Tax & Fiscal Compliance</CardTitle>
              </div>
              <CardDescription>Default tax rates and registration numbers for POS & invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tax Label</Label>
                  <Input
                    value={form.default_tax_label}
                    onChange={(e) => setForm({ ...form, default_tax_label: e.target.value })}
                    disabled={!isAdmin}
                    placeholder="GST / Sales Tax"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.default_tax_rate}
                    onChange={(e) => setForm({ ...form, default_tax_rate: Number(e.target.value) })}
                    disabled={!isAdmin}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">NTN (National Tax Number)</Label>
                  <Input
                    value={form.ntn}
                    onChange={(e) => setForm({ ...form, ntn: e.target.value })}
                    disabled={!isAdmin}
                    placeholder="1234567-8"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">STRN (Sales Tax Reg.)</Label>
                  <Input
                    value={form.strn}
                    onChange={(e) => setForm({ ...form, strn: e.target.value })}
                    disabled={!isAdmin}
                    placeholder="12-34-5678-901-23"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-8 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingSettings}
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Tax Settings
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Operating Hours */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Clinic Operating Schedule</CardTitle>
            </div>
            <CardDescription>Opening and closing hours displayed publicly and used for bookings.</CardDescription>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={handleSaveHours}
              disabled={savingHours}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {savingHours ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Schedule
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
            {hours.map((h, idx) => (
              <div
                key={h.id || idx}
                className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/75 flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">{DAY_NAMES[h.day_of_week]}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500">{h.is_closed ? 'Closed' : 'Open'}</span>
                    <Switch
                      checked={!h.is_closed}
                      disabled={!isAdmin}
                      onCheckedChange={(checked) => {
                        const updated = [...hours];
                        updated[idx].is_closed = !checked;
                        setHours(updated);
                      }}
                    />
                  </div>
                </div>

                {!h.is_closed ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-0.5">Open</span>
                      <Input
                        type="time"
                        value={h.open_time}
                        disabled={!isAdmin}
                        onChange={(e) => {
                          const updated = [...hours];
                          updated[idx].open_time = e.target.value;
                          setHours(updated);
                        }}
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-0.5">Close</span>
                      <Input
                        type="time"
                        value={h.close_time}
                        disabled={!isAdmin}
                        onChange={(e) => {
                          const updated = [...hours];
                          updated[idx].close_time = e.target.value;
                          setHours(updated);
                        }}
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-1 text-center">
                    <Badge variant="outline" className="text-rose-600 border-rose-200 text-[10px]">
                      Closed on {DAY_NAMES[h.day_of_week]}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-base">Authenticated Staff Session</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50">
            <span className="text-gray-500">Name</span>
            <span className="font-semibold text-gray-900">{staff.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-700">{staff.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm py-1">
            <span className="text-gray-500">Role</span>
            <Badge
              className={
                isAdmin
                  ? 'bg-purple-100 text-purple-700 border-0 text-xs'
                  : 'bg-blue-100 text-blue-700 border-0 text-xs'
              }
            >
              {isAdmin ? 'Super Admin' : 'Clinic Receptionist'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
