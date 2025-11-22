import React from 'react';
import { LayoutDashboard, PieChart, PlusCircle, History, Bot } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItemClass = (view: ViewState) =>
    `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      currentView === view ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 shadow-lg pb-safe">
      <div className="grid grid-cols-5 h-full max-w-md mx-auto">
        <button onClick={() => setView('dashboard')} className={navItemClass('dashboard')}>
          <LayoutDashboard size={24} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button onClick={() => setView('analytics')} className={navItemClass('analytics')}>
          <PieChart size={24} strokeWidth={currentView === 'analytics' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Charts</span>
        </button>

        <button onClick={() => setView('add')} className="relative flex flex-col items-center justify-center w-full h-full -mt-6">
          <div className="p-3 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
            <PlusCircle size={32} color="white" />
          </div>
          <span className="text-[10px] font-medium text-gray-500 mt-1">Add</span>
        </button>

        <button onClick={() => setView('history')} className={navItemClass('history')}>
          <History size={24} strokeWidth={currentView === 'history' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">History</span>
        </button>

        <button onClick={() => setView('assistant')} className={navItemClass('assistant')}>
          <Bot size={24} strokeWidth={currentView === 'assistant' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">AI Help</span>
        </button>
      </div>
    </div>
  );
};
