
import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Save, Download, Upload, 
  Plus, Trash2, Calendar, FileText, ExternalLink, CheckCircle, XCircle, MoreVertical, Settings, Link as LinkIcon, Check
} from 'lucide-react';
import { INCOME_TEMPLATES, EXPENSE_TEMPLATES, MONTHS, YEARS } from './constants';
import { 
  Transaction, MonthlyTransactions, MonthlyQuickState, QuickTransactionTemplate 
} from './types';
import { 
  formatCurrency, parseCurrencyInput, formatCurrencyInputDisplay, 
  generateId, getCurrentMonthKey 
} from './utils';

// --- Sub-components ---

// 1. Stats Card
const StatCard = ({ title, amount, type }: { title: string; amount: number; type: 'income' | 'expense' | 'balance' }) => {
  let colorClass = 'text-blue-600';
  let bgClass = 'bg-blue-50';
  let icon = <Wallet className="w-10 h-10" />;

  if (type === 'income') {
    colorClass = 'text-emerald-600';
    bgClass = 'bg-emerald-50';
    icon = <TrendingUp className="w-10 h-10" />;
  } else if (type === 'expense') {
    colorClass = 'text-rose-600';
    bgClass = 'bg-rose-50';
    icon = <TrendingDown className="w-10 h-10" />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-slate-500 text-lg font-bold mb-2 uppercase tracking-wide">{title}</p>
        <h3 className={`text-5xl font-bold ${colorClass}`}>{formatCurrency(amount)}</h3>
      </div>
      <div className={`p-5 rounded-full ${bgClass} ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};

// 2. Quick Transaction Row
interface QuickRowProps {
  template: QuickTransactionTemplate;
  state: { amount: number; isPaid: boolean };
  onChange: (id: string, amount: number, isPaid: boolean) => void;
}

const QuickTransactionRow: React.FC<QuickRowProps> = ({ template, state, onChange }) => {
  const [inputValue, setInputValue] = useState(formatCurrencyInputDisplay(state.amount));

  // Sync internal input state if external state changes (e.g. load defaults)
  // We use a version key or just rely on value changes.
  useEffect(() => {
    setInputValue(formatCurrencyInputDisplay(state.amount));
  }, [state.amount]);

  const handleBlur = () => {
    setInputValue(formatCurrencyInputDisplay(state.amount));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Allow user to empty the field to type new value
    if (val === '') {
        setInputValue('');
        onChange(template.id, 0, false);
        return;
    }
    const num = parseCurrencyInput(val);
    // Sanitize display slightly while typing to avoid invalid chars
    setInputValue(val.replace(/[^\d,.]/g, '')); 
    
    // Auto-mark as paid (active) if user types a value > 0
    onChange(template.id, num, num > 0 ? true : state.isPaid);
  };

  const togglePaid = () => {
    onChange(template.id, state.amount, !state.isPaid);
  };

  return (
    <div className={`flex items-center gap-4 p-5 bg-white border-2 rounded-2xl shadow-sm transition-all group ${state.isPaid ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-blue-200'}`}>
      <div className="flex-1">
        <div className="font-bold text-slate-800 text-xl">{template.name}</div>
        {/* Description removed per request */}
      </div>
      
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">R$</span>
        <input 
          type="text" 
          value={inputValue}
          onChange={handleInput}
          onBlur={handleBlur}
          placeholder="0,00"
          className="w-48 pl-12 pr-4 py-3 text-right text-2xl font-bold text-slate-700 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-mono transition-all"
        />
      </div>

      <button 
        onClick={togglePaid}
        className={`flex items-center justify-center p-4 rounded-xl transition-all shadow-sm ${
          state.isPaid 
            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200' 
            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
        }`}
        title={state.isPaid ? "Marcado como ativo" : "Marcar como ativo"}
      >
        {state.isPaid ? <CheckCircle size={32} /> : <XCircle size={32} />}
      </button>
    </div>
  );
};


// --- Main Application ---

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<MonthlyTransactions>({});
  const [quickState, setQuickState] = useState<MonthlyQuickState>({});
  const [defaultsVersion, setDefaultsVersion] = useState(0); // Used to force re-render inputs
  
  const [manualDescription, setManualDescription] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  
  const [docLink, setDocLink] = useState('');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // --- Computed ---
  const monthKey = getCurrentMonthKey(currentDate);
  const currentMonthTransactions = transactions[monthKey] || [];
  const currentMonthQuickState = quickState[monthKey] || {};

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  // --- Effects ---
  
  // Load from LocalStorage
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    const savedQuickState = localStorage.getItem('quickState');
    const savedDocLink = localStorage.getItem('docLink');
    
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedQuickState) setQuickState(JSON.parse(savedQuickState));
    if (savedDocLink) setDocLink(savedDocLink);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (Object.keys(transactions).length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (Object.keys(quickState).length > 0) {
      localStorage.setItem('quickState', JSON.stringify(quickState));
    }
  }, [quickState]);

  // --- Handlers ---

  const changeMonth = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
  };

  const changeYear = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
  };

  const handleQuickChange = (id: string, amount: number, isPaid: boolean) => {
    setQuickState(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        [id]: { id, amount, isPaid }
      }
    }));
  };

  const loadDefaultValues = () => {
    if (!confirm("Isso irá substituir os valores atuais da tela pelos padrões. Continuar?")) return;

    // Create a new state object for this month
    const newMonthState: Record<string, any> = {};
    
    // Explicitly populate with defaults from constants
    // Set isPaid to true so they appear active immediately
    [...INCOME_TEMPLATES, ...EXPENSE_TEMPLATES].forEach(t => {
      newMonthState[t.id] = { id: t.id, amount: t.defaultAmount, isPaid: true };
    });

    setQuickState(prev => ({
      ...prev,
      [monthKey]: newMonthState
    }));
    
    // Increment version to force inputs to re-read props
    setDefaultsVersion(v => v + 1);
  };

  const handleDocumentsClick = () => {
    if (docLink) {
      window.open(docLink, '_blank');
    } else {
      setIsDocModalOpen(true);
    }
  };

  const saveQuickToLedger = () => {
    const toAdd: Transaction[] = [];
    const existingTransactions = transactions[monthKey] || [];

    const processTemplate = (t: QuickTransactionTemplate, type: 'income' | 'expense') => {
      const st = currentMonthQuickState[t.id];
      // Save if there is an amount > 0.
      if (st && st.amount > 0) {
        // Check for duplicates (same description and same amount in this month)
        const isDuplicate = existingTransactions.some(ex => 
          ex.description === t.name && 
          Math.abs(ex.amount - st.amount) < 0.01
        );

        if (!isDuplicate) {
          toAdd.push({
            id: generateId(),
            description: t.name,
            amount: st.amount,
            category: t.category,
            type: type,
            date: currentDate.toISOString(),
            checked: false // Default to unchecked
          });
        }
      }
    };
    
    INCOME_TEMPLATES.forEach(t => processTemplate(t, 'income'));
    EXPENSE_TEMPLATES.forEach(t => processTemplate(t, 'expense'));

    if (toAdd.length === 0) {
      alert("Nenhuma transação nova encontrada ou todas as transações com valores já foram adicionadas.");
      return;
    }

    setTransactions(prev => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] || []), ...toAdd]
    }));
    
    alert(`${toAdd.length} transações adicionadas ao extrato com sucesso!`);
  };

  const addManualTransaction = (type: 'income' | 'expense') => {
    const amount = parseCurrencyInput(manualAmount);
    if (!manualDescription || amount <= 0) {
      alert("Preencha a descrição e um valor válido.");
      return;
    }

    const newTx: Transaction = {
      id: generateId(),
      description: manualDescription,
      amount: amount,
      category: 'Manual',
      type,
      date: currentDate.toISOString(),
      checked: false // Default to unchecked
    };

    setTransactions(prev => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] || []), newTx]
    }));

    setManualDescription('');
    setManualAmount('');
  };

  const deleteTransaction = (id: string) => {
    if (!confirm("Excluir transação?")) return;
    setTransactions(prev => ({
      ...prev,
      [monthKey]: prev[monthKey].filter(t => t.id !== id)
    }));
  };

  const toggleTransactionCheck = (id: string) => {
    setTransactions(prev => ({
      ...prev,
      [monthKey]: prev[monthKey].map(t => 
        t.id === id ? { ...t, checked: !t.checked } : t
      )
    }));
  };

  const handleBackup = () => {
    const data = { transactions, quickState, version: 1 };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_financeiro_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions) setTransactions(data.transactions);
        if (data.quickState) setQuickState(data.quickState);
        alert("Dados restaurados com sucesso!");
      } catch (err) {
        alert("Erro ao ler arquivo de backup.");
      }
    };
    reader.readAsText(file);
  };

  const saveDocLink = () => {
    localStorage.setItem('docLink', docLink);
    setIsDocModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-32">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 shadow-xl mb-12">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-primary p-4 rounded-2xl shadow-lg shadow-primary/20">
              <TrendingUp className="text-white w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Financeiro Pro</h1>
              <p className="text-slate-