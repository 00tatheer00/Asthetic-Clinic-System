'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSale } from '@/actions/pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Minus, Trash2, ShoppingCart, Receipt, Loader2, Search, CheckCircle2, Printer, ExternalLink } from 'lucide-react';
import { formatCurrency, calculateLineTotal, calculateDiscount, calculateTax } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface POSItem {
  id: string;
  product_id: string | null;
  treatment_id: string | null;
  item_type: 'product' | 'service';
  name: string;
  quantity: number;
  unit_price: number;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number;
  max_stock?: number;
}

export function POSTerminal({ products, treatments, taxRate }: {
  products: Array<{ id: string; name: string; sale_price: number; stock_quantity: number; reserved_quantity: number }>;
  treatments: Array<{ id: string; name: string; price: number | null }>;
  taxRate: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState<POSItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastSaleInfo, setLastSaleInfo] = useState<{
    saleId: string;
    invoiceId?: string | null;
    invoiceNumber?: string | null;
    total: number;
    customerName: string;
    paymentMethod: string;
  } | null>(null);

  // Filter items by search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTreatments = treatments.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addProduct = (product: typeof products[0]) => {
    const available = product.stock_quantity - product.reserved_quantity;
    const existing = items.find((i) => i.product_id === product.id);

    if (existing) {
      if (existing.quantity >= available) {
        toast.error('No more stock available');
        return;
      }
      setItems(items.map((i) =>
        i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        id: crypto.randomUUID(),
        product_id: product.id,
        treatment_id: null,
        item_type: 'product',
        name: product.name,
        quantity: 1,
        unit_price: product.sale_price,
        discount_type: null,
        discount_value: 0,
        max_stock: available,
      }]);
    }
  };

  const addTreatment = (treatment: typeof treatments[0]) => {
    setItems([...items, {
      id: crypto.randomUUID(),
      product_id: null,
      treatment_id: treatment.id,
      item_type: 'service',
      name: treatment.name,
      quantity: 1,
      unit_price: treatment.price || 0,
      discount_type: null,
      discount_value: 0,
    }]);
  };

  const updateQuantity = (id: string, qty: number) => {
    setItems(items.map((i) => i.id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.max_stock || 999)) } : i));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item.unit_price, item.quantity, item.discount_type, item.discount_value), 0);
  const saleDiscount = calculateDiscount(subtotal, discountType, discountValue);
  const afterDiscount = subtotal - saleDiscount;
  const tax = calculateTax(afterDiscount, taxRate);
  const total = afterDiscount + tax;
  const change = paymentMethod === 'cash' && amountReceived ? Math.max(0, parseFloat(amountReceived) - total) : 0;

  const handleCompleteSale = async () => {
    if (items.length === 0) { toast.error('Add items first'); return; }

    setProcessing(true);
    const result = await createSale({
      items: items.map((i) => ({
        product_id: i.product_id,
        treatment_id: i.treatment_id,
        item_type: i.item_type,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount_type: i.discount_type,
        discount_value: i.discount_value,
      })),
      customer_name: customerName || undefined,
      payment_method: paymentMethod,
      amount_received: amountReceived ? parseFloat(amountReceived) : undefined,
      discount_type: discountType,
      discount_value: discountValue,
      tax_rate: taxRate,
      idempotency_key: crypto.randomUUID(),
    });
    setProcessing(false);

    if (result.success) {
      setLastSaleInfo({
        saleId: result.saleId,
        invoiceId: (result as { invoiceId?: string | null }).invoiceId,
        invoiceNumber: (result as { invoiceNumber?: string | null }).invoiceNumber,
        total,
        customerName: customerName || 'Walk-in Customer',
        paymentMethod,
      });
      setShowSuccess(true);
    } else {
      toast.error(result.error || 'Failed to process sale');
    }
  };

  const handleResetSale = () => {
    setShowSuccess(false);
    setLastSaleInfo(null);
    setItems([]);
    setCustomerName('');
    setAmountReceived('');
    setDiscountType(null);
    setDiscountValue(0);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-8rem)]">
      {/* Left: Product Search & Selection */}
      <div className="lg:col-span-3 flex flex-col">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products or treatments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Products</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredProducts.map((p) => {
                  const available = p.stock_quantity - p.reserved_quantity;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      disabled={available <= 0}
                      className={cn(
                        'text-left p-3 rounded-xl border transition-all',
                        available <= 0
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-rose-200 hover:shadow-md active:scale-[0.98]'
                      )}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-gray-700">{formatCurrency(p.sale_price)}</span>
                        <span className={cn('text-[10px]', available <= 3 ? 'text-amber-600' : 'text-gray-400')}>
                          {available} left
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Treatments */}
          {filteredTreatments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Treatments</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredTreatments.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => addTreatment(t)}
                    className="text-left p-3 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <span className="text-xs font-bold text-indigo-600 mt-1 block">
                      {t.price ? formatCurrency(t.price) : 'Custom price'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="lg:col-span-2 flex flex-col">
        <Card className="flex-1 flex flex-col border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Current Sale
              {items.length > 0 && (
                <Badge className="ml-auto bg-rose-100 text-rose-700 text-xs border-0">{items.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden pt-0">
            {/* Customer */}
            <Input
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-8 text-xs mb-2"
            />

            {/* Items */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {items.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Tap products to add
                </div>
              )}
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-500">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded hover:bg-gray-200">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded hover:bg-gray-200">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-gray-900 w-16 text-right">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                  <button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {saleDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(saleDiscount)}</span></div>}
              {tax > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax ({taxRate}%)</span><span>{formatCurrency(tax)}</span></div>}
              <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-100">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn('p-2 rounded-lg border text-xs font-medium transition-all', paymentMethod === 'cash' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200')}
                >
                  💵 Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={cn('p-2 rounded-lg border text-xs font-medium transition-all', paymentMethod === 'card' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200')}
                >
                  💳 Card
                </button>
              </div>

              {paymentMethod === 'cash' && (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount received"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="h-8 text-xs"
                  />
                  {change > 0 && (
                    <div className="flex items-center text-xs text-green-600 font-bold whitespace-nowrap">
                      Change: {formatCurrency(change)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Complete Sale */}
            <Button
              onClick={handleCompleteSale}
              disabled={items.length === 0 || processing}
              className="w-full mt-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl h-11"
            >
              {processing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              ) : (
                <><Receipt className="mr-2 h-4 w-4" />Complete Sale — {formatCurrency(total)}</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccess && lastSaleInfo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Sale Complete!</h2>
            <p className="text-xs text-gray-500 mt-1">Payment processed & inventory updated.</p>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-left text-xs space-y-1.5">
              {lastSaleInfo.invoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice:</span>
                  <span className="font-mono font-semibold text-gray-900">{lastSaleInfo.invoiceNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium text-gray-900">{lastSaleInfo.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment:</span>
                <span className="capitalize font-medium text-gray-900">{lastSaleInfo.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-sm text-gray-900">
                <span>Total Paid:</span>
                <span>{formatCurrency(lastSaleInfo.total)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button
                onClick={() => router.push('/dashboard/invoices')}
                variant="ghost"
                className="w-full text-xs h-9 flex items-center justify-center gap-1.5 text-gray-600 hover:text-gray-900"
              >
                <ExternalLink className="h-4 w-4" />
                View in Invoices
              </Button>
              <Button
                onClick={handleResetSale}
                className="w-full text-xs h-10 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
              >
                New Sale
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
