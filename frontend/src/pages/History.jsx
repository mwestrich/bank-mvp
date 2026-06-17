import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import TransactionList from '../components/TransactionList';

const TYPES = [
  { value: '',           label: 'All Types' },
  { value: 'deposit',    label: 'Deposits' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'transfer',   label: 'Transfers' },
];

function HistorySkeleton() {
  return (
    <div className="card divide-y divide-surface-border overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
          <div className="space-y-2 text-right">
            <div className="skeleton h-3.5 w-20 rounded" />
            <div className="skeleton h-5 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from_date: '', to_date: '', type: '' });
  const [summary, setSummary] = useState({ in: 0, out: 0, count: 0 });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date)   params.append('to_date',   filters.to_date);
      if (filters.type)      params.append('type',      filters.type);
      const res = await api.get(`/transactions/history?${params.toString()}`);
      const txs = res.data;
      setTransactions(txs);
      const totalIn  = txs.filter(t => t.type === 'deposit').reduce((s,t) => s + parseFloat(t.amount), 0);
      const totalOut = txs.filter(t => t.type === 'withdrawal').reduce((s,t) => s + parseFloat(t.amount), 0);
      setSummary({ in: totalIn, out: totalOut, count: txs.length });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleFilter = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const hasFilters = filters.from_date || filters.to_date || filters.type;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Transaction History</h1>
        <p className="text-slate-500 text-sm mt-1">A complete record of your account activity.</p>
      </div>

      {/* Summary chips */}
      {!loading && transactions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="card flex items-center gap-2 px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-sm text-slate-400">{summary.count} transactions</span>
          </div>
          <div className="card flex items-center gap-2 px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-400">In: <span className="text-emerald-400 font-semibold">${summary.in.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
          </div>
          <div className="card flex items-center gap-2 px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-sm text-slate-400">Out: <span className="text-rose-400 font-semibold">${summary.out.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-p">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="form-group flex-1 min-w-36">
            <label htmlFor="hist-from" className="input-label">From Date</label>
            <input id="hist-from" type="date" name="from_date" value={filters.from_date}
              onChange={handleFilter} className="input" />
          </div>
          <div className="form-group flex-1 min-w-36">
            <label htmlFor="hist-to" className="input-label">To Date</label>
            <input id="hist-to" type="date" name="to_date" value={filters.to_date}
              onChange={handleFilter} className="input" />
          </div>
          <div className="form-group flex-1 min-w-36">
            <label htmlFor="hist-type" className="input-label">Transaction Type</label>
            <select id="hist-type" name="type" value={filters.type}
              onChange={handleFilter} className="input">
              {TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              id="reset-filters-btn"
              type="button"
              onClick={() => setFilters({ from_date: '', to_date: '', type: '' })}
              className="btn-secondary btn self-end"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? <HistorySkeleton /> : <TransactionList transactions={transactions} />}
    </div>
  );
}