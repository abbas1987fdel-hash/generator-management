import type { Cabin, GeneratorSettings, Subscriber, Transaction } from './App';
export interface GeneratorData {
  settings: GeneratorSettings;
  cabins: Cabin[];
  subscribers: Subscriber[];
  transactions: Transaction[];
}
export const emptyData = (): GeneratorData => ({
  settings: { totalCapacityAmps: 0, pricePerAmpere: 0, secretBackdoorCode: '1001' },
  cabins: [], subscribers: [], transactions: [],
});
export function checkWrite(currentRevision: number, expectedRevision: number, data: GeneratorData) {
  if (currentRevision !== expectedRevision) throw new Error('تغيرت البيانات على جهاز آخر. أعد تحميل الصفحة قبل إعادة التعديل.');
  if (new TextEncoder().encode(JSON.stringify(data)).length > 800000) throw new Error('بلغت البيانات حد الصفحة السحابية. تواصل مع مسؤول النظام لتوسعة التخزين.');
}
