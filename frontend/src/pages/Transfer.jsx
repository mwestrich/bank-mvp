import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Transfer() {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [balance, setBalance] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/accounts/me').then(res => {
      setFromAccount(res.data.account_number);
      setBalance(res.data.balance);
      setAccount(res.data);
    }).catch(console.error);
  }, []);

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!toAccount || !amount || parseFloat(amount) <= 0) return;
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/transactions/transfer', {
        fromAccount,
        toAccount,
        amount: parseFloat(amount),
        ...(note && { description: note }),
      });
      toast.success('Transfer completed successfully!');
      navigate('/');
    } catch { /* toasted */ } finally { setLoading(false); }
  };

  const amt = parseFloat(amount) || 0;
  const remaining = balance !== null ? parseFloat(balance) - amt : null;

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100">Transfer Funds</h1>
        <p className="text-slate-500 text-sm mt-1">Send money instantly to any Azem Bank account.</p>
      </div>

      {account && account.has_ris_notice && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="text-rose-400 font-semibold">Action Required: Uncleared IRS Tax Notice</h3>
            <p className="text-sm text-slate-300 mt-1">
              You have an outstanding IRS tax balance. Outbound transactions (Withdrawals and Transfers) have been temporarily restricted until this balance is cleared.
            </p>
          </div>
        </div>
      )}

      {step === 'form' ? (
        <div className="card-p space-y-5">
          {/* From account */}
          <div className="form-group">
            <label className="input-label">From Account</label>
            <div className="input flex items-center gap-3 cursor-not-allowed opacity-60">
              <div className="w-8 h-8 rounded-lg bg-navy-600/40 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <div>
                <p className="text-slate-200 font-mono text-sm">{fromAccount || '—'}</p>
                {balance !== null && (
                  <p className="text-xs text-slate-500">
                    Available: ${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* To account */}
          <div className="form-group">
            <label htmlFor="to-account" className="input-label">Recipient Account Number</label>
            <input
              id="to-account"
              type="text"
              className="input font-mono"
              placeholder="10-digit account number"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              maxLength={10}
              pattern="\d{10}"
            />
            {toAccount.length > 0 && toAccount.length < 10 && (
              <p className="text-xs text-amber-400 mt-1">{10 - toAccount.length} more digit{10 - toAccount.length !== 1 ? 's' : ''} needed</p>
            )}
            {toAccount.length === 10 && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Valid format
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="transfer-amount" className="input-label">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
              <input
                id="transfer-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="input pl-8"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {balance !== null && amt > 0 && (
              <div className={`text-xs mt-1 ${remaining < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {remaining < 0
                  ? `⚠ Insufficient funds — you're $${Math.abs(remaining).toFixed(2)} short`
                  : `Remaining after transfer: $${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </div>
            )}
          </div>

          {/* Note */}
          <div className="form-group">
            <label htmlFor="transfer-note" className="input-label">Note <span className="text-slate-600">(optional)</span></label>
            <input
              id="transfer-note"
              type="text"
              className="input"
              placeholder="What's this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/')} className="btn-secondary btn flex-1">Cancel</button>
            <button
              id="transfer-review-btn"
              type="button"
              onClick={handleConfirm}
              disabled={!toAccount || toAccount.length !== 10 || !amount || amt <= 0 || (balance !== null && amt > parseFloat(balance)) || (account && account.has_ris_notice)}
              className="btn-primary btn flex-1"
            >
              Review Transfer →
            </button>
          </div>
        </div>
      ) : (
        <div className="card-p space-y-5 animate-slide-up">
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-navy-600/20 border border-navy-500/30 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Confirm Transfer</h2>
            <p className="text-slate-500 text-sm mt-1">Please review the details before proceeding.</p>
          </div>

          {/* Summary */}
          <div className="bg-surface rounded-2xl border border-surface-border divide-y divide-surface-border overflow-hidden">
            {[
              { label: 'From', value: fromAccount, mono: true },
              { label: 'To', value: toAccount, mono: true },
              { label: 'Amount', value: `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bold: true, green: true },
              ...(note ? [{ label: 'Note', value: note }] : []),
            ].map(({ label, value, mono, bold, green }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-slate-500">{label}</span>
                <span className={`text-sm ${mono ? 'font-mono' : ''} ${bold ? 'font-bold text-base' : ''} ${green ? 'text-emerald-400' : 'text-slate-200'}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('form')} className="btn-secondary btn flex-1">← Edit</button>
            <button
              id="confirm-transfer-btn"
              type="button"
              onClick={handleSubmit}
              disabled={loading || (account && account.has_ris_notice)}
              className="btn-primary btn flex-1"
            >
              {loading ? (
                <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending…</>
              ) : 'Confirm & Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}