'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBeforeAfter, updateBeforeAfterVisibility } from '@/actions/clinic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Lock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConsentRecord {
  id: string;
  consent_status: 'pending' | 'given' | 'revoked';
  consent_notes: string | null;
  consent_given_at: string | null;
}

interface BACase {
  id: string;
  title: string | null;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  is_public: boolean;
  patient_id: string | null;
  treatment_id: string | null;
  created_at: string;
  treatments?: { id: string; name: string } | null;
  patients?: { id: string; name: string; phone: string } | null;
  consent_records?: ConsentRecord[];
}

interface GalleryListProps {
  cases: BACase[];
  treatments: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string; phone: string }>;
  isAdmin: boolean;
}

export function GalleryList({ cases, treatments, patients, isAdmin }: GalleryListProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [treatmentId, setTreatmentId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [description, setDescription] = useState('');
  const [consentStatus, setConsentStatus] = useState<'pending' | 'given' | 'revoked'>('given');
  const [consentNotes, setConsentNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const openCreateDialog = () => {
    setTitle('');
    setTreatmentId(treatments[0]?.id || '');
    setPatientId('');
    setBeforeUrl('');
    setAfterUrl('');
    setDescription('');
    setConsentStatus('given');
    setConsentNotes('Signed physical photo release form on file.');
    setIsPublic(false);
    setDialogOpen(true);
  };

  const handleToggleVisibility = async (c: BACase) => {
    setTogglingId(c.id);
    const newStatus = !c.is_public;

    try {
      const res = await updateBeforeAfterVisibility(c.id, newStatus);
      if (res.success) {
        toast.success(newStatus ? 'Case published to public gallery' : 'Case hidden from public gallery');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to update visibility');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeUrl.trim() || !afterUrl.trim()) {
      toast.error('Both Before and After image URLs are required.');
      return;
    }

    if (isPublic && consentStatus !== 'given') {
      toast.error('Patient consent must be marked as "Given" to publish publicly.');
      return;
    }

    setSaving(true);
    try {
      const res = await createBeforeAfter({
        treatment_id: treatmentId || null,
        patient_id: patientId || null,
        title: title || undefined,
        description: description || undefined,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        is_public: isPublic,
        consent_status: patientId ? consentStatus : undefined,
        consent_notes: consentNotes || undefined,
      });

      if (res.success) {
        toast.success('Case added to gallery successfully');
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save case');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Before & After Cases</h1>
          <p className="text-sm text-gray-500">
            Clinical result documentation and consent-managed public transformations.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreateDialog}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Case
          </Button>
        )}
      </div>

      {/* Grid */}
      {cases.length === 0 ? (
        <Card className="border-dashed border-gray-200 text-center py-12">
          <CardContent>
            <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800">No cases recorded</h3>
            <p className="text-xs text-gray-400 mt-1">
              Add before and after treatment photographs with patient consent records.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => {
            const consent = c.consent_records?.[0];
            const hasConsent = consent?.consent_status === 'given';
            const isToggling = togglingId === c.id;

            return (
              <Card key={c.id} className="border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {/* Images side-by-side */}
                <div className="grid grid-cols-2 bg-gray-100 h-48 border-b">
                  <div className="relative border-r border-gray-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.before_image_url}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      BEFORE
                    </span>
                  </div>
                  <div className="relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.after_image_url}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      AFTER
                    </span>
                  </div>
                </div>

                {/* Details */}
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-900 truncate">
                        {c.title || c.treatments?.name || 'Treatment Transformation'}
                      </span>
                      {c.treatments && (
                        <Badge variant="outline" className="text-[10px] text-gray-600">
                          {c.treatments.name}
                        </Badge>
                      )}
                    </div>

                    {c.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>
                    )}

                    {/* Patient & Consent Info */}
                    <div className="pt-2 border-t text-[11px] space-y-1">
                      {c.patients && (
                        <div className="flex items-center justify-between text-gray-500">
                          <span>Patient:</span>
                          <span className="font-medium text-gray-800">{c.patients.name}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Consent:</span>
                        {consent ? (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] font-medium',
                              consent.consent_status === 'given' && 'bg-green-100 text-green-700',
                              consent.consent_status === 'pending' && 'bg-amber-100 text-amber-700',
                              consent.consent_status === 'revoked' && 'bg-red-100 text-red-700'
                            )}
                          >
                            {consent.consent_status === 'given' ? (
                              <ShieldCheck className="h-3 w-3 mr-1 inline" />
                            ) : (
                              <ShieldAlert className="h-3 w-3 mr-1 inline" />
                            )}
                            {consent.consent_status}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Anonymous / Unlinked</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Visibility Toggle */}
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {c.is_public ? (
                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                      )}
                      <span className="text-xs font-medium text-gray-700">
                        {c.is_public ? 'Public on website' : 'Internal only'}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        {isToggling && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                        <Switch
                          checked={c.is_public}
                          disabled={isToggling || (c.patient_id !== null && !hasConsent && !c.is_public)}
                          onCheckedChange={() => handleToggleVisibility(c)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Before & After Case</DialogTitle>
            <DialogDescription>
              Add clinical photographs with treatment classification and patient consent.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Case Title</Label>
              <Input
                placeholder="e.g. 3-Session Acne Scar Subcision & Microneedling"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Treatment</Label>
                <select
                  value={treatmentId}
                  onChange={(e) => setTreatmentId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Treatment</option>
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Linked Patient (Optional)</Label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Anonymous / Not Linked</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Before Image URL *</Label>
                <Input
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={beforeUrl}
                  onChange={(e) => setBeforeUrl(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">After Image URL *</Label>
                <Input
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={afterUrl}
                  onChange={(e) => setAfterUrl(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Clinical Notes & Observations</Label>
              <Textarea
                placeholder="Details on session intervals, peel percentage, patient skin type..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Consent Section if patient is linked */}
            {patientId && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Lock className="h-3.5 w-3.5" />
                  Patient Privacy & Consent Record
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] text-gray-700">Consent Status</Label>
                    <select
                      value={consentStatus}
                      onChange={(e) => setConsentStatus(e.target.value as 'pending' | 'given' | 'revoked')}
                      className="w-full h-8 rounded border border-gray-300 bg-white px-2 text-xs"
                    >
                      <option value="given">Given (Authorized)</option>
                      <option value="pending">Pending</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-[11px] text-gray-700">Consent Notes</Label>
                    <Input
                      placeholder="e.g. Signed physical form"
                      value={consentNotes}
                      onChange={(e) => setConsentNotes(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Visibility */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs font-medium text-gray-900">Publish in Public Gallery</p>
                <p className="text-[10px] text-gray-500">Show on public /gallery showcase</p>
              </div>
              <Switch
                checked={isPublic}
                disabled={!!patientId && consentStatus !== 'given'}
                onCheckedChange={setIsPublic}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Save Case
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
