import type {GeneratorSettings} from './App';
export const accessCode = (settings:GeneratorSettings) => settings.loginCode ?? '19991';
export function validateCodeChange(settings:GeneratorSettings,oldCode:string,newCode:string,confirmation:string) {
  if(!oldCode && !newCode && !confirmation) return '';
  if(oldCode!==accessCode(settings)) return 'رمز الدخول الحالي غير صحيح';
  if(!/^\d{4,12}$/.test(newCode)) return 'الرمز الجديد يجب أن يتكون من 4 إلى 12 رقمًا';
  if(newCode!==confirmation) return 'تأكيد الرمز الجديد غير مطابق';
  return '';
}
