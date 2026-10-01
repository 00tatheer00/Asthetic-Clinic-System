'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { formatCurrency, getAvailableStock } from '@/lib/utils/helpers';
import { ShoppingBag, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  sale_price: number;
  stock_quantity: number;
  reserved_quantity: number;
  image_url: string | null;
  category_id: string | null;
  product_categories: { name: string }[] | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductGridProps {
  products: Product[];
  categories: Category[];
}

export function ProductGrid({ products, categories }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const addItem = useCartStore((s) => s.addItem);

  const filtered = activeCategory
    ? products.filter((p) => p.category_id === activeCategory)
    : products;

  const handleAddToCart = (product: Product) => {
    const available = getAvailableStock(product.stock_quantity, product.reserved_quantity);
    if (available <= 0) {
      toast.error('Out of stock');
      return;
    }

    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image_url: product.image_url,
      unit_price: product.sale_price,
      quantity: 1,
      available_stock: available,
    });

    setAddedIds((prev) => new Set(prev).add(product.id));
    toast.success(`${product.name} added to cart`);

    // Reset visual feedback after 2s
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  return (
    <div>
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          <Button
            variant={activeCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(null)}
            className={cn('rounded-full', activeCategory === null && 'bg-gray-900 text-white')}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={cn('rounded-full', activeCategory === cat.id && 'bg-gray-900 text-white')}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products available in this category.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((product) => {
          const available = getAvailableStock(product.stock_quantity, product.reserved_quantity);
          const outOfStock = available <= 0;
          const justAdded = addedIds.has(product.id);

          return (
            <div
              key={product.id}
              className="group relative rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Product Image with Zoom Effect */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative cursor-pointer">
                {(() => {
                  const getProductImage = (p: Product): string => {
                    if (p.image_url && p.image_url.trim() !== '') return p.image_url;
                    const n = (p.name + ' ' + (p.slug || '')).toLowerCase();
                    if (n.includes('moist') || n.includes('cream') || n.includes('barrier') || n.includes('lipid')) {
                      return '/images/products/moisturizer.jpg';
                    }
                    if (n.includes('sun') || n.includes('spf') || n.includes('shield') || n.includes('uv')) {
                      return '/images/products/sunscreen.jpg';
                    }
                    if (n.includes('serum') || n.includes('vitamin') || n.includes('bright') || n.includes('active')) {
                      return '/images/products/serum.jpg';
                    }
                    return '/images/products/cleanser.jpg';
                  };

                  return (
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover transform duration-500 ease-out group-hover:scale-110"
                    />
                  );
                })()}
              </div>

              {/* Category Badge */}
              {(() => {
                const catName = Array.isArray(product.product_categories)
                  ? product.product_categories[0]?.name
                  : (product.product_categories as any)?.name;
                return catName ? (
                  <Badge className="absolute top-3 left-3 bg-white/95 text-gray-700 text-[10px] font-semibold backdrop-blur-sm border border-gray-200/60 shadow-xs">
                    {catName}
                  </Badge>
                ) : null;
              })()}

              {/* Out of Stock Badge */}
              {outOfStock && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <Badge className="bg-red-100 text-red-700 text-sm border-0">Out of Stock</Badge>
                </div>
              )}

              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                  {product.name}
                </h3>
                {product.short_description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {product.short_description}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(product.sale_price)}
                  </span>

                  <Button
                    size="sm"
                    disabled={outOfStock}
                    onClick={() => handleAddToCart(product)}
                    className={cn(
                      'rounded-full h-8 px-4 text-xs font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer',
                      justAdded
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-900 hover:bg-rose-700 text-white'
                    )}
                  >
                    {justAdded ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Bag
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
