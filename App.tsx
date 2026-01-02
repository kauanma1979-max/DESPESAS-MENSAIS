
import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Save, Download, 
  Trash2, Calendar, FileText, ExternalLink, CheckCircle, XCircle, 
  Check, Edit, AlertTriangle, Bell, Info, Cloud, CloudOff, Database
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { INCOME_TEMPLATES, EXPENSE_TEMPLATES, MONTHS, YEARS } from './constants';
import { 
  Transaction, MonthlyTransactions, MonthlyQuickState, QuickTransactionTemplate 
} from './types';
import { 
  formatCurrency, parseCurrencyInput, formatCurrencyInputDisplay, 
  generateId, getCurrentMonthKey 
} from './utils';

// --- CONFIGURAÇÃO SUPABASE ---
// IMPORTANTE: Substitua os valores abaixo pelos que você obteve no Passo 3
const SUPABASE_URL = 'SUA_URL_AQUI'; 
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Sub-components ---

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`fade-in flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl glass-modal min-w-[300px] border-l-4 ${
            toast.type === 'success' ? 'border-l-emerald-500' : 
            toast.type === 'error' ? 'border-l-rose-500' : 'border-l-blue-500'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="text-emerald-500" />}
          {toast.type === 'error' && <AlertTriangle className="text-rose-500" />}
          {toast.type === 'info' && <Bell className="text-blue-500" />}
          <span className="font-bold text-slate-700">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-auto text-slate-400 hover:text-slate-600">
            <XCircle size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ title, amount, type }: { title: string; amount: number; type: 'income' | 'expense' | 'balance' }) => {
  let colorClass = 'text-blue-600';
  let bgClass = 'bg-blue-50/50';
  let icon = <Wallet className="w-8 h-8" />;

  if (type === 'income') {
    colorClass = 'text-emerald-600';
    bgClass = 'bg-emerald-50/50';
    icon = <TrendingUp className="w-8 h-8" />;
  } else if (type === 'expense') {
    colorClass = 'text-rose-600';
    bgClass = 'bg-rose-50/50';
    icon = <TrendingDown className="w-8 h-8" />;
  }

  return (
    <div className="fade-in glass-card rounded-2xl p-8 flex items-center justify-between transition-modern hover-elevate group">
      <div>
        <p className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-widest">{title}</p>
        <h3 className={`text-4xl font-black ${colorClass} tracking-tight`}>{formatCurrency(amount)}</h3>
      </div>
      <div className={`p-4 rounded-2xl transition-modern group-hover:scale-110 ${bgClass} ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};

interface QuickRowProps {
  template: QuickTransactionTemplate;
  state: { amount: number; isPaid: boolean };
  onChange: (id: string, amount: number, isPaid: boolean) => void;
}

