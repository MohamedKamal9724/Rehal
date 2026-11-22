import type { Rate, Supplier, Currency, OccupancyBasis } from '../types';
export function parseCsv(text:string):string[][] {
 const rows:string[][]=[]; let row:string[]=[];let cell='';let quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('علامة اقتباس غير مكتملة في CSV.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
}
export function importRateCsv(text:string,suppliers:Supplier[],workspaceId:string):Rate[]{
 const [rawHeader,...rows]=parseCsv(text.replace(/^\uFEFF/,''));
 const expected=['supplierId','serviceName','city','occupancyBasis','currency','netCost','validityStart','validityEnd'];
 if(!rawHeader||expected.some(h=>!rawHeader.includes(h)))throw new Error('أعمدة CSV غير مكتملة. استخدم القالب المحدد.');
 if(!rows.length||rows.length>1000)throw new Error('الملف يجب أن يحتوي على 1 إلى 1000 صف.');
 return rows.map((row,i)=>{const get=(k:string)=>(row[rawHeader.indexOf(k)]||'').trim();const supplier=suppliers.find(s=>s.id===get('supplierId')&&s.workspaceId===workspaceId);if(!supplier)throw new Error(`الصف ${i+2}: المورد غير موجود في الشركة.`);
 const cost=Number(get('netCost'));const currency=get('currency');const occupancy=get('occupancyBasis');const start=get('validityStart');const end=get('validityEnd');const date=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!get('serviceName')||!get('city')||!get('netCost')||!Number.isFinite(cost)||cost<0||!['EGP','USD','EUR','GBP','RUB','SAR'].includes(currency)||!['single','double','triple','per_person','per_group','per_vehicle'].includes(occupancy)||!date(start)||!date(end)||end<start)throw new Error(`الصف ${i+2}: راجع الخدمة والعملة والسعر والتواريخ والإشغال.`);
 return {id:crypto.randomUUID(),workspaceId,supplierId:supplier.id,supplierName:supplier.name,supplierType:supplier.type,serviceName:get('serviceName'),city:get('city'),occupancyBasis:occupancy as OccupancyBasis,currency:currency as Currency,netCost:cost,validityStart:start,validityEnd:end,seasonIds:[],nationalityTier:'all',version:1,updatedAt:new Date().toISOString()};
 });
}
