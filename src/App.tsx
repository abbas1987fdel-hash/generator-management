/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {accessCode,validateCodeChange} from './access';
import {whatsappAccountLink} from './whatsapp';
import { useGeneratorData } from './cloud';
import {ThemeToggle} from './ThemeToggle';
import {StorageMeter} from './StorageMeter';
import { currentMonth, financials } from './accounting';
import { 
  Zap, 
  KeyRound, 
  Gauge, 
  Coins, 
  X, 
  Check, 
  Sliders, 
  Eye, 
  EyeOff, 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  HelpCircle, 
  Plus, 
  Layers, 
  User, 
  ChevronLeft, 
  Sparkles, 
  Search, 
  ArrowRight, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Trash2, 
  Pencil, 
  Receipt, 
  RotateCcw, 
  BadgePercent, 
  Wallet, 
  ShieldCheck,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Generator Global Settings Interface
export interface GeneratorSettings {
  totalCapacityAmps: number;
  pricePerAmpere: number;
  secretBackdoorCode: string;
  loginCode?: string;
}

// Cabin Model Interface (With Password Protection)
export interface Cabin {
  id: string;
  name: string;
  managerName: string;
  capacityAmps: number;
  password?: string;
  createdAt: string;
}

// Payment Transaction Model Interface
export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  time: string;
}

// Subscriber / Customer Model Interface
export interface Subscriber {
  id: string;
  cabinId: string;
  name: string;
  amps: number;
  phone: string;
  roomOrHouse: string;
  paidAmount: number; // Sum of partial/full payments
}

