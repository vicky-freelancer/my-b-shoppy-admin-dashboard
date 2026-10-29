import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Product } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate, getStatusConfig, getOrderAmount } from '../lib/utils';
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Package,
  Calendar,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  FileText,
  ExternalLink,
  Edit3,
  AlertCircle,
  Tag,
  DollarSign,
  ShieldCheck,
  Layers,
  Trash2
} from 'lucide-react';
import { DeleteOrderModal } from './DeleteOrderModal';

interface OrderDetailsModalProps {
  order: Order | null;
  products?: Product[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string | number, newStatus: OrderStatus, extraUpdates?: Partial<Order>) => void;
  onDeleteOrder?: (orderId: string | number) => Promise<void> | void;
  currencySymbol: string;
  supportPhone?: string;
  appName?: string;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  products = [],
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteOrder,
  currencySymbol,
  supportPhone = '+1 (800) 555-0199',
  appName = 'COD Admin Hub',
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [notes, setNotes] = useState(order?.notes || '');
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit item & pricing state
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editVariant, setEditVariant] = useState(order?.product_variant || '');
  const [editCategory, setEditCategory] = useState(order?.category || 'General');
  const [editQty, setEditQty] = useState(order?.quantity || 1);
  const [editUnitPrice, setEditUnitPrice] = useState<number>(() => {
    if (!order) return 0;
    const total = getOrderAmount(order, products);
    const q = Math.max(1, order.quantity || 1);
    return Math.round(total / q);
  });
  const [isSavingItem, setIsSavingItem] = useState(false);

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.tracking_number || '');
      setNotes(order.notes || '');
      setEditVariant(order.product_variant || '');
      setEditCategory(order.category || 'General');
      setEditQty(order.quantity || 1);
      const total = getOrderAmount(order, products);
      const q = Math.max(1, order.quantity || 1);
      setEditUnitPrice(Math.round(total / q));
      setIsEditingProduct(false);
    }
  }, [order, products]);

  if (!isOpen || !order) return null;

  const orderAmount = getOrderAmount(order, products);

  const handleCopyAddress = () => {
    const fullText = `${order.customer_name}\n${order.phone}\n${order.address}\n${order.city}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSaveTracking = () => {
    setIsSavingTracking(true);
    onUpdateStatus(order.id, order.status as OrderStatus, { tracking_number: trackingNumber });
    setTimeout(() => setIsSavingTracking(false), 600);
  };

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    onUpdateStatus(order.id, order.status as OrderStatus, { notes });
    setTimeout(() => setIsSavingNotes(false), 600);
  };

  const handleSelectCatalogProduct = (prodId: string) => {
    const found = products.find((p) => String(p.id) === prodId);
    if (found) {
      setEditVariant(found.title);
      if (found.category) setEditCategory(found.category);
      if (found.sale_price) setEditUnitPrice(found.sale_price);
    }
  };

  const handleSaveItemChanges = () => {
    setIsSavingItem(true);
    const calculatedAmount = Math.max(1, editQty) * Math.max(0, editUnitPrice);
    onUpdateStatus(order.id, order.status as OrderStatus, {
      product_variant: editVariant,
      category: editCategory,
      quantity: editQty,
      price_per_unit: editUnitPrice,
      amount: calculatedAmount,
    });
    setTimeout(() => {
      setIsSavingItem(false);
      setIsEditingProduct(false);
    }, 600);
  };

  // WhatsApp pre-formatted message
  const whatsappPhone = order.phone.replace(/[^0-9]/g, '');
  const whatsappMessage = encodeURIComponent(
    `Hello ${order.customer_name},\nThis is ${appName} regarding your Cash-on-Delivery order #${order.id} for "${order.product_variant}" (Qty: ${order.quantity}).\n\nOrder & COD Price (Total to collect): ${formatCurrency(orderAmount, currencySymbol)}\nDelivery Address: ${order.address}, ${order.city}\n\nPlease reply "CONFIRM" to authorize courier dispatch.`
  );
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`;

  const timelineSteps: { status: OrderStatus; label: string; icon: any }[] = [
    { status: 'pending', label: 'Order Received', icon: Calendar },
    { status: 'confirmed', label: 'Verified & Confirmed', icon: CheckCircle2 },
    { status: 'shipped', label: 'Handed to Courier', icon: Truck },
    { status: 'delivered', label: 'Delivered & Cash Collected', icon: Package },
  ];

  const currentStatusIndex = timelineSteps.findIndex((s) => s.status === (order.status || 'pending').toLowerCase());

  if (showPrintView) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-[#f8fafc] rounded-2xl max-w-xl w-full p-8 shadow-2xl relative text-[#0f172a] border border-black">
          <div className="flex justify-between items-start border-b border-black pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#0f172a]">{appName}</h2>
              <p className="text-xs text-[#475569] font-mono">COD PACKING SLIP & RECEIPT</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-[#a16207] text-[#ffffff] font-bold rounded-lg text-xs flex items-center gap-1.5 hover:bg-[#854d0e] transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                type="button"
                onClick={() => setShowPrintView(false)}
                className="p-1.5 text-[#475569] hover:text-[#0f172a] rounded-lg hover:bg-[#f1f5f9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs mb-6 pb-4 border-b border-black">
            <div>
              <p className="text-[#475569] font-medium mb-1 uppercase tracking-wider text-[10px]">Customer / Ship To:</p>
              <p className="font-bold text-[#0f172a] text-sm">{order.customer_name}</p>
              <p className="text-[#334155]">{order.address}</p>
              <p className="text-[#334155] font-medium">{order.city}</p>
              <p className="text-[#334155] mt-1">Tel: {order.phone}</p>
              {order.email && <p className="text-[#475569]">{order.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-[#475569] font-medium mb-1 uppercase tracking-wider text-[10px]">Order Details:</p>
              <p className="font-mono font-bold text-[#0f172a]">#{order.id}</p>
              <p className="text-[#475569]">{formatDate(order.created_at)}</p>
              <p className="text-xs font-semibold text-[#a16207] bg-[#e2e8f0] inline-block px-2 py-0.5 rounded mt-1 border border-[#a16207]/30">
                PAYMENT: CASH ON DELIVERY
              </p>
              {order.tracking_number && (
                <p className="text-[#475569] font-mono mt-1 text-[11px]">AWB: {order.tracking_number}</p>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black text-[#475569] text-left">
                  <th className="py-2">Item / Variant</th>
                  <th className="py-2">Category</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">COD Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 font-medium text-[#0f172a]">{order.product_variant}</td>
                  <td className="py-3 text-[#334155]">{order.category || 'General'}</td>
                  <td className="py-3 text-center text-[#334155]">{order.quantity}</td>
                  <td className="py-3 text-right font-bold text-[#a16207]">{formatCurrency(orderAmount, currencySymbol)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[#ffffff] p-4 rounded-xl border border-black flex justify-between items-center mb-6">
            <div>
              <p className="text-xs text-[#334155] font-medium">TOTAL CASH TO COLLECT FROM CUSTOMER</p>
              <p className="text-[11px] text-[#475569]">Courier must collect exact amount upon delivery</p>
            </div>
            <span className="text-xl font-bold text-[#a16207]">{formatCurrency(orderAmount, currencySymbol)}</span>
          </div>

          {order.notes && (
            <div className="text-xs text-[#334155] bg-[#ffffff] p-3 rounded-lg border border-black mb-6">
              <span className="font-semibold text-[#a16207]">Delivery Instructions:</span> {order.notes}
            </div>
          )}

          <div className="text-[11px] text-[#475569] text-center">
            Thank you for shopping with us! Customer support: {supportPhone}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        id="order-details-modal"
        className="bg-[#f8fafc] w-full max-w-2xl rounded-2xl shadow-2xl border border-black overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 text-[#1e293b]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-black flex items-center justify-between bg-[#f8fafc]">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#a16207]">#{order.id}</span>
                <StatusBadge
                  status={order.status}
                  interactive
                  onStatusChange={(newStatus) => onUpdateStatus(order.id, newStatus)}
                />
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="print-packing-slip-btn"
              onClick={() => setShowPrintView(true)}
              className="px-3 py-1.5 rounded-lg border border-black text-xs font-medium text-[#334155] hover:bg-[#f1f5f9] flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#a16207]" />
              Packing Slip
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#475569] hover:text-[#0f172a] rounded-lg hover:bg-[#f1f5f9] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Quick Action Contact Bar */}
          <div className="flex flex-wrap gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>WhatsApp Customer</span>
            </a>

            <a
              href={`tel:${order.phone}`}
              className="flex-1 min-w-[120px] px-3.5 py-2.5 rounded-lg bg-[#ffffff] text-[#0f172a] border border-black hover:bg-[#e2e8f0] font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Phone className="w-4 h-4 text-[#a16207] shrink-0" />
              <span>Call ({order.phone})</span>
            </a>

            {order.email && (
              <a
                href={`mailto:${order.email}?subject=Regarding your Order #${order.id}`}
                className="px-3.5 py-2.5 rounded-lg bg-[#ffffff] text-[#0f172a] border border-black hover:bg-[#e2e8f0] font-medium text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Mail className="w-4 h-4 text-[#a16207] shrink-0" />
                <span>Email</span>
              </a>
            )}
          </div>

          {/* Stepper / Timeline */}
          <div className="bg-[#ffffff] rounded-xl p-4 border border-black">
            <h4 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3">
              Fulfillment Journey
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {timelineSteps.map((step, idx) => {
                const isPassedOrCurrent =
                  (order.status || 'pending').toLowerCase() === step.status ||
                  (currentStatusIndex >= 0 && idx <= currentStatusIndex);
                const isCurrent = (order.status || 'pending').toLowerCase() === step.status;
                const Icon = step.icon;

                return (
                  <button
                    key={step.status}
                    type="button"
                    onClick={() => onUpdateStatus(order.id, step.status)}
                    className={`p-2.5 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-[#e2e8f0] border-[#a16207] ring-1 ring-[#a16207] text-[#a16207] font-semibold'
                        : isPassedOrCurrent
                        ? 'bg-[#f8fafc] border-black text-[#0f172a] font-medium'
                        : 'bg-[#f8fafc] border-black text-[#475569] hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#a16207]' : isPassedOrCurrent ? 'text-[#0f172a]' : 'text-[#475569]'}`} />
                      {isPassedOrCurrent && <Check className="w-3 h-3 text-emerald-700" />}
                    </div>
                    <span className="truncate">
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two Column details: Customer & Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer info */}
            <div className="bg-[#ffffff] rounded-xl p-4 border border-black shadow-2xs">
              <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider block mb-2">
                Customer Information
              </span>
              <p className="font-bold text-[#0f172a] text-sm mb-1">{order.customer_name}</p>
              <div className="space-y-1 text-xs text-[#334155]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#475569] shrink-0" />
                  <span className="font-mono">{order.phone}</span>
                </div>
                {order.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#475569] shrink-0" />
                    <span className="truncate">{order.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery address */}
            <div className="bg-[#ffffff] rounded-xl p-4 border border-black shadow-2xs relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                  Delivery Destination
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="text-xs text-[#334155] hover:text-[#0f172a] flex items-center gap-1 font-medium bg-[#e2e8f0] px-2 py-0.5 rounded-md hover:bg-[#e2e8f0] transition-colors border border-black"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-medium text-[#0f172a] mb-1">{order.address}</p>
              <div className="flex items-center gap-1.5 text-xs text-[#334155]">
                <MapPin className="w-3.5 h-3.5 text-[#475569] shrink-0" />
                <span className="font-semibold text-[#a16207]">{order.city}</span>
              </div>
            </div>
          </div>

          {/* Product & COD Financial Summary */}
          <div className="bg-[#ffffff] rounded-xl p-4 border border-black shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider block">
                  Order Items & Pricing
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Order Price = COD Price
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProduct(!isEditingProduct)}
                className="text-xs text-[#a16207] hover:underline flex items-center gap-1 font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditingProduct ? 'Cancel Edit' : 'Edit Product / Price'}
              </button>
            </div>

            {/* If not editing, display cleanly */}
            {!isEditingProduct ? (
              <div className="flex items-start justify-between pb-3 border-b border-black">
                <div className="flex items-start gap-3">
                  {(() => {
                    const variant = (order.product_variant || '').toLowerCase();
                    const cleanedVariant = variant.replace(/standard/gi, '').replace(/x\s*\d+/gi, '').replace(/qty/gi, '').replace(/\d+/g, '').trim();
                    let matchedProduct = products.find(
                      (p) =>
                        (order.product_id && String(p.id) === String(order.product_id)) ||
                        (p.sku && variant.includes(p.sku.toLowerCase())) ||
                        (p.title && variant === p.title.toLowerCase()) ||
                        (p.title && variant.includes(p.title.toLowerCase())) ||
                        (p.title && cleanedVariant && cleanedVariant.length > 2 && p.title.toLowerCase().includes(cleanedVariant)) ||
                        (order.category && p.category && order.category.toLowerCase() === p.category.toLowerCase())
                    );
                    if (!matchedProduct && products.length > 0) {
                      matchedProduct = products[0];
                    }
                    const img = matchedProduct?.cover_image || matchedProduct?.image_url || (order as any).product_image || (order as any).image;
                    if (img) {
                      return (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#d97706]/40 bg-[#f1f5f9] shrink-0 shadow-sm">
                          <img
                            src={img}
                            alt={order.product_variant || 'Product'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="p-2 rounded-lg bg-[#e2e8f0] text-[#a16207] shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <h4 className="font-semibold text-[#0f172a] text-sm">{order.product_variant}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#475569]">Qty: {order.quantity} unit(s)</span>
                      <span className="text-[#cbd5e1]">•</span>
                      <span className="inline-flex items-center text-xs font-medium text-[#334155] bg-[#e2e8f0] px-2 py-0.5 rounded border border-black">
                        <Tag className="w-3 h-3 mr-1 text-[#475569]" />
                        {order.category || 'General'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#475569] block">Order & COD Amount</span>
                  <span className="font-bold text-base text-[#a16207]">
                    {formatCurrency(orderAmount, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-[#475569] block">Cash on Delivery</span>
                </div>
              </div>
            ) : (
              /* If editing product / price */
              <div className="p-3 bg-[#f8fafc] rounded-lg border border-black mb-3 space-y-3">
                {products.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#475569] mb-1">
                      Assign from Catalog Product (Auto-syncs price & details):
                    </label>
                    <select
                      onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-black bg-[#ffffff] text-[#0f172a] focus:outline-none focus:border-[#a16207]"
                    >
                      <option value="">-- Choose Catalog Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (SKU: {p.sku || 'N/A'}) — Sale Price: {currencySymbol}{p.sale_price}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#475569] mb-1">Product Variant Title:</label>
                    <input
                      type="text"
                      value={editVariant}
                      onChange={(e) => setEditVariant(e.target.value)}
                      placeholder="e.g. blue hand bag"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-black bg-[#ffffff] text-[#0f172a] focus:outline-none focus:border-[#a16207]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#475569] mb-1">Category:</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      placeholder="e.g. bag, rings"
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-black bg-[#ffffff] text-[#0f172a] focus:outline-none focus:border-[#a16207]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#475569] mb-1">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      value={editQty}
                      onChange={(e) => setEditQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-black bg-[#ffffff] text-[#0f172a] focus:outline-none focus:border-[#a16207]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#475569] mb-1">
                      Unit Sale Price ({currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editUnitPrice}
                      onChange={(e) => setEditUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-black bg-[#ffffff] text-[#0f172a] focus:outline-none focus:border-[#a16207]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black">
                  <div className="text-xs">
                    <span className="text-[#475569]">New Calculated COD Total: </span>
                    <span className="font-bold text-[#a16207] text-sm">
                      {formatCurrency(Math.max(1, editQty) * Math.max(0, editUnitPrice), currencySymbol)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveItemChanges}
                    disabled={isSavingItem}
                    className="px-3 py-1.5 rounded-lg bg-[#a16207] text-[#ffffff] font-bold text-xs hover:bg-[#854d0e] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSavingItem ? 'Saving to Database...' : 'Save Product & Price'}
                  </button>
                </div>
              </div>
            )}

            {/* Tracking ID update */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  Courier Tracking / AWB Number:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. FEDEX-992019 or DHL-3312"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-black bg-[#f8fafc] text-[#0f172a] focus:outline-none focus:border-[#a16207]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTracking}
                    disabled={isSavingTracking}
                    className="px-3 py-1.5 rounded-lg bg-[#a16207] text-[#ffffff] font-bold text-xs hover:bg-[#854d0e] disabled:opacity-50 transition-colors"
                  >
                    {isSavingTracking ? 'Saving...' : 'Save AWB'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-[#ffffff] rounded-xl p-4 border border-black">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-[#a16207]" />
                Admin / Dispatch Notes
              </label>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-xs font-medium text-[#a16207] hover:underline"
              >
                {isSavingNotes ? 'Saved' : 'Save Notes'}
              </button>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add courier notes, customer preferences, or verification details..."
              className="w-full p-2.5 text-xs rounded-lg border border-black bg-[#f8fafc] text-[#0f172a] focus:outline-none focus:border-[#a16207] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#f8fafc] border-t border-black flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#475569]">Order #{order.id}</span>
            {onDeleteOrder && (
              <button
                type="button"
                id="modal-delete-order-btn"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#e2e8f0] text-[#0f172a] hover:bg-[#e2e8f0] rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteOrderModal
          order={order}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirmSingle={async (orderId) => {
            if (onDeleteOrder) {
              await onDeleteOrder(orderId);
            }
            setIsDeleteModalOpen(false);
            onClose();
          }}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};
