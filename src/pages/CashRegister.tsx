import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { 
    Lock, Unlock, DollarSign, TrendingUp, TrendingDown, 
    AlertTriangle, Calendar, Save, History 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export const CashRegister = () => {
  const { cashSession, openCashRegister, closeCashRegister, addCashMovement } = useStore();
  
  // Estado para Inputs
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [moveType, setMoveType] = useState<'SUPPLY' | 'BLEED'>('SUPPLY');
  const [moveDesc, setMoveDesc] = useState('');
  const [moveValue, setMoveValue] = useState('');

  // Lógica de "Caixa Esquecido"
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
      alert("Movimentação registrada!");
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
                      Identificamos que o caixa do dia <strong className="text-white">{new Date(cashSession.opened_at).toLocaleDateString()}</strong> não foi fechado corretamente.
                      <br/><br/>
                      Para iniciar as vendas de hoje, você precisa encerrar a sessão anterior.
                  </p>

                  <div className="bg-black/40 p-4 rounded-xl text-left border border-zinc-800 mb-6">
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Valor Final em Gaveta (Dia anterior)</label>
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

                  <button 
                      onClick={handleClose}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                  >
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

                  <button 
                      onClick={handleOpen}
                      className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-900/20"
                  >
                      Iniciar Operação
                  </button>
              </div>
          </div>
      );
  }

  // --- TELA 3: CAIXA ABERTO (Painel de Controle) ---
  return (
    <div className="pb-20 p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"/> Caixa Aberto
                </h1>
                <p className="text-zinc-400 text-sm mt-1">
                    Aberto em {new Date(cashSession.opened_at).toLocaleDateString()} às {new Date(cashSession.opened_at).toLocaleTimeString()}
                </p>
            </div>
            <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 text-right">
                <p className="text-xs text-zinc-500 uppercase font-bold">Saldo Inicial</p>
                <p className="text-xl font-bold text-white">R$ {cashSession.opening_balance.toFixed(2)}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Lançar Movimentação */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <History size={20} className="text-brand-500"/> Nova Movimentação
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
                        <TrendingUp size={20} /> Suprimento (Entrada)
                    </button>
                    <button 
                        onClick={() => setMoveType('BLEED')}
                        className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-2 transition-all ${
                            moveType === 'BLEED' 
                            ? 'bg-red-600/10 border-red-600 text-red-500' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                    >
                        <TrendingDown size={20} /> Sangria (Saída)
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Valor</label>
                        <input 
                            type="number" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none font-bold"
                            placeholder="0.00"
                            value={moveValue}
                            onChange={e => setMoveValue(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Motivo / Descrição</label>
                        <input 
                            type="text" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                            placeholder="Ex: Pagamento de Motoboy..."
                            value={moveDesc}
                            onChange={e => setMoveDesc(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleMovement}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors mt-2"
                    >
                        Registrar Movimentação
                    </button>
                </div>
            </div>

            {/* Fechamento do Dia */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-fit">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Lock size={20} className="text-red-500"/> Fechamento do Dia
                </h2>
                
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                    <p className="text-sm text-red-200 flex gap-2">
                        <AlertTriangle size={18} className="shrink-0"/>
                        Ao fechar o caixa, você não poderá realizar novas vendas até abrir uma nova sessão.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Valor em Gaveta (Conferência)</label>
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
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Observações (Opcional)</label>
                        <textarea 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-red-500 outline-none resize-none h-24"
                            placeholder="Diferença de caixa, observações do dia..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleClose}
                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20"
                    >
                        Encerrar Caixa
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};