export function whatsappGeneralLink(message:string) {
  const text=message.trim();
  return text ? 'https://wa.me/?text='+encodeURIComponent(text) : null;
}
export function whatsappPhone(value:string) {
  let digits=value.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[^0-9]/g,'');
  if(digits.startsWith('00')) digits=digits.slice(2);
  if(/^07\d{9}$/.test(digits)) digits='964'+digits.slice(1);
  else if(/^7\d{9}$/.test(digits)) digits='964'+digits;
  return /^[1-9]\d{7,14}$/.test(digits)&&digits!=='9647700000000'?digits:null;
}
export const DEFAULT_SUBSCRIPTION_MESSAGE = 'السلام عليكم {الاسم}\nكشف حساب اشتراك المولدة\nالكابينة: {الكابينة}\nالمجموع الكلي للحساب: {المجموع}\nالمسدد: {المسدد}\nالمتبقي: {المتبقي}\nالتاريخ والوقت: {التاريخ}';
export function whatsappAccountLink(phone:string,name:string,cabin:string,total:number,paid:number,remaining:number,now=new Date(),template=DEFAULT_SUBSCRIPTION_MESSAGE) {
  const number=whatsappPhone(phone);if(!number) return null;
  const money=(n:number)=>n.toLocaleString('ar-IQ')+' د.ع';
  const values:Record<string,string>={'الاسم':name,'الكابينة':cabin,'المجموع':money(total),'المسدد':money(paid),'المتبقي':money(remaining),'التاريخ':now.toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})};
  const text=(template.trim() || DEFAULT_SUBSCRIPTION_MESSAGE).replace(/\{(الاسم|الكابينة|المجموع|المسدد|المتبقي|التاريخ)\}/g,(_,key:string)=>values[key]);
  return 'https://wa.me/'+number+'?text='+encodeURIComponent(text);
}
