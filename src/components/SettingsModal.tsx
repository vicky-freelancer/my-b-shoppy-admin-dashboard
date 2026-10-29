import React, { useState } from 'react';
import { AppSettings } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { X, Save, Database, Sliders, Store, Bell, Check, Sparkles, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onSeedData: () => Promise<void>;
  isSeeding?: boolean;
  onOpenSqlSetup?: () => void;
}

const CURRENCY_OPTIONS = [
  { symbol: '$', label: 'USD ($) - US Dollar' },
  { symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { symbol: '£', label: 'GBP (£) - British Pound' },
  { symbol: '€', label: 'EUR (€) - Euro' },
  { symbol: 'AED ', label: 'AED (د.إ) - UAE Dirham' },
  { symbol: 'CAD $', label: 'CAD ($) - Canadian Dollar' },
  { symbol: 'SAR ', label: 'SAR (﷼) - Saudi Riyal' },
  { symbol: 'PKR ', label: 'PKR (₨) - Pakistani Rupee' },
  { symbol: 'PHP ₱', label: 'PHP (₱) - Philippine Peso' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onSeedData,
  isSeeding = false,
  onOpenSqlSetup,
}) => {
  const [appName, setAppName] = useState(settings.appName);
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [enableSoundAlerts, setEnableSoundAlerts] = useState(settings.enableSoundAlerts);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(settings.autoRefreshInterval);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      appName: appName.trim() || 'COD Admin Dashboard',
      companyName: companyName.trim() || 'Logistics HQ',
      currencySymbol: currencySymbol,
      supportPhone: supportPhone.trim(),
      supportEmail: supportEmail.trim(),
      enableSoundAlerts: enableSoundAlerts,
      autoRefreshInterval: Number(autoRefreshInterval),
      defaultFilterStatus: settings.defaultFilterStatus,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        id="settings-modal"
        className="bg-[#f8fafc] w-full max-w-lg rounded-2xl shadow-2xl border border-black overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 text-[#1e293b]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-black flex items-center justify-between bg-[#f8fafc]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#a16207] text-[#ffffff] shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">Dashboard Settings</h2>
              <p className="text-xs text-[#475569]">Configure application name, currency, and Supabase integration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#475569] hover:text-[#0f172a] rounded-lg hover:bg-[#f1f5f9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* App Branding */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#a16207]" />
              Brand & Application Identity
            </h3>

            <div>
              <label className="block text-[#334155] font-semibold mb-1">
                Application Name <span className="text-[#475569] font-normal">(Displayed in Navbar & Header)</span>
              </label>
              <input
                type="text"
                id="setting-app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. COD Admin Dashboard"
                className="w-full px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#0f172a] placeholder:text-[#475569] focus:outline-none focus:border-[#a16207] font-medium"
              />
              <p className="text-[11px] text-[#475569] mt-1">
                Customize this to match your store, warehouse, or logistics brand.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#334155] font-semibold mb-1">
                  Company / Store Title
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Logistics"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#0f172a] placeholder:text-[#475569] focus:outline-none focus:border-[#a16207]"
                />
              </div>

              <div>
                <label className="block text-[#334155] font-semibold mb-1">
                  Currency Symbol & Format
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#0f172a] focus:outline-none focus:border-[#a16207] font-medium"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.symbol} value={opt.symbol} className="bg-[#ffffff] text-[#0f172a]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact details for WhatsApp and Receipts */}
          <div className="space-y-3 pt-3 border-t border-black">
            <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
              Customer Support & Packing Slips
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#334155] font-medium mb-1">Support Phone</label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+1 (800) 555-0199"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#0f172a] placeholder:text-[#475569] font-mono focus:outline-none focus:border-[#a16207]"
                />
              </div>

              <div>
                <label className="block text-[#334155] font-medium mb-1">Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="orders@yourstore.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#0f172a] placeholder:text-[#475569] focus:outline-none focus:border-[#a16207]"
                />
              </div>
            </div>
          </div>

          {/* Dashboard Preferences */}
          <div className="space-y-3 pt-3 border-t border-black">
            <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#a16207]" />
              Live Refresh & Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#334155] font-medium mb-1">Auto-Refresh Interval</label>
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black bg-[#ffffff] text-[#0f172a] focus:outline-none focus:border-[#a16207]"
                >
                  <option value={0} className="bg-[#ffffff] text-[#0f172a]">Manual Only (Off)</option>
                  <option value={15} className="bg-[#ffffff] text-[#0f172a]">Every 15 Seconds</option>
                  <option value={30} className="bg-[#ffffff] text-[#0f172a]">Every 30 Seconds</option>
                  <option value={60} className="bg-[#ffffff] text-[#0f172a]">Every 1 Minute</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-black bg-[#ffffff]">
                <span className="text-[#334155] font-medium">Sound Notifications</span>
                <input
                  type="checkbox"
                  checked={enableSoundAlerts}
                  onChange={(e) => setEnableSoundAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-[#a16207] focus:ring-0 cursor-pointer accent-[#a16207]"
                />
              </div>
            </div>
          </div>

          {/* Supabase Connection Details & Sample Seed */}
          <div className="space-y-3 pt-3 border-t border-black">
            <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#a16207]" />
              Supabase Connection & Database
            </h3>

            <div className="p-3 bg-[#ffffff] rounded-xl border border-black space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#475569] font-medium">Supabase Host</span>
                <span className="font-mono text-[#0f172a] font-semibold truncate max-w-[220px]">
                  {SUPABASE_URL.replace('https://', '')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#475569] font-medium">Target Tables</span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold">
                  <span className="bg-[#e2e8f0] text-[#a16207] px-1.5 py-0.5 rounded border border-[#a16207]/30">orders</span>
                  <span className="bg-[#e2e8f0] text-[#a16207] px-1.5 py-0.5 rounded border border-[#a16207]/30">products</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#475569] font-medium">Connection Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live & Connected
                </span>
              </div>
            </div>

            {onOpenSqlSetup && (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-semibold text-[#0f172a]">Products Table SQL Schema</p>
                  <p className="text-[11px] text-[#475569]">View and copy SQL migration script for Supabase</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenSqlSetup}
                  className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-[#e2e8f0] text-[#a16207] font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-black"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>View SQL</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-semibold text-[#0f172a]">Seed Database with COD Orders</p>
                <p className="text-[11px] text-[#475569]">Insert 10 sample Cash-on-Delivery test orders into Supabase</p>
              </div>
              <button
                type="button"
                id="seed-supabase-btn"
                onClick={onSeedData}
                disabled={isSeeding}
                className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-[#e2e8f0] text-[#0f172a] font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 border border-black"
              >
                {isSeeding ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#a16207]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#a16207]" />
                )}
                <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-black flex items-center justify-between">
            {savedSuccess ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs animate-in fade-in">
                <Check className="w-4 h-4" />
                Saved successfully!
              </span>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-black text-[#334155] hover:bg-[#f1f5f9] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-settings-btn"
                className="px-5 py-2 rounded-xl bg-[#a16207] text-[#ffffff] font-bold hover:bg-[#854d0e] flex items-center gap-2 transition-all shadow-lg shadow-[#d97706]/20 active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
