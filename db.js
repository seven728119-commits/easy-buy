import {normalize,validAmount,validDate} from './purchases.js';
import {validMemo} from './memos.js';
const NAME = 'haohaomai-local-v1';
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const uid = () => crypto.randomUUID();
export function initial() {
 const stores = [{id:'market',name:'傳統市場',icon:'🥬',note:'新鮮蔬果、魚肉',date:today()},{id:'pxmart',name:'全聯福利中心',icon:'🛒',note:'日常補貨，一次買齊',date:today()},{id:'drugstore',name:'藥妝店',icon:'🧴',note:'日用品、保養用品',date:''}];
 const items = [['高麗菜','1 顆','market','挑小顆一點的',true],['紅蘿蔔','2 根','market','',false],['雞蛋','1 盒','market','',true],['鮮奶','1 瓶','pxmart','看一下保存期限',true],['抽取式衛生紙','1 串','pxmart','',true],['洗衣精','1 瓶','drugstore','補充包就好',false]].map(([name,qty,store,note,favorite])=>({id:uid(),name,qty,store,note,favorite,done:false}));
 return {schema:1,stores,items,purchases:[],memos:[],demo:true,large:false};
}
let db;
export async function openDB() { db = await new Promise((resolve,reject)=>{ const r = indexedDB.open(NAME,1); r.onupgradeneeded=()=>r.result.createObjectStore('data'); r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error); }); return read(); }
export async function read() { return new Promise((resolve,reject)=>{const t=db.transaction('data','readwrite'),s=t.objectStore('data'),r=s.get('root');let data;r.onsuccess=()=>{data=normalize(r.result || initial());if(!r.result)s.put(data,'root');};t.oncomplete=()=>resolve(data);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);}); }
export async function change(fn) { return new Promise((resolve,reject)=>{const t=db.transaction('data','readwrite'),s=t.objectStore('data');let next;const r=s.get('root');r.onsuccess=()=>{try{next=fn(normalize(r.result));s.put(next,'root');}catch(e){t.abort();reject(e);}};t.oncomplete=()=>resolve(next);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);}); }
export function validBackup(x) {
 if(!x || x.schema!==1 || !Array.isArray(x.stores) || !Array.isArray(x.items) || x.stores.length>200 || x.items.length>20000) return false;
 if(x.purchases!==undefined&&(!Array.isArray(x.purchases)||x.purchases.length>50000))return false;
 if(x.memos!==undefined&&(!Array.isArray(x.memos)||x.memos.length>20000||!x.memos.every(validMemo)||new Set(x.memos.map(m=>m.id)).size!==x.memos.length))return false;
 const str=(v,n)=>typeof v==='string'&&v.length<=n;
 if(x.purchases){if(new Set(x.purchases.map(p=>p.id)).size!==x.purchases.length)return false;if(!x.purchases.every(p=>str(p.id,100)&&str(p.itemId,100)&&str(p.name,120)&&str(p.qty,40)&&str(p.storeId,100)&&str(p.storeName,80)&&str(p.note,400)&&validAmount(p.amountCents)&&validDate(p.date)&&str(p.createdAt,40)&&Number.isFinite(Date.parse(p.createdAt))&&typeof p.voided==='boolean'))return false;}
 const ids = new Set(x.stores.map(s=>s.id));
 return ids.size===x.stores.length && new Set(x.items.map(i=>i.id)).size===x.items.length && x.stores.every(s=>str(s.id,100)&&str(s.name,80)&&s.name.trim()&&str(s.icon,12)&&str(s.note,200)&&str(s.date,10)&&(!s.date||/^\d{4}-\d{2}-\d{2}$/.test(s.date))) && x.items.every(i=>str(i.id,100)&&str(i.name,120)&&i.name.trim()&&str(i.qty,40)&&str(i.note,400)&&ids.has(i.store)&&typeof i.done==='boolean'&&typeof i.favorite==='boolean'&&(i.activePurchaseId===undefined||i.activePurchaseId===null||str(i.activePurchaseId,100)));
}
