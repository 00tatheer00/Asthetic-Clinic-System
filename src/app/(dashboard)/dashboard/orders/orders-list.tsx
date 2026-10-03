'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  Phone,
  Mail,
  MapPin,
  Printer,
  MessageCircle,
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatPhone } from '@/lib/utils/helpers';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { OrderStatus } from '@/lib/types';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_method: string;
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_notes?: string | null;
  notes?: string | null;
  status: OrderStatus;
  subtotal?: number;
  delivery_fee?: number;
  discount_amount?: number;
  total: number;
  payment_method?: string;
  payment_status: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrdersListProps {
  orders: Order[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: { status: string; search: string };
  activeCount: number;
  isAdmin: boolean;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function OrdersList({
  orders,
  totalCount,
  currentPage: initialPage = 1,
  pageSize,
  filters,
  activeCount,
  isAdmin,
}: OrdersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(filters.search);
  const [activeSearch, setActiveSearch] = useState(filters.search);
  const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'all');
  const [currentPageState, setCurrentPageState] = useState<number>(initialPage || 1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // Instant in-memory filtering (0ms latency!)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedStatus !== 'all' && order.status !== selectedStatus) {
        return false;
      }
      if (activeSearch.trim()) {
        const q = activeSearch.toLowerCase().trim();
        const num = (order.order_number || '').toLowerCase();
        const name = (order.customer_name || '').toLowerCase();
        const phone = (order.customer_phone || '').toLowerCase();
        const email = (order.customer_email || '').toLowerCase();
        if (!num.includes(q) && !name.includes(q) && !phone.includes(q) && !email.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, selectedStatus, activeSearch]);

  const totalFilteredCount = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const displayedOrders = useMemo(() => {
    const start = (currentPageState - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPageState, pageSize]);

  const updateFilter = (key: string, value: string) => {
    let nextStatus = selectedStatus;
    let nextSearch = activeSearch;

    if (key === 'status') {
      nextStatus = value;
      setSelectedStatus(value);
    } else if (key === 'search') {
      nextSearch = value;
      setActiveSearch(value);
    }

    setCurrentPageState(1);

    try {
      const params = new URLSearchParams(window.location.search);
      if (nextStatus !== 'all') params.set('status', nextStatus);
      else params.delete('status');
      if (nextSearch) params.set('search', nextSearch);
      else params.delete('search');
      params.set('page', '1');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    } catch {
      // fallback
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
    setLoadingOrderId(orderId);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, {
        status: newStatus,
        cancellation_reason: reason,
      });
      setLoadingOrderId(null);
      if (result.success) {
        toast.success(`Order marked as ${ORDER_STATUS_LABELS[newStatus] || newStatus}`);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update order status');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter('status', f.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer',
                selectedStatus === f.value
                  ? 'bg-rose-500 text-white shadow-xs font-bold'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
              )}
            >
              {f.label}
              {f.value === 'all' && activeCount > 0 && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.2 rounded-full text-[10px]',
                    selectedStatus === f.value ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                  )}
                >
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              if (e.target.value === '') updateFilter('search', '');
            }}
            onKeyDown={(e) => e.key === 'Enter' && updateFilter('search', searchValue)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No orders found.</p>
        </Card>
      ) : (
        <Card className="border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/75">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-gray-600">Order</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Customer</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Method</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Total</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-gray-50/50 group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-gray-900">
                        {order.order_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-[11px] text-gray-400">{formatPhone(order.customer_phone)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {order.delivery_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-[10px] font-medium px-2 py-0.5 rounded-full border-0',
                          ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{formatDateTime(order.created_at)}</span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct Quick Action Button */}
                        {order.status === 'received' && (
                          <Button
                            size="sm"
                            disabled={isPending && loadingOrderId === order.id}
                            onClick={() => handleStatusChange(order.id, 'confirmed')}
                            className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                            title="Confirm this order"
                          >
                            {isPending && loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            Confirm
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            disabled={isPending && loadingOrderId === order.id}
                            onClick={() => handleStatusChange(order.id, 'preparing')}
                            className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                            title="Start preparing items"
                          >
                            {isPending && loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Package className="h-3.5 w-3.5 mr-1" />
                            )}
                            Prepare
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            disabled={isPending && loadingOrderId === order.id}
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                            title="Mark ready for dispatch or pickup"
                          >
                            {isPending && loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            disabled={isPending && loadingOrderId === order.id}
                            onClick={() =>
                              handleStatusChange(
                                order.id,
                                order.delivery_method === 'delivery' ? 'delivered' : 'picked_up'
                              )
                            }
                            className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold shadow-xs"
                            title={order.delivery_method === 'delivery' ? 'Mark delivered' : 'Mark picked up'}
                          >
                            {isPending && loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : order.delivery_method === 'delivery' ? (
                              <Truck className="h-3.5 w-3.5 mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            {order.delivery_method === 'delivery' ? 'Deliver' : 'Pick Up'}
                          </Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button
                            size="sm"
                            disabled={isPending && loadingOrderId === order.id}
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                            className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold shadow-xs"
                            title="Mark delivered"
                          >
                            {isPending && loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Truck className="h-3.5 w-3.5 mr-1" />
                            )}
                            Deliver
                          </Button>
                        )}
                        {['delivered', 'picked_up'].includes(order.status) && (
                          <Button
                            size="sm"
                            disabled={isPending && loadingOrderId === order.id}
                            onClick={() => handleStatusChange(order.id, 'completed')}
                            className="h-7 px-2.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                            title="Complete order"
                          >
                            {isPending && loadingOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            Complete
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                          className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {order.status === 'received' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" /> Confirm Order
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'preparing')}>
                                  <Package className="mr-2 h-4 w-4 text-indigo-600" /> Confirm & Prepare
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === 'confirmed' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'preparing')}>
                                  <Package className="mr-2 h-4 w-4 text-indigo-600" /> Start Preparing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ready')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Mark Ready
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === 'preparing' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ready')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Ready
                                </DropdownMenuItem>
                                {order.delivery_method === 'delivery' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')}>
                                    <Truck className="mr-2 h-4 w-4 text-amber-600" /> Dispatch (In Transit)
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {order.status === 'ready' && order.delivery_method === 'delivery' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
                                  <Truck className="mr-2 h-4 w-4 text-green-600" /> Mark Delivered
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')}>
                                  <Truck className="mr-2 h-4 w-4 text-amber-600" /> Mark In Transit
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === 'ready' && order.delivery_method === 'pickup' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'picked_up')}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Mark Picked Up
                              </DropdownMenuItem>
                            )}
                            {order.status === 'shipped' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
                                <Truck className="mr-2 h-4 w-4 text-green-600" /> Mark Delivered
                              </DropdownMenuItem>
                            )}
                            {['delivered', 'picked_up'].includes(order.status) && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'completed')}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-purple-600" /> Complete Order
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Contact links */}
                            <DropdownMenuItem
                              onClick={() => {
                                const phone = order.customer_phone.replace(/\D/g, '').replace(/^0/, '92');
                                const text = encodeURIComponent(
                                  `Assalam-o-Alaikum ${order.customer_name}, update from Brimish Skin Care Clinic regarding your order #${order.order_number}.`
                                );
                                window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                              }}
                              className="text-emerald-700 font-medium"
                            >
                              <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> WhatsApp Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `tel:${order.customer_phone}`;
                              }}
                            >
                              <Phone className="mr-2 h-4 w-4 text-blue-600" /> Call Customer
                            </DropdownMenuItem>

                            {!['completed', 'cancelled'].includes(order.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to cancel Order ${order.order_number}?`)) {
                                      handleStatusChange(order.id, 'cancelled');
                                    }
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(currentPageState - 1) * pageSize + 1}–{Math.min(currentPageState * pageSize, totalFilteredCount)} of {totalFilteredCount}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPageState <= 1}
              onClick={() => setCurrentPageState((p) => Math.max(1, p - 1))}
              className="h-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPageState >= totalPages}
              onClick={() => setCurrentPageState((p) => Math.min(totalPages, p + 1))}
              className="h-8"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <span>Order {selectedOrder.order_number}</span>
                    <Badge
                      className={cn(
                        'text-[10px] font-semibold uppercase',
                        ORDER_STATUS_COLORS[selectedOrder.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                    </Badge>
                  </DialogTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-7 text-xs gap-1.5 text-gray-700 hover:text-gray-900 border-gray-200"
                    title="Print order slip"
                  >
                    <Printer className="h-3.5 w-3.5 text-gray-500" />
                    <span>Print Slip</span>
                  </Button>
                </div>
                <DialogDescription className="text-xs text-gray-500">
                  Placed on {formatDateTime(selectedOrder.created_at)}
                </DialogDescription>
              </DialogHeader>

              {/* Customer & Delivery Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 text-xs">
                <div className="space-y-1.5">
                  <p className="font-semibold text-gray-400 uppercase text-[10px]">Customer Details</p>
                  <p className="font-bold text-gray-900 text-sm">{selectedOrder.customer_name}</p>
                  <p className="text-gray-600 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <a href={`tel:${selectedOrder.customer_phone}`} className="hover:underline font-mono">
                      {formatPhone(selectedOrder.customer_phone)}
                    </a>
                  </p>
                  {selectedOrder.customer_email && (
                    <p className="text-gray-600 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <a href={`mailto:${selectedOrder.customer_email}`} className="hover:underline">
                        {selectedOrder.customer_email}
                      </a>
                    </p>
                  )}
                  {/* Quick Action Links for customer */}
                  <div className="flex items-center gap-2 pt-1.5">
                    <a
                      href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(`Assalam-o-Alaikum ${selectedOrder.customer_name}, update regarding your Brimish Skin Care order #${selectedOrder.order_number}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                    >
                      <MessageCircle className="h-3 w-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition shadow-2xs"
                    >
                      <Phone className="h-3 w-3 text-blue-600" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="font-semibold text-gray-400 uppercase text-[10px]">Fulfillment Details</p>
                  <p className="text-gray-700 capitalize">
                    Method: <span className="font-semibold text-gray-900">{selectedOrder.delivery_method}</span>
                  </p>
                  {selectedOrder.delivery_address && (
                    <p className="text-gray-600 flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        {selectedOrder.delivery_address}
                        {selectedOrder.delivery_city ? `, ${selectedOrder.delivery_city}` : ''}
                      </span>
                    </p>
                  )}
                  {selectedOrder.delivery_notes && (
                    <p className="text-gray-500 italic mt-1">Note: {selectedOrder.delivery_notes}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Order Items</h4>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-2 px-3 text-left font-medium text-gray-500">Item</th>
                        <th className="py-2 px-3 text-center font-medium text-gray-500 w-16">Qty</th>
                        <th className="py-2 px-3 text-right font-medium text-gray-500 w-24">Price</th>
                        <th className="py-2 px-3 text-right font-medium text-gray-500 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                        selectedOrder.order_items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 font-medium text-gray-900">{item.name}</td>
                            <td className="py-2 px-3 text-center text-gray-600">{item.quantity}</td>
                            <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                            <td className="py-2 px-3 text-right font-bold text-gray-900">{formatCurrency(item.line_total)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-3 text-center text-gray-400">
                            Line items recorded in database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-3 text-xs">
                  <div className="w-56 space-y-1">
                    {selectedOrder.subtotal !== undefined && (
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_fee ? (
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery Fee:</span>
                        <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                      </div>
                    ) : null}
                    {selectedOrder.discount_amount ? (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-1">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-3 border-t">
                <p className="text-xs font-semibold text-gray-700 mb-2">Available Status Actions:</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {selectedOrder.status === 'received' && (
                    <>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-semibold shadow-xs"
                      >
                        {isPending && loadingOrderId === selectedOrder.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Confirm Order
                      </Button>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold shadow-xs"
                      >
                        <Package className="mr-1.5 h-3.5 w-3.5" />
                        Confirm & Prepare
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold shadow-xs"
                      >
                        {isPending && loadingOrderId === selectedOrder.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Package className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Start Preparing
                      </Button>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedOrder.id, 'ready')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold shadow-xs"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Mark as Ready
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedOrder.id, 'ready')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold shadow-xs"
                      >
                        {isPending && loadingOrderId === selectedOrder.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Ready for Pickup/Dispatch
                      </Button>
                      {selectedOrder.delivery_method === 'delivery' && (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleStatusChange(selectedOrder.id, 'shipped')}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 font-semibold shadow-xs"
                        >
                          <Truck className="mr-1.5 h-3.5 w-3.5" />
                          Dispatch (In Transit)
                        </Button>
                      )}
                    </>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <>
                      {selectedOrder.delivery_method === 'delivery' ? (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 font-semibold shadow-xs"
                          >
                            {isPending && loadingOrderId === selectedOrder.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Truck className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Mark Delivered
                          </Button>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleStatusChange(selectedOrder.id, 'shipped')}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 font-semibold shadow-xs"
                          >
                            <Truck className="mr-1.5 h-3.5 w-3.5" />
                            Mark In Transit
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleStatusChange(selectedOrder.id, 'picked_up')}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 font-semibold shadow-xs"
                        >
                          {isPending && loadingOrderId === selectedOrder.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Mark Picked Up
                        </Button>
                      )}
                    </>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 font-semibold shadow-xs"
                    >
                      {isPending && loadingOrderId === selectedOrder.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Truck className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Mark Delivered
                    </Button>
                  )}
                  {['delivered', 'picked_up'].includes(selectedOrder.status) && (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 font-semibold shadow-xs"
                    >
                      {isPending && loadingOrderId === selectedOrder.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Complete Order
                    </Button>
                  )}
                  {!['completed', 'cancelled'].includes(selectedOrder.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to cancel Order ${selectedOrder.order_number}? Reserved stock will be returned.`)) {
                          handleStatusChange(selectedOrder.id, 'cancelled');
                        }
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8 ml-auto font-medium"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancel Order
                    </Button>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
