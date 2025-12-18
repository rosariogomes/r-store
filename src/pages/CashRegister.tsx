import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { 
    Lock, Unlock, TrendingUp, TrendingDown, 
    AlertTriangle, History, ArrowDown, ArrowUp, Wallet, DollarSign
} from 'lucide-react';

export const CashRegister = () => {
  const { cashSession, sales, openCashRegister, closeCashRegister, addCashMovement } = useStore();
  
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [moveType, setMoveType] = useState<'SUPPLY' | 'BLEED'>('SUPPLY');
  const [moveDesc, setMoveDesc] = useState('');
  const [moveValue, setMoveValue] = useState('');

  // --- Lógica de Cálculos em Tempo Real ---
  const registerSummary = useMemo(() => {
      if (!cashSession) return { currentBalance: 0, totalSupply: 0, totalBleed: 0, totalSalesCash: 0 };

      // 1. Soma Sangrias e Suprimentos
      const movements = cashSession.movements || [];
      const totalSupply = movements.filter(m => m.type === 'SUPPLY').reduce((acc, m) => acc + Number(m.amount), 0);
      const totalBleed = movements.filter(m => m.type === 'BLEED').reduce((acc, m) => acc + Number(m.amount), 0);

      // 2. Soma Vendas EM DINHEIRO (CASH) feitas após a abertura do caixa
      // (Pix e Cartão não entram na gaveta, então não somamos no saldo físico)
      const sessionStart = new Date(cashSession.opened_at).getTime();
      const cashSales = sales.filter(s => {
          const saleTime = new Date(s.created_at).getTime();
          return saleTime >= sessionStart && s.payment_method === 'CASH' && s.status === 'PAID';
      });
      const totalSalesCash = cashSales.reduce((acc, s) => acc + Number(s.total_amount), 0);

      // 3. Saldo Final em Gaveta
      const currentBalance = (cashSession.opening_balance || 0) + totalSupply - totalBleed + totalSalesCash;

      return { currentBalance, totalSupply, totalBleed, totalSalesCash };
  }, [cashSession, sales]);

  // --- Helpers ---
  const isSessionFromToday = () => {
      if (!cashSession) return true;
      const today = new Date().toDateString();
      const sessionDay = new Date(cashSession.opened_at).toDateString();
      return today === sessionDay;
  };

  const handleOpen = async () => {
      if (!amount) return alert("Informe o valor inicial");
      await openCashRegister(Number(amount));
      setAmount('');
  };

  const handleClose = async () => {
      if (!amount) return alert("Informe o valor em gaveta para conferência");
      await closeCashRegister(Number(amount), notes);
      setAmount('');
      setNotes('');
  };

  const handleMovement = async () => {
      if (!moveValue || !moveDesc) return alert("Preencha valor e descrição");
      await addCashMovement(moveType, Number(moveValue), moveDesc);
      setMoveValue('');
      setMoveDesc('');
  };

  // --- TELA 1: RECUPERAÇÃO DE CAIXA ESQUECIDO ---
  if (cashSession && !isSessionFromToday()) {
      return (
          <div className="pb-20 p-6 animate-fade-in flex items-center justify-center h-[80vh]">
              <div className="bg-zinc-900 border border-red-900/50 p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-600 animate-pulse"/>
                  <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle size={40} className="text-red-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Caixa Anterior Aberto</h1>
                  <p className="text-zinc-400 mb-6">
                      O caixa de <strong className="text-white">{new Date(cashSession.opened_at).toLocaleDateString()}</strong> não foi fechado.
                      <br/>Encerre-o para iniciar hoje.
                  </p>
                  <div className="bg-black/40 p-4 rounded-xl text-left border border-zinc-800 mb-6">
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Valor Final em Gaveta</label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                          <input 
                              type="number" 
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 pl-10 text-white focus:border-red-500 outline-none text-lg font-bold"
                              placeholder="0.00"
                              value={amount}
                              onChange={e => setAmount(e.target.value)}
                          />
                      </div>
                  </div>
                  <button onClick={handleClose} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                      <Lock size={20} /> Encerrar Caixa Anterior
                  </button>
              </div>
          </div>
      );
  }

  // --- TELA 2: ABRIR NOVO CAIXA ---
  if (!cashSession) {
      return (
          <div className="pb-20 p-6 animate-fade-in flex flex-col items-center justify-center h-[80vh]">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                  <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-500">
                      <Unlock size={32} />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Abrir Caixa</h1>
                  <p className="text-zinc-400 mb-8">Informe o fundo de troco para iniciar o dia.</p>
                  <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                      <input 
                          type="number" 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 text-white focus:border-brand-500 outline-none text-xl font-bold"
                          placeholder="0.00"
                          autoFocus
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                      />
                  </div>
                  <button onClick={handleOpen} className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20">
                      Iniciar Operação
                  </button>
              </div>
          </div>
      );
  }

  // --- TELA 3: CAIXA ABERTO ---
  return (
    <div className="pb-20 p-6 animate-fade-in">
        
        {/* Header e Cards de Saldo */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"/>
                <span className="text-zinc-400 text-sm">Caixa Aberto em {new Date(cashSession.opened_at).toLocaleDateString()} às {new Date(cashSession.opened_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Saldo Inicial */}
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
                    <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Saldo Inicial (Troco)</p>
                        <p className="text-2xl font-bold text-zinc-300">R$ {cashSession.opening_balance.toFixed(2)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <History size={24} />
                    </div>
                </div>

                {/* Card Saldo Atual (Dinâmico) */}
                <div className="bg-zinc-900 p-6 rounded-2xl border border-brand-900/50 bg-gradient-to-br from-zinc-900 to-brand-900/10 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/10 rounded-bl-full -mr-4 -mt-4" />
                    <div>
                        <p className="text-brand-500 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                            <Wallet size={12} /> Dinheiro em Gaveta (Atual)
                        </p>
                        <p className="text-3xl font-bold text-white">R$ {registerSummary.currentBalance.toFixed(2)}</p>
                        <div className="flex gap-3 mt-2 text-[10px] text-zinc-400">
                            <span>Vendas: +{registerSummary.totalSalesCash.toFixed(2)}</span>
                            <span>Entradas: +{registerSummary.totalSupply.toFixed(2)}</span>
                            <span>Saídas: -{registerSummary.totalBleed.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Nova Movimentação */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-brand-500"/> Nova Movimentação
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <button 
                        onClick={() => setMoveType('SUPPLY')}
                        className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-2 transition-all ${
                            moveType === 'SUPPLY' 
                            ? 'bg-green-600/10 border-green-600 text-green-500' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                    >
                        <ArrowUp size={20} /> Suprimento
                    </button>
                    <button 
                        onClick={() => setMoveType('BLEED')}
                        className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-2 transition-all ${
                            moveType === 'BLEED' 
                            ? 'bg-red-600/10 border-red-600 text-red-500' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                    >
                        <ArrowDown size={20} /> Sangria
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Valor</label>
                            <input 
                                type="number" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold"
                                placeholder="0.00"
                                value={moveValue}
                                onChange={e => setMoveValue(e.target.value)}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Motivo</label>
                            <input 
                                type="text" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                                placeholder="Ex: Pagamento Motoboy..."
                                value={moveDesc}
                                onChange={e => setMoveDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <button onClick={handleMovement} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
                        Registrar
                    </button>
                </div>
            </div>

            {/* Fechamento do Dia */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-fit">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Lock size={20} className="text-red-500"/> Fechamento do Dia
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Valor Final em Gaveta (Conferência)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                            <input 
                                type="number" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-red-500 outline-none font-bold text-lg"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20">
                        Encerrar Caixa
                    </button>
                </div>
            </div>
        </div>

        {/* LISTA DE HISTÓRICO DE MOVIMENTAÇÕES */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                <History size={18} className="text-zinc-400" />
                <h3 className="font-bold text-white">Histórico de Movimentações</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">Horário</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Descrição</th>
                            <th className="p-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                        {(!cashSession.movements || cashSession.movements.length === 0) && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-zinc-500 italic">
                                    Nenhuma movimentação registrada hoje.
                                </td>
                            </tr>
                        )}
                        
                        {/* Renderiza Movimentações */}
                        {cashSession.movements?.slice().reverse().map((mov) => (
                            <tr key={mov.id} className="hover:bg-zinc-800/50">
                                <td className="p-4 text-zinc-400">
                                    {new Date(mov.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="p-4">
                                    {mov.type === 'SUPPLY' ? (
                                        <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold">SUPRIMENTO</span>
                                    ) : (
                                        <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-bold">SANGRIA</span>
                                    )}
                                </td>
                                <td className="p-4 text-white font-medium">{mov.description}</td>
                                <td className={`p-4 text-right font-bold ${mov.type === 'SUPPLY' ? 'text-green-500' : 'text-red-500'}`}>
                                    {mov.type === 'SUPPLY' ? '+' : '-'} R$ {Number(mov.amount).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};