const QuickTransactionRow: React.FC<QuickRowProps> = ({ template, state, onChange }) => {
  const [inputValue, setInputValue] = useState(formatCurrencyInputDisplay(state.amount));

  useEffect(() => {
    setInputValue(formatCurrencyInputDisplay(state.amount));
  }, [state.amount]);

  const handleBlur = () => {
    setInputValue(formatCurrencyInputDisplay(state.amount));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === '') {
        setInputValue('');
        onChange(template.id, 0, false);
        return;
    }
    const num = parseCurrencyInput(val);
    setInputValue(val.replace(/[^\d,.]/g, '')); 
    onChange(template.id, num, num > 0 ? true : state.isPaid);
  };

  const togglePaid = () => {
    onChange(template.id, state.amount, !state.isPaid);
  };

  return (
    <div className={`fade-in flex items-center gap-4 p-5 glass-card border-2 rounded-2xl transition-modern group ${state.isPaid ? 'border-emerald-200/50 bg-emerald-50/40' : 'border-transparent hover:border-slate-200'}`}>
      <div className="flex-1">
        <div className="font-bold text-slate-700 text-lg group-hover:text-primary transition-colors">{template.name}</div>
      </div>
      
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
        <input 
          type="text" 
          value={inputValue}
          onChange={handleInput}
          onBlur={handleBlur}
          placeholder="0,00"
          className="w-40 pl-10 pr-4 py-2.5 text-right text-xl font-bold text-slate-700 glass-modal border-2 border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-modern font-mono"
        />
        {state.amount > 0 && <Check className="absolute -right-2 -top-2 text-emerald-500 w-5 h-5 bg-white rounded-full p-0.5 shadow-sm border border-emerald-100" />}
      </div>

      <button 
        onClick={togglePaid}
        className={`flex items-center justify-center p-3 rounded-xl transition-modern shadow-sm ${
          state.isPaid 
            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-200 scale-105' 
            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
        }`}
      >
        {state.isPaid ? <CheckCircle size={28} /> : <XCircle size={28} />}
      </button>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<MonthlyTransactions>({});
  const [quickState, setQuickState] = useState<MonthlyQuickState>({});
  const [defaultsVersion, setDefaultsVersion] = useState(0);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  
  const [manualDescription, setManualDescription] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  
  const [docLink, setDocLink] = useState('');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const monthKey = getCurrentMonthKey(currentDate);
  const currentMonthTransactions = transactions[monthKey] || [];
  const currentMonthQuickState = quickState[monthKey] || {};

  const incomeTransactions = currentMonthTransactions.filter(t => t.type === 'income');
  const expenseTransactions = currentMonthTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // --- Helpers ---
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  // --- Supabase Sincronização ---
  const fetchFromSupabase = async () => {
    try {
      // Teste de conexão
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*');
      
      if (txError) throw txError;

      const organizedTransactions: MonthlyTransactions = {};
      txData.forEach((tx: any) => {
        if (!organizedTransactions[tx.month_key]) organizedTransactions[tx.month_key] = [];
        organizedTransactions[tx.month_key].push({
          id: tx.id,
          description: tx.description,
          amount: parseFloat(tx.amount),
          category: tx.category,
          type: tx.type,
          date: tx.date,
          checked: tx.checked
        });
      });

      const { data: qsData, error: qsError } = await supabase
        .from('quick_state')
        .select('*');
      
      if (qsError) throw qsError;

      const organizedQuickState: MonthlyQuickState = {};
      qsData.forEach((qs: any) => {
        if (!organizedQuickState[qs.month_key]) organizedQuickState[qs.month_key] = {};
        organizedQuickState[qs.month_key][qs.template_id] = {
          id: qs.template_id,
          amount: parseFloat(qs.amount),
          isPaid: qs.is_paid
        };
      });

      setTransactions(organizedTransactions);
      setQuickState(organizedQuickState);
      setIsDbConnected(true);
    } catch (err) {
      console.error("Erro ao conectar ao Supabase:", err);
      setIsDbConnected(false);
      addToast("Erro na sincronização com o banco de dados.", "error");
    }
  };

  useEffect(() => {
    fetchFromSupabase();
    const savedDocLink = localStorage.getItem('docLink');
    if (savedDocLink) setDocLink(savedDocLink);
  }, []);

  // --- Handlers Sincronizados ---

  const handleQuickChange = async (id: string, amount: number, isPaid: boolean) => {
    // Atualização local imediata (Otimista)
    setQuickState(prev => ({
      ...prev,
      [monthKey]: { ...prev[monthKey], [id]: { id, amount, isPaid } }
    }));

    // Sincronização com Supabase (Upsert)
    if (isDbConnected) {
      const { error } = await supabase
        .from('quick_state')
        .upsert({ 
          template_id: id, 
          amount, 
          is_paid: isPaid, 
          month_key: monthKey 
        }, { onConflict: 'template_id, month_key' });
      
      if (error) addToast("Falha ao salvar no banco.", "error");
    }
  };

  const addManualTransaction = async (type: 'income' | 'expense') => {
    const amount = parseCurrencyInput(manualAmount);
    if (!manualDescription || amount <= 0) {
      addToast("Descrição e valor são obrigatórios.", "error");
      return;
    }

    const newTx: Transaction = {
      id: generateId(),
      description: manualDescription,
      amount: amount,
      category: 'Manual',
      type,
      date: currentDate.toISOString(),
      checked: false
    };

    setTransactions(prev => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] || []), newTx]
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('transactions').insert({
        id: newTx.id,
        description: newTx.description,
        amount: newTx.amount,
        category: newTx.category,
        type: newTx.type,
        date: newTx.date,
        checked: newTx.checked,
        month_key: monthKey
      });
      if (error) addToast("Erro ao salvar lançamento.", "error");
    }

    setManualDescription('');
    setManualAmount('');
    addToast("Lançamento adicionado!");
  };

  const deleteTransaction = async (id: string) => {
    showConfirm("Excluir", "Tem certeza que deseja remover esta transação?", async () => {
      setTransactions(prev => ({
        ...prev,
        [monthKey]: prev[monthKey].filter(t => t.id !== id)
      }));

      if (isDbConnected) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) addToast("Erro ao excluir do banco.", "error");
      }

      addToast("Transação removida.");
      setConfirmModal(null);
    });
  };

  const toggleTransactionCheck = async (t: Transaction) => {
    const newChecked = !t.checked;
    setTransactions(prev => ({
      ...prev, [monthKey]: prev[monthKey].map(tx => tx.id === t.id ? { ...tx, checked: newChecked } : tx)
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('transactions').update({ checked: newChecked }).eq('id', t.id);
      if (error) addToast("Erro ao atualizar status.", "error");
    }
  };

  const loadDefaultValues = () => {
    showConfirm(
      "Carregar Padrões",
      "Isso irá substituir os valores atuais pelos padrões pré-definidos.",
      () => {
        const newMonthState: Record<string, any> = {};
        [...INCOME_TEMPLATES, ...EXPENSE_TEMPLATES].forEach(async (t) => {
          newMonthState[t.id] = { id: t.id, amount: t.defaultAmount, isPaid: true };
          if (isDbConnected) {
             await supabase.from('quick_state').upsert({ 
               template_id: t.id, 
               amount: t.defaultAmount, 
               is_paid: true, 
               month_key: monthKey 
             }, { onConflict: 'template_id, month_key' });
          }
        });
        setQuickState(prev => ({ ...prev, [monthKey]: newMonthState }));
        setDefaultsVersion(v => v + 1);
        addToast("Padrões carregados!");
        setConfirmModal(null);
      }
    );
  };

  const saveQuickToLedger = async () => {
    const toAdd: Transaction[] = [];
    const existingTransactions = transactions[monthKey] || [];

    const processTemplate = (t: QuickTransactionTemplate, type: 'income' | 'expense') => {
      const st = currentMonthQuickState[t.id];
      if (st && st.amount > 0) {
        const isDuplicate = existingTransactions.some(ex => 
          ex.description === t.name && Math.abs(ex.amount - st.amount) < 0.01
        );
        if (!isDuplicate) {
          toAdd.push({
            id: generateId(),
            description: t.name,
            amount: st.amount,
            category: t.category,
            type: type,
            date: currentDate.toISOString(),
            checked: false
          });
        }
      }
    };
    
    INCOME_TEMPLATES.forEach(t => processTemplate(t, 'income'));
    EXPENSE_TEMPLATES.forEach(t => processTemplate(t, 'expense'));

    if (toAdd.length === 0) {
      addToast("Nenhuma transação nova encontrada.", "info");
      return;
    }

    if (isDbConnected) {
      const dbPayload = toAdd.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        type: tx.type,
        date: tx.date,
        checked: tx.checked,
        month_key: monthKey
      }));
      const { error } = await supabase.from('transactions').insert(dbPayload);
      if (error) {
        addToast("Erro ao consolidar no banco.", "error");
        return;
      }
    }

    setTransactions(prev => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] || []), ...toAdd]
    }));
    addToast(`${toAdd.length} transações consolidadas!`);
  };

  const saveEdit = async () => {
    if (!editingTransaction) return;
    const amount = parseCurrencyInput(editAmount);
    if (!editDescription || amount <= 0) {
      addToast("Dados inválidos.", "error");
      return;
    }
    
    setTransactions(prev => ({
      ...prev,
      [monthKey]: prev[monthKey].map(t => 
        t.id === editingTransaction.id ? { ...t, description: editDescription, amount: amount } : t
      )
    }));

    if (isDbConnected) {
      const { error } = await supabase.from('transactions')
        .update({ description: editDescription, amount: amount })
        .eq('id', editingTransaction.id);
      if (error) addToast("Erro ao editar no banco.", "error");
    }

    setEditingTransaction(null);
    addToast("Alterações salvas.");
  };

  const renderTransactionRow = (t: Transaction) => (
    <div key={t.id} className={`fade-in flex items-start p-5 border-b border-slate-100 hover:bg-white/50 transition-modern group ${t.checked ? 'bg-emerald-50/30' : ''}`}>
      <button 
        onClick={() => toggleTransactionCheck(t)}
        className={`mt-1 mr-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-modern border-2 flex-shrink-0 ${
          t.checked ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-200 hover:border-emerald-200'
        }`}
      >
        <Check size={24} strokeWidth={3} />
      </button>

      <div className="flex-grow min-w-0">
        <div className={`text-lg font-bold truncate ${t.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
          {t.description}
        </div>
        <div className={`text-xl font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
        </div>
      </div>

      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-modern">
        <button onClick={() => {
          setEditingTransaction(t);
          setEditDescription(t.description);
          setEditAmount(formatCurrencyInputDisplay(t.amount));
        }} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-modern">
          <Edit size={20} />
        </button>
        <button onClick={() => deleteTransaction(t.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-modern">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header com Gradiente Animado e Indicador de Banco de Dados */}
      <header className="header-animated text-white p-10 shadow-2xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="header-brand-gradient p-5 rounded-3xl shadow-2xl shadow-accent/30">
              <TrendingUp className="text-white w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                  Financeiro <span className="text-accent">Pro</span>
                </h1>
                
                {/* ÍCONE DE CONEXÃO */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isDbConnected === true ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${isDbConnected === true ? 'bg-emerald-500 pulse-green' : 'bg-rose-500'}`}></div>
                  {isDbConnected === true ? (
                    <span className="flex items-center gap-1.5"><Cloud size={12} /> Sincronizado</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><CloudOff size={12} /> Offline</span>
                  )}
                </div>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Modern Financial Tracking © 2025</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => {
              const data = { transactions, quickState, version: 1 };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `financeiro_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              addToast("Backup local gerado!");
            }} className="flex items-center gap-3 px-8 py-4 glass-modal hover:bg-white/20 rounded-2xl text-lg font-bold transition-modern hover:scale-105">
              <Database size={24} /> Backup
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <StatCard title="Entradas" amount={totalIncome} type="income" />
          <StatCard title="Saídas" amount={totalExpense} type="expense" />
          <StatCard title="Saldo Consolidado" amount={balance} type="balance" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8 space-y-12">
            
            <div className="glass-card p-10 rounded-3xl shadow-xl transition-modern">
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <h2 className="text-3xl font-black flex items-center gap-4 text-slate-800">
                  <Calendar className="text-primary" size={32} /> Período
                </h2>
                <div className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xl shadow-xl">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                {YEARS.map((year) => (
                  <button key={year} onClick={() => setCurrentDate(d => { const n = new Date(d); n.setFullYear(year); return n; })}
                    className={`px-6 py-3 rounded-xl text-lg font-black transition-modern ${currentDate.getFullYear() === year ? 'bg-primary text-white shadow-xl scale-105' : 'glass-modal text-slate-500 hover:text-primary'}`}>
                    {year}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {MONTHS.map((m, idx) => (
                  <button key={m} onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(idx); return n; })}
                    className={`py-4 font-bold rounded-xl transition-modern ${currentDate.getMonth() === idx ? 'bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg scale-105' : 'glass-modal text-slate-500 hover:bg-white'}`}>
                    {m.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-t-8 border-primary">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
                 <div>
                   <h2 className="text-3xl font-black text-slate-800 mb-1 flex items-center gap-4">
                     <FileText className="text-primary" size={36} /> Templates Rápidos
                   </h2>
                   <p className="text-slate-400 font-medium">Lançamentos frequentes com um clique</p>
                 </div>
                 <div className="flex gap-4 w-full lg:w-auto">
                    <button onClick={loadDefaultValues} className="flex-1 lg:flex-none px-6 py-4 glass-modal text-amber-600 font-black rounded-2xl hover:bg-amber-50 transition-modern flex items-center justify-center gap-2">
                      <Download size={20} /> Resetar Padrões
                    </button>
                    <button onClick={() => { if(docLink) window.open(docLink, '_blank'); else setIsDocModalOpen(true); }} className="flex-1 lg:flex-none px-6 py-4 glass-modal text-purple-600 font-black rounded-2xl hover:bg-purple-50 transition-modern flex items-center justify-center gap-2">
                      <ExternalLink size={20} /> Comprovantes
                    </button>
                 </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 mb-12">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Entradas Automáticas
                    </h3>
                    {INCOME_TEMPLATES.map(t => (
                      <QuickTransactionRow key={`${t.id}-${defaultsVersion}`} template={t} state={currentMonthQuickState[t.id] || { id: t.id, amount: 0, isPaid: false }} onChange={handleQuickChange} />
                    ))}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div> Saídas Planejadas
                    </h3>
                    {EXPENSE_TEMPLATES.map(t => (
                      <QuickTransactionRow key={`${t.id}-${defaultsVersion}`} template={t} state={currentMonthQuickState[t.id] || { id: t.id, amount: 0, isPaid: false }} onChange={handleQuickChange} />
                    ))}
                  </div>
              </div>

              <button onClick={saveQuickToLedger} className="w-full py-6 bg-gradient-to-r from-primary to-secondary text-white rounded-[2rem] font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-modern flex items-center justify-center gap-4">
                <Save size={28} /> Consolidar no Extrato Mensal
              </button>
            </div>

            <div className="glass-card p-10 rounded-3xl shadow-xl">
              <h2 className="text-3xl font-black mb-8 text-slate-800">Lançamento Avulso</h2>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-6 group">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2 transition-colors group-focus-within:text-primary">Descrição do Item</label>
                  <input type="text" value={manualDescription} onChange={(e) => setManualDescription(e.target.value)} placeholder="O que você comprou/recebeu?"
                    className="w-full p-5 text-lg glass-modal border-2 border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-modern" />
                </div>
                <div className="md:col-span-3 group">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2 transition-colors group-focus-within:text-primary">Valor (R$)</label>
                  <input type="text" value={manualAmount} onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, ''); setManualAmount(formatCurrencyInputDisplay(v ? parseInt(v)/100 : 0)); }} placeholder="0,00"
                    className="w-full p-5 text-lg font-black text-right glass-modal border-2 border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-modern" />
                </div>
                <div className="md:col-span-3 flex gap-3">
                  <button onClick={() => addManualTransaction('income')} className="flex-1 p-5 glass-modal text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-[1.5rem] transition-modern shadow-lg flex items-center justify-center">
                    <TrendingUp size={28} />
                  </button>
                  <button onClick={() => addManualTransaction('expense')} className="flex-1 p-5 glass-modal text-rose-600 hover:bg-rose-500 hover:text-white rounded-[1.5rem] transition-modern shadow-lg flex items-center justify-center">
                    <TrendingDown size={28} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 h-full">
            <div className="glass-card p-8 rounded-[2.5rem] shadow-xl sticky top-8 flex flex-col max-h-[1400px]">
              <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-slate-800">
                <Bell className="text-primary" size={32} /> Histórico
              </h2>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {currentMonthTransactions.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                    <Info size={48} className="mb-4 opacity-20" />
                    <p className="font-bold">Nada por aqui ainda.</p>
                  </div>
                ) : (
                  <>
                    {incomeTransactions.length > 0 && (
                      <div className="mb-8">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 py-3 mb-2 flex items-center justify-between px-4 rounded-xl">
                          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Entradas</span>
                          <span className="text-sm font-black text-emerald-500">{formatCurrency(totalIncome)}</span>
                        </div>
                        {incomeTransactions.map(renderTransactionRow)}
                      </div>
                    )}
                    {expenseTransactions.length > 0 && (
                      <div>
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 py-3 mb-2 flex items-center justify-between px-4 rounded-xl">
                          <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Saídas</span>
                          <span className="text-sm font-black text-rose-500">{formatCurrency(totalExpense)}</span>
                        </div>
                        {expenseTransactions.map(renderTransactionRow)}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-8 pt-8 border-t-2 border-slate-100/50">
                <div className={`p-8 rounded-[2rem] shadow-2xl transition-modern ${balance >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  <p className="font-black text-xs uppercase tracking-widest opacity-70 mb-1">Status do Mês</p>
                  <div className="text-3xl font-black">{formatCurrency(balance)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Editing Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-modal rounded-[2.5rem] shadow-2xl max-w-lg w-full p-12 fade-in">
             <h3 className="text-3xl font-black mb-8 flex items-center gap-4 text-slate-800">
               <Edit className="text-primary" size={32} /> Ajustar Item
             </h3>
             <div className="space-y-6">
                <div className="group">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Descrição</label>
                  <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} 
                    className="w-full p-5 glass-modal border-2 border-slate-100 rounded-2xl font-bold" />
                </div>
                <div className="group">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-2">Valor</label>
                  <input type="text" value={editAmount} onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, ''); setEditAmount(formatCurrencyInputDisplay(v ? parseInt(v)/100 : 0)); }}
                    className="w-full p-5 glass-modal border-2 border-slate-100 rounded-2xl font-black text-right text-2xl text-primary" />
                </div>
             </div>
             <div className="flex justify-end gap-4 mt-12">
               <button onClick={() => setEditingTransaction(null)} className="px-8 py-4 text-slate-500 font-black hover:bg-slate-100 rounded-2xl transition-modern">Descartar</button>
               <button onClick={saveEdit} className="px-10 py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-modern shadow-xl">Salvar Alterações</button>
             </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="glass-modal rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 fade-in text-center">
             <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 mb-4">{confirmModal.title}</h3>
             <p className="text-slate-500 font-medium leading-relaxed mb-10">{confirmModal.message}</p>
             <div className="flex gap-4">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 glass-modal text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-modern">Voltar</button>
                <button onClick={confirmModal.onConfirm} className="flex-1 py-4 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 shadow-xl">Confirmar</button>
             </div>
          </div>
        </div>
      )}

      {/* Docs Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-modal rounded-[2.5rem] shadow-2xl max-w-xl w-full p-12 fade-in">
             <h3 className="text-3xl font-black mb-6 flex items-center gap-4 text-slate-800">
               <Database className="text-primary" size={32} /> Link de Arquivos
             </h3>
             <p className="text-slate-500 font-medium mb-10">Conecte sua pasta do Drive ou Cloud.</p>
             <input type="url" value={docLink} onChange={(e) => setDocLink(e.target.value)} placeholder="https://drive.google.com/..."
               className="w-full p-5 glass-modal border-2 border-slate-100 rounded-2xl mb-12 focus:outline-none focus:border-primary transition-modern" />
             <div className="flex justify-end gap-4">
               <button onClick={() => setIsDocModalOpen(false)} className="px-8 py-4 text-slate-500 font-black rounded-2xl">Fechar</button>
               <button onClick={() => { localStorage.setItem('docLink', docLink); setIsDocModalOpen(false); addToast("Link configurado!"); }}
                 className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl">Vincular</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
