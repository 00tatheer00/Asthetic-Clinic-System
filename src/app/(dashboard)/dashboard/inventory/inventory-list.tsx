'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adjustStock } from '@/actions/content';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Package, AlertTriangle, Plus, Minus, Loader2 } from 'lucide-react';
import { formatCurrency, getAvailableStock } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
}

interface InventoryListProps {
  products: Product[];
  isAdmin: boolean;
}

export function InventoryList({ products, isAdmin }: InventoryListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [adjustForm, setAdjustForm] = useState({ quantity: '', movement_type: 'restock' as string, reason: '' });
  const [adjusting, setAdjusting] = useState(false);

  const filtered = products.filter((p) => {
    if (filter === 'low') return p.is_active && p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0;
    if (filter === 'out') return p.stock_quantity <= 0;
    return true;
  });

  const lowCount = products.filter((p) => p.is_active && p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0).length;
  const outCount = products.filter((p) => p.stock_quantity <= 0).length;

  const handleAdjust = async () => {
    if (!adjustDialog.product || !adjustForm.quantity || !adjustForm.reason) return;
    setAdjusting(true);

    const quantity = adjustForm.movement_type === 'restock' || adjustForm.movement_type === 'adjustment'
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
      toast.success('Stock adjusted');
      setAdjustDialog({ open: false, product: null });
      setAdjustForm({ quantity: '', movement_type: 'restock', reason: '' });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} className={cn('rounded-full text-xs', filter === 'all' && 'bg-gray-900 text-white')}>
          All ({products.length})
        </Button>
        <Button variant={filter === 'low' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('low')} className={cn('rounded-full text-xs', filter === 'low' && 'bg-amber-600 text-white')}>
          ⚠ Low Stock ({lowCount})
        </Button>
        <Button variant={filter === 'out' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('out')} className={cn('rounded-full text-xs', filter === 'out' && 'bg-red-600 text-white')}>
          Out of Stock ({outCount})
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No products match this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-semibold">Product</TableHead>
                  <TableHead className="text-xs font-semibold">SKU</TableHead>
                  <TableHead className="text-xs font-semibold">Price</TableHead>
                  <TableHead className="text-xs font-semibold">In Stock</TableHead>
                  <TableHead className="text-xs font-semibold">Reserved</TableHead>
                  <TableHead className="text-xs font-semibold">Available</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  {isAdmin && <TableHead className="text-xs font-semibold text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => {
                  const available = getAvailableStock(product.stock_quantity, product.reserved_quantity);
                  const isLow = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
                  const isOut = product.stock_quantity <= 0;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500 font-mono">{product.sku || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{formatCurrency(product.sale_price)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-sm font-medium', isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900')}>
                          {product.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{product.reserved_quantity}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">{available}</span>
                      </TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge className="bg-red-100 text-red-700 text-[10px] border-0">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px] border-0 flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" /> Low
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-[10px] border-0">In Stock</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAdjustDialog({ open: true, product });
                              setAdjustForm({ quantity: '', movement_type: 'restock', reason: '' });
                            }}
                            className="h-7 text-xs rounded-lg"
                          >
                            Adjust
                          </Button>
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
      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ ...adjustDialog, open })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {adjustDialog.product?.name} — Current: {adjustDialog.product?.stock_quantity}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={adjustForm.movement_type}
                onChange={(e) => setAdjustForm({ ...adjustForm, movement_type: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="restock">Restock (+)</option>
                <option value="adjustment">Manual Adjustment (+)</option>
                <option value="damage">Damage (−)</option>
                <option value="return">Return (+)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} placeholder="Enter quantity" />
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="Reason for adjustment" rows={2} />
            </div>
            <Button
              onClick={handleAdjust}
              disabled={adjusting || !adjustForm.quantity || !adjustForm.reason}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg"
            >
              {adjusting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adjusting...</> : 'Apply Adjustment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
