import {validDate} from './purchases.js';

export const validTime=value=>typeof value==='string'&&(value===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(value));
export function validMemo(m){
 const str=(v,n)=>typeof v==='string'&&v.length<=n;
 return !!m&&str(m.id,100)&&!!m.id&&str(m.title,120)&&!!m.title.trim()&&str(m.place,120)&&str(m.note,400)&&validDate(m.date)&&validTime(m.time)&&(!m.time||!!m.date)&&typeof m.done==='boolean'&&typeof m.deleted==='boolean'&&str(m.createdAt,40)&&Number.isFinite(Date.parse(m.createdAt))&&str(m.updatedAt,40)&&Number.isFinite(Date.parse(m.updatedAt));
}
export function memoValues({title,place='',note='',date='',time=''}){
 const value={title:title.trim(),place:place.trim(),note:note.trim(),date,time};
 if(!value.title)throw Error('請先寫下要做什麼。');
 if(value.title.length>120||value.place.length>120||value.note.length>400)throw Error('內容太長，請簡短記下重點。');
 if(!validDate(date))throw Error('請選擇有效的日期，或按「日期先不訂」。');
 if(!validTime(time))throw Error('請選擇有效的時間，或按「時間先不訂」。');
 if(time&&!date)throw Error('有指定時間時，也請選擇哪一天。');
 return value;
}
export function saveMemo(state,{id,values,now,editing=false}){
 if(!Array.isArray(state.memos))state.memos=[];
 const value=memoValues(values),old=state.memos.find(m=>m.id===id);
 if(editing&&(!old||old.deleted))throw Error('這筆行程已移除，請關閉後重新新增。');
 if(old){if(editing)Object.assign(old,value,{updatedAt:now});return;}
 state.memos.push({id,...value,done:false,deleted:false,createdAt:now,updatedAt:now});
}
export function memoRecords(state,{filter='pending',query=''}={}){
 const q=query.trim().toLocaleLowerCase();
 return (state.memos||[]).filter(m=>!m.deleted&&(filter==='all'||m.done===(filter==='done'))&&(!q||`${m.title} ${m.place} ${m.note}`.toLocaleLowerCase().includes(q))).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'99:99').localeCompare(b.time||'99:99')||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
}
export function memoGroups(records,currentDate){
 const result=[];
 for(const [key,title,match] of [
  ['earlier','之前還沒完成',m=>!m.done&&m.date&&m.date<currentDate],
  ['today','今天的行程',m=>m.date===currentDate],
  ['upcoming','之後的安排',m=>m.date>currentDate],
  ['undated','還沒排日期',m=>!m.date],
  ['past','過去的紀錄',m=>m.done&&m.date&&m.date<currentDate]
 ]){const items=records.filter(match);if(items.length)result.push({key,title,items});}
 return result;
}
export function timeText(time){if(!time)return '時間未定';const [h,m]=time.split(':').map(Number);return `${h<12?'上午':'下午'} ${h%12||12}:${String(m).padStart(2,'0')}`;}
export function dayText(date,currentDate){if(!date)return '日期未定';if(date===currentDate)return '今天';const d=new Date(date+'T12:00:00');return `${date.slice(0,4)===currentDate.slice(0,4)?'':date.slice(0,4)+' 年 '}${d.getMonth()+1} 月 ${d.getDate()} 日（${'日一二三四五六'[d.getDay()]}）`;}
export function nextDate(date){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
