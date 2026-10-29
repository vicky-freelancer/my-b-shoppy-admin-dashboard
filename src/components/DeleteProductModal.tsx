import React from 'react';
import { Product } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: string | number) => Promise<void>;
  currencySymbol?: string;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  currencySymbol = '₹',
}) => {
  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#f8fafc] border border-[#fecaca] w-full max-w-md rounded-2xl shadow-2xl p-6 text-[#334155] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-black">
          <div className="flex items-center gap-2.5 text-rose-600 font-serif font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span>Delete Product</span>
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
            Are you sure you want to permanently delete this product from your inventory?
          </p>

          <div className="p-3 rounded-xl bg-[#f8fafc] border border-black flex items-center gap-3">
            <img
              src={product.cover_image}
              alt={product.title}
              className="w-12 h-12 rounded-lg object-cover border border-black"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-[#0f172a] truncate">{product.title}</h4>
              <p className="text-[11px] font-mono text-[#475569] mt-0.5">SKU: {product.sku}</p>
              <p className="text-[11px] text-[#a16207] font-bold mt-0.5">
                {currencySymbol} {product.sale_price} &bull; {product.quantity} in stock
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#475569]">
            This action will remove the product from your catalog and active orders product pickers.
          </p>
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
            id="confirm-delete-product-btn"
            onClick={async () => {
              await onConfirm(product.id);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-200 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
};
