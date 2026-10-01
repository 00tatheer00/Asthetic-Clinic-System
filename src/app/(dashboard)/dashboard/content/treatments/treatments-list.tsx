'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTreatment, deleteTreatment } from '@/actions/content';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Stethoscope,
} from 'lucide-react';
import { formatCurrency, slugify } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Treatment {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  short_description: string | null;
  price: number | null;
  price_label: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  treatment_categories?: Category | null;
}

interface TreatmentsListProps {
  treatments: Treatment[];
  categories: Category[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  categoryFilter: string;
  isAdmin: boolean;
}

export function TreatmentsList({
  treatments,
  categories,
  totalCount,
  currentPage,
  pageSize,
  search,
  categoryFilter,
  isAdmin,
}: TreatmentsListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Treatment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteTreatment(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      toast.success(`Treatment "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete treatment');
    }
  };

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchValue) params.set('search', searchValue);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    params.set('page', '1');
    router.push(`/dashboard/content/treatments?${params.toString()}`);
  };

  const handleCategoryFilter = (catId: string) => {
    const params = new URLSearchParams();
    if (searchValue) params.set('search', searchValue);
    if (catId !== 'all') params.set('category', catId);
    params.set('page', '1');
    router.push(`/dashboard/content/treatments?${params.toString()}`);
  };

  const openCreateDialog = () => {
    setEditingTreatment(null);
    setName('');
    setSlug('');
    setCategoryId(categories[0]?.id || '');
    setPrice('');
    setPriceLabel('Starting from');
    setDurationMinutes('45');
    setShortDescription('');
    setDescription('');
    setImageUrl('');
    setIsActive(true);
    setIsFeatured(false);
    setSortOrder('0');
    setDialogOpen(true);
  };

  const openEditDialog = (t: Treatment) => {
    setEditingTreatment(t);
    setName(t.name);
    setSlug(t.slug);
    setCategoryId(t.category_id || '');
    setPrice(t.price ? String(t.price) : '');
    setPriceLabel(t.price_label || '');
    setDurationMinutes(t.duration_minutes ? String(t.duration_minutes) : '45');
    setShortDescription(t.short_description || '');
    setDescription(t.description || '');
    setImageUrl(t.image_url || '');
    setIsActive(t.is_active);
    setIsFeatured(t.is_featured);
    setSortOrder(String(t.sort_order));
    setDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingTreatment) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        category_id: categoryId || null,
        price: price ? parseFloat(price) : null,
        price_label: priceLabel || null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        short_description: shortDescription || null,
        description: description || null,
        image_url: imageUrl || '',
        is_active: isActive,
        is_featured: isFeatured,
        sort_order: parseInt(sortOrder, 10) || 0,
      };

      const res = await saveTreatment(editingTreatment ? editingTreatment.id : null, payload);

      if (res.success) {
        toast.success(editingTreatment ? 'Treatment updated' : 'Treatment created');
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save treatment');
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Treatments & Procedures</h1>
          <p className="text-sm text-gray-500">
            Manage clinical procedures, session durations, pricing, and public showcase.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreateDialog}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Treatment
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => handleCategoryFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
              categoryFilter === 'all'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                categoryFilter === cat.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search treatments..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={handleSearch} className="h-9 text-xs">
            Search
          </Button>
        </div>
      </div>

      {/* Treatments Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/75">
              <TableRow>
                <TableHead className="text-xs font-semibold text-gray-600">Treatment</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Category</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-center">Duration</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Price</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-center">Featured</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    No treatments found.
                  </TableCell>
                </TableRow>
              ) : (
                treatments.map((t) => (
                  <TableRow key={t.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 text-rose-500 overflow-hidden border">
                          {t.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={t.image_url}
                              alt={t.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Stethoscope className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{t.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">/{t.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {t.treatment_categories?.name || '—'}
                    </TableCell>
                    <TableCell className="text-center text-xs text-gray-600">
                      {t.duration_minutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {t.duration_minutes} min
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-gray-900">
                      {t.price ? (
                        <div>
                          <span>{formatCurrency(t.price)}</span>
                          {t.price_label && (
                            <span className="text-[10px] text-gray-400 block font-normal">
                              {t.price_label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-normal">Consultation</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {t.is_featured ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                          <Sparkles className="h-3 w-3 mr-1 inline" />
                          Featured
                        </Badge>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {t.is_active ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(t)}
                            className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(t)}
                            className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Page {currentPage} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const p = new URLSearchParams();
                if (search) p.set('search', search);
                if (categoryFilter !== 'all') p.set('category', categoryFilter);
                p.set('page', String(currentPage - 1));
                router.push(`/dashboard/content/treatments?${p.toString()}`);
              }}
              className="h-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const p = new URLSearchParams();
                if (search) p.set('search', search);
                if (categoryFilter !== 'all') p.set('category', categoryFilter);
                p.set('page', String(currentPage + 1));
                router.push(`/dashboard/content/treatments?${p.toString()}`);
              }}
              className="h-8"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Treatment Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}</DialogTitle>
            <DialogDescription>
              {editingTreatment
                ? 'Update procedure details, clinical description, and pricing.'
                : 'Add a new treatment service to clinic booking and website.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Treatment Name *</Label>
                <Input
                  required
                  placeholder="e.g. Carbon Laser Peel"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">URL Slug *</Label>
                <Input
                  required
                  placeholder="carbon-laser-peel"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Duration (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  step="5"
                  placeholder="45"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Price (PKR)</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="8000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Price Label</Label>
                <Input
                  placeholder="e.g. Starting from, Per session"
                  value={priceLabel}
                  onChange={(e) => setPriceLabel(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Short Summary</Label>
              <Input
                placeholder="Non-invasive laser procedure for porcelain glow, acne clearing and pores."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Detailed Procedure Information</Label>
              <Textarea
                placeholder="Candidate profile, expected results, downtime, aftercare tips..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Image URL</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="pt-2 border-t grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-900">Featured Service</p>
                  <p className="text-[10px] text-gray-500">Highlight on homepage</p>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-900">Active Status</p>
                  <p className="text-[10px] text-gray-500">Available for booking</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
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
                {editingTreatment ? 'Save Changes' : 'Create Treatment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Treatment Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Treatment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This will remove the service from active treatment listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete Treatment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
