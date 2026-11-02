import React, { useState } from 'react';
import { mariaAction } from '../lib/mariaApi';

type CatalogAction = 'bootstrap' | 'publish' | 'draft' | 'archive';

export function MariaCatalogControls({ onChanged, products }: { onChanged: () => void; products: any[] }) {
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const selectedProduct = products.find(product => String(product.id) === selected);

  async function action(kind: CatalogAction) {
    if (pending || (kind !== 'bootstrap' && !selectedProduct)) return;
    setPending(true);
    setMessage('');
    try {
      const path = kind === 'bootstrap' ? 'categories/bootstrap' : `products/${encodeURIComponent(selected)}/${kind}`;
      const result = await mariaAction(path, 'POST');
      if (result.success) {
        setMessage(kind === 'bootstrap' ? 'Categories initialized.' : `Product ${kind === 'publish' ? 'published' : kind === 'draft' ? 'moved to draft' : 'archived'}.`);
        onChanged();
      } else {
        setMessage(result.error || 'The change was not saved.');
      }
    } finally {
      setPending(false);
    }
  }

  const buttonClass = 'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5" aria-label="Catalog publishing">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Catalog publishing</h2>
        <p className="mt-1 text-sm text-gray-600">New products are drafts until published. Checkout remains unavailable.</p>
      </div>
      <button type="button" className={buttonClass} disabled={pending} onClick={() => void action('bootstrap')}>Initialize ten categories</button>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-gray-700 sm:min-w-64">
          Product
          <select aria-label="Product to publish" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900" value={selected} disabled={pending} onChange={event => { setSelected(event.target.value); setMessage(''); }}>
            <option value="">Select product</option>
            {products.map(product => <option key={product.id} value={String(product.id)}>{product.title} — {product.archived_at ? 'Archived' : product.is_active ? 'Published' : 'Draft'}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedProduct || pending} onClick={() => void action('publish')}>Publish</button>
          <button type="button" className={buttonClass} disabled={!selectedProduct || pending} onClick={() => void action('draft')}>Move to draft</button>
          <button type="button" className={buttonClass} disabled={!selectedProduct || pending} onClick={() => void action('archive')}>Archive</button>
        </div>
      </div>
      {!products.length && <p className="text-sm text-gray-600">Add a product to manage its publishing status.</p>}
      <p role="status" className="text-sm text-gray-700">{pending ? 'Saving…' : message}</p>
    </section>
  );
}
