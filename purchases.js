// Currency amounts are stored as integer cents. Blank is unknown, never zero.
export function parseAmount(text) {
 const value=String(text??'').trim();
 if(!value)return null;
 if(!/^\d{1,7}(\.\d{1,2})?$/.test(value))throw Error('請填寫 0 到 9,999,999.99 元，最多兩位小數。');
 const [whole,fraction='']=value.split('.');
 return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export const validAmount=v=>v===null||(Number.isSafeInteger(v)&&v>=0&&v<=999999999);
export function validDate(value){if(value==='')return true;if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00');return !isNaN(d)&&d.getFullYear()===Number(value.slice(0,4))&&d.getMonth()+1===Number(value.slice(5,7))&&d.getDate()===Number(value.slice(8,10));}
export function normalize(s){if(!Array.isArray(s.purchases))s.purchases=[];return s;}
export function purchase(s,{itemId,id,amountCents,date,createdAt}){
 normalize(s);if(!validAmount(amountCents)||!validDate(date))throw Error('Invalid purchase');
 const item=s.items.find(i=>i.id===itemId);if(!item)throw Error('Missing item');
 // The transaction reads the latest state. A repeated submission cannot duplicate a purchase.
 if(s.purchases.some(p=>p.id===id)||(item.done&&item.activePurchaseId&&s.purchases.some(p=>p.id===item.activePurchaseId&&!p.voided)))return;
 const store=s.stores.find(x=>x.id===item.store);if(!store)throw Error('Missing store');
 s.purchases.push({id,itemId,name:item.name,qty:item.qty,storeId:store.id,storeName:store.name,note:item.note,amountCents,date,createdAt,voided:false});
 item.done=true;item.activePurchaseId=id;
}
export function voidPurchase(s,id){const record=s.purchases.find(p=>p.id===id);if(!record)return;record.voided=true;const item=s.items.find(i=>i.activePurchaseId===id);if(item){item.done=false;item.activePurchaseId=null;}}
export function recordsFor(s,{query='',month=''}={}){const q=query.trim().toLocaleLowerCase();return (s.purchases||[]).filter(p=>!p.voided&&(!month||(month==='unknown'?!p.date:p.date.startsWith(month)))&&(!q||`${p.name} ${p.storeName} ${p.note}`.toLocaleLowerCase().includes(q))).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));}
export function totals(records){return {cents:records.reduce((n,p)=>n+(p.amountCents??0),0),unknown:records.filter(p=>p.amountCents===null).length,count:records.length};}
export function mergeBackup(current,incoming){normalize(current);let conflicts=0,added=0;for(const key of ['stores','items','purchases']){const fields=key==='stores'?['name','icon','note','date']:key==='items'?['name','qty','store','note','favorite','done']:['itemId','name','qty','storeId','storeName','note','date','amountCents','voided'];for(const row of incoming[key]||[]){const old=current[key].find(x=>x.id===row.id);if(!old){current[key].push(structuredClone(row));added++;}else if(fields.some(f=>old[f]!==row[f]))conflicts++;}}current.demo=false;return {added,conflicts};}
