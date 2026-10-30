import React, { useState } from 'react';
import { Order } from '../types';
import { AlertTriangle, Trash2, X, Package, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface DeleteOrderModalProps {
  order: Order | null;
  bulkOrderIds?: (string | number)[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmSingle: (orderId: string | number) => Promise<void>;
  onConfirmBulk?: (orderIds: (string | number)[]) => Promise<void>;
  currencySymbol?: string;
}

export const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
  order,
  bulkOrderIds = [],
  isOpen,
  onClose,
  onConfirmSingle,
  onConfirmBulk,
  currencySymbol = '₹',
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const isBulk = bulkOrderIds.length > 0;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (isBulk && onConfirmBulk) {
        await onConfirmBulk(bulkOrderIds);
      } else if (order) {
        await onConfirmSingle(order.id);
      }
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        id="delete-order-confirmation-modal"
        className="bg-[#f8fafc] border border-[#fecaca] w-full max-w-md rounded-2xl shadow-2xl p-4 sm:p-6 text-[#334155] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black">
          <div className="flex items-center gap-2.5 text-rose-600 font-serif font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span>{isBulk ? `Delete ${bulkOrderIds.length} Orders` : 'Delete Order'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-[#475569] hover:text-[#a16207] hover:bg-[#e2e8f0] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-3 text-xs">
          <p className="text-[#475569]">
            {isBulk
              ? `Are you sure you want to permanently delete these ${bulkOrderIds.length} selected orders?`
              : `Are you sure you want to permanently delete this Cash on Delivery order from your database?`}
          </p>

          {!isBulk && order && (
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-black space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-[#0f172a] text-xs">#{order.id}</span>
                  <h4 className="font-semibold text-[#0f172a] text-sm mt-0.5">{order.customer_name}</h4>
                  <p className="text-[11px] text-[#475569] font-mono">{order.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#a16207]">
                    {formatCurrency(order.amount || 0, currencySymbol)}
                  </span>
                  <p className="text-[10px] text-[#475569]">COD Amount</p>
                </div>
              </div>

              <div className="pt-2 border-t border-black flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569]">
                <span className="truncate max-w-[200px] text-[#334155]">{order.product_variant}</span>
                <span>Qty: {order.quantity}</span>
              </div>
            </div>
          )}

          {isBulk && (
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-black flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#e2e8f0] border border-black flex items-center justify-center text-[#a16207]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-[#0f172a] text-xs">
                  {bulkOrderIds.length} COD Orders Selected
                </p>
                <p className="text-[11px] text-[#475569] mt-0.5">
                  All selected records will be removed from your active orders list.
                </p>
              </div>
            </div>
          )}

          <p className="text-[11px] text-rose-700/80 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            ⚠️ This action cannot be undone. The order records will be permanently removed.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-black flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-[#f8fafc] border border-black text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] text-xs font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-delete-order-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-200 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : isBulk ? `Delete ${bulkOrderIds.length} Orders` : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
