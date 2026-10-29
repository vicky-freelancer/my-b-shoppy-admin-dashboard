import React, { useEffect, useRef, useState } from 'react';
import { Category, Subcategory } from '../types';
import { X, Upload, Image as ImageIcon, AlertCircle, Check, Database, Loader2 } from 'lucide-react';

export interface SubcategoryFormValues {
  category_id: string;
  name: string;
  featured_image: string;
  is_active: boolean;
  sort_order: number;
}

interface SubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: SubcategoryFormValues) => Promise<void>;
  categories: Category[];
  editingSubcategory?: Subcategory | null;
  onOpenSqlSetup?: () => void;
  defaultCategoryId?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editingSubcategory,
  onOpenSqlSetup,
  defaultCategoryId,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number | ''>(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingSubcategory) {
      setCategoryId(editingSubcategory.category_id || '');
      setName(editingSubcategory.name || '');
      setFeaturedImage(editingSubcategory.featured_image || '');
      setIsActive(editingSubcategory.is_active !== false);
      setSortOrder(editingSubcategory.sort_order ?? 0);
    } else {
      setCategoryId(defaultCategoryId || categories[0]?.id || '');
      setName('');
      setFeaturedImage('');
      setIsActive(true);
      setSortOrder(0);
    }
    setFormError(null);
    // Only reset the form when the modal opens or the edit target changes.
    // `categories` refreshes in the background and must not wipe typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingSubcategory?.id, defaultCategoryId]);

  useEffect(() => {
    if (!isOpen || editingSubcategory) return;
    setCategoryId((prev) => prev || defaultCategoryId || categories[0]?.id || '');
  }, [isOpen, editingSubcategory, categories, defaultCategoryId]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      setFormError('Please upload a JPG, JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFormError('Image is too large. Please upload a file under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFeaturedImage(event.target.result as string);
        setFormError(null);
      }
    };
    reader.onerror = () => setFormError('Could not read the selected image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!categoryId) {
      setFormError('Please select a parent category.');
      return;
    }
    if (!trimmedName) {
      setFormError('Subcategory name is required.');
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setFormError('Subcategory name must be between 2 and 80 characters.');
      return;
    }
    if (!featuredImage) {
      setFormError('A featured image is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        category_id: categoryId,
        name: trimmedName,
        featured_image: featuredImage,
        is_active: isActive,
        sort_order: Number(sortOrder) || 0,
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save subcategory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-[#f8fafc] border border-black w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-[#334155] my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-black flex items-center justify-between bg-[#ffffff]">
          <div>
            <h2 className="text-base font-serif font-bold text-[#a16207] uppercase tracking-wide">
              {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              {editingSubcategory
                ? 'Update the image, parent category or visibility.'
                : 'Group products under an existing parent category.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#e2e8f0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {formError && (
            <div className="p-3.5 rounded-xl bg-[#fef2f2] border border-rose-200 text-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-rose-800">Could not save subcategory</p>
                  <p className="text-[11px] text-rose-700/90 break-words mt-0.5">{formError}</p>
                </div>
              </div>
              {onOpenSqlSetup && (
                <button
                  type="button"
                  onClick={onOpenSqlSetup}
                  className="px-3 py-1.5 rounded-lg bg-[#fef2f2] hover:bg-[#fee2e2] text-[#a16207] border border-[#fecaca] font-medium text-[11px] flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Run Migration SQL</span>
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#a16207] uppercase tracking-wider mb-1">
              Parent Category <span className="text-rose-600">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-black text-[#0f172a] focus:outline-none focus:border-[#d97706]"
              required
            >
              <option value="">Select a parent category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-[11px] text-amber-700 mt-1.5">
                No categories found. Run the migration SQL to create and seed the categories table.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a16207] uppercase tracking-wider mb-1">
              Subcategory Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Pearl Drop Earrings"
              className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-black text-[#0f172a] placeholder:text-[#64748b] focus:outline-none focus:border-[#d97706]"
              required
            />
            <p className="text-[10px] text-[#64748b] mt-1">{name.trim().length}/80 characters</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a16207] uppercase tracking-wider mb-1">
              Featured Image <span className="text-rose-600">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-black bg-[#f1f5f9] shrink-0 group shadow-inner">
                {featuredImage ? (
                  <img
                    src={featuredImage}
                    alt="Subcategory preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#64748b]">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">No image</span>
                  </div>
                )}
                {featuredImage && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-[#a16207] font-bold underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#a16207] bg-[#fffbeb]'
                    : 'border-black hover:border-[#475569] bg-[#ffffff]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFileUpload(file);
                    event.target.value = '';
                  }}
                />
                <Upload className="w-5 h-5 mx-auto text-[#475569] mb-1" />
                <p className="text-xs text-[#334155] font-medium">
                  Click to upload or drag &amp; drop
                </p>
                <p className="text-[10px] text-[#64748b] mt-0.5">JPG, JPEG, PNG or WebP · max 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a16207] uppercase tracking-wider mb-1">
                Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive((prev) => !prev)}
                className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-[#f8fafc] border-black text-[#475569]'
                }`}
              >
                <span className="font-semibold">{isActive ? 'Active' : 'Inactive'}</span>
                <span
                  className={`w-8 h-4 rounded-full relative transition-colors ${
                    isActive ? 'bg-emerald-500/70' : 'bg-[#cbd5e1]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                      isActive ? 'left-4' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a16207] uppercase tracking-wider mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value === '' ? '' : Number(event.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-[#ffffff] border border-black text-[#0f172a] focus:outline-none focus:border-[#d97706]"
              />
              <p className="text-[10px] text-[#64748b] mt-1">Lower numbers appear first.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-black flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#f8fafc] border border-black text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-[#a16207] hover:bg-[#854d0e] text-[#ffffff] font-bold shadow-lg shadow-[#d97706]/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : editingSubcategory
                  ? 'Update Subcategory'
                  : 'Save Subcategory'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
