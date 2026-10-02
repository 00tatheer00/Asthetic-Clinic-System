'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { createSale } from '@/actions/pos';
import { saveProduct } from '@/actions/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Receipt,
  Loader2,
  Search,
  CheckCircle2,
  Printer,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Package,
  Stethoscope,
  X,
  Phone,
  User,
  AlertTriangle,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  calculateLineTotal,
  calculateDiscount,
  calculateTax,
} from '@/lib/utils/helpers';
import { useReceiptSettings } from '@/lib/receipt-settings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductItem {
  id: string;
  name: string;
  sale_price: number;
  stock_quantity: number;
  reserved_quantity: number;
  sku?: string | null;
  category_id?: string | null;
  product_categories?: { id: string; name: string } | { id: string; name: string }[] | null | any;
}

interface TreatmentItem {
  id: string;
  name: string;
  price: number | null;
  treatment_categories?: { id: string; name: string } | { id: string; name: string }[] | null | any;
}

interface CategoryItem {
  id: string;
  name: string;
}

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

interface POSTerminalProps {
  products: ProductItem[];
  treatments: TreatmentItem[];
  categories?: CategoryItem[];
  taxRate: number;
  clinicSettings?: {
    clinic_name?: string | null;
    clinic_address?: string | null;
    clinic_phone?: string | null;
    clinic_email?: string | null;
    default_tax_rate?: number | null;
    default_tax_label?: string | null;
    receipt_title?: string | null;
    receipt_doctor?: string | null;
  };
}

