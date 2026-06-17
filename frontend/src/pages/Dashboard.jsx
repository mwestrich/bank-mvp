import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import BalanceCard from '../components/BalanceCard';
import TransactionList from '../components/TransactionList';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon, colorClass }) {
  return (
    <div className="card-p flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse-slow">
      <div className="skeleton h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, txCount: 0 });
  const [fundingSources, setFundingSources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedFundingSourceId, setSelectedFundingSourceId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [accRes, txRes, fundRes] = await Promise.all([
        api.get('/accounts/me'),
        api.get('/accounts/recent-transactions'),
        api.get('/funding')
      ]);
      setAccount(accRes.data);
      setFundingSources(fundRes.data);
      if (fundRes.data.length > 0) {
        setSelectedFundingSourceId(fundRes.data[0].id.toString());
      }
      const txs = txRes.data;
      setRecentTx(txs);
      // compute quick stats
      const totalIn = txs.filter(t => t.type === 'deposit').reduce((s, t) => s + parseFloat(t.amount), 0);
      const totalOut = txs.filter(t => t.type === 'withdrawal').reduce((s, t) => s + parseFloat(t.amount), 0);
      setStats({ totalIn, totalOut, txCount: txs.length });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    setActionLoading(true);
    try {
      await api.post('/transactions/deposit', {
        accountNumber: account.account_number,
        amount: amt,
        ...(selectedFundingSourceId && { fundingSourceId: parseInt(selectedFundingSourceId, 10) })
      });
      toast.success(`$${amt.toFixed(2)} deposited successfully!`);
      setDepositOpen(false);
      setDepositAmount('');
      setLoading(true);
      fetchData();
    } catch { /* toasted */ } finally { setActionLoading(false); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    setActionLoading(true);
    try {
      await api.post('/transactions/withdraw', {
        accountNumber: account.account_number,
        amount: amt,
        ...(selectedFundingSourceId && { fundingSourceId: parseInt(selectedFundingSourceId, 10) })
      });
      toast.success(`$${amt.toFixed(2)} withdrawn successfully!`);
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setLoading(true);
      fetchData();
    } catch { /* toasted */ } finally { setActionLoading(false); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {greeting()}, {firstName} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-sm">Here's your financial overview.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="open-deposit-btn"
            onClick={() => setDepositOpen(true)}
            className="btn-success btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Deposit
          </button>
          <button
            id="open-withdraw-btn"
            onClick={() => setWithdrawOpen(true)}
            className="btn-danger btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            Withdraw
          </button>
        </div>
      </div>

      {/* RIS Notice Banner */}
      {account && account.has_ris_notice && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="text-rose-400 font-semibold">Action Required: Uncleared IRS Tax Notice</h3>
            <p className="text-sm text-slate-300 mt-1">
              You have an outstanding IRS tax. Outbound transactions (Withdrawals and Transfers) have been temporarily restricted until this balance is cleared.
            </p>
          </div>
        </div>
      )}

      {loading ? <DashboardSkeleton /> : (
        <>
          {/* Balance Card */}
          {account && (
            <BalanceCard
              balance={account.balance}
              accountNumber={account.account_number}
              jointText={account.joint_owner_name ? `Joint with ${user?.full_name === account.owner_name ? account.joint_owner_name : account.owner_name}` : null}
            />
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Recent Deposits"
              value={`$${stats.totalIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              colorClass="bg-emerald-500/15"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
            />
            <StatCard
              label="Recent Withdrawals"
              value={`$${stats.totalOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              colorClass="bg-rose-500/15"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>}
            />
            <StatCard
              label="Recent Transactions"
              value={stats.txCount}
              colorClass="bg-navy-500/20"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            />
          </div>

          {/* Quick actions row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/transfer', label: 'Transfer', icon: '↔', color: 'text-navy-300 bg-navy-500/20' },
              { to: '/history', label: 'History', icon: '📋', color: 'text-slate-300 bg-surface-hover' },
              { to: '/profile', label: 'Profile', icon: '👤', color: 'text-slate-300 bg-surface-hover' },
            ].map(({ to, label, icon, color }) => (
              <Link key={to} to={to} className={`card flex flex-col items-center justify-center gap-2 py-4 hover:bg-surface-hover transition-colors ${color}`}>
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium text-slate-400">{label}</span>
              </Link>
            ))}
          </div>

          {/* Recent transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-200">Recent Activity</h2>
              <Link to="/history" className="text-sm text-navy-400 hover:text-navy-300 transition-colors font-medium">
                View all →
              </Link>
            </div>
            <TransactionList transactions={recentTx} />
          </div>
        </>
      )}

      {/* Deposit Modal */}
      <Modal isOpen={depositOpen} onClose={() => { setDepositOpen(false); setDepositAmount(''); }} title="Deposit Funds">
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="deposit-source" className="input-label">From Account</label>
            {fundingSources.length > 0 ? (
              <select id="deposit-source" className="input" value={selectedFundingSourceId} onChange={(e) => setSelectedFundingSourceId(e.target.value)}>
                {fundingSources.map(s => (
                  <option key={s.id} value={s.id}>{s.bank_name} (•••• {s.account_last4})</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-amber-400 bg-amber-400/10 p-3 rounded-xl border border-amber-400/20">
                You have no linked accounts. <Link to="/profile" className="font-bold underline" onClick={() => setDepositOpen(false)}>Add one in your profile</Link> to make realistic deposits, or continue with a generic cash deposit.
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="deposit-amount" className="input-label">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="input pl-8"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          {/* Preset amounts */}
          <div className="flex gap-2 flex-wrap">
            {[100, 500, 1000, 5000].map(amt => (
              <button key={amt} type="button"
                onClick={() => setDepositAmount(String(amt))}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${parseFloat(depositAmount) === amt
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-surface-border text-slate-400 hover:border-surface-hover hover:text-slate-200'
                  }`}
              >
                ${amt.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setDepositOpen(false); setDepositAmount(''); }} className="btn-secondary btn flex-1">Cancel</button>
            <button id="confirm-deposit" type="submit" disabled={actionLoading || !depositAmount} className="btn-success btn flex-1">
              {actionLoading ? 'Processing…' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={withdrawOpen} onClose={() => { setWithdrawOpen(false); setWithdrawAmount(''); }} title="Withdraw Funds">
        <form onSubmit={handleWithdraw} className="space-y-4">
          {account && (
            <div className="bg-surface rounded-xl p-3 border border-surface-border text-sm text-slate-400">
              Available balance: <span className="text-slate-200 font-semibold">
                ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="withdraw-dest" className="input-label">To Account</label>
            {fundingSources.length > 0 ? (
              <select id="withdraw-dest" className="input" value={selectedFundingSourceId} onChange={(e) => setSelectedFundingSourceId(e.target.value)}>
                {fundingSources.map(s => (
                  <option key={s.id} value={s.id}>{s.bank_name} (•••• {s.account_last4})</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-amber-400 bg-amber-400/10 p-3 rounded-xl border border-amber-400/20">
                You have no linked accounts. <Link to="/profile" className="font-bold underline" onClick={() => setWithdrawOpen(false)}>Add one in your profile</Link> to make realistic withdrawals, or continue with a generic cash withdrawal.
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="withdraw-amount" className="input-label">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={account?.balance}
                className="input pl-8"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setWithdrawOpen(false); setWithdrawAmount(''); }} className="btn-secondary btn flex-1">Cancel</button>
            <button id="confirm-withdraw" type="submit" disabled={actionLoading || !withdrawAmount} className="btn-danger btn flex-1">
              {actionLoading ? 'Processing…' : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}