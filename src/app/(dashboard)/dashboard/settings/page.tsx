import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();

  const isAdmin = staff.role === 'super_admin';

  const { data: settings } = await supabase
    .from('clinic_settings')
    .select('*')
    .limit(1)
    .single();

  const { data: hours } = await supabase
    .from('operating_hours')
    .select('*')
    .order('day_of_week');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Clinic configuration and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinic Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Clinic Information</CardTitle>
            <CardDescription>Basic clinic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{settings?.clinic_name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-900">{settings?.clinic_phone || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{settings?.clinic_email || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Address</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">{settings?.clinic_address || '—'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tax & Compliance */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tax & Compliance</CardTitle>
            <CardDescription>Tax configuration for invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax Label</span>
              <span className="font-medium text-gray-900">{settings?.default_tax_label || 'GST'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax Rate</span>
              <span className="font-medium text-gray-900">{settings?.default_tax_rate || 0}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">NTN</span>
              <span className="font-medium text-gray-900">{settings?.ntn || 'Not set'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">STRN</span>
              <span className="font-medium text-gray-900">{settings?.strn || 'Not set'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Operating Hours</CardTitle>
            <CardDescription>Clinic schedule displayed on the website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(hours || []).map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{dayNames[h.day_of_week]}</span>
                  {h.is_closed ? (
                    <Badge variant="outline" className="text-red-500 border-red-200 text-xs">Closed</Badge>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {h.open_time?.slice(0, 5)} – {h.close_time?.slice(0, 5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff Info */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{staff.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{staff.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Role</span>
              <Badge className={isAdmin ? 'bg-purple-100 text-purple-700 border-0' : 'bg-blue-100 text-blue-700 border-0'}>
                {isAdmin ? 'Super Admin' : 'Receptionist'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isAdmin && (
        <p className="text-xs text-gray-400 text-center">
          Contact the admin to update clinic settings.
        </p>
      )}
    </div>
  );
}
