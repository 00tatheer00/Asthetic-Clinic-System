'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateClinicSettings, updateOperatingHours } from '@/actions/clinic';
import { updateStaffEmailAction, updateStaffPasswordAction } from '@/actions/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Save,
  Loader2,
  Building2,
  Receipt,
  Clock,
  UserCheck,
  RefreshCw,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  MailCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { clearBrowserCacheAndReload } from '@/lib/cache-utils';
import { cn } from '@/lib/utils';

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

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface StaffInfo {
  id?: string;
  name: string;
  email: string;
  role: string;
}

interface SettingsFormProps {
  settings: ClinicSettings | null;
  operatingHours: OperatingHour[];
  staff: StaffInfo;
  allStaff?: StaffMember[];
  isAdmin: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function SettingsForm({
  settings,
  operatingHours,
  staff,
  allStaff = [],
  isAdmin,
}: SettingsFormProps) {
  const router = useRouter();
  const [clearingCache, setClearingCache] = useState(false);

  // Super Admin Credentials Reset State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff.id || (allStaff[0]?.id ?? ''));
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const selectedMember = (allStaff || []).find((s) => s.id === selectedStaffId) || {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setUpdatingEmail(true);
    const res = await updateStaffEmailAction({
      newEmail,
      staffId: selectedStaffId || staff.id,
    });
    setUpdatingEmail(false);

    if (res.success) {
      toast.success(res.message || 'Login email successfully updated!');
      setNewEmail('');
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to update login email');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    setUpdatingPassword(true);
    const res = await updateStaffPasswordAction({
      newPassword,
      staffId: selectedStaffId || staff.id,
    });
    setUpdatingPassword(false);

    if (res.success) {
      toast.success(res.message || 'Login password successfully updated!');
      setNewPassword('');
      setConfirmPassword('');
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to update password');
    }
  };

  const handlePurgeCache = async () => {
    try {
      setClearingCache(true);
      toast.loading('Purging browser cache...', {
        id: 'settings-cache-purge',
      });
      await clearBrowserCacheAndReload({ hardRedirect: true });
    } catch (err) {
      console.error(err);
      toast.error('Failed to purge cache', {
        id: 'settings-cache-purge',
      });
      setClearingCache(false);
    }
  };

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

      {/* Super Admin Login Credentials & Security Card (Reset Email & Password) */}
      {isAdmin && (
        <Card className="border-0 shadow-sm overflow-hidden border-t-2 border-rose-600">
          <CardHeader className="pb-4 bg-gradient-to-r from-rose-50/60 to-purple-50/40 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-100/80 text-rose-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-gray-900">
                      Dashboard Login Security (Reset Email &amp; Password)
                    </CardTitle>
                    <Badge className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase font-bold tracking-wide">
                      Super Admin
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5 text-gray-600">
                    Update login credentials for yourself or clinic staff.
                  </CardDescription>
                </div>
              </div>

              {/* Staff Selector */}
              {allStaff.length > 0 && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Select Account:</span>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => {
                      setSelectedStaffId(e.target.value);
                      setNewEmail('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-xs rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-800 shadow-2xs focus:border-rose-500 focus:outline-none"
                  >
                    {allStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role === 'super_admin' ? 'Super Admin' : 'Staff'}) — {s.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Active Selected Account Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <div>
                  <span className="text-gray-500">Managing Credentials for: </span>
                  <strong className="text-gray-900 font-semibold">{selectedMember.name}</strong>
                  <span className="text-gray-400 mx-1.5">•</span>
                  <span className="font-mono text-gray-600">{selectedMember.email}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] capitalize font-medium">
                {selectedMember.role.replace('_', ' ')}
              </Badge>
            </div>

            {/* 2-Column Grid: Left Email Reset, Right Password Reset */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form 1: Reset Login Email */}
              <form onSubmit={handleUpdateEmail} className="space-y-4 p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <MailCheck className="h-4 w-4 text-rose-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      1. Reset Login Email
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Current Login Email</Label>
                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-gray-700">
                      {selectedMember.email}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      New Login Email Address *
                    </Label>
                    <Input
                      type="email"
                      required
                      placeholder="e.g. admin@brimishclinic.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                    <p className="text-[11px] text-gray-500">
                      Enter a valid new email address. This will be used for future logins.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={updatingEmail || !newEmail.trim()}
                    className="w-full h-8 text-xs bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-xs"
                  >
                    {updatingEmail ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Updating Email...
                      </>
                    ) : (
                      'Update Login Email'
                    )}
                  </Button>
                </div>
              </form>

              {/* Form 2: Reset Login Password */}
              <form onSubmit={handleUpdatePassword} className="space-y-4 p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Lock className="h-4 w-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      2. Reset Login Password
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-gray-700">New Password *</Label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium"
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="h-3 w-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Confirm New Password *
                    </Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-gray-500">
                      Password must be at least 8 characters. Both fields must match.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={updatingPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="w-full h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Browser Cache & Deployment Sync Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-rose-600" />
              <div>
                <CardTitle className="text-base">Browser Cache & Deployment Sync</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Clear local browser cache and fetch latest updates immediately.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs w-fit">
              Live Auto-Sync Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <p className="text-sm text-gray-600 leading-relaxed">
            When a new version is deployed, browsers occasionally cache older assets.
            If you do not see the latest changes or features, purge the browser cache using the button below.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Purges CacheStorage, Service Worker caches, and performs a fresh hard reload.
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={clearingCache}
              onClick={handlePurgeCache}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 gap-2 text-xs shrink-0"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', clearingCache && 'animate-spin')} />
              {clearingCache ? 'Purging Cache...' : 'Purge Cache & Reload'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
