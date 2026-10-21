import type { Cabin, GeneratorSettings, Subscriber, Transaction } from './App';
import type { Invoice } from './accounting';
export interface GeneratorData {
  closedThrough?: Record<string, string>;
  ledgerVersion: 2;
  invoices: Invoice[];
  openingCredits: Record<string, number>;
  settings: GeneratorSettings;
  cabins: Cabin[];
  subscribers: Subscriber[];
  transactions: Transaction[];
}
export const emptyData = (): GeneratorData => ({
  ledgerVersion:2, invoices:[], openingCredits:{},
  settings: { totalCapacityAmps: 0, pricePerAmpere: 0, secretBackdoorCode: '1001' },
  cabins: [], subscribers: [], transactions: [],
});
export const STORAGE_LIMIT = 800000;
export const storageBytes = (data: GeneratorData) => new TextEncoder().encode(JSON.stringify(data)).length;
export function checkWrite(currentRevision: number, expectedRevision: number, data: GeneratorData) {
  if (currentRevision !== expectedRevision) throw new Error('تغيرت البيانات على جهاز آخر. أعد تحميل الصفحة قبل إعادة التعديل.');
  if (storageBytes(data) > STORAGE_LIMIT) throw new Error('بلغت البيانات حد الصفحة السحابية. تواصل مع مسؤول النظام لتوسعة التخزين.');
}
