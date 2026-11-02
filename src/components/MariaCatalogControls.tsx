import React,{useEffect,useState} from 'react';
import {mariaProducts,mariaAction} from '../lib/mariaApi';
export function MariaCatalogControls({onChanged,products}:{onChanged:()=>void;products:any[]}){
 const [selected,setSelected]=useState(''),[message,setMessage]=useState('');

 async function action(kind:string){const r=await mariaAction(kind==='bootstrap'?'categories/bootstrap':'products/'+selected+'/'+kind,'POST');setMessage(r.success?'Catalog saved.':r.error||'Not saved');if(r.success){onChanged();}}
 return <section className="rounded-xl border bg-white p-4 space-y-3" aria-label="Catalog publishing"><h2>Catalog publishing</h2><p>New products are drafts until published. Checkout remains unavailable.</p><button onClick={()=>void action('bootstrap')}>Initialize ten categories</button><select aria-label="Product to publish" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.title} — {p.archived_at?'Archived':p.is_active?'Published':'Draft'}</option>)}</select>{['publish','draft','archive'].map(kind=><button key={kind} disabled={!selected} onClick={()=>void action(kind)}>{kind}</button>)}<p role="status">{message}</p></section>;
}
