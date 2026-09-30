'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderCheckoutSchema, type OrderCheckoutInput } from '@/lib/validations';
import { placeOrder } from '@/actions/orders';
import { useCartStore } from '@/stores/cart-store';
import { formatCurrency } from '@/lib/utils/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle2, Truck, Store, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [orderResult, setOrderResult] = useState<{ orderNumber: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const subtotal = getSubtotal();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderCheckoutInput>({
    resolver: zodResolver(orderCheckoutSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      delivery_method: 'pickup',
      delivery_address: '',
      delivery_city: '',
      delivery_notes: '',
      items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      })),
    },
  });

  const deliveryMethod = watch('delivery_method');
  const deliveryFee = deliveryMethod === 'delivery' ? 200 : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0 && !orderResult) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cart is empty</h1>
          <p className="text-gray-500 mb-6">Add products before checkout.</p>
          <Link href="/products">
            <Button className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (orderResult) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Your order number is <span className="font-bold text-rose-600">{orderResult.orderNumber}</span>
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We&apos;ll confirm your order shortly. Payment is cash on delivery/pickup.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products">
              <Button variant="outline" className="rounded-full px-8">Continue Shopping</Button>
            </Link>
            <Link href="/">
              <Button className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: OrderCheckoutInput) => {
    setServerError(null);

    // Inject current cart items
    data.items = items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    }));

    const result = await placeOrder(data);

    if (!result.success) {
      setServerError(result.error || 'Failed to place order.');
      return;
    }

    setOrderResult({ orderNumber: result.orderNumber! });
    clearCart();
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link href="/order/cart" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Cart
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {serverError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
              )}

              {/* Contact Info */}
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">Full Name *</Label>
                      <Input id="customer_name" placeholder="Your name" {...register('customer_name')} className={errors.customer_name ? 'border-red-500' : ''} />
                      {errors.customer_name && <p className="text-xs text-red-600">{errors.customer_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_phone">Phone *</Label>
                      <Input id="customer_phone" placeholder="03001234567" {...register('customer_phone')} className={errors.customer_phone ? 'border-red-500' : ''} />
                      {errors.customer_phone && <p className="text-xs text-red-600">{errors.customer_phone.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="customer_email">Email (optional)</Label>
                    <Input id="customer_email" type="email" placeholder="your@email.com" {...register('customer_email')} />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Method</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('delivery_method', 'pickup')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        deliveryMethod === 'pickup'
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Store className={cn('h-6 w-6', deliveryMethod === 'pickup' ? 'text-rose-600' : 'text-gray-400')} />
                      <span className={cn('text-sm font-medium', deliveryMethod === 'pickup' ? 'text-rose-700' : 'text-gray-700')}>Pickup</span>
                      <span className="text-xs text-gray-500">Free</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('delivery_method', 'delivery')}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        deliveryMethod === 'delivery'
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Truck className={cn('h-6 w-6', deliveryMethod === 'delivery' ? 'text-rose-600' : 'text-gray-400')} />
                      <span className={cn('text-sm font-medium', deliveryMethod === 'delivery' ? 'text-rose-700' : 'text-gray-700')}>Delivery</span>
                      <span className="text-xs text-gray-500">Rs. 200</span>
                    </button>
                  </div>

                  {deliveryMethod === 'delivery' && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="delivery_address">Delivery Address *</Label>
                        <Textarea id="delivery_address" placeholder="Full address" rows={2} {...register('delivery_address')} className={errors.delivery_address ? 'border-red-500' : ''} />
                        {errors.delivery_address && <p className="text-xs text-red-600">{errors.delivery_address.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_city">City</Label>
                        <Input id="delivery_city" placeholder="Peshawar" {...register('delivery_city')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_notes">Delivery Notes</Label>
                        <Input id="delivery_notes" placeholder="Any special instructions" {...register('delivery_notes')} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="border-0 shadow-lg sticky top-24">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.product_id} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate max-w-[60%]">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery</span>
                      <span className="text-gray-900">{deliveryFee ? formatCurrency(deliveryFee) : 'Free'}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mt-3 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-200/50 rounded-full h-11"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Placing Order...</>
                    ) : (
                      <>Place Order — {formatCurrency(total)}</>
                    )}
                  </Button>

                  <p className="text-[10px] text-gray-400 text-center mt-3">
                    Cash on delivery. No online payment required.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
