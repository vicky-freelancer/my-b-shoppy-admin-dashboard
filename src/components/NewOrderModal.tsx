import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Product } from '../types';
import { X, Plus, User, Phone, MapPin, Package, FileText, Check, ShieldCheck, Tag, DollarSign } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: Omit<Order, 'id'>) => Promise<void>;
  currencySymbol: string;
  products?: Product[];
}

const COMMON_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Pune',
  'Jaipur',
  'Surat',
  'New York',
  'San Francisco',
  'Chicago',
];

const COMMON_CATEGORIES = [
  'Hair Accessories',
  'Artificial Jewels',
  'Bows',
  'Scrunchies',
  'Handbags',
  'Earrings',
  'Necklaces',
  'Bracelets',
  'Rings',
];

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currencySymbol = '₹',
  products = [],
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(
    products.length > 0 ? products[0].category : COMMON_CATEGORIES[0]
  );
  const [customCategory, setCustomCategory] = useState('');
  const [city, setCity] = useState(COMMON_CITIES[0]);
  const [customCity, setCustomCity] = useState('');
  const [address, setAddress] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length > 0 ? String(products[0].id) : 'CUSTOM'
  );
  const [productVariant, setProductVariant] = useState(
    products.length > 0 ? products[0].title : 'Handcrafted Jewellery Item'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(
    products.length > 0 ? (products[0].sale_price || 149) : 149
  );
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Reset the form with current catalog defaults every time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    const firstProduct = products.length > 0 ? products[0] : null;
    setCategory(firstProduct ? firstProduct.category : COMMON_CATEGORIES[0]);
    setCustomCategory('');
    setSelectedProductId(firstProduct ? String(firstProduct.id) : 'CUSTOM');
    setProductVariant(firstProduct ? firstProduct.title : 'Handcrafted Jewellery Item');
    setUnitPrice(firstProduct ? firstProduct.sale_price || 149 : 149);
    setCustomerName('');
    setPhone('');
    setEmail('');
    setCity(COMMON_CITIES[0]);
    setCustomCity('');
    setAddress('');
    setQuantity(1);
    setStatus('pending');
    setNotes('');
    setIsSubmitting(false);
    setFormError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  // Synchronize product selection
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    if (prodId === 'CUSTOM') {
      return;
    }
    const found = products.find((p) => String(p.id) === prodId);
    if (found) {
      setProductVariant(found.title);
      if (found.category) {
        setCategory(found.category);
      }
      setUnitPrice(found.sale_price || 0);
    }
  };

  // Order price and COD price are strictly identical
  const totalAmount = Math.max(0, quantity * unitPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please provide the customer name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please provide the full delivery address.');
      return;
    }

    const selectedCategory = category === 'OTHER' ? customCategory : category;
    if (!selectedCategory.trim()) {
      setFormError('Please specify the order category.');
      return;
    }

    if (!productVariant.trim()) {
      setFormError('Please specify the product name / variant.');
      return;
    }

    const selectedCity = city === 'OTHER' ? customCity : city;
    if (!selectedCity.trim()) {
      setFormError('Please specify the delivery city.');
      return;
    }

    const requestedQty = Math.max(1, Number(quantity) || 1);
    const selectedCatalogProduct =
      selectedProductId === 'CUSTOM' ? null : products.find((p) => String(p.id) === selectedProductId) || null;

    // Prevent ordering more than what is currently available in stock
    if (selectedCatalogProduct) {
      const available = Number(selectedCatalogProduct.quantity) || 0;
      if (requestedQty > available) {
        setFormError(
          `Only ${available} unit${available === 1 ? '' : 's'} left in stock for "${selectedCatalogProduct.title}".`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        customer_name: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        category: selectedCategory.trim(),
        city: selectedCity.trim(),
        address: address.trim(),
        product_variant: productVariant.trim(),
        product_id: selectedCatalogProduct ? selectedCatalogProduct.id : undefined,
        quantity: requestedQty,
        status: status,
        created_at: new Date().toISOString(),
        amount: totalAmount,
        price_per_unit: unitPrice,
        notes: notes.trim(),
        payment_method: 'Cash on Delivery (COD)',
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        id="new-order-modal"
        className="bg-[#120f0b] w-full max-w-xl rounded-2xl shadow-2xl border border-[#2d251a] overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150 text-[#e8ded1]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f1a14] flex items-center justify-between bg-[#0e0c0a]">
          <div>
            <h2 className="text-base font-serif font-bold text-[#f3e7c4]">Create New COD Order</h2>
            <p className="text-xs text-[#8c7a4f]">Order Price & COD Price remain exactly the same (₹ to collect)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8c7a4f] hover:text-[#f3e7c4] rounded-lg hover:bg-[#18140f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-950/40 text-rose-300 rounded-lg border border-rose-800/50 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Customer info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#8c7a4f] uppercase tracking-wider">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#d8cca8] font-medium mb-1">
                  Customer Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] focus:outline-none focus:border-[#e5c158]"
                />
              </div>

              <div>
                <label className="block text-[#d8cca8] font-medium mb-1">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] font-mono focus:outline-none focus:border-[#e5c158]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#d8cca8] font-medium mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] focus:outline-none focus:border-[#e5c158]"
              />
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-3 pt-3 border-t border-[#1f1a14]">
            <h3 className="text-xs font-semibold text-[#8c7a4f] uppercase tracking-wider">
              Shipping Destination
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#d8cca8] font-medium mb-1">
                  City <span className="text-rose-400">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] focus:outline-none focus:border-[#e5c158]"
                >
                  {COMMON_CITIES.map((c) => (
                    <option key={c} value={c} className="bg-[#18140f] text-[#f3e7c4]">
                      {c}
                    </option>
                  ))}
                  <option value="OTHER" className="bg-[#18140f] text-[#f3e7c4]">Other / Custom City</option>
                </select>
              </div>

              {city === 'OTHER' && (
                <div>
                  <label className="block text-[#d8cca8] font-medium mb-1">
                    Enter City Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] focus:outline-none focus:border-[#e5c158]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[#d8cca8] font-medium mb-1">
                Full Street Address <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Flat No, Street, Landmark, Pincode"
                className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] focus:outline-none focus:border-[#e5c158] resize-none"
              />
            </div>
          </div>

          {/* Product & COD */}
          <div className="space-y-3 pt-3 border-t border-[#1f1a14]">
            <h3 className="text-xs font-semibold text-[#8c7a4f] uppercase tracking-wider">
              Product & Price Details
            </h3>

            {/* Select from catalog if available */}
            {products.length > 0 && (
              <div>
                <label className="block text-[#d8cca8] font-medium mb-1">
                  Select from Store Catalog
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] focus:outline-none focus:border-[#e5c158] mb-2"
                >
                  {products.map((p) => {
                    const available = Number(p.quantity) || 0;
                    return (
                      <option key={p.id} value={String(p.id)} className="bg-[#18140f] text-[#f3e7c4]">
                        {p.title} ({p.sku}) — {currencySymbol}{p.sale_price}
                        {` — ${available > 0 ? `${available} in stock` : 'Out of stock'}`}
                      </option>
                    );
                  })}
                  <option value="CUSTOM" className="bg-[#18140f] text-[#f3e7c4]">
                    -- Custom / Other Item --
                  </option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[#d8cca8] font-medium mb-1">
                Product Name / Variant <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={productVariant}
                onChange={(e) => setProductVariant(e.target.value)}
                placeholder="e.g. Pearl Petal Bloom Earrings"
                className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] focus:outline-none focus:border-[#e5c158]"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-[#d8cca8] font-medium mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] focus:outline-none focus:border-[#e5c158] mb-2"
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#18140f] text-[#f3e7c4]">
                    {c}
                  </option>
                ))}
                <option value="OTHER" className="bg-[#18140f] text-[#f3e7c4]">Other / Custom Category...</option>
              </select>

              {category === 'OTHER' && (
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name (e.g. Luxury Bangles)"
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] focus:outline-none focus:border-[#e5c158]"
                />
              )}
            </div>

            {/* Quantity, Unit Price, and Identical Order/COD Price calculation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#d8cca8] font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-center font-semibold text-[#f3e7c4] focus:outline-none focus:border-[#e5c158]"
                />
              </div>

              <div>
                <label className="block text-[#d8cca8] font-medium mb-1">Unit Price ({currencySymbol})</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] font-mono text-center text-[#f3e7c4] focus:outline-none focus:border-[#e5c158]"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 bg-[#18140f] p-2.5 rounded-xl border border-[#3b301f] flex flex-col justify-center text-center">
                <span className="text-[10px] font-semibold text-[#8c7a4f] uppercase tracking-wider">Order & COD Price</span>
                <span className="text-sm font-bold text-[#e5c158]">{formatCurrency(totalAmount, currencySymbol)}</span>
              </div>
            </div>

            {/* Guarantee Note: Order price and COD price are the same */}
            <div className="p-2.5 rounded-xl bg-[#16120d] border border-[#292217] flex items-center gap-2 text-[11px] text-[#c4b595]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Same Price Rule:</strong> Order Price = COD Collectable Price (<span className="text-[#e5c158] font-semibold">{formatCurrency(totalAmount, currencySymbol)}</span>). No extra COD fee or price alteration.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#d8cca8] font-medium mb-1">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] focus:outline-none focus:border-[#e5c158]"
                >
                  <option value="pending" className="bg-[#18140f] text-[#f3e7c4]">Pending Verification</option>
                  <option value="confirmed" className="bg-[#18140f] text-[#f3e7c4]">Confirmed</option>
                  <option value="shipped" className="bg-[#18140f] text-[#f3e7c4]">Shipped</option>
                </select>
              </div>

              <div>
                <label className="block text-[#d8cca8] font-medium mb-1">Order Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Call before delivery"
                  className="w-full px-3 py-2 rounded-xl border border-[#2d251a] bg-[#18140f] text-[#f3e7c4] placeholder:text-[#8c7a4f] focus:outline-none focus:border-[#e5c158]"
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-[#1f1a14] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#2d251a] text-[#d8cca8] hover:bg-[#18140f] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#e5c158] hover:bg-[#f3cf65] text-[#0c0a09] font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-[#d4af37]/20 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span>Saving to Database...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Order ({formatCurrency(totalAmount, currencySymbol)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

