import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { PRESET_JEWELLERY_IMAGES } from '../lib/products';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Tag,
  DollarSign,
  Package,
  Layers,
  AlertCircle,
  Check,
  Plus,
  Database,
} from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id'>) => Promise<void>;
  editingProduct?: Product | null;
  currencySymbol?: string;
  onOpenSqlSetup?: () => void;
}

const COMMON_CATEGORIES = [
  'Earrings',
  'Chains',
  'Necklaces',
  'Rings',
  'Bracelets',
  'Pendants',
  'Bangles',
  'Anklets',
  'Nose Pins',
  'Sets & Combos',
];

const PRESET_BADGES = [
  'Bestseller',
  'Featured',
  'New Arrival',
  'Trending',
  'Limited Edition',
  'Hot Deal',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  currencySymbol = '₹',
  onOpenSqlSetup,
}) => {
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_JEWELLERY_IMAGES[0].url);
  const [mrp, setMrp] = useState<number | ''>(400);
  const [salePrice, setSalePrice] = useState<number | ''>(149);
  const [quantity, setQuantity] = useState<number | ''>(20);
  const [badges, setBadges] = useState<string[]>(['Bestseller', 'Featured']);
  const [customBadge, setCustomBadge] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');

  const [imageTab, setImageTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form when modal opens or editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title || '');
      setSku(editingProduct.sku || '');
      if (COMMON_CATEGORIES.includes(editingProduct.category)) {
        setCategory(editingProduct.category);
        setCustomCategory('');
      } else {
        setCategory('OTHER');
        setCustomCategory(editingProduct.category || '');
      }
      setCoverImage(editingProduct.cover_image || PRESET_JEWELLERY_IMAGES[0].url);
      setMrp(editingProduct.mrp ?? 0);
      setSalePrice(editingProduct.sale_price ?? 0);
      setQuantity(editingProduct.quantity ?? 0);
      setBadges(editingProduct.badges || []);
      setDescription(editingProduct.description || '');
      setMaterial(editingProduct.material || '');
    } else {
      // Default empty new product values for manual entry
      setTitle('');
      setSku(`LK-${Math.random().toString(36).substring(2, 5).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
      setCategory(COMMON_CATEGORIES[0]);
      setCustomCategory('');
      setCoverImage('');
      setMrp('');
      setSalePrice('');
      setQuantity('');
      setBadges([]);
      setDescription('');
      setMaterial('');
    }
    setFormError(null);
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  // Auto generate SKU based on title and category
  const generateSku = () => {
    const catCode = (category === 'OTHER' ? customCategory : category).substring(0, 3).toUpperCase() || 'CAT';
    const randNum = Math.floor(100 + Math.random() * 900);
    setSku(`LK-${catCode}-${randNum}`);
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Please upload a valid image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCoverImage(e.target.result as string);
        setFormError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Toggle badge
  const toggleBadge = (badge: string) => {
    if (badges.includes(badge)) {
      setBadges(badges.filter((b) => b !== badge));
    } else {
      setBadges([...badges, badge]);
    }
  };

  const addCustomBadge = () => {
    if (customBadge.trim() && !badges.includes(customBadge.trim())) {
      setBadges([...badges, customBadge.trim()]);
      setCustomBadge('');
    }
  };

  // Calculate discount %
  const discountPercent =
    typeof mrp === 'number' && typeof salePrice === 'number' && mrp > salePrice && mrp > 0
      ? Math.round(((mrp - salePrice) / mrp) * 100)
      : 0;

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Product title is required.');
      return;
    }

    if (!sku.trim()) {
      setFormError('Product SKU is required.');
      return;
    }

    const finalCategory = category === 'OTHER' ? customCategory.trim() : category;
    if (!finalCategory) {
      setFormError('Please select or specify a category.');
      return;
    }

    if (salePrice === '' || Number(salePrice) < 0) {
      setFormError('Please enter a valid sale price.');
      return;
    }

    if (quantity === '' || Number(quantity) < 0) {
      setFormError('Please enter a valid stock quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        sku: sku.trim().toUpperCase(),
        category: finalCategory,
        cover_image: coverImage || PRESET_JEWELLERY_IMAGES[0].url,
        mrp: Number(mrp) || Number(salePrice),
        sale_price: Number(salePrice),
        quantity: Number(quantity),
        badges: badges,
        description: description.trim(),
        material: material.trim(),
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="product-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="product-modal-content"
        className="bg-[#12100e] border border-[#2d251a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-[#d8cca8] my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#241e17] flex items-center justify-between bg-[#16120d]">
          <div>
            <h2 className="text-base font-serif font-bold text-[#e5c158] uppercase tracking-wide">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-[#8c7a4f] mt-0.5">
              {editingProduct ? `Updating inventory item #${editingProduct.sku}` : 'Fill in the details to publish a new jewellery piece.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#201a14] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {formError && (
            <div className="p-3.5 rounded-xl bg-[#241414] border border-rose-800/60 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-rose-200">Database Storage Notice</p>
                  <p className="text-[11px] text-rose-300/90 break-words mt-0.5">{formError}</p>
                </div>
              </div>
              {onOpenSqlSetup && (
                <button
                  type="button"
                  onClick={onOpenSqlSetup}
                  className="px-3 py-1.5 rounded-lg bg-[#2e1d1d] hover:bg-[#3d2424] text-[#e5c158] border border-[#523030] font-medium text-[11px] flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors"
                >
                  <Database className="w-3.5 h-3.5 text-[#e5c158]" />
                  <span>Fix Supabase Table</span>
                </button>
              )}
            </div>
          )}

          {/* 1. Cover Image Upload & Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#e5c158] uppercase tracking-wider">
              Product Cover Image <span className="text-rose-400">*</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Image Preview Box */}
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-[#3d3220] bg-[#1a1611] shrink-0 group shadow-inner">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_JEWELLERY_IMAGES[0].url;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#736342]">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-[#e5c158] font-bold underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Upload Tabs */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex gap-2 border-b border-[#241e17] pb-1.5">
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      imageTab === 'upload'
                        ? 'bg-[#241e15] text-[#e5c158] border border-[#d4af37]/40'
                        : 'text-[#8c7a4f] hover:text-[#d8cca8]'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('presets')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      imageTab === 'presets'
                        ? 'bg-[#241e15] text-[#e5c158] border border-[#d4af37]/40'
                        : 'text-[#8c7a4f] hover:text-[#d8cca8]'
                    }`}
                  >
                    Sample Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      imageTab === 'url'
                        ? 'bg-[#241e15] text-[#e5c158] border border-[#d4af37]/40'
                        : 'text-[#8c7a4f] hover:text-[#d8cca8]'
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {imageTab === 'upload' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#e5c158] bg-[#241e15]'
                        : 'border-[#2d251a] hover:border-[#8c7a4f] bg-[#16120d]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <Upload className="w-5 h-5 mx-auto text-[#8c7a4f] mb-1" />
                    <p className="text-xs text-[#d8cca8] font-medium">
                      Click to upload or drag & drop cover image
                    </p>
                    <p className="text-[10px] text-[#736342] mt-0.5">
                      PNG, JPG, WEBP up to 5MB
                    </p>
                  </div>
                )}

                {imageTab === 'presets' && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {PRESET_JEWELLERY_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCoverImage(preset.url)}
                        className={`relative rounded-lg overflow-hidden border h-14 group transition-all ${
                          coverImage === preset.url
                            ? 'border-[#e5c158] ring-2 ring-[#e5c158]/50'
                            : 'border-[#2d251a] hover:border-[#8c7a4f]'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white p-0.5 truncate text-center">
                          {preset.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {imageTab === 'url' && (
                  <div className="pt-1">
                    <input
                      type="url"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 rounded-xl bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Title & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#e5c158] uppercase tracking-wider mb-1">
                Product Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pearl Petal Bloom Earrings"
                className="w-full px-3 py-2 rounded-xl bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#e5c158] uppercase tracking-wider">
                  SKU <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateSku}
                  className="text-[10px] text-[#e5c158] hover:underline flex items-center gap-0.5"
                >
                  <Sparkles className="w-2.5 h-2.5" /> Auto
                </button>
              </div>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. LK-EAR-001"
                className="w-full px-3 py-2 rounded-xl bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] font-mono placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* 3. Category & Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#e5c158] uppercase tracking-wider mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] focus:outline-none focus:border-[#d4af37] mb-2"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="OTHER">Other / Custom Category...</option>
              </select>

              {category === 'OTHER' && (
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category (e.g. Luxury Brooches)"
                  className="w-full px-3 py-2 rounded-xl bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#e5c158] uppercase tracking-wider mb-1">
                Material / Finish
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 18K Gold Plated Brass, Zircon"
                className="w-full px-3 py-2 rounded-xl bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* 4. Pricing & Inventory */}
          <div className="p-4 rounded-xl bg-[#16120d] border border-[#241e17] space-y-3">
            <h3 className="text-xs font-semibold text-[#e5c158] uppercase tracking-wider flex items-center justify-between">
              <span>Pricing & Stock Inventory</span>
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#3d2e14] text-[#e5c158] border border-[#d4af37]/40 text-[10px] font-bold">
                  {discountPercent}% DISCOUNT
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#a39882] mb-1 font-medium">
                  MRP (Original Price)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7a4f] font-bold">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="400"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#1c1813] border border-[#2d251a] text-[#f3e7c4] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#e5c158] mb-1 font-semibold">
                  Sale Price <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e5c158] font-bold">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="149"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#1c1813] border border-[#d4af37]/60 text-[#e5c158] font-bold focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a39882] mb-1 font-medium">
                  Stock Quantity <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="20"
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1813] border border-[#2d251a] text-[#f3e7c4] font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>

          {/* 5. Product Badges Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#e5c158] uppercase tracking-wider mb-1.5">
              Badges / Promotion Tags
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {PRESET_BADGES.map((b) => {
                const isSelected = badges.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBadge(b)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? b === 'Bestseller'
                          ? 'bg-[#7c5310] text-[#ffdf88] border border-[#d4af37]'
                          : 'bg-[#4c2d77] text-[#d6bbfb] border border-[#8b5cf6]'
                        : 'bg-[#18140f] text-[#8c7a4f] border border-[#2d251a] hover:border-[#8c7a4f]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{b}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom badge input */}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomBadge();
                  }
                }}
                placeholder="Add custom badge (e.g. Handmade)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37]"
              />
              <button
                type="button"
                onClick={addCustomBadge}
                className="px-3 py-1.5 rounded-lg bg-[#241e15] border border-[#3b3223] text-[#e5c158] font-medium hover:bg-[#30281b]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 6. Description */}
          <div>
            <label className="block text-xs font-semibold text-[#e5c158] uppercase tracking-wider mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Exquisite handcrafted jewellery piece designed for timeless elegance..."
              className="w-full px-3 py-2 rounded-xl bg-[#16120d] border border-[#2d251a] text-[#f3e7c4] placeholder:text-[#736342] focus:outline-none focus:border-[#d4af37] resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#241e17] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#1c1813] border border-[#2d251a] text-[#a39882] hover:text-[#f3e7c4] hover:bg-[#252019] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-product-btn"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-[#e5c158] hover:bg-[#f0cf6a] text-[#0c0a09] font-bold shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#0c0a09]" />
              <span>{isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
