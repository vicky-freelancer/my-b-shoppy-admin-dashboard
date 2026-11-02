// Local migration adapter. Supabase remains intact when this explicit switch is off.
export const mariaDbMode=!!import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_CATALOG_SOURCE==='mariadb' || (typeof window!=='undefined'&&window.location.hostname==='admin.mybshoppy.com');
let csrf='';
function base(){
  const configured=(import.meta.env?.VITE_API_BASE_URL||import.meta.env?.VITE_ADMIN_API_URL||import.meta.env?.VITE_API_URL||'').replace(/\/+$/,'');
  if(configured)return configured;
  if(window.location.hostname==='admin.mybshoppy.com')return 'https://api.mybshoppy.com';
  if(['localhost','127.0.0.1'].includes(window.location.hostname))return 'http://localhost:5000';
  throw new Error('The administration API is not configured.');
}
export async function mariaAuth(action:'login'|'session'|'logout',body?:unknown){
  if(action==='logout'&&!csrf)await mariaAuth('session');
  const response=await fetch(base()+'/api/admin/'+action,{method:action==='session'?'GET':'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json',...(csrf?{'x-csrf-token':csrf}:{})},body:body?JSON.stringify(body):undefined});
  const result=await response.json();if(!response.ok)throw Object.assign(new Error(result.error||result.code||'Sign-in unavailable'),{status:response.status});if(action==='logout'&&result.success!==true)throw new Error('Unable to sign out. Please try again.');csrf=result.csrfToken||'';return result;
}
export async function mariaRequest(path:string,method='GET',body?:unknown){
  if(method!=='GET'&&!csrf)await mariaAuth('session');
  const form=body instanceof FormData;
  const response=await fetch(base()+'/api/v1/admin/'+path,{method,credentials:'include',cache:'no-store',headers:{...(!form?{'Content-Type':'application/json'}:{}),...(csrf?{'x-csrf-token':csrf}:{})},body:body?(form?body:JSON.stringify(body)):undefined});
  const result=await response.json();if(!response.ok)throw new Error((typeof result.message==='string'&&result.message)||(typeof result.error==='string'&&result.error)||(typeof result.code==='string'&&result.code)||'The change was not saved.');return result;
}
export function mariaMedia(url:string){return url?.startsWith('/media/')?base()+url:url;}
export async function mariaProducts(){
  const products:any[]=[];
  for(let page=1;;page++){const result=await mariaRequest('products?pageSize=100&page='+page);products.push(...result.products);if(products.length>=result.count)break;if(!result.products.length)throw new Error('Incomplete catalog response');}
  return products.map(p=>({...p,cover_image:mariaMedia(p.cover_image),is_active:!!p.is_active}));
}
async function asset(value:string){
  if(value?.startsWith('data:')){
    if(!/^data:image\/(jpeg|png|webp);base64,/.test(value)||value.length>8*1024*1024)throw new Error('Upload a JPEG, PNG or WebP image up to 5MB.');
    const blob=await (await fetch(value)).blob();const form=new FormData();form.set('image',blob,'upload');return (await mariaRequest('media','POST',form)).asset.id;
  }
  const products=await mariaProducts();const existing=products.find(p=>p.cover_image===value||p.images?.some((image:any)=>mariaMedia(image.url)===value));if(existing?.cover_image===value&&existing?.image_asset_id)return existing.image_asset_id;const match=existing?.images?.find((image:any)=>mariaMedia(image.url)===value);if(match)return String(match.asset_id);
  const subcategories=(await mariaRequest('subcategories')).subcategories;const s=subcategories.find((s:any)=>mariaMedia(s.featured_image)===value);if(s)return String(s.featured_asset_id);
  throw new Error('Choose an uploaded image. External URL/preset imports are not enabled.');
}
const productFields=['row_version','title','sku','category','category_id','subcategory_id','subcategory','image_asset_id','image_asset_ids','mrp','sale_price','quantity','badges','slug','subtitle','original_price','badge','rating','reviews_count','stone','variants','in_stock','description','material'];
const subcategoryFields=['row_version','category_id','name','slug','featured_asset_id','is_active','sort_order'];
function payloadFields(source:any,fields:string[]){
  const payload:Record<string,unknown>={};
  for(const field of fields)if(source[field]!==undefined)payload[field]=source[field];
  // Media belongs in the upload request, never inside catalog JSON, including nested values.
  const check=(value:unknown):void=>{
    if((typeof value==='string'&&/^data:/i.test(value))||(typeof Blob!=='undefined'&&value instanceof Blob))throw new Error('Image data must be uploaded before saving.');
    if(Array.isArray(value))value.forEach(check);
    else if(value&&typeof value==='object')Object.values(value).forEach(check);
  };
  check(payload);
  return payload;
}
export async function mariaSaveProduct(input:any,pid?:string|number){
  try{
    const existing=pid?(await mariaProducts()).find(p=>String(p.id)===String(pid)):null;
    const merged={...existing,...input};
    merged.subcategory_id=merged.subcategory_id??null;
    if(Array.isArray(input.additional_images)){
      const values=[input.cover_image,...input.additional_images].filter(Boolean);
      if(values.length>10)throw new Error('Choose at most 10 product images.');
      merged.image_asset_ids=[];
      for(const value of values)merged.image_asset_ids.push(await asset(value));
      delete merged.image_asset_id;
    }else if(input.cover_image)merged.image_asset_id=await asset(input.cover_image);
    const product=(await mariaRequest('products'+(pid?'/'+encodeURIComponent(pid):''),pid?'PATCH':'POST',payloadFields(merged,productFields))).product;
    return {success:true,product:{...product,cover_image:mariaMedia(product.cover_image)}};
  }catch(e){return {success:false,error:e instanceof Error?e.message:'Product not saved'};}
}
export async function mariaSubcategories(){return (await mariaRequest('subcategories')).subcategories.map((s:any)=>({...s,featured_image:mariaMedia(s.featured_image)}));}
export async function mariaSaveSubcategory(input:any,sid?:string|number){
  try{const data=payloadFields({...input,featured_asset_id:await asset(input.featured_image)},subcategoryFields);const s=(await mariaRequest('subcategories'+(sid?'/'+sid:''),sid?'PATCH':'POST',data)).subcategory;return {success:true,subcategory:{...s,featured_image:mariaMedia(s.featured_image)}};}
  catch(e){return {success:false,error:e instanceof Error?e.message:'Subcategory not saved',isDatabaseError:true};}
}
export async function mariaAction(path:string,method:string,body?:unknown){try{const result=await mariaRequest(path,method,body);return {success:true,...result};}catch(e){return {success:false,error:e instanceof Error?e.message:'Change not saved'};}}
