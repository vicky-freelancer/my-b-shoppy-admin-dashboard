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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#12100e] border border-[#3b2020] w-full max-w-md rounded-2xl shadow-2xl p-6 text-[#d8cca8] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#241e17]">
          <div className="flex items-center gap-2.5 text-rose-400 font-serif font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/40 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <span>Delete Product</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#8c7a4f] hover:text-[#e5c158] hover:bg-[#201a14]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs">
          <p className="text-[#c9b787]">
            Are you sure you want to permanently delete this product from your inventory?
          </p>

          <div className="p-3 rounded-xl bg-[#1c1813] border border-[#2d251a] flex items-center gap-3">
            <img
              src={product.cover_image}
              alt={product.title}
              className="w-12 h-12 rounded-lg object-cover border border-[#3b3223]"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-[#f3e7c4] truncate">{product.title}</h4>
              <p className="text-[11px] font-mono text-[#8c7a4f] mt-0.5">SKU: {product.sku}</p>
              <p className="text-[11px] text-[#e5c158] font-bold mt-0.5">
                {currencySymbol} {product.sale_price} &bull; {product.quantity} in stock
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#8c7a4f]">
            This action will remove the product from your catalog and active orders product pickers.
          </p>
        </div>

        <div className="pt-3 border-t border-[#241e17] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c1813] border border-[#2d251a] text-[#a39882] hover:text-[#f3e7c4] hover:bg-[#252019] text-xs font-medium"
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
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
};
