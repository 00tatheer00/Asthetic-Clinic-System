'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProduct, deleteProduct } from '@/actions/content';
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
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, slugify } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string | null;
  description: string | null;
  short_description: string | null;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  expiry_date: string | null;
  image_url: string | null;
  is_published: boolean;
  is_active: boolean;
  product_categories?: Category | null;
}

interface ProductsListProps {
  products: Product[];
  categories: Category[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  categoryFilter: string;
  isAdmin: boolean;
}

export function ProductsList({
  products,
  categories,
  totalCount,
  currentPage,
  pageSize,
  search,
  categoryFilter,
  isAdmin,
}: ProductsListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteProduct(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      toast.success(`Product "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete product');
    }
  };

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchValue) params.set('search', searchValue);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    params.set('page', '1');
    router.push(`/dashboard/content/products?${params.toString()}`);
  };

  const handleCategoryFilter = (catId: string) => {
    const params = new URLSearchParams();
    if (searchValue) params.set('search', searchValue);
    if (catId !== 'all') params.set('category', catId);
    params.set('page', '1');
    router.push(`/dashboard/content/products?${params.toString()}`);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategoryId(categories[0]?.id || '');
    setPurchasePrice('');
    setSalePrice('');
    setStockQuantity('10');
    setLowStockThreshold('5');
    setExpiryDate('');
    setShortDescription('');
    setDescription('');
    setImageUrl('');
    setIsPublished(true);
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSlug(prod.slug);
    setSku(prod.sku);
    setCategoryId(prod.category_id || '');
    setPurchasePrice(String(prod.purchase_price));
    setSalePrice(String(prod.sale_price));
    setStockQuantity(String(prod.stock_quantity));
    setLowStockThreshold(String(prod.low_stock_threshold));
    setExpiryDate(prod.expiry_date || '');
    setShortDescription(prod.short_description || '');
    setDescription(prod.description || '');
    setImageUrl(prod.image_url || '');
    setIsPublished(prod.is_published);
    setIsActive(prod.is_active);
    setDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingProduct) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !sku.trim()) {
      toast.error('Name, Slug, and SKU are required');
      return;
    }

    const pPrice = parseFloat(purchasePrice) || 0;
    const sPrice = parseFloat(salePrice) || 0;
    if (sPrice <= 0) {
      toast.error('Sale price must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        sku,
        category_id: categoryId || null,
        purchase_price: pPrice,
        sale_price: sPrice,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        expiry_date: expiryDate || null,
        short_description: shortDescription || null,
        description: description || null,
        image_url: imageUrl || '',
        is_published: isPublished,
        is_active: isActive,
      };

      const res = await saveProduct(editingProduct ? editingProduct.id : null, payload);

      if (res.success) {
        toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save product');
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products & Catalog</h1>
          <p className="text-sm text-gray-500">
            Manage your clinic retail products, stock levels, and store visibility.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreateDialog}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Product
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
              placeholder="Search products by name or SKU..."
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

      {/* Products Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/75">
              <TableRow>
                <TableHead className="text-xs font-semibold text-gray-600">Product</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">SKU</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Category</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Cost Price</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Sale Price</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-center">Stock</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((prod) => {
                  const isLowStock = prod.stock_quantity <= prod.low_stock_threshold;

                  return (
                    <TableRow key={prod.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 overflow-hidden border">
                            {prod.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{prod.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">/{prod.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">{prod.sku}</TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {prod.product_categories?.name || '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {formatCurrency(prod.purchase_price)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-gray-900">
                        {formatCurrency(prod.sale_price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs font-medium',
                            prod.stock_quantity === 0
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          )}
                        >
                          {isLowStock && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                          {prod.stock_quantity} in stock
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {prod.is_published ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 text-[10px]">
                              Clinic Only
                            </Badge>
                          )}
                          {!prod.is_active && (
                            <Badge variant="destructive" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(prod)}
                              className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(prod)}
                              className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
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
                router.push(`/dashboard/content/products?${p.toString()}`);
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
                router.push(`/dashboard/content/products?${p.toString()}`);
              }}
              className="h-8"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Product Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product details, pricing, and catalog visibility.'
                : 'Enter details for the new product to list in inventory and online store.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Product Name *</Label>
                <Input
                  required
                  placeholder="e.g. Ceramide Barrier Repair Cream"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">URL Slug *</Label>
                <Input
                  required
                  placeholder="ceramide-barrier-repair-cream"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">SKU *</Label>
                <Input
                  required
                  placeholder="PRD-1001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
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
                <Label className="text-xs font-medium">Purchase / Cost Price (PKR) *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="any"
                  placeholder="2500"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sale Price (PKR) *</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="3800"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Initial Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  disabled={!!editingProduct}
                  placeholder="10"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="text-xs"
                />
                {editingProduct && (
                  <p className="text-[10px] text-gray-400">
                    Use Inventory &gt; Adjust Stock to modify active inventory.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Low Stock Alert Threshold</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="5"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Short Description (for product card)</Label>
              <Input
                placeholder="Intense hydration barrier cream with 5 essential ceramides."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Description</Label>
              <Textarea
                placeholder="Detailed usage directions, ingredients, skin types..."
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
                  <p className="text-xs font-medium text-gray-900">Publish in Online Store</p>
                  <p className="text-[10px] text-gray-500">Allow customers to order online</p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-900">Active Status</p>
                  <p className="text-[10px] text-gray-500">Enable in POS and inventory</p>
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
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This will remove the item from inventory and active product listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
