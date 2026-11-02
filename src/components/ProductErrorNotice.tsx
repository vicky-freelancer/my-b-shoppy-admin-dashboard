import React from 'react';
import { AlertCircle, Database } from 'lucide-react';

export function ProductErrorNotice({ error, mariaDbMode, onOpenSqlSetup }: { error: string; mariaDbMode: boolean; onOpenSqlSetup?: () => void }) {
  return (
    <div role="alert" className="p-3.5 rounded-xl bg-[#fef2f2] border border-rose-200 text-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-rose-800">{mariaDbMode ? 'Could not save product' : 'Database Storage Notice'}</p>
          <p className="text-[11px] text-rose-700/90 break-words mt-0.5">{error}</p>
        </div>
      </div>
      {!mariaDbMode && onOpenSqlSetup && (
        <button type="button" onClick={onOpenSqlSetup} className="px-3 py-1.5 rounded-lg bg-[#fef2f2] hover:bg-[#fee2e2] text-[#a16207] border border-[#fecaca] font-medium text-[11px] flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors">
          <Database className="w-3.5 h-3.5 text-[#a16207]" />
          <span>Fix Supabase Table</span>
        </button>
      )}
    </div>
  );
}
