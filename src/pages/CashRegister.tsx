import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useStore } from '../context/StoreContext';
import { CashRegisterMovement } from '../types'; // <--- CORREÇÃO 1: Importei o tipo

export const CashRegister = () => {
  const { cashSession, openCashRegister, closeCashRegister, addCashMovement } = useStore();
  const [showModal, setShowModal] = useState<'OPEN' | 'MOVEMENT' | 'CLOSE' | null>(null);
  
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [closingCount, setClosingCount] = useState({ cash: '', card: '', pix: '' });

  const isOpen = cashSession?.status === 'OPEN';
  
  // <--- CORREÇÃO 2: Tipagem explícita para o TypeScript não se perder
  const movements: CashRegisterMovement[] = cashSession?.movements || [];

  // Calculations
  const totalIn = movements.filter(m => m.amount > 0 && m.type !== 'OPENING').reduce((acc, m) => acc + m.amount, 0);
  const totalOut = movements.filter(m => m.amount < 0).reduce((acc, m) => acc + Math.abs(m.amount), 0);
  const currentTotal = cashSession?.current_balance || 0;

  // Handlers
  const handleMovement = (type: 'SUPPLY' | 'BLEED') => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;

    // Use Context Action
    addCashMovement(
        type, 
        type === 'BLEED' ? -amount : amount, 
        formDesc || (type === 'BLEED' ? 'Sangria' : 'Suprimento')
    );

    setShowModal(null);
    setFormAmount('');
    setFormDesc('');
  };

  const handleCloseRegister = () => {
    const declaredTotal = Number(closingCount.cash) + Number(closingCount.card) + Number(closingCount.pix);
    const diff = declaredTotal - currentTotal;
    
    alert(`Caixa Fechado!\n\nSistema: R$ ${currentTotal.toFixed(2)}\nDeclarado: R$ ${declaredTotal.toFixed(2)}\nDiferença: R$ ${diff.toFixed(2)}`);
    
    closeCashRegister();
    setShowModal(null);
  };

  const handleOpenRegister = () => {
    const initial = parseFloat(formAmount) || 0;
    openCashRegister(initial);
    setShowModal(null);
    setFormAmount('');
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Controle de Caixa</h1>
          <p className="text-zinc-400">
             {isOpen ? 'Caixa Aberto • Operando' : 'Caixa Fechado'} • {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-3">
            {!isOpen ? (
                <button 
                    onClick={() => setShowModal('OPEN')}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20"
                >
                    <ICONS.Lock size={20} /> Abrir Caixa
                </button>
            ) : (
                <>
                    <button 
                        onClick={() => setShowModal('MOVEMENT')}
                        className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-medium rounded-xl transition-colors"
                    >
                        <ICONS.Money size={20} /> Movimentar
                    </button>
                    <button 
                        onClick={() => setShowModal('CLOSE')}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20"
                    >
                        <ICONS.Check size={20} /> Fechar Caixa
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Grid */}
      {isOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Stats */}
            <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <ICONS.Money size={100} />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium mb-1">Saldo em Caixa (Atual)</p>
                    <h2 className="text-4xl font-bold text-white mb-4">R$ {currentTotal.toFixed(2)}</h2>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                        <div>
                            <p className="text-xs text-zinc-500 mb-1">Entradas</p>
                            <p className="text-green-500 font-bold">+ R$ {totalIn.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 mb-1">Saídas</p>
                            <p className="text-red-500 font-bold">- R$ {totalOut.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                     <h3 className="text-white font-bold mb-4 flex items-center gap-2"><ICONS.Sales size={18} /> Resumo do Dia</h3>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                            <span className="text-zinc-400 text-sm">Abertura</span>
                            <span className="text-white font-mono">R$ {cashSession.opening_balance.toFixed(2)}</span>
                        </div>
                        {/* Summary breakdown logic could be enhanced here, showing totals per method */}
                        <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                             <span className="text-zinc-400 text-sm">Vendas/Recebimentos</span>
                             <span className="text-green-500 font-mono">+ R$ {totalIn.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                             <span className="text-zinc-400 text-sm">Sangrias/Despesas</span>
                             <span className="text-red-500 font-mono">- R$ {totalOut.toFixed(2)}</span>
                        </div>
                     </div>
                </div>
            </div>

            {/* Right: Timeline */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                    <ICONS.Trending size={20} /> Movimentações
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {movements.map((mov) => (
                        <div key={mov.id} className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800 group hover:border-zinc-700 transition-colors">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg 
                                    ${mov.type === 'OPENING' ? 'bg-blue-500/10 text-blue-500' : 
                                      mov.type === 'SALE' || mov.type === 'SUPPLY' || mov.type === 'RECEIPT' ? 'bg-green-500/10 text-green-500' : 
                                      'bg-red-500/10 text-red-500'}`}>
                                    {mov.type === 'OPENING' && <ICONS.Lock size={18} />}
                                    {(mov.type === 'SALE' || mov.type === 'RECEIPT') && <ICONS.Sales size={18} />}
                                    {mov.type === 'SUPPLY' && <ICONS.Income size={18} />}
                                    {mov.type === 'BLEED' && <ICONS.Expense size={18} />}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{mov.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <span>{mov.timestamp}</span>
                                        <span>•</span>
                                        <span className="uppercase">{mov.type === 'OPENING' ? 'Abertura' : mov.type === 'RECEIPT' ? 'Recebimento' : mov.type === 'SALE' ? 'Venda' : mov.type === 'SUPPLY' ? 'Suprimento' : 'Sangria'}</span>
                                        {mov.method && (
                                            <>
                                                <span>•</span>
                                                <span className="text-zinc-400 font-bold">{mov.method}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                             </div>
                             <span className={`font-mono font-bold ${mov.amount >= 0 ? 'text-white' : 'text-red-500'}`}>
                                {mov.amount >= 0 ? '+' : ''} R$ {mov.amount.toFixed(2)}
                             </span>
                        </div>
                    ))}
                    {movements.length === 0 && (
                        <p className="text-zinc-500 text-center py-4">Nenhuma movimentação.</p>
                    )}
                </div>
            </div>
        </div>
      )}

      {!isOpen && (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl border-dashed">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                  <ICONS.Lock size={40} className="text-zinc-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">O Caixa está fechado</h2>
              <p className="text-zinc-500 mb-6 max-w-md text-center">Nenhuma movimentação pode ser feita até que o caixa seja aberto. Inicie o dia informando o saldo inicial.</p>
              <button 
                onClick={() => setShowModal('OPEN')}
                className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors"
              >
                  Abrir Caixa Agora
              </button>
          </div>
      )}

      {/* Modals */}
      {showModal === 'OPEN' && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-4">Abertura de Caixa</h3>
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Saldo Inicial (Fundo de Troco)</label>
                <input 
                    type="number" 
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white mb-6 focus:outline-none focus:border-brand-600"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                />
                <div className="flex gap-3">
                    <button onClick={() => setShowModal(null)} className="flex-1 py-3 text-zinc-400 hover:bg-zinc-800 rounded-xl">Cancelar</button>
                    <button onClick={handleOpenRegister} className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl">Confirmar</button>
                </div>
            </div>
         </div>
      )}

      {showModal === 'MOVEMENT' && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-4">Nova Movimentação</h3>
                
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Valor (R$)</label>
                <input 
                    type="number" 
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white mb-4 focus:outline-none focus:border-brand-600"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                />
                
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Descrição / Motivo</label>
                <input 
                    type="text" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white mb-6 focus:outline-none focus:border-brand-600"
                    placeholder="Ex: Pagamento Fornecedor"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3 mb-4">
                     <button 
                        onClick={() => handleMovement('SUPPLY')}
                        className="py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 font-bold rounded-xl border border-green-500/20"
                     >
                        + Suprimento
                     </button>
                     <button 
                        onClick={() => handleMovement('BLEED')}
                        className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/20"
                     >
                        - Sangria
                     </button>
                </div>
                <button onClick={() => setShowModal(null)} className="w-full py-3 text-zinc-400 hover:bg-zinc-800 rounded-xl">Cancelar</button>
            </div>
         </div>
      )}

      {showModal === 'CLOSE' && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-lg">
                <h3 className="text-xl font-bold text-white mb-1">Conferência de Fechamento</h3>
                <p className="text-zinc-500 text-sm mb-6">Informe os valores contados fisicamente.</p>
                
                <div className="space-y-4 mb-8">
                     <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Dinheiro em Espécie</label>
                        <input 
                            type="number" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                            placeholder="0.00"
                            value={closingCount.cash}
                            onChange={e => setClosingCount({...closingCount, cash: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Cartões (Máquina)</label>
                            <input 
                                type="number" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                                placeholder="0.00"
                                value={closingCount.card}
                                onChange={e => setClosingCount({...closingCount, card: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Pix</label>
                            <input 
                                type="number" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                                placeholder="0.00"
                                value={closingCount.pix}
                                onChange={e => setClosingCount({...closingCount, pix: e.target.value})}
                            />
                        </div>
                     </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-6 flex justify-between items-center">
                     <span className="text-zinc-400">Total Esperado pelo Sistema</span>
                     <span className="text-white font-bold">R$ {currentTotal.toFixed(2)}</span>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setShowModal(null)} className="flex-1 py-3 text-zinc-400 hover:bg-zinc-800 rounded-xl">Cancelar</button>
                    <button onClick={handleCloseRegister} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20">Finalizar Dia</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};