'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adjustStock, saveProduct, deleteProduct, createProductCategory } from '@/actions/content';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
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
  Package,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  SlidersHorizontal,
  Loader2,
  Search,
  CheckCircle2,
  X,
  ExternalLink,
  Percent,
} from 'lucide-react';
import { formatCurrency, getAvailableStock, slugify } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string | null;
  sku: string | null;
  category_id?: string | null;
  description?: string | null;
  short_description?: string | null;
  purchase_price?: number | null;
  sale_price: number;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  expiry_date?: string | null;
  image_url?: string | null;
  is_published?: boolean;
  is_active: boolean;
  is_taxable?: boolean;
  tax_rate?: number;
  tax_type?: 'percentage' | 'flat';
  tax_inclusive?: boolean;
  flat_tax_amount?: number;
  product_categories?: Category | Category[] | null | any;
}

interface InventoryListProps {
  products: Product[];
  categories?: Category[];
  isAdmin: boolean;
}

export function InventoryList({ products, categories = [], isAdmin }: InventoryListProps) {
  const router = useRouter();
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Stock Adjustment State
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [adjustForm, setAdjustForm] = useState({
    quantity: '',
    movement_type: 'restock' as string,
    reason: '',
  });
  const [adjusting, setAdjusting] = useState(false);

  // Edit / Create Product State
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    sku: '',
    category_id: '',
    purchase_price: '0',
    sale_price: '',
    stock_quantity: '0',
    low_stock_threshold: '5',
    expiry_date: '',
    short_description: '',
    description: '',
    image_url: '',
    is_published: true,
    is_active: true,
    is_taxable: true,
    tax_rate: '0',
    tax_type: 'flat' as 'percentage' | 'flat',
    tax_inclusive: true,
    flat_tax_amount: '0',
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter products by status, category, and search query
  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Status filter
      if (filter === 'low' && !(p.is_active && p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0)) {
        return false;
      }
      if (filter === 'out' && p.stock_quantity > 0) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchSlug = p.slug?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchSlug) return false;
      }
      return true;
    });
  }, [products, filter, selectedCategory, searchQuery]);

  const lowCount = products.filter(
    (p) => p.is_active && p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0
  ).length;
  const outCount = products.filter((p) => p.stock_quantity <= 0).length;

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Please enter a category name');
      return;
    }
    setCreatingCategory(true);
    try {
      const res = await createProductCategory(trimmed);
      if (res.success && res.category) {
        setCategoryList((prev) => [...prev, res.category]);
        setEditForm((prev) => ({ ...prev, category_id: res.category.id }));
        setNewCategoryName('');
        setShowNewCategory(false);
        toast.success(`Category "${res.category.name}" created and selected!`);
      } else {
        toast.error(res.error || 'Failed to create category');
      }
    } catch {
      toast.error('Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Open Edit Modal with pre-filled product data
  const handleOpenEdit = (product: Product) => {
    setEditForm({
      name: product.name || '',
      slug: product.slug || slugify(product.name || ''),
      sku: product.sku || '',
      category_id: product.category_id || '',
      purchase_price: String(product.purchase_price ?? 0),
      sale_price: String(product.sale_price ?? ''),
      stock_quantity: String(product.stock_quantity ?? 0),
      low_stock_threshold: String(product.low_stock_threshold ?? 5),
      expiry_date: product.expiry_date || '',
      short_description: product.short_description || '',
      description: product.description || '',
      image_url: product.image_url || '',
      is_published: product.is_published ?? true,
      is_active: product.is_active ?? true,
      is_taxable: product.is_taxable ?? false,
      tax_rate: String(product.tax_rate ?? 0),
      tax_type: (product.tax_type as 'percentage' | 'flat') || (product.flat_tax_amount && Number(product.flat_tax_amount) > 0 ? 'flat' : 'flat'),
      tax_inclusive: product.tax_inclusive !== false,
      flat_tax_amount: String(product.flat_tax_amount ?? 0),
    });
    setShowNewCategory(false);
    setNewCategoryName('');
    setEditDialog({ open: true, product });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const defaultSku = `PRD-${Date.now().toString().slice(-4)}`;
    setEditForm({
      name: '',
      slug: '',
      sku: defaultSku,
      category_id: categoryList[0]?.id || '',
      purchase_price: '0',
      sale_price: '',
      stock_quantity: '10',
      low_stock_threshold: '5',
      expiry_date: '',
      short_description: '',
      description: '',
      image_url: '',
      is_published: true,
      is_active: true,
      is_taxable: true,
      tax_rate: '0',
      tax_type: 'flat',
      tax_inclusive: true,
      flat_tax_amount: '0',
    });
    setShowNewCategory(false);
    setNewCategoryName('');
    setEditDialog({ open: true, product: null });
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const salePriceNum = parseFloat(editForm.sale_price);
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
      toast.error('Sale price must be greater than 0');
      return;
    }

    setSavingProduct(true);
    try {
      const cleanSlug = editForm.slug.trim() || slugify(editForm.name);
      const cleanSku = editForm.sku.trim() || `PRD-${Date.now().toString().slice(-4)}`;

      const payload = {
        name: editForm.name.trim(),
        slug: cleanSlug,
        sku: cleanSku,
        category_id: editForm.category_id || null,
        purchase_price: parseFloat(editForm.purchase_price) || 0,
        sale_price: salePriceNum,
        stock_quantity: parseInt(editForm.stock_quantity, 10) || 0,
        low_stock_threshold: parseInt(editForm.low_stock_threshold, 10) || 5,
        expiry_date: editForm.expiry_date || null,
        short_description: editForm.short_description.trim() || null,
        description: editForm.description.trim() || null,
        image_url: editForm.image_url.trim() || '',
        is_published: editForm.is_published,
        is_active: editForm.is_active,
        is_taxable: editForm.is_taxable,
        tax_rate: editForm.is_taxable ? (parseFloat(editForm.tax_rate) || 0) : 0,
        tax_type: editForm.tax_type,
        tax_inclusive: editForm.tax_inclusive,
        flat_tax_amount: editForm.is_taxable ? (parseFloat(editForm.flat_tax_amount) || 0) : 0,
      };

      const result = await saveProduct(editDialog.product ? editDialog.product.id : null, payload);

      if (result.success) {
        toast.success(
          editDialog.product ? 'Product updated successfully' : 'Product created successfully'
        );
        setEditDialog({ open: false, product: null });
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save product');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteProduct(deleteTarget.id);
      if (result.success) {
        toast.success(`"${deleteTarget.name}" deleted successfully`);
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete product');
      }
    } catch {
      toast.error('An error occurred while deleting the product');
    } finally {
      setDeleting(false);
    }
  };

  // Adjust Stock
  const handleAdjust = async () => {
    if (!adjustDialog.product || !adjustForm.quantity || !adjustForm.reason) return;
    setAdjusting(true);

    const quantity =
      adjustForm.movement_type === 'restock' || adjustForm.movement_type === 'adjustment'
        ? Math.abs(parseInt(adjustForm.quantity, 10))
        : -Math.abs(parseInt(adjustForm.quantity, 10));

    const result = await adjustStock({
      product_id: adjustDialog.product.id,
      quantity,
      movement_type: adjustForm.movement_type,
      reason: adjustForm.reason,
    });
    setAdjusting(false);

    if (result.success) {
      toast.success('Stock adjusted successfully');
      setAdjustDialog({ open: false, product: null });
      setAdjustForm({ quantity: '', movement_type: 'restock', reason: '' });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to adjust stock');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Filters, Search, and Add Product */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-card p-3 rounded-2xl border border-gray-200/90 shadow-2xs">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-full text-xs font-semibold h-8 transition-all',
              filter === 'all'
                ? 'bg-rose-600 text-white hover:bg-rose-700 border-rose-600'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300'
            )}
          >
            All ({products.length})
          </Button>
          <Button
            variant={filter === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('low')}
            className={cn(
              'rounded-full text-xs font-semibold h-8 transition-all',
              filter === 'low'
                ? 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600'
                : 'text-amber-700 hover:bg-amber-50 border-amber-200'
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Low Stock ({lowCount})
          </Button>
          <Button
            variant={filter === 'out' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('out')}
            className={cn(
              'rounded-full text-xs font-semibold h-8 transition-all',
              filter === 'out'
                ? 'bg-red-600 text-white hover:bg-red-700 border-red-600'
                : 'text-red-700 hover:bg-red-50 border-red-200'
            )}
          >
            Out of Stock ({outCount})
          </Button>

          {/* Category Dropdown if categories exist */}
          {categoryList.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-rose-500 ml-1"
            >
              <option value="all">All Categories</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right side: Search & Add Product */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search product or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-gray-50/50 rounded-xl border-gray-200 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {isAdmin && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="h-8 px-3 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </Button>
          )}
        </div>
      </div>

      {/* Products Table */}
      {filtered.length === 0 ? (
        <Card className="border border-gray-200/90 shadow-2xs rounded-2xl">
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">No products found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your filter or search query.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200/90 shadow-2xs rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/75 border-b border-gray-200/80">
                  <TableHead className="text-xs font-bold text-gray-700">Product</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">SKU</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Price</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-center">In Stock</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-center">Reserved</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-center">Available</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-center">Status</TableHead>
                  {isAdmin && (
                    <TableHead className="text-xs font-bold text-gray-700 text-right pr-4">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => {
                  const available = getAvailableStock(product.stock_quantity, product.reserved_quantity);
                  const isLow =
                    product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
                  const isOut = product.stock_quantity <= 0;

                  return (
                    <TableRow
                      key={product.id}
                      className="hover:bg-rose-50/20 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {/* Product Name & Category */}
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 leading-tight">
                            {product.name}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {product.slug ? `/${product.slug}` : '—'}
                          </span>
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="py-3">
                        <span className="text-xs text-gray-600 font-mono font-medium bg-gray-100 px-2 py-0.5 rounded">
                          {product.sku || '—'}
                        </span>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(product.sale_price)}
                          </span>
                          {product.is_taxable ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 rounded px-1.5 py-0.5 mt-0.5 w-fit">
                              {Number(product.flat_tax_amount || 0) > 0 || product.tax_type === 'flat'
                                ? `GST Rs. ${Number(product.flat_tax_amount || 0).toLocaleString()} (${product.tax_inclusive !== false ? 'Flat Incl' : 'Flat Excl'})`
                                : `GST ${product.tax_rate}% (${product.tax_inclusive !== false ? 'Incl' : 'Excl'})`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              No GST
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* In Stock */}
                      <TableCell className="text-center py-3">
                        <span
                          className={cn(
                            'text-sm font-extrabold',
                            isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'
                          )}
                        >
                          {product.stock_quantity}
                        </span>
                      </TableCell>

                      {/* Reserved */}
                      <TableCell className="text-center py-3">
                        <span className="text-sm text-gray-400 font-medium">
                          {product.reserved_quantity}
                        </span>
                      </TableCell>

                      {/* Available */}
                      <TableCell className="text-center py-3">
                        <span className="text-sm font-bold text-gray-900">{available}</span>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-center py-3">
                        {isOut ? (
                          <Badge className="bg-red-100 text-red-700 text-[10px] font-semibold border-0">
                            Out of Stock
                          </Badge>
                        ) : isLow ? (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px] font-semibold border-0 flex items-center justify-center gap-1 mx-auto w-fit">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold border-0">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions: Adjust, Edit, Delete */}
                      {isAdmin && (
                        <TableCell className="text-right py-3 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Adjust Stock Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              title="Adjust Stock Quantity"
                              onClick={() => {
                                setAdjustDialog({ open: true, product });
                                setAdjustForm({ quantity: '', movement_type: 'restock', reason: '' });
                              }}
                              className="h-7 px-2.5 text-xs font-semibold rounded-lg border-gray-200 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                            >
                              <SlidersHorizontal className="h-3 w-3 text-gray-500" />
                              <span>Adjust</span>
                            </Button>

                            {/* Edit Product Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              title="Edit Product Details & Price"
                              onClick={() => handleOpenEdit(product)}
                              className="h-7 px-2.5 text-xs font-semibold rounded-lg border-rose-200 hover:bg-rose-50 text-rose-700 flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3 text-rose-600" />
                              <span>Edit</span>
                            </Button>

                            {/* Delete Product Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete Product"
                              onClick={() => setDeleteTarget(product)}
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog
        open={adjustDialog.open}
        onOpenChange={(open) => setAdjustDialog({ ...adjustDialog, open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock Quantity</DialogTitle>
            <DialogDescription>
              {adjustDialog.product?.name} — Current stock:{' '}
              <strong className="text-gray-900 font-bold">{adjustDialog.product?.stock_quantity}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Movement Type</Label>
              <select
                value={adjustForm.movement_type}
                onChange={(e) => setAdjustForm({ ...adjustForm, movement_type: e.target.value })}
                className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs"
              >
                <option value="restock">Restock (+)</option>
                <option value="adjustment">Manual Adjustment (+)</option>
                <option value="damage">Damage / Expired (−)</option>
                <option value="return">Customer Return (+)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                placeholder="Enter quantity"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reason / Notes *</Label>
              <Textarea
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="e.g. Received shipment from supplier / shelf audit"
                rows={2}
                className="text-xs"
              />
            </div>
            <Button
              onClick={handleAdjust}
              disabled={adjusting || !adjustForm.quantity || !adjustForm.reason}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-9 text-xs font-semibold"
            >
              {adjusting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying Adjustment...
                </>
              ) : (
                'Apply Stock Adjustment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit / Create Product Modal */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editDialog.product ? 'Edit Product Details' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editDialog.product
                ? `Update details, pricing, and stock for "${editDialog.product.name}". Changes automatically sync to POS and website.`
                : 'Create a new product. It will immediately be available in Inventory, POS, and Online Store.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Product Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Product Name *</Label>
                <Input
                  required
                  placeholder="e.g. Barrier Restore Moisture Cream"
                  value={editForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditForm((prev) => ({
                      ...prev,
                      name: val,
                      slug: !editDialog.product ? slugify(val) : prev.slug,
                    }));
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* SKU */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">SKU (Stock Keeping Unit) *</Label>
                <Input
                  required
                  placeholder="BSC-MST-001"
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Category with Inline Add */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Category</Label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {showNewCategory ? 'Select Existing Category' : '+ Add Custom Category'}
                  </button>
                </div>

                {showNewCategory ? (
                  <div className="flex items-center gap-2 p-2 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl">
                    <Input
                      placeholder="Type custom product category (e.g. Cleansers, Toners)..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategory();
                        }
                      }}
                      className="h-8 text-xs bg-white dark:bg-card"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={creatingCategory || !newCategoryName.trim()}
                      className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                    >
                      {creatingCategory ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewCategory(false)}
                      className="h-8 px-2 text-xs text-gray-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <select
                    value={editForm.category_id}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setShowNewCategory(true);
                      } else {
                        setEditForm({ ...editForm, category_id: e.target.value });
                      }
                    }}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">No Category / General</option>
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__NEW__" className="text-rose-600 font-bold">
                      + Add New Category (Doctor Custom)...
                    </option>
                  </select>
                )}
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Slug (URL path)</Label>
                <Input
                  placeholder="barrier-restore-moisture-cream"
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Sale Price */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sale Price (PKR) *</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="1400"
                  value={editForm.sale_price}
                  onChange={(e) => setEditForm({ ...editForm, sale_price: e.target.value })}
                  className="h-9 text-xs font-semibold"
                />
              </div>

              {/* Purchase / Cost Price */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cost Price (PKR)</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="950"
                  value={editForm.purchase_price}
                  onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* GST & Fiscal Tax Settings for Doctor & POS (Doctor Flat Price Mode) */}
              <div className="sm:col-span-2 p-3.5 rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                      <Percent className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                        GST / Tax Advance Setting (Flat Price Mode)
                      </Label>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Doctor can enter flat GST in Rupees directly (e.g. Rs. 150). POS will automatically deduce & record it.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={editForm.is_taxable}
                    onCheckedChange={(checked: boolean) => setEditForm({ ...editForm, is_taxable: checked })}
                  />
                </div>

                {editForm.is_taxable && (
                  <div className="pt-2.5 border-t border-rose-100 dark:border-rose-900/40 space-y-3">
                    {/* Mode Toggle: Flat Price (Doctor Preferred) vs % Percentage */}
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800/80 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, tax_type: 'flat' })}
                        className={cn(
                          'flex-1 py-1 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                          editForm.tax_type === 'flat'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        )}
                      >
                        <CheckCircle2 className={cn('h-3.5 w-3.5', editForm.tax_type === 'flat' ? 'opacity-100' : 'opacity-0')} />
                        <span>Flat GST Price (PKR Rupees) — Doctor Default</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, tax_type: 'percentage' })}
                        className={cn(
                          'py-1 px-3 rounded-md text-xs font-medium transition-all cursor-pointer',
                          editForm.tax_type === 'percentage'
                            ? 'bg-rose-600 text-white shadow-xs font-bold'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                        )}
                      >
                        % Percentage Rate
                      </button>
                    </div>

                    {/* Tax Pricing Mode: Inclusive (Option 2 Default) vs Exclusive */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, tax_inclusive: true })}
                        className={cn(
                          'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                          editForm.tax_inclusive
                            ? 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500 font-semibold'
                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-card text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Tax Inclusive (Selling Price Includes GST)</span>
                          {editForm.tax_inclusive && <CheckCircle2 className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                          Customer pays flat retail price. POS automatically records the GST portion (Doctor Option 2).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, tax_inclusive: false })}
                        className={cn(
                          'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                          !editForm.tax_inclusive
                            ? 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500 font-semibold'
                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-card text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Tax Exclusive (+ GST Extra)</span>
                          {!editForm.tax_inclusive && <CheckCircle2 className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                          GST is added on top of the retail price at POS checkout.
                        </p>
                      </button>
                    </div>

                    {/* Tax Amount / Rate Input & Calculation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editForm.tax_type === 'flat' ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                            <span>Flat GST Amount (PKR) *</span>
                            <span className="text-[10px] text-rose-600 font-semibold">Fixed Rupees</span>
                          </Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                              Rs.
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={editForm.flat_tax_amount}
                              onChange={(e) => setEditForm({ ...editForm, flat_tax_amount: e.target.value })}
                              placeholder="150"
                              className="h-9 text-xs font-bold pl-9 pr-3 text-slate-900 bg-white dark:bg-card"
                            />
                          </div>
                          {/* Quick Rupee Presets for Doctor */}
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {['50', '100', '150', '200', '250', '300', '500'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setEditForm({ ...editForm, flat_tax_amount: preset })}
                                className={cn(
                                  'px-2 py-0.5 text-[10px] rounded font-bold transition-colors cursor-pointer',
                                  editForm.flat_tax_amount === preset
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
                                )}
                              >
                                Rs. {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            GST Percentage Rate (%)
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={editForm.tax_rate}
                              onChange={(e) => setEditForm({ ...editForm, tax_rate: e.target.value })}
                              placeholder="18"
                              className="h-9 text-xs font-bold pr-7"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                              %
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {['0', '5', '16', '17', '18'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setEditForm({ ...editForm, tax_rate: preset })}
                                className={cn(
                                  'px-2 py-0.5 text-[10px] rounded font-medium transition-colors cursor-pointer',
                                  editForm.tax_rate === preset
                                    ? 'bg-rose-600 text-white font-bold'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                )}
                              >
                                {preset}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Live Calculation Preview Card for Doctor */}
                      {(() => {
                        const price = parseFloat(editForm.sale_price) || 0;
                        const isFlat = editForm.tax_type === 'flat';
                        const flatAmount = parseFloat(editForm.flat_tax_amount) || 0;
                        const rate = parseFloat(editForm.tax_rate) || 0;
                        let netPrice = price;
                        let gstAmount = 0;
                        let finalCustomerPrice = price;

                        if (price > 0) {
                          if (isFlat) {
                            gstAmount = flatAmount;
                            if (editForm.tax_inclusive) {
                              netPrice = Math.max(0, price - flatAmount);
                              finalCustomerPrice = price;
                            } else {
                              netPrice = price;
                              finalCustomerPrice = price + flatAmount;
                            }
                          } else if (rate > 0) {
                            if (editForm.tax_inclusive) {
                              netPrice = price / (1 + rate / 100);
                              gstAmount = price - netPrice;
                              finalCustomerPrice = price;
                            } else {
                              gstAmount = price * (rate / 100);
                              finalCustomerPrice = price + gstAmount;
                            }
                          }
                        }

                        return (
                          <div className="p-2.5 rounded-lg bg-gray-50/90 dark:bg-card/80 border border-gray-200/80 dark:border-gray-800 flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Live POS Price Breakdown
                            </span>
                            <div className="space-y-1 my-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Base Product Price:</span>
                                <span className="font-semibold">{formatCurrency(netPrice)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
                                <span>{isFlat ? `Flat GST (Rupees):` : `GST (${rate}%):`}</span>
                                <span>+{formatCurrency(gstAmount)}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold pt-1 border-t border-gray-200 dark:border-gray-700">
                                <span>Final Bill Price:</span>
                                <span className="text-emerald-600 font-extrabold">{formatCurrency(finalCustomerPrice)}</span>
                              </div>
                            </div>
                            <span className="text-[9.5px] text-gray-500 leading-tight">
                              {editForm.tax_inclusive
                                ? `✓ Doctor Option 2: Customer pays Rs. ${price.toLocaleString()}. POS automatically registers Rs. ${gstAmount.toLocaleString()} flat GST.`
                                : `⚡ GST Rs. ${gstAmount.toLocaleString()} will be added on top in POS cart.`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Current Stock Quantity */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Stock Quantity *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  placeholder="34"
                  value={editForm.stock_quantity}
                  onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })}
                  className="h-9 text-xs font-bold"
                />
              </div>

              {/* Low Stock Alert Threshold */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Low Stock Alert Threshold</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="5"
                  value={editForm.low_stock_threshold}
                  onChange={(e) => setEditForm({ ...editForm, low_stock_threshold: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Short Description</Label>
              <Input
                placeholder="Intense hydration barrier cream with ceramides and hyaluronic acid."
                value={editForm.short_description}
                onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Full Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Description</Label>
              <Textarea
                placeholder="Detailed directions for use, key benefits, skin types..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Toggles: Active & Published Online */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                />
                <div>
                  <Label className="text-xs font-semibold cursor-pointer">Active Product</Label>
                  <p className="text-[10px] text-gray-400">Can be sold in POS & inventory</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editForm.is_published}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_published: checked })}
                />
                <div>
                  <Label className="text-xs font-semibold cursor-pointer">Publish on Website</Label>
                  <p className="text-[10px] text-gray-400">Visible to patients in online store</p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditDialog({ open: false, product: null })}
                disabled={savingProduct}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingProduct}
                className="h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white min-w-24"
              >
                {savingProduct ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : editDialog.product ? (
                  'Save Changes'
                ) : (
                  'Create Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              Delete &quot;{deleteTarget?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-600">
              Are you sure you want to delete this product? It will be immediately removed from
              Inventory, Point of Sale (POS), and the Online Website store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="text-xs h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 font-semibold"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
