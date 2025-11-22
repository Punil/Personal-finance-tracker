import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid 
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Calendar, Settings, 
  ChevronRight, Search, Trash2, Send, Bot 
} from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { Currency, Category, Expense, ViewState } from './types';
import { convertCurrency, formatCurrency, getSymbol } from './services/currencyService';
import { getFinancialAdvice } from './services/geminiService';

// --- UI Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${className}`}>
    {children}
  </div>
);

const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6 pt-2 px-4">
    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

// --- Screens ---

// 1. Dashboard Screen
const Dashboard: React.FC<{ 
  expenses: Expense[]; 
  currency: Currency; 
  onSeeAll: () => void 
}> = ({ expenses, currency, onSeeAll }) => {
  
  const totalSpent = useMemo(() => 
    expenses.reduce((acc, curr) => acc + convertCurrency(curr.amount, curr.currency, currency), 0),
  [expenses, currency]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlySpent = useMemo(() => 
    expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + convertCurrency(curr.amount, curr.currency, currency), 0),
  [expenses, currency, currentMonth, currentYear]);

  const recentExpenses = [...expenses].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-4 pt-6 pb-2 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-medium text-slate-500">Total Balance</h2>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalSpent, currency)}
          </div>
        </div>
        <div className="bg-blue-50 p-2 rounded-full">
          <Wallet className="text-blue-600" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 mt-6">
        <Card className="bg-green-50 border-green-100">
          <div className="flex items-center space-x-2 text-green-700 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold uppercase">This Month</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {formatCurrency(monthlySpent, currency)}
          </div>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <div className="flex items-center space-x-2 text-purple-700 mb-1">
            <Calendar size={16} />
            <span className="text-xs font-semibold uppercase">Transactions</span>
          </div>
          <div className="text-lg font-bold text-purple-900">
            {expenses.length}
          </div>
        </Card>
      </div>

      <div className="mt-8 px-4">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
          <button onClick={onSeeAll} className="text-blue-600 text-sm font-medium flex items-center">
            See all <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="space-y-3">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No expenses yet
            </div>
          ) : (
            recentExpenses.map(expense => (
              <Card key={expense.id} className="flex items-center justify-between py-3 px-4 active:scale-[0.98] transition-transform">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm
                    ${expense.category === Category.Food ? 'bg-orange-400' : 
                      expense.category === Category.Transport ? 'bg-blue-400' :
                      expense.category === Category.Shopping ? 'bg-pink-400' : 'bg-slate-400'}`}
                  >
                    {expense.category[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{expense.description}</div>
                    <div className="text-xs text-slate-500">{expense.date} • {expense.category}</div>
                  </div>
                </div>
                <div className="font-bold text-slate-900">
                  {getSymbol(expense.currency)}{expense.amount}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Analytics Screen
const Analytics: React.FC<{ expenses: Expense[]; currency: Currency }> = ({ expenses, currency }) => {
  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#64748b'];

  // Prepare Category Data
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      const val = convertCurrency(e.amount, e.currency, currency);
      map.set(e.category, (map.get(e.category) || 0) + val);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses, currency]);

  // Prepare Monthly Data
  const monthlyData = useMemo(() => {
    const data: { name: string; amount: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    // Last 6 months
    for(let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      
      const total = expenses
        .filter(e => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === year;
        })
        .reduce((acc, curr) => acc + convertCurrency(curr.amount, curr.currency, currency), 0);
        
      data.push({ name: monthName, amount: Math.round(total) });
    }
    return data;
  }, [expenses, currency]);

  return (
    <div className="pb-24 px-4 pt-6">
      <Header title="Analytics" subtitle="Track your spending habits" />

      <Card className="mb-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">Spending by Category</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => formatCurrency(value, currency)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {categoryData.map((entry, index) => (
            <div key={entry.name} className="flex items-center text-xs">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-slate-600 truncate">{entry.name}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-bold text-slate-800 mb-4">Monthly Trends</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <RechartsTooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [formatCurrency(value, currency), 'Spent']}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

// 3. Add Expense Screen
const AddExpense: React.FC<{ 
  onAdd: (expense: Omit<Expense, 'id' | 'timestamp' | 'amountInBase'>) => void; 
  onCancel: () => void 
}> = ({ onAdd, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [curr, setCurr] = useState<Currency>(Currency.USD);
  const [cat, setCat] = useState<Category>(Category.Other);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc) return;
    
    onAdd({
      amount: parseFloat(amount),
      currency: curr,
      category: cat,
      description: desc,
      date: date,
    });
  };

  return (
    <div className="min-h-screen bg-white pb-24 px-4 pt-6">
      <Header title="Add Expense" />
      
      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
              {getSymbol(curr)}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Currency</label>
            <select
              value={curr}
              onChange={(e) => setCurr(e.target.value as Currency)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(Category).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCat(c)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  cat === c 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">Description</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Coffee with friends"
            required
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 active:scale-[0.99] transition-all"
          >
            Save Expense
          </button>
        </div>
      </form>
    </div>
  );
};

// 4. History Screen
const HistoryScreen: React.FC<{ expenses: Expense[]; onDelete: (id: string) => void }> = ({ expenses, onDelete }) => {
  return (
    <div className="pb-24 px-4 pt-6">
      <Header title="History" subtitle="All transactions" />
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No history available</div>
        ) : (
          expenses.sort((a, b) => b.timestamp - a.timestamp).map(expense => (
            <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
               <div>
                <div className="font-semibold text-slate-900">{expense.description}</div>
                <div className="text-xs text-slate-500">{expense.date} • {expense.category}</div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold text-slate-900">
                  {getSymbol(expense.currency)}{expense.amount}
                </span>
                <button 
                  onClick={() => onDelete(expense.id)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 5. Assistant Screen (Gemini)
const Assistant: React.FC<{ expenses: Expense[]; baseCurrency: Currency }> = ({ expenses, baseCurrency }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: `Hello! I can help you analyze your spending in ${baseCurrency}. Ask me anything!` }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const answer = await getFinancialAdvice(userMsg, expenses, baseCurrency);
    
    setLoading(false);
    setMessages(prev => [...prev, { role: 'ai', text: answer }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      <div className="px-4 pt-6 pb-2 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center">
          <Bot className="mr-2 text-blue-600" /> AI Assistant
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
               {msg.text.split('\n').map((line, i) => (
                 <p key={i} className={line.trim().startsWith('-') ? 'ml-2' : ''}>{line}</p>
               ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 rounded-tl-none flex space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 mb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your spending..."
            className="flex-1 bg-slate-100 border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !query.trim()}
            className="p-3 bg-blue-600 text-white rounded-full shadow-md disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [baseCurrency, setBaseCurrency] = useState<Currency>(Currency.EUR);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = (newExpense: Omit<Expense, 'id' | 'timestamp' | 'amountInBase'>) => {
    const expense: Expense = {
      ...newExpense,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      amountInBase: convertCurrency(newExpense.amount, newExpense.currency, Currency.USD),
    };
    setExpenses(prev => [...prev, expense]);
    setView('dashboard');
  };

  const handleDeleteExpense = (id: string) => {
    if(window.confirm("Delete this transaction?")) {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl overflow-hidden relative">
      {/* Top StatusBar Simulator (visual only) */}
      <div className="h-1 w-full bg-blue-600" />

      {/* Content Area */}
      <div className="h-full">
        {view === 'dashboard' && (
          <Dashboard 
            expenses={expenses} 
            currency={baseCurrency} 
            onSeeAll={() => setView('history')} 
          />
        )}
        {view === 'analytics' && (
          <Analytics expenses={expenses} currency={baseCurrency} />
        )}
        {view === 'add' && (
          <AddExpense onAdd={handleAddExpense} onCancel={() => setView('dashboard')} />
        )}
        {view === 'history' && (
          <HistoryScreen expenses={expenses} onDelete={handleDeleteExpense} />
        )}
        {view === 'assistant' && (
          <Assistant expenses={expenses} baseCurrency={baseCurrency} />
        )}
      </div>

      {/* Global Navigation */}
      <BottomNav currentView={view} setView={setView} />
      
      {/* Settings Cog (Floating for simplicity) */}
      {view === 'dashboard' && (
        <div className="absolute top-6 right-4 z-10">
            <select 
                className="bg-white/80 backdrop-blur text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-slate-200 outline-none text-slate-600"
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value as Currency)}
            >
                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      )}
    </div>
  );
};

export default App;