function GeneratorApp({onLock}:{onLock:()=>void}) {
  const {data, change, update} = useGeneratorData();
  const {settings, cabins, subscribers, transactions} = data;
  const setSettings = (value: React.SetStateAction<GeneratorSettings>) => change('settings', value);
  const setCabins = (value: React.SetStateAction<Cabin[]>) => change('cabins', value);
  const setSubscribers = (value: React.SetStateAction<Subscriber[]>) => change('subscribers', value);
  const setTransactions = (value: React.SetStateAction<Transaction[]>) => change('transactions', value);

  // 5. Navigation & Cabin Dashboard State (3 Tabs)
  const [activeCabinId, setActiveCabinId] = useState<string | null>(null);
  const [cabinDashboardTab, setCabinDashboardTab] = useState<'overview' | 'customers' | 'overdue'>('overview');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // 6. Customer Profile Modal State (ملف الزبون)
  const [activeProfileCustomerId, setActiveProfileCustomerId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Subscriber | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerAmps, setEditCustomerAmps] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<Subscriber | null>(null);

  // 7. Payment Modal State (تسديد دفعة)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInputAmount, setPaymentInputAmount] = useState<string>('');

  // 8. Edit Transaction Modal State (تعديل دفعة)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editInputAmount, setEditInputAmount] = useState<string>('');

  // 9. Hidden Backdoor State (1001)
  const [oldCode,setOldCode]=useState('');
  const [newCode,setNewCode]=useState('');
  const [confirmCode,setConfirmCode]=useState('');
  const [settingsError,setSettingsError]=useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalForm, setModalForm] = useState<GeneratorSettings>(settings);

  // 10. Add Cabin State (Including Password)
  const [isAddCabinOpen, setIsAddCabinOpen] = useState(false);
  const [newCabinName, setNewCabinName] = useState('');
  const [newCabinManager, setNewCabinManager] = useState('');
  const [newCabinCapacity, setNewCabinCapacity] = useState<string>('');
  const [cabinSearchQuery, setCabinSearchQuery] = useState('');

  // 10.1 Edit & Delete Cabin from inside Settings
  const [editingCabin, setEditingCabin] = useState<Cabin | null>(null);
  const [editCabinName, setEditCabinName] = useState('');
  const [editCabinManager, setEditCabinManager] = useState('');
  const [editCabinCapacity, setEditCabinCapacity] = useState('');
  const [cabinToDelete, setCabinToDelete] = useState<Cabin | null>(null);

  // 11. Cabin Password Authentication Prompt State (قفل حماية الكابينات)

  // 12. Add Subscriber Modal inside Cabin
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubAmps, setNewSubAmps] = useState('5');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubAddress, setNewSubAddress] = useState('');

  // 12. General UI State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger floating toast feedback
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Save admin settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(modalForm.totalCapacityAmps) || modalForm.totalCapacityAmps < 0) return;
    if (!Number.isFinite(modalForm.pricePerAmpere) || modalForm.pricePerAmpere < 0) return;
    const codeError=validateCodeChange(settings,oldCode,newCode,confirmCode);
    if(codeError){setSettingsError(codeError);return;}

    setSettings({
      ...settings,
      loginCode:newCode || accessCode(settings),
      totalCapacityAmps: Number(modalForm.totalCapacityAmps),
      pricePerAmpere: Number(modalForm.pricePerAmpere),
      secretBackdoorCode: modalForm.secretBackdoorCode.trim(),
    });

    setIsSettingsOpen(false);
    triggerToast(`تم تحديث سعر الأمبير إلى ${Number(modalForm.pricePerAmpere).toLocaleString('ar-IQ')} د.ع`);
  };

  const getCustomerFinancials = (sub: Subscriber) => financials(data,sub.id);

  const settleAccount = (sub: Subscriber) => {
    const amount=financials(data,sub.id).remainingBalance;
    if(amount<=0)return;
    if(!window.confirm(`تصفير حساب ${sub.name}؟\nتأكيد استلام مبلغ ${amount.toLocaleString('ar-IQ')} د.ع وتسديد كامل المتبقي. سيُحفظ وصل في معاملات الزبون.`))return;
    const now=new Date();
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    const receipt:Transaction={id:'tx-'+crypto.randomUUID(),customerId:sub.id,amount,date,time:now.toLocaleTimeString('ar-IQ',{timeZone:'Asia/Baghdad',hour:'2-digit',minute:'2-digit'})};
    update(previous=>{
      if(!previous.subscribers.some(s=>s.id===sub.id)||financials(previous,sub.id).remainingBalance!==amount)throw new Error('تغير الرصيد. راجع الحساب قبل التسديد.');
      return {...previous,transactions:[receipt,...previous.transactions],subscribers:previous.subscribers.map(s=>s.id===sub.id?{...s,paidAmount:s.paidAmount+amount}:s)};
    });
    triggerToast('تم تسجيل التسديد الكامل في معاملات الزبون');
  };

  // Submit payment for active profile customer
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileCustomerId) return;
    const currentSub = subscribers.find((s) => s.id === activeProfileCustomerId);
    if (!currentSub) return;

    const amount = Number(paymentInputAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      triggerToast('يرجى إدخال مبلغ صحيح');
      return;
    }

    const { remainingBalance } = getCustomerFinancials(currentSub);
    const effectivePayment = Math.min(amount, remainingBalance);
    if (effectivePayment <= 0) return;
    const newRemaining = Math.max(0, remainingBalance - effectivePayment);

    // Create new transaction
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const newTx: Transaction = {
      id: 'tx-' + crypto.randomUUID(),
      customerId: currentSub.id,
      amount: effectivePayment,
      date: dateStr,
      time: timeStr,
    };

    // Update subscriber's paidAmount
    setSubscribers((prev) =>
      prev.map((s) => {
        if (s.id === currentSub.id) {
          const nextPaid = s.paidAmount + effectivePayment;
          return { ...s, paidAmount: nextPaid };
        }
        return s;
      })
    );

    // Append to transactions array
    setTransactions((prev) => [newTx, ...prev]);

    setIsPaymentModalOpen(false);
    setPaymentInputAmount('');

    // Check golden rule
    if (newRemaining === 0) triggerToast('تم التسديد بالكامل وحفظ الوصل');

    if (newRemaining > 0) {
      triggerToast(`تم تسديد ${effectivePayment.toLocaleString('ar-IQ')} د.ع (المتبقي: ${newRemaining.toLocaleString('ar-IQ')} د.ع)`);
    }
  };

  // Delete transaction (Restores debt / استرجاع الدين)
  const handleDeleteTransaction = (tx: Transaction) => {
    const currentSub = subscribers.find((s) => s.id === tx.customerId);
    if (!currentSub) return;

    // Remove transaction
    setTransactions((prev) => prev.filter((t) => t.id !== tx.id));

    // Reduce subscriber's paidAmount -> raises remaining debt!
    setSubscribers((prev) =>
      prev.map((s) => {
        if (s.id === currentSub.id) {
          const updatedPaid = Math.max(0, s.paidAmount - tx.amount);
          return { ...s, paidAmount: updatedPaid };
        }
        return s;
      })
    );

    triggerToast(`تم حذف الدفعة (${tx.amount.toLocaleString('ar-IQ')} د.ع) واسترجاع الدين`);
  };

  // Edit transaction amount
  const handleEditTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const newAmount = Number(editInputAmount);
    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      triggerToast('يرجى إدخال مبلغ صحيح');
      return;
    }

    const currentSub = subscribers.find((s) => s.id === editingTransaction.customerId);
    if (!currentSub) return;

    const delta = newAmount - editingTransaction.amount;

    // Update transaction
    setTransactions((prev) =>
      prev.map((t) => (t.id === editingTransaction.id ? { ...t, amount: newAmount } : t))
    );

    // Update subscriber
    setSubscribers((prev) =>
      prev.map((s) => {
        if (s.id === currentSub.id) {
          const updatedPaid = Math.max(0, s.paidAmount + delta);
          return { ...s, paidAmount: updatedPaid };
        }
        return s;
      })
    );

    setEditingTransaction(null);
    setEditInputAmount('');

    triggerToast('تم تعديل الدفعة بنجاح وتحديث الرصيد');
  };

  // Start editing customer from profile
  const handleStartEditCustomer = (sub: Subscriber) => {
    setEditingCustomer(sub);
    setEditCustomerName(sub.name);
    setEditCustomerAmps(String(sub.amps));
    setEditCustomerPhone(sub.phone);
    setEditCustomerAddress(sub.roomOrHouse);
  };

  // Save edited customer details
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const trimmedName = editCustomerName.trim();
    const parsedAmps = Number(editCustomerAmps);
    if (!trimmedName || !parsedAmps || parsedAmps <= 0) {
      triggerToast('يرجى التأكد من اسم الزبون وعدد الأمبيرات');
      return;
    }

    setSubscribers((prev) =>
      prev.map((s) => {
        if (s.id === editingCustomer.id) {
          return {
            ...s,
            name: trimmedName,
            amps: parsedAmps,
            phone: editCustomerPhone.trim(),
            roomOrHouse: editCustomerAddress.trim() || 'بدون تفاصيل إضافية',
          };
        }
        return s;
      })
    );

    triggerToast(`تم تحديث بيانات الزبون "${trimmedName}" بنجاح`);
    setEditingCustomer(null);
  };

  // Confirm and execute customer deletion
  const handleConfirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    if (data.invoices.some(i=>i.customerId===customerToDelete.id) || transactions.some(t=>t.customerId===customerToDelete.id)) { triggerToast('لا يمكن حذف مشترك لديه فواتير أو وصولات محفوظة'); return; }
    const deletedName = customerToDelete.name;
    const deletedId = customerToDelete.id;

    setSubscribers((prev) => prev.filter((s) => s.id !== deletedId));
    setTransactions((prev) => prev.filter((t) => t.customerId !== deletedId));

    setActiveProfileCustomerId(null);
    setCustomerToDelete(null);
    triggerToast(`تم حذف الزبون "${deletedName}" وسجلاته بنجاح`);
  };

  // Add new subscriber into active cabin
  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCabinId) return;

    const trimmedName = newSubName.trim();
    const parsedAmps = Number(newSubAmps);
    if (!trimmedName || !parsedAmps || parsedAmps <= 0) {
      triggerToast('يرجى التأكد من اسم المشترك وعدد الأمبيرات');
      return;
    }

    const newSub: Subscriber = {
      id: 'sub-' + crypto.randomUUID(),
      cabinId: activeCabinId,
      name: trimmedName,
      amps: parsedAmps,
      phone: newSubPhone.trim(),
      roomOrHouse: newSubAddress.trim() || 'بدون تفاصيل إضافية',
      paidAmount: 0, // Unpaid by default
    };

    update(previous=> {
      const month=currentMonth();
      return {...previous,subscribers:[newSub,...previous.subscribers],invoices:[...previous.invoices,{id:newSub.id+':'+month,customerId:newSub.id,month,amps:newSub.amps,rate:previous.settings.pricePerAmpere,amount:newSub.amps*previous.settings.pricePerAmpere}]};
    });
    setNewSubName('');
    setNewSubAmps('5');
    setNewSubPhone('');
    setNewSubAddress('');
    setIsAddSubOpen(false);
    triggerToast(`تم تسجيل ${trimmedName} (${parsedAmps} أمبير)`);
  };

  // Add new cabin with password protection
  const handleAddCabin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCabinName.trim();
    const trimmedManager = newCabinManager.trim();
    const parsedCapacity = Number(newCabinCapacity);


    if (!trimmedName || !trimmedManager || !parsedCapacity) {
      triggerToast('يرجى ملء جميع الحقول بصورة صحيحة');
      return;
    }


    const newCabin: Cabin = {
      id: 'cab-' + crypto.randomUUID(),
      name: trimmedName,
      managerName: trimmedManager,
      capacityAmps: parsedCapacity,

      createdAt: new Date().toISOString().split('T')[0],
    };

    setCabins((prev) => [newCabin, ...prev]);
    setNewCabinName('');
    setNewCabinManager('');
    setNewCabinCapacity('');
    setIsAddCabinOpen(false);
    triggerToast(`تمت إضافة ${trimmedName} بنجاح`);
  };

  // Start editing cabin from Settings
  const handleStartEditCabin = (cabin: Cabin) => {
    setIsSettingsOpen(false);
    setEditingCabin(cabin);
    setEditCabinName(cabin.name);
    setEditCabinManager(cabin.managerName);
    setEditCabinCapacity(String(cabin.capacityAmps));
  };

  // Save edited cabin
  const handleSaveEditCabin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCabin) return;
    const trimmedName = editCabinName.trim();
    const trimmedManager = editCabinManager.trim();
    const parsedCapacity = Number(editCabinCapacity);


    if (!trimmedName || !trimmedManager || !parsedCapacity || parsedCapacity <= 0) {
      triggerToast('يرجى التأكد من اسم الكابينة وسعتها');
      return;
    }


    setCabins((prev) =>
      prev.map((c) => {
        if (c.id === editingCabin.id) {
          return {
            ...c,
            name: trimmedName,
            managerName: trimmedManager,
            capacityAmps: parsedCapacity,

          };
        }
        return c;
      })
    );

    triggerToast(`تم تحديث بيانات الكابينة "${trimmedName}" بنجاح`);
    setEditingCabin(null);
  };

  // Confirm delete cabin
  const handleConfirmDeleteCabin = () => {
    if (!cabinToDelete) return;
    if (subscribers.some(s=>s.cabinId===cabinToDelete.id)) { triggerToast('لا يمكن حذف كابينة تحتوي مشتركين حفاظًا على سجلاتهم'); return; }
    const deletedName = cabinToDelete.name;
    const deletedId = cabinToDelete.id;

    // Remove cabin
    setCabins((prev) => prev.filter((c) => c.id !== deletedId));

    // Remove subscribers belonging to this cabin
    const deletedCustomerIds = new Set(
      subscribers.filter((s) => s.cabinId === deletedId).map((s) => s.id)
    );
    setSubscribers((prev) => prev.filter((s) => s.cabinId !== deletedId));
    setTransactions((prev) => prev.filter((t) => !deletedCustomerIds.has(t.customerId)));

    if (activeCabinId === deletedId) {
      setActiveCabinId(null);
      setActiveProfileCustomerId(null);
    }

    setCabinToDelete(null);
    triggerToast(`تم حذف كابينة "${deletedName}" مع كافة مشتركيها بنجاح`);
  };

  // Active Cabin & Active Customer Profile Lookups
  const activeCabin = cabins.find((c) => c.id === activeCabinId) || null;
  const activeCabinSubscribers = activeCabin ? subscribers.filter((s) => s.cabinId === activeCabin.id) : [];
  
  // Categorize subscribers by payment status dynamically
  const paidSubscribers = activeCabinSubscribers.filter((s) => getCustomerFinancials(s).isFullyPaid);
  const overdueSubscribers = activeCabinSubscribers.filter((s) => !getCustomerFinancials(s).isFullyPaid);

  // Filtered subscribers for the "الزبائن" tab
  const filteredCustomers = activeCabinSubscribers.filter((s) =>
    s.name.toLowerCase().includes(customerSearchQuery.trim().toLowerCase()) ||
    s.roomOrHouse.toLowerCase().includes(customerSearchQuery.trim().toLowerCase())
  );

  // Cabin drawn load calculations

  // Financials for this cabin
  const collectedCabinRevenue = activeCabinSubscribers.reduce((sum, s) => {
    const { effectivePaid } = getCustomerFinancials(s);
    return sum + effectivePaid;
  }, 0);
  const overdueCabinRevenue = activeCabinSubscribers.reduce((sum, s) => {
    const { remainingBalance } = getCustomerFinancials(s);
    return sum + remainingBalance;
  }, 0);

  // Global calculations
  const totalAllocatedAmps = cabins.reduce((acc, cab) => acc + cab.capacityAmps, 0);
  const remainingGenAmps = Math.max(0, settings.totalCapacityAmps - totalAllocatedAmps);

  // SVG Animated Donut Parameters

  const buildWhatsAppLink = (sub:Subscriber) => {
    const f=getCustomerFinancials(sub);
    return whatsappAccountLink(sub.phone,sub.name,cabins.find(c=>c.id===sub.cabinId)?.name??'',f.totalDue,f.effectivePaid,f.remainingBalance);
  };
  const whatsappButton = (sub:Subscriber) => {
    const link=buildWhatsAppLink(sub);
    return <button type="button" onClick={e=>{e.stopPropagation();if(link)window.open(link,'_blank','noopener,noreferrer');else triggerToast('أضف رقم هاتف صحيح للمشترك أولًا');}} className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 p-2 text-xs flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4"/>واتساب المشترك</button>;
  };
  const accountTotals = (list:Subscriber[]) => list.reduce((sum,sub)=>{const f=getCustomerFinancials(sub);return {total:sum.total+f.totalDue,paid:sum.paid+f.effectivePaid,remaining:sum.remaining+f.remainingBalance};},{total:0,paid:0,remaining:0});
  const totals=accountTotals(activeCabin?activeCabinSubscribers:subscribers);

  // Lookup for currently viewed customer profile
  const activeCustomer = subscribers.find((s) => s.id === activeProfileCustomerId) || null;
  const activeCustomerTxs = activeCustomer ? transactions.filter((t) => t.customerId === activeCustomer.id) : [];
  const activeCustomerFinancials = activeCustomer ? getCustomerFinancials(activeCustomer) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-500/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-emerald-400/30 whitespace-nowrap"
          >
            <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive Mobile Frame */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-950 relative border-x border-slate-900 shadow-2xl">
        
        <div dir="rtl" className="p-3 border-b border-slate-800 flex justify-end"><ThemeToggle /></div>
        {/* --- Top Header with Stealth Backdoor (1001) --- */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeCabin ? (
              <button
                onClick={() => {
                  setActiveCabinId(null);
                  setCabinDashboardTab('overview');
                  setCustomerSearchQuery('');
                  setActiveProfileCustomerId(null);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                <span>الكابينات</span>
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                <img src={import.meta.env.BASE_URL+'icon-192.png'} alt="شعار حسن الجنابي" className="w-9 h-9 rounded-xl"/>
              </div>
            )}

            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-relaxed break-words whitespace-normal">
                {activeCabin ? activeCabin.name : 'مولدة حسن كريم كاظم'}
              </h1>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{activeCabin ? `المسؤول: ${activeCabin.managerName}` : 'النظام قيد التشغيل'}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            <button aria-label="الإعدادات الرئيسية" className="p-2 rounded-xl bg-slate-800" onClick={()=>{setModalForm({...settings});setOldCode('');setNewCode('');setConfirmCode('');setSettingsError('');setIsSettingsOpen(true);}}><Sliders className="w-5 h-5"/></button>
            <button aria-label="قفل النظام" className="p-2 rounded-xl bg-slate-800" onClick={onLock}><Lock className="w-5 h-5"/></button>
          </div>
        </header>
        <section dir="rtl" className="m-4 p-4 rounded-2xl border border-amber-500/30 bg-slate-900 space-y-2">
          <h2 className="text-sm font-bold">المجموع الكلي للحساب — {activeCabin?'الكابينة':'جميع الكابينات'}</h2>
          <p className="text-2xl font-bold text-amber-400">{totals.total.toLocaleString('ar-IQ')} د.ع</p>
          <p className="text-xs text-slate-300">المسدد: {totals.paid.toLocaleString('ar-IQ')} · المتبقي: {totals.remaining.toLocaleString('ar-IQ')} د.ع</p>
          <p className="text-[10px] text-slate-500">حسب الفواتير والسجلات المحفوظة في النظام</p>
        </section>

        {/* ============================================================ */}
        {/* VIEW 1: CABIN DASHBOARD (لوحة تحكم الكابينة عند الاختيار)   */}
        {/* ============================================================ */}
        {activeCabin ? (
          <main className="flex-1 p-4 pb-6 space-y-4 overflow-y-auto">
            
            {/* Cabin Header Info Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>لوحة تحكم الكابينة</span>
                </div>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">
                  {activeCabin.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  الجابي: <span className="text-slate-200 font-medium">{activeCabin.managerName}</span>
                  <span className="mx-1.5 text-slate-600">·</span>
                  سعر الأمبير: <span className="text-emerald-400 font-mono-numbers font-semibold">{settings.pricePerAmpere.toLocaleString('ar-IQ')} د.ع</span>
                </p>
              </div>


            </div>

            {/* --- 3 Tabs Bar (الرئيسية / الزبائن / المتأخرون) --- */}
            <div className="bg-slate-900/80 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setCabinDashboardTab('overview')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cabinDashboardTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>الرئيسية</span>
              </button>

              <button
                onClick={() => setCabinDashboardTab('customers')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  cabinDashboardTab === 'customers'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>الزبائن</span>
                <span className={`text-[10px] font-mono-numbers px-1.5 py-0.2 rounded-full font-bold ${
                  cabinDashboardTab === 'customers' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {activeCabinSubscribers.length}
                </span>
              </button>

              <button
                onClick={() => setCabinDashboardTab('overdue')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
                  cabinDashboardTab === 'overdue'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>المتأخرون</span>
                {overdueSubscribers.length > 0 && (
                  <span className={`text-[10px] font-mono-numbers px-1.5 py-0.2 rounded-full font-bold ${
                    cabinDashboardTab === 'overdue' ? 'bg-slate-950 text-rose-300' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {overdueSubscribers.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {cabinDashboardTab === 'overview' && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Micro Stat Metric Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">إجمالي الزبائن</span>
                    <span className="text-xl font-bold font-mono-numbers text-slate-100 my-1">
                      {activeCabinSubscribers.length}
                    </span>
                    <span className="text-[9px] text-slate-400">مشترك بالكابينة</span>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center flex flex-col justify-between">
                    <span className="text-[10px] text-emerald-400/90 font-medium">المسددين</span>
                    <span className="text-xl font-bold font-mono-numbers text-emerald-400 my-1">
                      {paidSubscribers.length}
                    </span>
                    <span className="text-[9px] text-emerald-400/80">تم تصفير الحساب</span>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center flex flex-col justify-between">
                    <span className="text-[10px] text-rose-400/90 font-medium">المتأخرين</span>
                    <span className="text-xl font-bold font-mono-numbers text-rose-400 my-1">
                      {overdueSubscribers.length}
                    </span>
                    <span className="text-[9px] text-rose-400/80">عليهم متبقي</span>
                  </div>
                </div>

                {/* Revenue Overview */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">المحصل فعلياً:</span>
                    <span className="font-mono-numbers font-bold text-emerald-400">
                      {collectedCabinRevenue.toLocaleString('ar-IQ')} د.ع
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-800/60 pt-2">
                    <span className="text-slate-400">المتبقي تحت التحصيل:</span>
                    <span className="font-mono-numbers font-bold text-rose-400">
                      {overdueCabinRevenue.toLocaleString('ar-IQ')} د.ع
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setCabinDashboardTab('customers')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>عرض قائمة الزبائن وإدارة الوصولات</span>
                  </span>
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
              </motion.div>
            )}

            {/* TAB 2: CUSTOMERS TAB */}
            {cabinDashboardTab === 'customers' && (
              <motion.div
                key="tab-customers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                {/* Search Bar Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="ابحث باسم الزبون أو العنوان..."
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pr-10 pl-10 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  {customerSearchQuery && (
                    <button
                      onClick={() => setCustomerSearchQuery('')}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 text-xs"
                      aria-label="مسح البحث"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Subtitle & Quick Action Header */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-slate-400">
                    {customerSearchQuery ? (
                      <>النتائج: <span className="font-mono-numbers text-amber-400 font-bold">{filteredCustomers.length}</span> من أصل {activeCabinSubscribers.length}</>
                    ) : (
                      <>إجمالي المشتركين: <span className="font-mono-numbers text-slate-200 font-bold">{activeCabinSubscribers.length}</span></>
                    )}
                  </span>

                  <button
                    onClick={() => setIsAddSubOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>إضافة زبون</span>
                  </button>
                </div>

                {/* Customers List Cards */}
                {filteredCustomers.length === 0 ? (
                  <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
                    <Search className="w-8 h-8 text-slate-600 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-300">
                      {customerSearchQuery ? `لا توجد نتائج تطابق "${customerSearchQuery}"` : 'لا يوجد زبائن مسجلين'}
                    </h4>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredCustomers.map((sub) => {
                      const { totalDue, remainingBalance, isFullyPaid } = getCustomerFinancials(sub);

                      return (
                        <motion.div
                          key={sub.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setActiveProfileCustomerId(sub.id)}
                          className="group bg-slate-900/80 hover:bg-slate-900 active:bg-slate-850 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3.5 transition-all duration-150 cursor-pointer shadow-sm relative overflow-hidden"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <button type="button" disabled={isFullyPaid} onClick={e=>{e.stopPropagation();settleAccount(sub);}} className="float-left rounded-lg border border-emerald-500/30 bg-emerald-600/20 text-emerald-400 px-2 py-1 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed">تصفير الحساب</button>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-100 break-words whitespace-normal group-hover:text-amber-400 transition-colors">
                                  {sub.name}
                                </h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                                  isFullyPaid
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {isFullyPaid ? 'مسدد بالكامل' : `متبقي ${remainingBalance.toLocaleString('ar-IQ')} د.ع`}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                                <span className="font-mono-numbers text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">
                                  {sub.amps} أمبير
                                </span>
                                <span className="text-slate-600">·</span>
                                <span className="truncate text-slate-400 text-[11px]">{sub.roomOrHouse}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              {whatsappButton(sub)}
                              <div className="text-left bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
                                <span className="text-xs font-bold font-mono-numbers text-emerald-400 block">
                                  {totalDue.toLocaleString('ar-IQ')} د.ع
                                </span>
                                <span className="text-[9px] text-slate-400 block">
                                  مجموع الفواتير
                                </span>
                              </div>

                              <div className="w-7 h-7 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: OVERDUE TAB */}
            {cabinDashboardTab === 'overdue' && (
              <motion.div
                key="tab-overdue"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-rose-400" />
                      <span>قائمة الاشتراكات المتأخرة</span>
                    </span>
                    <p className="text-[11px] text-rose-200/70">
                      عدد المتأخرين: {overdueSubscribers.length} مشترك
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-rose-300/80 block">المبلغ المطلوب:</span>
                    <span className="text-sm font-bold font-mono-numbers text-rose-300">
                      {overdueCabinRevenue.toLocaleString('ar-IQ')} د.ع
                    </span>
                  </div>
                </div>

                {overdueSubscribers.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-200">
                      رائع! لا يوجد أي مشترك متأخر في هذه الكابينة
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      تم تسديد كافة المستحقات وتصفير الحسابات بنجاح.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {overdueSubscribers.map((sub) => {
                      const { remainingBalance } = getCustomerFinancials(sub);
                      return (
                        <div
                          key={sub.id}
                          className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 space-y-3 shadow-sm relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-100">
                                  {sub.name}
                                </h4>
                                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  متأخر
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                <span>{sub.roomOrHouse}</span>
                                <span className="text-slate-600">·</span>
                                <span className="font-mono-numbers text-amber-400 font-semibold">{sub.amps} أمبير</span>
                              </p>
                            </div>

                            <div className="text-left bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 shrink-0">
                              <span className="text-xs font-bold font-mono-numbers text-rose-400 block">
                                {remainingBalance.toLocaleString('ar-IQ')} د.ع
                              </span>
                              <span className="text-[9px] text-slate-400 block">المبلغ المتبقي</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                            <a
                              href={buildWhatsAppLink(sub) ?? undefined} onClick={e=>{if(!buildWhatsAppLink(sub)){e.preventDefault();triggerToast('أضف رقم هاتف صحيح للمشترك أولًا');}}}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                            >
                              <MessageCircle className="w-4 h-4 fill-white" />
                              <span>تذكير عبر واتساب</span>
                            </a>

                            <button
                              onClick={() => setActiveProfileCustomerId(sub.id)}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
                            >
                              <Wallet className="w-3.5 h-3.5 text-amber-400" />
                              <span>ملف الدفع</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </main>
        ) : (
          /* ============================================================ */
          /* VIEW 2: MAIN HOMEPAGE (قائمة الكابينات وشبكة التوزيع)         */
          /* ============================================================ */
          <main className="flex-1 p-4 pb-6 space-y-4 overflow-y-auto">
            {/* Top Capacity & Price Metrics Strip */}
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>سعة المولدة</span>
                  <Gauge className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-bold font-mono-numbers text-slate-100">
                    {settings.totalCapacityAmps}
                  </span>
                  <span className="text-xs text-slate-400 mr-1.5">أمبير</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
                  <span>المتبقي:</span>
                  <span className="font-mono-numbers text-emerald-400 font-semibold">{remainingGenAmps} أمبير</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>سعر الأمبير</span>
                  <Coins className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-bold font-mono-numbers text-emerald-400">
                    {settings.pricePerAmpere.toLocaleString('ar-IQ')}
                  </span>
                  <span className="text-xs text-slate-400 mr-1.5">د.ع</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
                  <span>الكابينات:</span>
                  <span className="font-mono-numbers text-amber-400 font-semibold">{cabins.length} كابينة</span>
                </div>
              </div>
            </section>

            {/* Cabins Section Header & Filter */}
            <section className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>كابينات التوزيع ({cabins.length})</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    اضغط على أي كابينة لفتح لوحة التحكم الخاصة بها
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                  <span className="font-mono-numbers text-amber-400 font-bold">{remainingGenAmps} A</span> متاح
                </div>
              </div>

              {/* Quick Search */}
              {cabins.length > 2 && (
                <div className="relative">
                  <input
                    type="text"
                    value={cabinSearchQuery}
                    onChange={(e) => setCabinSearchQuery(e.target.value)}
                    placeholder="بحث عن كابينة أو جابي..."
                    className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Cabins Vertical List */}
              <div className="space-y-2.5">
                {cabins
                  .filter((c) =>
                    c.name.toLowerCase().includes(cabinSearchQuery.toLowerCase()) ||
                    c.managerName.toLowerCase().includes(cabinSearchQuery.toLowerCase())
                  )
                  .map((cabin) => {
                    const cabinSubs = subscribers.filter((s) => s.cabinId === cabin.id);
                    const cabinTotals = accountTotals(cabinSubs);
                    const cabinOverdueCount = cabinSubs.filter((s) => !getCustomerFinancials(s).isFullyPaid).length;

                    return (
                      <motion.div
                        key={cabin.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setActiveCabinId(cabin.id);
                          setCabinDashboardTab('overview');setCustomerSearchQuery('');setActiveProfileCustomerId(null);
                        }}
                        className="group bg-slate-900/70 hover:bg-slate-900 active:bg-slate-850 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all duration-150 cursor-pointer shadow-sm relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                              <Layers className="w-5 h-5" />
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-amber-400 transition-colors">
                                  {cabin.name}
                                </h3>

                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">المسؤول: {cabin.managerName}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
                            <span className="text-slate-400 block">المجموع الكلي</span>
                            <strong className="text-amber-400 font-mono-numbers block mt-1 break-words">{cabinTotals.total.toLocaleString('ar-IQ')} د.ع</strong>
                          </div>
                          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
                            <span className="text-slate-400 block">المتبقي</span>
                            <strong className="text-emerald-400 font-mono-numbers block mt-1 break-words">{cabinTotals.remaining.toLocaleString('ar-IQ')} د.ع</strong>
                          </div>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">

                          
                          {cabinOverdueCount > 0 ? (
                            <span className="text-rose-400 font-semibold font-mono-numbers">
                              {cabinOverdueCount} متأخر
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">
                              الجميع مسدد
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </section>


          </main>
        )}



        {/* ============================================================ */}
        {/* CUSTOMER PROFILE & FINANCIAL OPERATIONS SHEET (ملف الزبون)    */}
        {/* ============================================================ */}
        <AnimatePresence>
          {activeCustomer && activeCustomerFinancials && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, y: 150 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 150 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
              >
                {/* Mobile drag handle */}
                <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto mt-2.5 sm:hidden" />

                {/* Profile Top Bar */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-100 truncate">{activeCustomer.name}</h3>
                      <p className="text-xs text-slate-400 truncate">{activeCustomer.roomOrHouse}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* زر قلم التعديل */}
                    <button
                      type="button"
                      onClick={() => handleStartEditCustomer(activeCustomer)}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                      title="تعديل بيانات الزبون"
                      aria-label="تعديل بيانات الزبون"
                    >
                      <Pencil className="w-4 h-4 stroke-[2.2]" />
                    </button>

                    {/* زر حاوية الحذف */}
                    <button
                      type="button"
                      onClick={() => setCustomerToDelete(activeCustomer)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="حذف الزبون"
                      aria-label="حذف الزبون"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.2]" />
                    </button>

                    <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

                    <button
                      type="button"
                      onClick={() => setActiveProfileCustomerId(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      aria-label="إغلاق ملف الزبون"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Profile Scrollable Content */}
                <div className="p-4 space-y-4 overflow-y-auto">

                  {/* Customer Quick Info Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                      <span className="text-slate-400">عدد الأمبيرات:</span>
                      <span className="font-bold font-mono-numbers text-amber-400 text-sm">{activeCustomer.amps} A</span>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                      <span className="text-slate-400">سعر الأمبير:</span>
                      <span className="font-mono-numbers text-slate-200">{settings.pricePerAmpere.toLocaleString('ar-IQ')} د.ع</span>
                    </div>
                  </div>

                  {whatsappButton(activeCustomer)}
                  {/* Central Financial Screen (المبلغ الباقي / الديون) */}
                  <div className={`p-5 rounded-3xl border text-center relative overflow-hidden transition-all ${
                    activeCustomerFinancials.isFullyPaid
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      {activeCustomerFinancials.isFullyPaid ? 'حالة الحساب المالي' : 'المبلغ الباقي / الديون المطلوبة'}
                    </span>

                    <div className="my-2">
                      <span className={`text-3xl font-extrabold font-mono-numbers ${
                        activeCustomerFinancials.isFullyPaid ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {activeCustomerFinancials.remainingBalance.toLocaleString('ar-IQ')}
                      </span>
                      <span className="text-sm font-semibold text-slate-400 mr-1.5">دينار عراقي</span>
                    </div>

                    {/* Status Pill */}
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border">
                      {activeCustomerFinancials.isFullyPaid ? (
                        <span className="text-emerald-400 flex items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم تصفير الحساب بالكامل (0 د.ع)</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1.5 border-rose-500/30 bg-rose-500/10">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>يوجد مبلغ متبقي قيد التحصيل</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>إجمالي الفواتير:</span>
                      <span className="font-mono-numbers text-slate-200 font-bold">
                        {activeCustomerFinancials.totalDue.toLocaleString('ar-IQ')} د.ع
                      </span>
                    </div>
                  </div>

                  {/* Prominent Action Button: Pay Installment (تسديد دفعة) */}
                  <div>
                    <button
                      onClick={() => {
                        setPaymentInputAmount(String(activeCustomerFinancials.remainingBalance));
                        setIsPaymentModalOpen(true);
                      }}
                      disabled={activeCustomerFinancials.isFullyPaid}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                        activeCustomerFinancials.isFullyPaid
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-[0.98] shadow-amber-500/20'
                      }`}
                    >
                      <Coins className="w-5 h-5 stroke-[2.2]" />
                      <span>{activeCustomerFinancials.isFullyPaid ? 'الحساب مسدد بالكامل' : 'تسديد دفعة مالية'}</span>
                    </button>
                  </div>

                  <section className="space-y-3 rounded-2xl bg-slate-900 p-4">
                    <h4 className="font-bold">الفواتير الشهرية — التسديد للأقدم أولاً</h4>
                    {activeCustomerFinancials.openingCredit > 0 && <p className="text-xs text-amber-300">رصيد تسديد سابق: {activeCustomerFinancials.openingCredit.toLocaleString('ar-IQ')} د.ع (وصولاته غير متوفرة في النسخة القديمة)</p>}
                    {activeCustomerFinancials.credit > 0 && <p>رصيد دائن: {activeCustomerFinancials.credit.toLocaleString('ar-IQ')} د.ع</p>}
                    {[...activeCustomerFinancials.invoices].reverse().map(invoice=><div key={invoice.id} className="border-b border-slate-700 pb-3 text-sm space-y-1">
                      <strong>{invoice.month}{invoice.opening?' — رصيد افتتاحي من النسخة السابقة':''}</strong>
                      <p>{invoice.amps} أمبير × {invoice.rate.toLocaleString('ar-IQ')} د.ع = {invoice.amount.toLocaleString('ar-IQ')} د.ع</p>
                      <p>المسدد: {invoice.paid.toLocaleString('ar-IQ')} · المتبقي: {invoice.remaining.toLocaleString('ar-IQ')} د.ع</p>
                    </div>)}
                    <p className="text-xs text-slate-400">تغيير السعر أو الأمبير يطبق على الفواتير الجديدة فقط. الوصولات تبقى بعد اكتمال التسديد.</p>
                  </section>
                  {/* Bottom Section: Transactions History (سجل المعاملات) */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-amber-400" />
                        <span>سجل الدفعات والوصولات ({activeCustomerTxs.length})</span>
                      </h4>
                      <span className="text-[10px] text-slate-500">حفظ فوري</span>
                    </div>

                    {activeCustomerTxs.length === 0 ? (
                      <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-1.5">
                        <Receipt className="w-6 h-6 text-slate-600 mx-auto" />
                        <p className="text-xs font-medium text-slate-400">
                          {activeCustomerFinancials.isFullyPaid 
                            ? 'لا توجد وصولات محفوظة'
                            : 'لا توجد دفعات مسجلة بعد لهذا الزبون'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeCustomerTxs.map((tx) => (
                          <div
                            key={tx.id}
                            className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm"
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold font-mono-numbers text-emerald-400">
                                  +{tx.amount.toLocaleString('ar-IQ')} د.ع
                                </span>
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                  وصل مقبوض
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono-numbers">
                                {tx.date} · {tx.time}
                              </p>
                            </div>

                            {/* Control Icons: Edit (Pencil) & Delete (Trash) */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  setEditingTransaction(tx);
                                  setEditInputAmount(String(tx.amount));
                                }}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                                title="تعديل قيمة الدفعة"
                                aria-label="تعديل الدفعة"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button (Deletes transaction and restores debt!) */}
                              <button
                                onClick={() => handleDeleteTransaction(tx)}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                title="حذف الدفعة واسترجاع الدين"
                                aria-label="حذف الدفعة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Record Payment Modal (نافذة تسديد دفعة) --- */}
        <AnimatePresence>
          {isPaymentModalOpen && activeCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-100">تسجيل دفعة نقدية</h3>
                  </div>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                      <span>المبلغ المدفوع (دينار عراقي)</span>
                      <span className="text-[10px] text-amber-400 font-mono-numbers">
                        الباقي: {activeCustomerFinancials?.remainingBalance.toLocaleString('ar-IQ')} د.ع
                      </span>
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={paymentInputAmount}
                        onChange={(e) => setPaymentInputAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-base font-mono-numbers text-emerald-400 font-bold focus:outline-none focus:border-amber-500 text-left"
                        dir="ltr"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        د.ع
                      </span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPaymentInputAmount(String(activeCustomerFinancials?.remainingBalance || 0))}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-amber-300 transition-colors"
                    >
                      تسديد كامل الباقي
                    </button>
                    {activeCustomerFinancials && activeCustomerFinancials.remainingBalance >= 50000 && (
                      <button
                        type="button"
                        onClick={() => setPaymentInputAmount('50000')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-mono-numbers text-slate-300 transition-colors"
                      >
                        50,000
                      </button>
                    )}
                    {activeCustomerFinancials && activeCustomerFinancials.remainingBalance >= 25000 && (
                      <button
                        type="button"
                        onClick={() => setPaymentInputAmount('25000')}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-mono-numbers text-slate-300 transition-colors"
                      >
                        25,000
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>تأكيد التسديد</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Edit Transaction Modal (نافذة تعديل الدفعة) --- */}
        <AnimatePresence>
          {editingTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-100">تعديل قيمة الدفعة</h3>
                  </div>
                  <button
                    onClick={() => setEditingTransaction(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditTransaction} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold">المبلغ الجديد للدفعة (د.ع)</label>
                    <input
                      type="number"
                      required
                      value={editInputAmount}
                      onChange={(e) => setEditInputAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-base font-mono-numbers text-amber-400 font-bold focus:outline-none focus:border-amber-500 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>حفظ التعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTransaction(null)}
                      className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Edit Customer Modal (نافذة تعديل بيانات الزبون) --- */}
        <AnimatePresence>
          {editingCustomer && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto sm:hidden" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Pencil className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">تعديل بيانات الزبون</h3>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{editingCustomer.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCustomer} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">اسم الزبون / المشترك</label>
                    <input
                      type="text"
                      required
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      placeholder="اسم الزبون"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">عدد الأمبيرات</label>
                    <input
                      type="number"
                      required
                      value={editCustomerAmps}
                      onChange={(e) => setEditCustomerAmps(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 text-left font-mono-numbers focus:outline-none focus:border-amber-500"
                      dir="ltr"
                    />
                  </div>

                  {Number(editCustomerAmps) > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">المبلغ الشهري المستحق:</span>
                      <span className="font-bold font-mono-numbers text-emerald-400">
                        {(Number(editCustomerAmps) * settings.pricePerAmpere).toLocaleString('ar-IQ')} د.ع
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">رقم الهاتف (للتذكير بالواتساب)</label>
                    <input
                      type="tel"
                      value={editCustomerPhone}
                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                      placeholder="9647701234567"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 text-left font-mono-numbers focus:outline-none focus:border-amber-500"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">العنوان أو رقم الدار / الغرفة</label>
                    <input
                      type="text"
                      value={editCustomerAddress}
                      onChange={(e) => setEditCustomerAddress(e.target.value)}
                      placeholder="مثال: دار 14، الفرع الثاني"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>حفظ التعديلات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(null)}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Delete Customer Confirmation Modal (تأكيد حذف الزبون) --- */}
        <AnimatePresence>
          {customerToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 stroke-[2]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100">حذف الزبون نهائياً</h3>
                  <p className="text-xs text-slate-300">
                    هل أنت متأكد من حذف الزبون <span className="font-bold text-amber-400">"{customerToDelete.name}"</span>؟
                  </p>
                  <p className="text-[11px] text-rose-400/90 pt-1">
                    سيتم حذف الزبون وكافة سجلات وصولاته وحساباته من الكابينة نهائياً.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmDeleteCustomer}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، حذف الزبون</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(null)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Add Subscriber Modal inside Cabin --- */}
        <AnimatePresence>
          {isAddSubOpen && activeCabin && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, y: 120 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 120 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto sm:hidden" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">إضافة زبون جديد</h3>
                    <p className="text-[11px] text-slate-400">إلى {activeCabin.name}</p>
                  </div>
                  <button
                    onClick={() => setIsAddSubOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddSubscriber} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">اسم الزبون / المشترك</label>
                    <input
                      type="text"
                      required
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="مثال: د. صفاء كريم"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">عدد الأمبيرات</label>
                    <input
                      type="number"
                      required
                      value={newSubAmps}
                      onChange={(e) => setNewSubAmps(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 text-left font-mono-numbers focus:outline-none focus:border-amber-500"
                      dir="ltr"
                    />
                  </div>

                  {Number(newSubAmps) > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">المبلغ الشهري المتوقع:</span>
                      <span className="font-bold font-mono-numbers text-emerald-400">
                        {(Number(newSubAmps) * settings.pricePerAmpere).toLocaleString('ar-IQ')} د.ع
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">رقم الهاتف (للتذكير بالواتساب)</label>
                    <input
                      type="tel"
                      value={newSubPhone}
                      onChange={(e) => setNewSubPhone(e.target.value)}
                      placeholder="9647701234567"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 text-left font-mono-numbers focus:outline-none focus:border-amber-500"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">العنوان / رقم الدار</label>
                    <input
                      type="text"
                      value={newSubAddress}
                      onChange={(e) => setNewSubAddress(e.target.value)}
                      placeholder="دار 12 أو محل 5"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                    >
                      حفظ الزبون
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddSubOpen(false)}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Add Cabin Modal --- */}
        <AnimatePresence>
          {isAddCabinOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, y: 120 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 120 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
              >
                <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto mt-2.5 sm:hidden" />

                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-100">
                        إضافة كابينة جديدة
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        تسجيل نقطة توزيع تابعة للمولدة
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAddCabinOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddCabin} className="p-5 space-y-4 overflow-y-auto">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-400" />
                        اسم أو رقم الكابينة
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-medium">مطلوب</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCabinName}
                      onChange={(e) => setNewCabinName(e.target.value)}
                      placeholder="مثال: كابينة 4 - شارع الفلوجة"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-400" />
                        اسم المسؤول / الجابي
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-medium">مطلوب</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCabinManager}
                      onChange={(e) => setNewCabinManager(e.target.value)}
                      placeholder="مثال: يوسف عبد الله"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-amber-400" />
                        سعة الكابينة (أمبير)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">
                        المتبقي: {remainingGenAmps} A
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={newCabinCapacity}
                        onChange={(e) => setNewCabinCapacity(e.target.value)}
                        placeholder="مثال: 60"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono-numbers text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-left"
                        dir="ltr"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        أمبير
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>إضافة الكابينة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddCabinOpen(false)}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Edit Cabin Modal (نافذة تعديل الكابينة) --- */}
        <AnimatePresence>
          {editingCabin && (
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto sm:hidden" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Pencil className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">تعديل بيانات الكابينة</h3>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{editingCabin.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCabin(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditCabin} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">اسم الكابينة</label>
                    <input
                      type="text"
                      required
                      value={editCabinName}
                      onChange={(e) => setEditCabinName(e.target.value)}
                      placeholder="اسم أو رقم الكابينة"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">اسم المسؤول / الجابي</label>
                    <input
                      type="text"
                      required
                      value={editCabinManager}
                      onChange={(e) => setEditCabinManager(e.target.value)}
                      placeholder="اسم الجابي"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">سعة الكابينة (أمبير)</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={editCabinCapacity}
                        onChange={(e) => setEditCabinCapacity(e.target.value)}
                        placeholder="السعة بالأمبير"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono-numbers text-slate-100 focus:outline-none focus:border-amber-500 text-left"
                        dir="ltr"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        أمبير
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>حفظ تعديلات الكابينة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCabin(null)}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Delete Cabin Confirmation Modal (تأكيد حذف الكابينة) --- */}
        <AnimatePresence>
          {cabinToDelete && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 stroke-[2]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100">حذف الكابينة نهائياً</h3>
                  <p className="text-xs text-slate-300">
                    هل أنت متأكد من حذف <span className="font-bold text-amber-400">"{cabinToDelete.name}"</span>؟
                  </p>
                  <p className="text-[11px] text-rose-400/90 pt-1">
                    سيتم حذف الكابينة مع كافة مشتركيها ({subscribers.filter(s => s.cabinId === cabinToDelete.id).length} مشترك) وجميع سجلات وصولاتهم نهائياً.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmDeleteCabin}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، حذف الكابينة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCabinToDelete(null)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Admin Settings Modal (Backdoor: 1001) --- */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-100">
                        إعدادات المولدة (لوحة الإدارة)
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        تعديل المعايير العامة والرمز السري
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveSettings} className="p-5 space-y-4 overflow-y-auto">
                  <StorageMeter data={data}/>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-amber-400" />
                        السعة الكلية للمولدة (أمبير)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">أمبير A</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={modalForm.totalCapacityAmps}
                        onChange={(e) => setModalForm({
                          ...modalForm, 
                          totalCapacityAmps: Number(e.target.value)
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono-numbers text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-left"
                        dir="ltr"
                        placeholder="مثال: 450"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        أمبير
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        سعر الأمبير الواحد (دينار)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers">د.ع / شهرياً</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={modalForm.pricePerAmpere}
                        onChange={(e) => setModalForm({
                          ...modalForm, 
                          pricePerAmpere: Number(e.target.value)
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono-numbers text-emerald-400 font-semibold placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left"
                        dir="ltr"
                        placeholder="مثال: 10000"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        د.ع
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      💡 السعر الجديد يطبق على الفواتير الجديدة فقط، ولا يغير فواتير الأشهر السابقة.
                    </p>
                  </div>

                  <fieldset className="space-y-3 border-t border-slate-700 pt-3">
                    <legend className="font-bold text-sm">تغيير رمز دخول النظام</legend>
                    <p className="text-xs text-slate-400">اترك الحقول فارغة للإبقاء على الرمز الحالي.</p>
                    <label className="block text-xs">الرمز الحالي<input type="password" autoComplete="current-password" value={oldCode} onChange={e=>setOldCode(e.target.value)} className="block w-full rounded-xl p-3 bg-slate-950 mt-1"/></label>
                    <label className="block text-xs">الرمز الجديد<input type="password" inputMode="numeric" maxLength={12} autoComplete="new-password" value={newCode} onChange={e=>setNewCode(e.target.value)} className="block w-full rounded-xl p-3 bg-slate-950 mt-1"/></label>
                    <label className="block text-xs">تأكيد الرمز الجديد<input type="password" inputMode="numeric" maxLength={12} autoComplete="new-password" value={confirmCode} onChange={e=>setConfirmCode(e.target.value)} className="block w-full rounded-xl p-3 bg-slate-950 mt-1"/></label>
                    {settingsError&&<p role="alert" className="text-red-400 text-xs">{settingsError}</p>}
                  </fieldset>
                  {/* Dedicated Action: Add & Manage Cabins inside Generator Settings */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>إدارة شبكة الكابينات</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono-numbers bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {cabins.length} كابينة مسجلة
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setIsAddCabinOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>إضافة كابينة جديدة</span>
                    </button>

                    {/* Cabins List with Edit and Delete Options */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                      {cabins.length === 0 ? (
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-center text-xs text-slate-400">
                          لا توجد كابينات مضافة بعد.
                        </div>
                      ) : (
                        cabins.map((cabin) => {
                          const cabinSubsCount = subscribers.filter((s) => s.cabinId === cabin.id).length;
                          return (
                            <div
                              key={cabin.id}
                              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-2 text-xs hover:border-slate-700 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-100 break-words whitespace-normal">{cabin.name}</span>
                                  <span className="text-[10px] text-amber-400 font-mono-numbers bg-amber-500/10 px-1.5 py-0.2 rounded shrink-0">
                                    {cabin.capacityAmps} A
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                                  <span className="truncate">المسؤول: {cabin.managerName}</span>
                                  <span>•</span>
                                  <span className="text-slate-300">{cabinSubsCount} مشترك</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* زر قلم التعديل */}
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCabin(cabin)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 active:scale-95 transition-all"
                                  title="تعديل بيانات الكابينة"
                                  aria-label="تعديل بيانات الكابينة"
                                >
                                  <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                                </button>

                                {/* زر حاوية الحذف */}
                                <button
                                  type="button"
                                  onClick={() => setCabinToDelete(cabin)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
                                  title="حذف الكابينة"
                                  aria-label="حذف الكابينة"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>حفظ وإغلاق</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default function App() {
  const {data}=useGeneratorData();
  const code=accessCode(data.settings);
  const [accepted,setAccepted]=useState<string|null>(null);
  const [input,setInput]=useState('');const [error,setError]=useState('');
  if(accepted===code)return <GeneratorApp onLock={()=>{setAccepted(null);setInput('');setError('');}}/>;
  return <main dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><form onSubmit={e=>{e.preventDefault();if(input===code){setAccepted(code);setInput('');setError('');}else setError('رمز الدخول غير صحيح');}} className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-7 space-y-5">
    <img src={import.meta.env.BASE_URL+'icon-192.png'} alt="شعار حسن الجنابي" className="w-28 h-28 rounded-2xl mx-auto"/><h1 className="text-xl font-bold text-center">مولدة حسن كريم كاظم</h1><p className="text-center text-slate-400">مرحبًا بعودتك، أدخل رمز الدخول</p>
    <label className="block text-sm">رمز الدخول<input autoFocus type="password" inputMode="numeric" autoComplete="current-password" value={input} onChange={e=>setInput(e.target.value)} className="mt-2 w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-center"/></label>
    {error&&<p role="alert" className="text-red-400 text-sm">{error}</p>}
    <button className="w-full bg-amber-400 text-slate-950 rounded-xl p-3 font-bold">دخول النظام</button>
  </form></main>;
}
