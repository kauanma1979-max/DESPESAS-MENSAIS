import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Save, Download, Upload, 
  Plus, Trash2, Calendar, FileText, ExternalLink, CheckCircle, XCircle, MoreVertical, Settings, Link as LinkIcon, Check, Edit
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

  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // --- Computed ---
  const monthKey = getCurrentMonthKey(currentDate);
  const currentMonthTransactions = transactions[monthKey] || [];
  const currentMonthQuickState = quickState[monthKey] || {};

  // Separate Income and Expense
  const incomeTransactions = currentMonthTransactions.filter(t => t.type === 'income');
  const expenseTransactions = currentMonthTransactions.filter(t => t.type === 'expense');

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

  // --- Edit Functions ---
  const startEditing = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDescription(transaction.description);
    setEditAmount(formatCurrencyInputDisplay(transaction.amount));
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setEditDescription('');
    setEditAmount('');
  };

  const saveEdit = () => {
    if (!editingTransaction) return;

    const amount = parseCurrencyInput(editAmount);
    if (!editDescription || amount <= 0) {
      alert("Preencha a descrição e um valor válido.");
      return;
    }

    setTransactions(prev => ({
      ...prev,
      [monthKey]: prev[monthKey].map(t => 
        t.id === editingTransaction.id 
          ? { ...t, description: editDescription, amount: amount } 
          : t
      )
    }));

    cancelEdit();
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

  // Helper to render transaction row with VERTICAL LAYOUT
  const renderTransactionRow = (t: Transaction) => (
    <div key={t.id} className={`flex items-start p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors ${t.checked ? 'bg-emerald-50/40' : ''}`}>
      
      {/* 1. Checkbox (Left side) */}
      <button 
        onClick={() => toggleTransactionCheck(t.id)}
        className={`
          mt-1 mr-5 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border-2 flex-shrink-0
          ${t.checked 
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200' 
            : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-50'}
        `}
        title={t.checked ? "Marcado como conferido" : "Marcar como conferido"}
      >
        <Check size={32} strokeWidth={3} />
      </button>

      {/* 2. Content Stack (Middle - Vertical Layout) */}
      <div className="flex-grow min-w-0 flex flex-col gap-1">
        
        {/* NAME - Large, Bold, Breaks words */}
        <div className={`text-xl font-bold leading-snug break-words ${t.checked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
          {t.description}
        </div>

        {/* VALUE - Extra Large, Colored */}
        <div className={`text-2xl font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'} ${t.checked ? 'opacity-60' : ''}`}>
          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
        </div>

        {/* DATE - Smaller, gray */}
        <div className="text-sm font-medium text-slate-400 flex items-center gap-1">
          <Calendar size={14} />
          {new Date(t.date).toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* 3. Actions (Right side) */}
      <div className="flex flex-col gap-2 ml-4 self-center sm:self-start">
        <button 
          onClick={() => startEditing(t)}
          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          title="Editar"
        >
          <Edit size={24} />
        </button>
        <button 
          onClick={() => deleteTransaction(t.id)}
          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          title="Excluir"
        >
          <Trash2 size={24} />
        </button>
      </div>

    </div>
  );

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
              <p className="text-slate-400 text-lg">Gerenciamento de Despesas</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={handleBackup}
              className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <Download size={24} /> Backup
            </button>
            <label className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm">
              <Upload size={24} /> Restaurar
              <input type="file" onChange={handleRestore} className="hidden" accept=".json" />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 sm:px-8">
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard title="Receitas do Mês" amount={totalIncome} type="income" />
          <StatCard title="Despesas do Mês" amount={totalExpense} type="expense" />
          <StatCard title="Saldo Atual" amount={balance} type="balance" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          
          {/* LEFT COLUMN: Main Interaction */}
          <div className="xl:col-span-2 space-y-10">
            
            {/* Year & Month Selector */}
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-slate-800">
                <Calendar className="text-primary" size={36} /> Período
              </h2>

              {/* Year Selector */}
              <div className="flex flex-wrap justify-center gap-4 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                {YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => changeYear(year)}
                    className={`px-8 py-4 rounded-xl text-xl font-bold transition-all ${
                      currentDate.getFullYear() === year
                        ? 'bg-slate-800 text-white shadow-xl transform scale-105'
                        : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-200 hover:text-slate-700'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {/* Month Selector */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {MONTHS.map((m, idx) => (
                  <button
                    key={m}
                    onClick={() => changeMonth(idx)}
                    className={`py-4 text-lg font-bold rounded-xl transition-all ${
                      currentDate.getMonth() === idx
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {m.substring(0, 3)}
                  </button>
                ))}
              </div>
              <div className="mt-8 text-center">
                <span className="inline-block font-black text-slate-700 uppercase tracking-widest text-2xl bg-slate-100 px-12 py-4 rounded-full border border-slate-200">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
              </div>
            </div>

            {/* Quick Transactions */}
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary to-secondary"></div>
               
               <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
                 <h2 className="text-3xl font-bold flex items-center gap-4 text-slate-800">
                   <FileText className="text-primary" size={36} /> Transações Rápidas
                 </h2>
                 <div className="flex flex-wrap gap-5 w-full xl:w-auto">
                    <button 
                      onClick={loadDefaultValues}
                      className="flex-1 xl:flex-none px-8 py-4 text-base font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200 shadow-sm flex items-center justify-center gap-3"
                    >
                      <Download size={24} /> Carregar Padrões
                    </button>
                    
                    {/* Unified Documents Button */}
                    <div className="flex-1 xl:flex-none flex items-stretch rounded-xl shadow-sm overflow-hidden border border-purple-200 bg-purple-50">
                      <button 
                        onClick={handleDocumentsClick}
                        className="flex-grow px-8 py-4 text-base font-bold text-purple-700 hover:bg-purple-100 transition-colors flex items-center justify-center gap-3"
                      >
                         <ExternalLink size={24} /> Ver Comprovantes
                      </button>
                      <div className="w-px bg-purple-200"></div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsDocModalOpen(true); }}
                        className="px-4 text-purple-600 hover:bg-purple-100 hover:text-purple-800 transition-colors flex items-center justify-center"
                        title="Configurar Link"
                      >
                        <Settings size={24} />
                      </button>
                    </div>
                 </div>
               </div>

               <div className="grid md:grid-cols-2 gap-12">
                  {/* Income Column */}
                  <div>
                    <h3 className="text-2xl font-black text-emerald-600 uppercase mb-6 flex items-center gap-3 pb-4 border-b-2 border-slate-100">
                      <TrendingUp size={32} /> Receitas
                    </h3>
                    <div className="space-y-5">
                      {INCOME_TEMPLATES.map(t => (
                        <QuickTransactionRow 
                          key={`${t.id}-${defaultsVersion}`} // Use key to force re-mount on version change
                          template={t} 
                          state={currentMonthQuickState[t.id] || { id: t.id, amount: 0, isPaid: false }}
                          onChange={handleQuickChange}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Expense Column */}
                  <div>
                    <h3 className="text-2xl font-black text-rose-600 uppercase mb-6 flex items-center gap-3 pb-4 border-b-2 border-slate-100">
                      <TrendingDown size={32} /> Despesas
                    </h3>
                    <div className="space-y-5">
                      {EXPENSE_TEMPLATES.map(t => (
                        <QuickTransactionRow 
                          key={`${t.id}-${defaultsVersion}`} // Use key to force re-mount on version change
                          template={t} 
                          state={currentMonthQuickState[t.id] || { id: t.id, amount: 0, isPaid: false }}
                          onChange={handleQuickChange}
                        />
                      ))}
                    </div>
                  </div>
               </div>

               <div className="mt-12 flex justify-end">
                 <button 
                  onClick={saveQuickToLedger}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 active:translate-y-0 font-bold text-xl"
                 >
                   <Save size={28} /> Consolidar e Salvar no Extrato
                 </button>
               </div>
            </div>

            {/* Manual Entry */}
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-slate-800">
                <Plus className="text-primary" size={36} /> Adicionar Manualmente
              </h2>
              <div className="flex flex-col lg:flex-row gap-8 items-end">
                <div className="w-full lg:flex-1">
                  <label className="block text-lg font-bold text-slate-500 mb-3">Descrição</label>
                  <input 
                    type="text" 
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Ex: Jantar fora"
                    className="w-full p-5 text-xl border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="w-full lg:w-56">
                  <label className="block text-lg font-bold text-slate-500 mb-3">Valor</label>
                  <input 
                    type="text" 
                    value={manualAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setManualAmount(formatCurrencyInputDisplay(val ? parseInt(val)/100 : 0));
                    }}
                    placeholder="0,00"
                    className="w-full p-5 text-xl font-bold text-right border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                  <button 
                    onClick={() => addManualTransaction('income')}
                    className="flex-1 lg:flex-none px-8 py-5 bg-emerald-100 text-emerald-700 font-bold text-lg rounded-xl hover:bg-emerald-200 transition-colors flex items-center justify-center"
                  >
                    + Receita
                  </button>
                  <button 
                    onClick={() => addManualTransaction('expense')}
                    className="flex-1 lg:flex-none px-8 py-5 bg-rose-100 text-rose-700 font-bold text-lg rounded-xl hover:bg-rose-200 transition-colors flex items-center justify-center"
                  >
                    - Despesa
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: History & Charts */}
          <div className="space-y-10">
            
            {/* Transaction List */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[1400px]">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-slate-800">
                <MoreVertical className="text-primary" size={36} /> Extrato do Mês
              </h2>
              
              <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
                {currentMonthTransactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Wallet size={80} className="mb-6 opacity-20" />
                    <p className="text-xl font-medium">Nenhuma transação registrada.</p>
                  </div>
                ) : (
                  <>
                    {/* INCOMES SECTION */}
                    {incomeTransactions.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-xl font-black text-emerald-600 uppercase mb-4 sticky top-0 bg-white py-2 z-10 border-b border-emerald-100">
                          Receitas
                        </h3>
                        {incomeTransactions.map(renderTransactionRow)}
                      </div>
                    )}

                    {/* EXPENSES SECTION */}
                    {expenseTransactions.length > 0 && (
                      <div>
                         <h3 className="text-xl font-black text-rose-600 uppercase mb-4 sticky top-0 bg-white py-2 z-10 border-b border-rose-100">
                          Despesas
                        </h3>
                        {expenseTransactions.map(renderTransactionRow)}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Statement Summary Footer */}
              <div className="mt-6 pt-6 border-t-2 border-slate-100 bg-slate-50/50 p-6 rounded-2xl">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold text-lg">Total Receitas</span>
                    <span className="font-bold text-emerald-600 text-lg">+ {formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold text-lg">Total Despesas</span>
                    <span className="font-bold text-rose-600 text-lg">- {formatCurrency(totalExpense)}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-3"></div>
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-extrabold text-slate-800">Saldo Final</span>
                    <span className={`font-black text-2xl ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Editing Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-10 animate-in fade-in zoom-in duration-200">
             <h3 className="text-3xl font-bold mb-6 flex items-center gap-4 text-slate-800">
               <Edit className="text-primary" size={36} /> Editar Transação
             </h3>
             
             <label className="block text-base font-bold text-slate-700 mb-3">Descrição</label>
             <input 
               type="text"
               value={editDescription}
               onChange={(e) => setEditDescription(e.target.value)}
               className="w-full p-5 border-2 border-slate-200 rounded-xl mb-6 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all text-lg"
             />

             <label className="block text-base font-bold text-slate-700 mb-3">Valor</label>
             <input 
               type="text"
               value={editAmount}
               onChange={(e) => {
                const val = e.target.value.replace(/[^\d]/g, '');
                setEditAmount(formatCurrencyInputDisplay(val ? parseInt(val)/100 : 0));
               }}
               className="w-full p-5 border-2 border-slate-200 rounded-xl mb-8 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all text-lg font-bold text-right"
             />

             <div className="flex justify-end gap-4">
               <button 
                onClick={cancelEdit}
                className="px-8 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-lg"
               >
                 Cancelar
               </button>
               <button 
                onClick={saveEdit}
                className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 text-lg"
               >
                 Salvar
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-10 animate-in fade-in zoom-in duration-200">
             <h3 className="text-3xl font-bold mb-6 flex items-center gap-4 text-slate-800">
               <LinkIcon className="text-primary" size={36} /> Configurar Link
             </h3>
             <p className="text-slate-500 text-lg mb-8 leading-relaxed">
               Cole o link da sua pasta na nuvem (Google Drive, Dropbox, OneDrive) para acesso rápido aos comprovantes.
             </p>
             <label className="block text-base font-bold text-slate-700 mb-3">URL da Pasta</label>
             <input 
               type="url"
               value={docLink}
               onChange={(e) => setDocLink(e.target.value)}
               placeholder="https://"
               className="w-full p-5 border-2 border-slate-200 rounded-xl mb-8 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all text-lg"
             />
             <div className="flex justify-end gap-4">
               {docLink && (
                 <a 
                   href={docLink} 
                   target="_blank" 
                   rel="noreferrer"
                   className="mr-auto text-primary flex items-center gap-2 hover:underline font-bold text-base bg-primary/5 px-5 py-3 rounded-xl"
                 >
                   <ExternalLink size={20} /> Testar
                 </a>
               )}
               <button 
                onClick={() => setIsDocModalOpen(false)}
                className="px-8 py-4 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-lg"
               >
                 Cancelar
               </button>
               <button 
                onClick={saveDocLink}
                className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 text-lg"
               >
                 Salvar
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;