export function POSTerminal({
  products,
  treatments,
  categories = [],
  taxRate,
  clinicSettings,
}: POSTerminalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const receiptSettings = useReceiptSettings();

  // Active Cart State
  const [items, setItems] = useState<POSItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCatalogTab, setActiveCatalogTab] = useState<'all' | 'products' | 'treatments'>('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Add Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category_id: categories[0]?.id || '',
    sale_price: '',
    purchase_price: '',
    stock_quantity: '20',
  });

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [lastSaleInfo, setLastSaleInfo] = useState<{
    saleId: string;
    invoiceId?: string | null;
    invoiceNumber?: string | null;
    total: number;
    subtotal: number;
    discount: number;
    tax: number;
    taxRate: number;
    customerName: string;
    customerPhone?: string | null;
    paymentMethod: string;
    amountReceived?: number;
    change?: number;
    items: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
      discount_amount?: number;
    }>;
    createdAt: string;
  } | null>(null);

  // Filter items in memory (0ms instant search)
  const filteredProducts = useMemo(() => {
    if (activeCatalogTab === 'treatments') return [];
    return products.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchCat = p.product_categories?.name?.toLowerCase().includes(q);
      return matchName || matchSku || matchCat;
    });
  }, [products, searchQuery, activeCatalogTab]);

  const filteredTreatments = useMemo(() => {
    if (activeCatalogTab === 'products') return [];
    return treatments.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = t.name?.toLowerCase().includes(q);
      const matchCat = t.treatment_categories?.name?.toLowerCase().includes(q);
      return matchName || matchCat;
    });
  }, [treatments, searchQuery, activeCatalogTab]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success('Catalog updated with website');
      }, 500);
    });
  };

  const addProduct = (product: ProductItem) => {
    const available = product.stock_quantity - product.reserved_quantity;
    const existing = items.find((i) => i.product_id === product.id);

    if (existing) {
      if (available > 0 && existing.quantity >= available) {
        toast.error(`Only ${available} units available in stock`);
        return;
      }
      setItems(
        items.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          id: crypto.randomUUID(),
          product_id: product.id,
          treatment_id: null,
          item_type: 'product',
          name: product.name,
          quantity: 1,
          unit_price: product.sale_price,
          discount_type: null,
          discount_value: 0,
          max_stock: available > 0 ? available : 999,
        },
      ]);
    }
  };

  const addTreatment = (treatment: TreatmentItem) => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        product_id: null,
        treatment_id: treatment.id,
        item_type: 'service',
        name: treatment.name,
        quantity: 1,
        unit_price: treatment.price || 0,
        discount_type: null,
        discount_value: 0,
      },
    ]);
  };

  const updateQuantity = (id: string, qty: number) => {
    setItems(
      items.map((i) =>
        i.id === id
          ? { ...i, quantity: Math.max(1, Math.min(qty, i.max_stock || 999)) }
          : i
      )
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      calculateLineTotal(
        item.unit_price,
        item.quantity,
        item.discount_type,
        item.discount_value
      ),
    0
  );
  const saleDiscount = calculateDiscount(subtotal, discountType, discountValue);
  const afterDiscount = subtotal - saleDiscount;
  const tax = calculateTax(afterDiscount, taxRate);
  const total = afterDiscount + tax;
  const change =
    paymentMethod === 'cash' && amountReceived
      ? Math.max(0, parseFloat(amountReceived) - total)
      : 0;

  // Complete Sale
  const handleCompleteSale = async () => {
    if (items.length === 0) {
      toast.error('Add products or treatments to cart first');
      return;
    }

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
      const invoiceId = (result as { invoiceId?: string | null }).invoiceId;
      const invoiceNum = (result as { invoiceNumber?: string | null }).invoiceNumber;

      const saleRecord = {
        saleId: result.saleId,
        invoiceId,
        invoiceNumber: invoiceNum,
        total,
        subtotal,
        discount: saleDiscount,
        tax,
        taxRate,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || null,
        paymentMethod,
        amountReceived: amountReceived ? parseFloat(amountReceived) : total,
        change,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: calculateLineTotal(
            item.unit_price,
            item.quantity,
            item.discount_type,
            item.discount_value
          ),
          discount_amount: calculateDiscount(
            item.unit_price * item.quantity,
            item.discount_type,
            item.discount_value
          ),
        })),
        createdAt: new Date().toISOString(),
      };

      setLastSaleInfo(saleRecord);

      // Generate verification QR Code
      if (invoiceId) {
        const origin =
          typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : 'https://brimishskincare.com';
        const verifyUrl = `${origin}/verify-invoice?id=${invoiceId}&num=${encodeURIComponent(invoiceNum || '')}`;
        QRCode.toDataURL(verifyUrl, {
          width: 240,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        })
          .then((url) => setQrCodeDataUrl(url))
          .catch(() => {});
      }

      setShowReceiptModal(true);
      toast.success('Sale completed successfully!');
    } else {
      toast.error(result.error || 'Failed to process sale');
    }
  };

  const handleResetSale = () => {
    setShowReceiptModal(false);
    setLastSaleInfo(null);
    setItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setAmountReceived('');
    setDiscountType(null);
    setDiscountValue(0);
    router.refresh();
  };

  // Quick Add Product to POS & Website
  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim() || !newProductForm.sale_price) {
      toast.error('Product name and sale price are required');
      return;
    }

    setSavingProduct(true);
    const saleNum = parseFloat(newProductForm.sale_price) || 0;
    const costNum = parseFloat(newProductForm.purchase_price) || saleNum * 0.7;
    const stockNum = parseInt(newProductForm.stock_quantity, 10) || 0;
    const generatedSlug =
      newProductForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `product-${Date.now()}`;
    const generatedSku = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await saveProduct(null, {
      name: newProductForm.name.trim(),
      slug: generatedSlug,
      sku: generatedSku,
      category_id: newProductForm.category_id || null,
      sale_price: saleNum,
      purchase_price: costNum,
      stock_quantity: stockNum,
      low_stock_threshold: 5,
      is_published: true,
      is_active: true,
    });

    setSavingProduct(false);

    if (res.success) {
      toast.success(`Product "${newProductForm.name}" added to POS & website!`);
      setShowAddProductModal(false);
      setNewProductForm({
        name: '',
        category_id: categories[0]?.id || '',
        sale_price: '',
        purchase_price: '',
        stock_quantity: '20',
      });
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to save product');
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Top Header & Fast Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2.5 shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-none">
              Point of Sale
            </h1>
            <p className="text-[11px] text-gray-500 mt-1">
              Walk-in checkout & thermal receipts
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs px-2.5 rounded-lg border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="Sync with latest products & website changes"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1', isRefreshing && 'animate-spin text-rose-500')} />
            <span>Sync</span>
          </Button>
        </div>

        {/* Search, Filter Chips & Quick Add */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Chips */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-full">
            <button
              onClick={() => setActiveCatalogTab('all')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150',
                activeCatalogTab === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveCatalogTab('products')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150',
                activeCatalogTab === 'products'
                  ? 'bg-rose-500 text-white shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Products
            </button>
            <button
              onClick={() => setActiveCatalogTab('treatments')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150',
                activeCatalogTab === 'treatments'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Services
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-white rounded-lg border-gray-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Add Product Button */}
          <Button
            size="sm"
            onClick={() => setShowAddProductModal(true)}
            className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 rounded-lg flex items-center gap-1 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Product</span>
          </Button>
        </div>
      </div>

      {/* Main Split Grid: 100% Viewport Height (No outer scrolling) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 pt-2.5 overflow-hidden">
        {/* Left Side: Product & Treatment Catalog Grid */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-4 overscroll-contain [scrollbar-width:thin]">
            {/* Products Section */}
            {filteredProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Retail & Clinical Products ({filteredProducts.length})
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400">Click card to add</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {filteredProducts.map((p) => {
                    const available = p.stock_quantity - p.reserved_quantity;
                    const isOutOfStock = available <= 0;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className={cn(
                          'text-left p-3 rounded-xl border border-l-[3.5px] transition-all flex flex-col justify-between cursor-pointer group shadow-2xs',
                          isOutOfStock
                            ? 'border-gray-200 border-l-gray-400 bg-gray-50/70 opacity-60 hover:border-gray-300'
                            : 'border-rose-100 border-l-rose-500 bg-white hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
                        )}
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors leading-snug">
                            {p.name}
                          </p>
                          {p.product_categories?.name && (
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                              {p.product_categories.name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                          <span className="text-xs font-bold text-rose-600 font-serif">
                            {formatCurrency(p.sale_price)}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] px-1.5 py-0.2 rounded font-medium',
                              isOutOfStock
                                ? 'bg-red-50 text-red-600 font-bold'
                                : available <= 3
                                ? 'bg-amber-50 text-amber-700 font-semibold'
                                : 'bg-emerald-50 text-emerald-700'
                            )}
                          >
                            {isOutOfStock ? '0 left' : `${available} left`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Treatments Section */}
            {filteredTreatments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Procedures & Clinical Services ({filteredTreatments.length})
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400">Fixed rate clinical procedures</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {filteredTreatments.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => addTreatment(t)}
                      className="text-left p-3 rounded-xl border border-indigo-100 border-l-[3.5px] border-l-indigo-600 bg-white hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98] flex flex-col justify-between shadow-2xs cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-indigo-400 font-medium mt-0.5">
                          {t.treatment_categories?.name || 'Clinic Procedure'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                        <span className="text-xs font-bold text-indigo-700 font-serif">
                          {t.price ? formatCurrency(t.price) : 'Custom rate'}
                        </span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-medium">
                          Procedure
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State if search matches nothing */}
            {filteredProducts.length === 0 && filteredTreatments.length === 0 && (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white p-6">
                <Package className="h-9 w-9 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No matching items found</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Try a different search query or click &quot;New Product&quot; to add one.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowAddProductModal(true)}
                  className="mt-3 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add New Product
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart & Immediate Checkout (Pinned Totals, Never scrolls out of view) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-gray-200/90 shadow-sm p-3.5 overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Current Sale</h2>
              {items.length > 0 && (
                <Badge className="bg-rose-100 text-rose-700 text-[10px] font-bold border-0 px-2 py-0.2">
                  {items.reduce((s, i) => s + i.quantity, 0)} items
                </Badge>
              )}
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-gray-400 hover:text-red-600 font-medium transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Details Inputs */}
          <div className="grid grid-cols-2 gap-2 pt-2.5 pb-2 shrink-0">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Patient Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs pl-8 bg-gray-50/70 border-gray-200 rounded-lg"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-8 text-xs pl-8 bg-gray-50/70 border-gray-200 rounded-lg"
              />
            </div>
          </div>

          {/* Cart Items List: Scrollable Internally */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 py-1 pr-1 overscroll-contain [scrollbar-width:thin]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 text-gray-400">
                <ShoppingCart className="h-9 w-9 text-gray-300 stroke-1 mb-2" />
                <p className="text-xs font-semibold text-gray-700">Cart is empty</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Click any product or procedure on the left to add
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/90 border border-gray-100 hover:border-gray-200 transition-all text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate leading-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded text-gray-600 hover:bg-gray-100 active:scale-95"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded text-gray-600 hover:bg-gray-100 active:scale-95"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="font-bold text-gray-900 text-xs w-16 text-right shrink-0">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Fixed Checkout Summary (Always 100% visible at bottom) */}
          <div className="pt-2.5 border-t border-gray-100 shrink-0 space-y-2">
            {/* Subtotal & Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({taxRate}%)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1 border-t border-gray-200 font-bold">
                <span className="text-gray-900 text-sm">Total Payable</span>
                <span className="text-lg text-rose-600 font-serif">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  'py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5',
                  paymentMethod === 'cash'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-2xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                <span>💵</span>
                <span>Cash Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={cn(
                  'py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5',
                  paymentMethod === 'card'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-2xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                <span>💳</span>
                <span>Card / POS</span>
              </button>
            </div>

            {/* Cash Tender & Change */}
            {paymentMethod === 'cash' && (
              <div className="flex items-center gap-2 pt-0.5">
                <Input
                  type="number"
                  placeholder="Amount tender (e.g. 5000)"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="h-8 text-xs bg-gray-50/70 border-gray-200 rounded-lg flex-1"
                />
                {change > 0 && (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-lg shrink-0">
                    Change: {formatCurrency(change)}
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button */}
            <Button
              type="button"
              onClick={handleCompleteSale}
              disabled={items.length === 0 || processing}
              className="w-full h-11 text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 via-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  <span>Charge & Print Receipt — {formatCurrency(total)}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* OFFICIAL 80MM THERMAL RECEIPT SLIP MODAL (WITH QR CODE)      */}
      {/* ============================================================ */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-md max-h-[94vh] overflow-y-auto p-0">
          {lastSaleInfo && (
            <div>
              {/* Header Action Bar (Hidden in Print) */}
              <div className="print:hidden p-3.5 border-b bg-gray-50 flex items-center justify-between gap-2 sticky top-0 z-10 backdrop-blur-sm bg-gray-50/95">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm">
                      Receipt {lastSaleInfo.invoiceNumber || 'Official Slip'}
                    </h3>
                    <Badge className="bg-stone-900 text-white text-[9px] uppercase font-bold tracking-wider">
                      80mm Thermal
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500">Official clinic receipt generated</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs px-3"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print Receipt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetSale}
                    className="h-8 text-xs border-gray-300 px-3 font-semibold"
                  >
                    New Sale
                  </Button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div className="bg-stone-100/70 p-4 sm:p-6 print:p-0 print:bg-white flex justify-center">
                {/* ========================================================== */}
                {/* 80MM THERMAL RECEIPT SLIP (PURE CLINICAL FORMAT)           */}
                {/* ========================================================== */}
                <div
                  id="printable-invoice"
                  className="w-full max-w-[340px] bg-white border border-stone-200 print:border-0 shadow-sm p-4 font-mono text-[11px] text-black leading-tight"
                >
                  {/* Clinic Header */}
                  <div className="text-center pb-2.5 border-b border-dashed border-black">
                    <div className="flex justify-center mb-1.5">
                      <Image
                        src="/images/logo.png"
                        alt="Brimish Skin Care Logo"
                        width={46}
                        height={46}
                        className="w-11 h-11 object-contain"
                        priority
                      />
                    </div>
                    <h2 className="text-sm font-black tracking-tight text-black uppercase">
                      {receiptSettings.receiptTitle || clinicSettings?.clinic_name || 'BRIMISH SKIN CARE & LASER CLINIC'}
                    </h2>
                    <p className="text-[10px] font-bold text-black mt-0.5">
                      {receiptSettings.receiptDoctor || 'DR. BILAL AHMAD (MD Aesthetic Medicine)'}
                    </p>
                    <p className="text-[9px] text-gray-700 mt-0.5">
                      {receiptSettings.receiptSpecialty || 'Medical Aesthetics, Dermatology & Laser Center'}
                    </p>
                    <p className="text-[9px] text-gray-700 mt-0.5">
                      {receiptSettings.receiptAddress || clinicSettings?.clinic_address || 'Cantonment Plaza, University Rd, Peshawar'}
                    </p>
                    <p className="text-[9px] font-semibold text-black mt-0.5">
                      {receiptSettings.receiptPhone || clinicSettings?.clinic_phone || 'Tel: +92 91 5842100 | WhatsApp: 0312-9000100'}
                    </p>
                  </div>

                  {/* Receipt Metadata */}
                  <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
                    {lastSaleInfo.invoiceNumber && (
                      <div className="flex justify-between">
                        <span>Receipt #:</span>
                        <strong className="font-bold">{lastSaleInfo.invoiceNumber}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{formatDate(lastSaleInfo.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>
                        {new Date(lastSaleInfo.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Patient:</span>
                      <strong className="font-bold">{lastSaleInfo.customerName}</strong>
                    </div>
                    {lastSaleInfo.customerPhone && (
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span>{formatPhone(lastSaleInfo.customerPhone)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="uppercase font-bold">{lastSaleInfo.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <span className="font-bold uppercase text-[9px] px-1 py-0.2 rounded bg-black text-white">
                        PAID IN FULL
                      </span>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="py-2 border-b border-dashed border-black">
                    <div className="flex justify-between font-bold pb-1 text-[9px] border-b border-black uppercase tracking-wider">
                      <span className="w-1/2">Item / Procedure</span>
                      <span className="w-1/4 text-center">Qty x Rate</span>
                      <span className="w-1/4 text-right">Total</span>
                    </div>
                    <div className="space-y-1.5 pt-1.5">
                      {lastSaleInfo.items.map((item, idx) => (
                        <div key={idx}>
                          <p className="font-bold text-[10px] text-black leading-tight">
                            {item.name}
                          </p>
                          <div className="flex justify-between text-[9px] text-gray-800">
                            <span>
                              {item.quantity} x {formatCurrency(item.unit_price)}
                            </span>
                            <span className="font-bold text-black">
                              {formatCurrency(item.line_total)}
                            </span>
                          </div>
                          {item.discount_amount && item.discount_amount > 0 && (
                            <div className="text-[8px] text-gray-700">
                              Disc: -{formatCurrency(item.discount_amount)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(lastSaleInfo.subtotal)}</span>
                    </div>
                    {lastSaleInfo.discount > 0 && (
                      <div className="flex justify-between text-black font-semibold">
                        <span>Privilege Discount:</span>
                        <span>-{formatCurrency(lastSaleInfo.discount)}</span>
                      </div>
                    )}
                    {lastSaleInfo.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Services Tax ({lastSaleInfo.taxRate}%):</span>
                        <span>{formatCurrency(lastSaleInfo.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs sm:text-sm font-black pt-1.5 border-t border-black text-black">
                      <span className="uppercase">NET TOTAL:</span>
                      <span>{formatCurrency(lastSaleInfo.total)}</span>
                    </div>
                    {lastSaleInfo.paymentMethod === 'cash' && (
                      <>
                        <div className="flex justify-between text-[9px] text-gray-700 pt-0.5">
                          <span>Amount Tendered:</span>
                          <span>{formatCurrency(lastSaleInfo.amountReceived || lastSaleInfo.total)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-black">
                          <span>Change Returned:</span>
                          <span>{formatCurrency(lastSaleInfo.change || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Autogenerated QR Code for Online Verification */}
                  {receiptSettings.enableQrVerification && qrCodeDataUrl && (
                    <div className="text-center pt-2.5 pb-1">
                      <div className="w-24 h-24 mx-auto bg-white p-1 border border-black rounded flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeDataUrl}
                          alt="Invoice QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-[9px] font-black text-black uppercase mt-1 tracking-wider">
                        SCAN TO VERIFY RECEIPT
                      </p>
                      <p className="text-[8px] text-gray-700 mt-0.5">
                        Official Clinic Digital Verification Record
                      </p>
                      <p className="text-[8px] font-bold text-black mt-0.5">
                        brimishclinic.com
                      </p>
                    </div>
                  )}

                  {/* Receipt Footer */}
                  <div className="text-center pt-2 text-[9px] text-gray-800 space-y-0.5">
                    <p className="font-bold text-black">
                      {receiptSettings.receiptFooterMessage || 'Thank you for choosing Brimish Skin Care.'}
                    </p>
                    <p className="text-[8px] text-gray-600">
                      Follow-up consultations valid within 30 days
                    </p>
                    <p className="text-[8px] text-gray-500">
                      Computer-generated official clinical slip
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* QUICK ADD PRODUCT MODAL (SYNCED WITH POS & WEBSITE)         */}
      {/* ============================================================ */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-rose-600" />
              <span>Quick Add Product</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Instantly add a new product. It will be available for sale in POS and published on the website.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickAddProduct} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Product Name *</Label>
              <Input
                required
                placeholder="e.g. Niacinamide Clarifying Serum"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                className="text-xs h-9"
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Category</Label>
                <select
                  value={newProductForm.category_id}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, category_id: e.target.value })
                  }
                  className="w-full text-xs h-9 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Selling Price (PKR) *</Label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 2400"
                  value={newProductForm.sale_price}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, sale_price: e.target.value })
                  }
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Initial Stock</Label>
                <Input
                  type="number"
                  placeholder="e.g. 25"
                  value={newProductForm.stock_quantity}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, stock_quantity: e.target.value })
                  }
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Purchase / Cost Price (PKR)</Label>
              <Input
                type="number"
                placeholder="e.g. 1500 (optional)"
                value={newProductForm.purchase_price}
                onChange={(e) =>
                  setNewProductForm({ ...newProductForm, purchase_price: e.target.value })
                }
                className="text-xs h-9"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddProductModal(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingProduct}
                size="sm"
                className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {savingProduct ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Add Product & Publish
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
