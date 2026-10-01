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
              className="group relative rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="h-12 w-12 text-gray-200" />
                )}
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
                      'rounded-full h-8 px-3 text-xs transition-all',
                      justAdded
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
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
                        Add
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
