import React from 'react';
import { Subcategory } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteSubcategoryModalProps {
  subcategory: Subcategory | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string | number) => Promise<void>;
  productCount?: number;
}

export const DeleteSubcategoryModal: React.FC<DeleteSubcategoryModalProps> = ({
  subcategory,
  isOpen,
  onClose,
  onConfirm,
  productCount = 0,
}) => {
  if (!isOpen || !subcategory) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-[#f8fafc] border border-[#fecaca] w-full max-w-md rounded-2xl shadow-2xl p-6 text-[#334155] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-black">
          <div className="flex items-center gap-2.5 text-rose-600 font-serif font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span>Delete Subcategory</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#e2e8f0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs">
          <p className="text-[#475569]">
            Are you sure you want to permanently delete this subcategory?
          </p>

          <div className="p-3 rounded-xl bg-[#f8fafc] border border-black flex items-center gap-3">
            {subcategory.featured_image ? (
              <img
                src={subcategory.featured_image}
                alt={subcategory.name}
                className="w-12 h-12 rounded-lg object-cover border border-black"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg border border-black bg-[#e2e8f0]" />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-[#0f172a] truncate">{subcategory.name}</h4>
              <p className="text-[11px] font-mono text-[#475569] mt-0.5">
                {subcategory.category_name || subcategory.category_id}
              </p>
              <p className="text-[11px] text-[#a16207] font-bold mt-0.5">
                {productCount} linked product{productCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {productCount > 0 ? (
            <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              This subcategory still has products assigned. Reassign those products before deleting it
              so the catalogue is not broken.
            </p>
          ) : (
            <p className="text-[11px] text-[#475569]">
              Existing products are not affected. This only removes the subcategory from the
              storefront navigation.
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-black flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#f8fafc] border border-black text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={productCount > 0}
            onClick={async () => {
              try {
                await onConfirm(subcategory.id);
                onClose();
              } catch {
                // App surfaces the error toast; keep the dialog open for correction.
              }
            }}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-rose-200 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
};
