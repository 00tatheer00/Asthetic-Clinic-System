'use client';

import { useState, useTransition, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { createSale } from '@/actions/pos';
import { saveProduct, createProductCategory } from '@/actions/content';
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
  Tag,
  Percent,
  FolderPlus,
  Banknote,
  CreditCard,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  calculateLineTotal,
  calculateDiscount,
  calculateTax,
  normalizePakistaniPhone,
} from '@/lib/utils/helpers';
import { useReceiptSettings } from '@/lib/receipt-settings';
import { printReceipt } from '@/lib/print-receipt';
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
  const [posFormError, setPosFormError] = useState<string | null>(null);

  // Categories State & Management
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(categories);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [isAddingCustomCategoryInProductModal, setIsAddingCustomCategoryInProductModal] = useState(false);
  const [customCategoryInProductModalName, setCustomCategoryInProductModalName] = useState('');

  // GST / Tax State (default to clinic setting taxRate, configurable live)
  const [posTaxRate, setPosTaxRate] = useState<number>(taxRate || 0);
  const [isCustomTax, setIsCustomTax] = useState(false);

  // Synchronize categories when server revalidates
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
    }
  }, [categories]);

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

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts for High-Speed Reception POS Billing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

      // F2: Focus Search Input
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // F10 or Ctrl+P: Print Thermal Receipt if modal is open
      if ((e.key === 'F10' || (e.ctrlKey && e.key === 'p')) && showReceiptModal) {
        e.preventDefault();
        printReceipt('printable-invoice', `Receipt-${lastSaleInfo?.invoiceNumber || 'POS'}`);
        return;
      }

      // Escape: Clear search or close modals
      if (e.key === 'Escape') {
        if (showReceiptModal) {
          setShowReceiptModal(false);
        } else if (showAddProductModal) {
          setShowAddProductModal(false);
        } else if (searchQuery) {
          setSearchQuery('');
        }
        return;
      }

      // F8 & F9: Toggle payment method when not inside a text field
      if (!isInput) {
        if (e.key === 'F8') {
          e.preventDefault();
          setPaymentMethod('cash');
          toast.info('Switched to Cash Payment Mode');
        } else if (e.key === 'F9') {
          e.preventDefault();
          setPaymentMethod('card');
          toast.info('Switched to Card / POS Mode');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showReceiptModal, showAddProductModal, searchQuery]);
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
      // Category filter check
      if (selectedCategoryFilter !== 'all' && p.category_id !== selectedCategoryFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchCat = p.product_categories?.name?.toLowerCase().includes(q);
      return matchName || matchSku || matchCat;
    });
  }, [products, searchQuery, activeCatalogTab, selectedCategoryFilter]);

  const filteredTreatments = useMemo(() => {
    if (activeCatalogTab === 'products') return [];
    // If filtering by a specific product category, hide treatments
    if (selectedCategoryFilter !== 'all') return [];
    return treatments.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = t.name?.toLowerCase().includes(q);
      const matchCat = t.treatment_categories?.name?.toLowerCase().includes(q);
      return matchName || matchCat;
    });
  }, [treatments, searchQuery, activeCatalogTab, selectedCategoryFilter]);

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
  const tax = calculateTax(afterDiscount, posTaxRate);
  const total = afterDiscount + tax;
  const change =
    paymentMethod === 'cash' && amountReceived
      ? Math.max(0, parseFloat(amountReceived) - total)
      : 0;

  // Complete Sale
  const handleCompleteSale = async () => {
    setPosFormError(null);

    if (items.length === 0) {
      toast.error('Add products or treatments to cart first');
      return;
    }

    // Validate patient name and phone are provided
    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setPosFormError('Patient name is required (at least 2 characters)');
      toast.error('Patient name is required');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 7) {
      setPosFormError('Patient phone number is required');
      toast.error('Patient phone number is required');
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
      customer_name: customerName.trim() || undefined,
      customer_phone: customerPhone.trim() || undefined,
      payment_method: paymentMethod,
      amount_received: amountReceived ? parseFloat(amountReceived) : undefined,
      discount_type: discountType,
      discount_value: discountValue,
      tax_rate: posTaxRate,
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
        taxRate: posTaxRate,
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
    setPosTaxRate(taxRate || 0);
    setIsCustomTax(false);
    router.refresh();
  };

  // Save custom category from standalone modal (catalog toolbar)
  const handleCreateCategoryFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error('Category name must be at least 2 characters');
      return;
    }

    setCreatingCategory(true);
    try {
      const res = await createProductCategory(trimmed);
      if (res.success && res.category) {
        const newCat = res.category as CategoryItem;
        setCategoriesList((prev) => {
          if (prev.some((c) => c.id === newCat.id)) return prev;
          return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name));
        });
        setSelectedCategoryFilter(newCat.id);
        setNewCategoryName('');
        setShowAddCategoryModal(false);
        toast.success(`Category "${newCat.name}" created and selected!`);
      } else {
        toast.error(res.error || 'Failed to create category');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating category');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Save custom category from inside the Quick Add Product modal
  const handleSaveCustomCategoryInModal = async () => {
    const trimmed = customCategoryInProductModalName.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error('Category name must be at least 2 characters');
      return;
    }

    setCreatingCategory(true);
    try {
      const res = await createProductCategory(trimmed);
      if (res.success && res.category) {
        const newCat = res.category as CategoryItem;
        setCategoriesList((prev) => {
          if (prev.some((c) => c.id === newCat.id)) return prev;
          return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name));
        });
        setNewProductForm((prev) => ({ ...prev, category_id: newCat.id }));
        setCustomCategoryInProductModalName('');
        setIsAddingCustomCategoryInProductModal(false);
        toast.success(`Category "${newCat.name}" created and selected!`);
      } else {
        toast.error(res.error || 'Failed to create category');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating category');
    } finally {
      setCreatingCategory(false);
    }
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
      {/* 1. Sleek Compact Top Bar: Title, Sync, Shortcuts, Actions & Mobile Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 shrink-0 border-b border-slate-200/90">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            POS
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              Point of Sale
            </h1>
            <p className="text-[10px] text-slate-500 font-medium leading-none">
              Walk-in patient checkout &amp; thermal receipts
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs px-2 rounded-lg border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 ml-1"
            title="Sync with latest products & website changes"
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', isRefreshing && 'animate-spin text-rose-500')} />
            <span>Sync</span>
          </Button>
        </div>

        {/* Mobile / Tablet View Switcher (< lg) */}
        <div className="flex lg:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setMobileView('catalog')}
            className={cn(
              'py-1 px-3 rounded-md transition-all',
              mobileView === 'catalog'
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Catalog ({filteredProducts.length + filteredTreatments.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileView('cart')}
            className={cn(
              'py-1 px-3 rounded-md transition-all flex items-center gap-1.5',
              mobileView === 'cart'
                ? 'bg-rose-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Current Sale</span>
            {items.length > 0 && (
              <span className={cn('text-[10px] px-1.5 rounded-full font-mono', mobileView === 'cart' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700')}>
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Right Actions: Keyboard Guide, Add Category, New Product */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Keyboard Shortcuts Guide */}
          <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">Keys:</span>
            <kbd className="px-1.5 py-0.2 rounded bg-white shadow-2xs border border-slate-200 text-slate-800 font-mono font-bold">F2</kbd> Search
            <kbd className="px-1.5 py-0.2 rounded bg-white shadow-2xs border border-slate-200 text-slate-800 font-mono font-bold">F8</kbd> Cash
            <kbd className="px-1.5 py-0.2 rounded bg-white shadow-2xs border border-slate-200 text-slate-800 font-mono font-bold">F9</kbd> Card
            <kbd className="px-1.5 py-0.2 rounded bg-white shadow-2xs border border-slate-200 text-slate-800 font-mono font-bold">F10</kbd> Print
            <kbd className="px-1.5 py-0.2 rounded bg-white shadow-2xs border border-slate-200 text-slate-800 font-mono font-bold">Esc</kbd> Close
          </div>

          {/* Add Category Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddCategoryModal(true)}
            className="h-7 px-2.5 text-xs rounded-lg border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 flex items-center gap-1 shadow-2xs bg-white"
            title="Add custom category"
          >
            <Plus className="h-3 w-3 text-rose-500" />
            <span>Category</span>
          </Button>

          {/* Quick Add Product Button */}
          <Button
            size="sm"
            onClick={() => setShowAddProductModal(true)}
            className="h-7 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-2.5 rounded-lg flex items-center gap-1 shadow-xs"
          >
            <Plus className="h-3 w-3" />
            <span>New Product</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Split Grid: 100% Full Height (Elongated Current Sale Container) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 pt-1.5 overflow-hidden">
        {/* Left Side: Product & Treatment Catalog Grid */}
        <div
          className={cn(
            'lg:col-span-7 xl:col-span-7 flex flex-col h-full min-h-0 overflow-hidden',
            mobileView === 'cart' ? 'hidden lg:flex' : 'flex'
          )}
        >
          {/* Catalog Filter & Search Toolbar Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 py-1.5 px-2 bg-slate-50/80 rounded-xl border border-slate-200/90 mb-2 shrink-0">
            {/* Catalog Type Chips & Category Dropdown */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              {/* Catalog Filter Chips */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setActiveCatalogTab('all')}
                  className={cn(
                    'px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all duration-150',
                    activeCatalogTab === 'all'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveCatalogTab('products')}
                  className={cn(
                    'px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all duration-150',
                    activeCatalogTab === 'products'
                      ? 'bg-rose-500 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveCatalogTab('treatments')}
                  className={cn(
                    'px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all duration-150',
                    activeCatalogTab === 'treatments'
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Services
                </button>
              </div>

              {/* Category Filter Dropdown with Inline Custom Option */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  if (e.target.value === '__add_new_category__') {
                    setShowAddCategoryModal(true);
                  } else {
                    setSelectedCategoryFilter(e.target.value);
                  }
                }}
                className="h-7 text-xs px-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium min-w-[120px]"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__add_new_category__" className="text-rose-600 font-bold">
                  + Add Custom Category...
                </option>
              </select>
            </div>

            {/* Right: Search Input */}
            <div className="relative w-full sm:w-56 md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search items [F2]..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-7 text-xs bg-white rounded-lg border-slate-200 focus-visible:ring-rose-500 text-slate-900 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-4 overscroll-contain [scrollbar-width:thin]">
            {/* Products Section */}
            {filteredProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Retail &amp; Clinical Products ({filteredProducts.length})
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">Click card to add</span>
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
                          'text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer group shadow-2xs',
                          isOutOfStock
                            ? 'border-slate-200 bg-slate-50/70 opacity-60 hover:border-slate-300'
                            : 'border-slate-200 bg-white hover:border-rose-300 hover:shadow-xs hover:-translate-y-0.5 active:scale-[0.98]'
                        )}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-rose-600 transition-colors leading-snug">
                            {p.name}
                          </p>
                          {p.product_categories?.name && (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                              {p.product_categories.name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
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
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Procedures &amp; Clinical Services ({filteredTreatments.length})
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">Fixed rate clinical procedures</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {filteredTreatments.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => addTreatment(t)}
                      className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs hover:-translate-y-0.5 transition-all active:scale-[0.98] flex flex-col justify-between shadow-2xs cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-indigo-400 font-medium mt-0.5">
                          {t.treatment_categories?.name || 'Clinic Procedure'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
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
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white p-6">
                <Package className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No matching items found</p>
                <p className="text-xs text-slate-400 mt-0.5">
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

        {/* Right Side: Current Sale Container (FULL HEIGHT, CLEAN, PROFESSIONAL, NO DARKNESS) */}
        <div
          className={cn(
            'lg:col-span-5 xl:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm overflow-hidden',
            mobileView === 'catalog' ? 'hidden lg:flex' : 'flex'
          )}
        >
          {/* Cart Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80 shadow-2xs">
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Current Sale</h2>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Walk-in patient billing</p>
              </div>
              {items.length > 0 && (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.2 rounded-full border border-rose-200 ml-1">
                  {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Back to catalog button on mobile */}
              <button
                type="button"
                onClick={() => setMobileView('catalog')}
                className="lg:hidden text-[11px] text-slate-600 font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 border border-slate-200"
              >
                + Add Items
              </button>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold transition-colors flex items-center gap-1 hover:bg-rose-50 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Details Inputs */}
          <div className="p-2.5 sm:p-3 shrink-0 border-b border-slate-200/80 bg-slate-50/60">
            {posFormError && (
              <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 font-medium">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span>{posFormError}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Patient Name *"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setPosFormError(null); }}
                  className={cn(
                    'h-8 text-xs pl-8 bg-white rounded-lg border-slate-200 shadow-2xs focus-visible:ring-rose-500 font-medium text-slate-900 placeholder:text-slate-400',
                    posFormError && !customerName.trim() ? 'border-red-400 ring-1 ring-red-200 bg-red-50/30' : ''
                  )}
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Phone * (0300...)"
                  value={customerPhone}
                  onChange={(e) => { setCustomerPhone(normalizePakistaniPhone(e.target.value)); setPosFormError(null); }}
                  className={cn(
                    'h-8 text-xs pl-8 bg-white rounded-lg border-slate-200 shadow-2xs focus-visible:ring-rose-500 font-medium text-slate-900 placeholder:text-slate-400',
                    posFormError && !customerPhone.trim() ? 'border-red-400 ring-1 ring-red-200 bg-red-50/30' : ''
                  )}
                  required
                />
              </div>
            </div>
          </div>

          {/* Cart Items List: Scrollable with Generous Vertical Space */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 p-2.5 sm:p-3 pr-2 overscroll-contain [scrollbar-width:thin]">
            {items.length === 0 ? (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-2 text-rose-500 shadow-2xs">
                  <ShoppingCart className="h-5 w-5 stroke-1.5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Current sale is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px] leading-relaxed">
                  Click any product or procedure on the left catalog to add to this bill
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/90 hover:border-rose-200 hover:shadow-2xs transition-all text-xs group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-5 w-5 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-white active:scale-95 transition-all"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-5 w-5 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-white active:scale-95 transition-all"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="font-bold text-slate-900 text-xs w-16 sm:w-20 text-right shrink-0 font-mono">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Fixed Checkout Summary (Clean, Professional, No Darkness) */}
          <div className="border-t-2 border-slate-200/90 shrink-0 bg-white">
            {/* Discount & GST Controls Strip */}
            <div className="p-2.5 bg-slate-50/70 border-b border-slate-200/80 space-y-2 text-xs">
              {/* Discount Row */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Tag className="h-3.5 w-3.5 text-rose-500" />
                    <span>Discount</span>
                    {saleDiscount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                        -{formatCurrency(saleDiscount)}
                      </span>
                    )}
                  </div>

                  {/* Discount Segmented Switcher */}
                  <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType(null);
                        setDiscountValue(0);
                      }}
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all',
                        !discountType ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                      )}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('percentage');
                        if (discountValue <= 0) setDiscountValue(10);
                      }}
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all flex items-center gap-0.5',
                        discountType === 'percentage' ? 'bg-rose-500 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                      )}
                    >
                      <span>% Off</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('fixed');
                        if (discountValue <= 0) setDiscountValue(500);
                      }}
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all',
                        discountType === 'fixed' ? 'bg-rose-500 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                      )}
                    >
                      Flat PKR
                    </button>
                  </div>
                </div>

                {/* Percentage Presets & Input */}
                {discountType === 'percentage' && (
                  <div className="flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="Discount %"
                        value={discountValue || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setDiscountValue(Math.min(100, Math.max(0, val)));
                        }}
                        className="h-7 text-xs bg-white pr-6 rounded-lg border-slate-200 text-slate-900"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">%</span>
                    </div>
                    {[5, 10, 15, 20].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDiscountValue(p)}
                        className={cn(
                          'h-7 px-2 rounded-lg border text-[10px] font-bold transition-all',
                          discountValue === p
                            ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                )}

                {/* Fixed Amount Presets & Input */}
                {discountType === 'fixed' && (
                  <div className="flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-semibold">Rs</span>
                      <Input
                        type="number"
                        min="0"
                        step="50"
                        placeholder="Amount"
                        value={discountValue || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setDiscountValue(Math.max(0, val));
                        }}
                        className="h-7 text-xs bg-white pl-6 rounded-lg border-slate-200 text-slate-900"
                      />
                    </div>
                    {[200, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDiscountValue(amt)}
                        className={cn(
                          'h-7 px-1.5 rounded-lg border text-[10px] font-bold transition-all',
                          discountValue === amt
                            ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* GST / Sales Tax Controls */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-200/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Receipt className="h-3.5 w-3.5 text-blue-500" />
                    <span>Sales Tax (GST)</span>
                  </div>

                  {/* GST Presets */}
                  <div className="flex items-center gap-1">
                    {[0, 5, 16, 18].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => {
                          setPosTaxRate(rate);
                          setIsCustomTax(false);
                        }}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all',
                          !isCustomTax && posTaxRate === rate
                            ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        {rate === 0 ? '0%' : `${rate}%`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCustomTax(!isCustomTax)}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all',
                        isCustomTax
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Custom GST Input Field */}
                {isCustomTax && (
                  <div className="flex items-center gap-2 pt-0.5 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="Custom GST % (e.g. 13, 17)"
                        value={posTaxRate || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPosTaxRate(Math.min(100, Math.max(0, val)));
                        }}
                        className="h-7 text-xs bg-white pr-7 rounded-lg border-slate-200 text-slate-900"
                        autoFocus
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">%</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                      Applied: {posTaxRate}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtotal, Net Payable & Checkout Box */}
            <div className="p-3 bg-white space-y-2">
              {/* Detailed Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 font-mono">{formatCurrency(subtotal)}</span>
                </div>
                {saleDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                    <span>Discount {discountType === 'percentage' ? `(${discountValue}%)` : '(Flat)'}</span>
                    <span className="font-mono">-{formatCurrency(saleDiscount)}</span>
                  </div>
                )}
                {posTaxRate > 0 ? (
                  <div className="flex justify-between text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                    <span>GST ({posTaxRate}%)</span>
                    <span className="font-mono">+{formatCurrency(tax)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>GST / Tax</span>
                    <span className="font-medium text-slate-500">0% (Exempt)</span>
                  </div>
                )}
              </div>

              {/* High-Impact Total Payable Card (Crisp, Light, No Darkness) */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-rose-50/90 via-pink-50/40 to-slate-50/90 text-slate-900 flex items-center justify-between border-2 border-rose-200/90 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-rose-800 font-extrabold block leading-none">
                    Total Amount
                  </span>
                  <span className="text-xs text-rose-600 font-semibold mt-0.5 inline-block">
                    Net Payable
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-mono">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    'py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer',
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-2xs ring-1 ring-emerald-400/50'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={cn(
                    'py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer',
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50 text-blue-950 shadow-2xs ring-1 ring-blue-400/50'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>Card / POS</span>
                </button>
              </div>

              {/* Cash Tender & Change */}
              {paymentMethod === 'cash' && (
                <div className="space-y-1.5 pt-0.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        placeholder="Amount received (e.g. 5000)"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg font-medium text-slate-900"
                      />
                    </div>
                    {total > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmountReceived(String(total))}
                        className="h-8 px-2.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors shrink-0"
                      >
                        Exact
                      </button>
                    )}
                  </div>

                  {change > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      <span>Change to Return:</span>
                      <span className="text-sm font-extrabold font-mono">{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Sale Button */}
              <Button
                type="button"
                onClick={handleCompleteSale}
                disabled={items.length === 0 || processing}
                className={cn(
                  'w-full h-11 sm:h-12 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer',
                  items.length === 0
                    ? 'bg-rose-50 text-rose-300 border border-rose-200 cursor-not-allowed shadow-none'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/10'
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4" />
                    <span>Charge &amp; Print Receipt {total > 0 ? `— ${formatCurrency(total)}` : ''}</span>
                  </>
                )}
              </Button>
            </div>
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
                    onClick={() => printReceipt('printable-invoice', `Receipt-${lastSaleInfo?.invoiceNumber || 'POS'}`)}
                    className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs px-3 flex items-center gap-1.5"
                    title="Print receipt or export / save as PDF"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print / PDF</span>
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
                      {receiptSettings.receiptAddress || clinicSettings?.clinic_address || 'Sami Tower, Ring Road, Peshawar'}
                    </p>
                    <p className="text-[9px] font-semibold text-black mt-0.5">
                      {receiptSettings.receiptPhone || clinicSettings?.clinic_phone || 'Dr: 0335-6400959 | WhatsApp: 0335-6400959'}
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
                      <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 border border-black rounded text-black bg-white">
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
                        <span>Privilege / Concession Discount:</span>
                        <span>-{formatCurrency(lastSaleInfo.discount)}</span>
                      </div>
                    )}
                    {lastSaleInfo.tax > 0 && (
                      <div className="flex justify-between">
                        <span>GST / Sales Tax ({lastSaleInfo.taxRate}%):</span>
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">Category</Label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategoryInProductModal(!isAddingCustomCategoryInProductModal)}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>
                    {isAddingCustomCategoryInProductModal ? 'Select Existing' : '+ Add Custom Category'}
                  </span>
                </button>
              </div>

              {isAddingCustomCategoryInProductModal ? (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50/70 border border-rose-200">
                  <Input
                    placeholder="New category name (e.g. Toners, Sunscreens)..."
                    value={customCategoryInProductModalName}
                    onChange={(e) => setCustomCategoryInProductModalName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        await handleSaveCustomCategoryInModal();
                      }
                    }}
                    className="h-8 text-xs bg-white border-rose-200"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveCustomCategoryInModal}
                    disabled={creatingCategory || !customCategoryInProductModalName.trim()}
                    className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white shrink-0 font-medium"
                  >
                    {creatingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCustomCategoryInProductModal(false)}
                    className="h-8 px-2 text-xs text-gray-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <select
                  value={newProductForm.category_id}
                  onChange={(e) => {
                    if (e.target.value === '__add_custom_in_modal__') {
                      setIsAddingCustomCategoryInProductModal(true);
                    } else {
                      setNewProductForm({ ...newProductForm, category_id: e.target.value });
                    }
                  }}
                  className="w-full text-xs h-9 px-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select Category (optional)</option>
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__add_custom_in_modal__" className="text-rose-600 font-bold">
                    ➕ + Add Custom Category...
                  </option>
                </select>
              )}
            </div>

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

      {/* ============================================================ */}
      {/* ADD CUSTOM CATEGORY MODAL                                    */}
      {/* ============================================================ */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-rose-600" />
              <span>Add Custom Product Category</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Create a new category for products in POS. It will immediately appear in all dropdowns and filters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategoryFromModal} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Category Name *</Label>
              <Input
                required
                placeholder="e.g. Cleansers, Chemical Peels, Sun Protection..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="text-xs h-9"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingCategory || !newCategoryName.trim()}
                size="sm"
                className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {creatingCategory ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Category
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
