import React from 'react';

const TX_META = {
  deposit: {
    label: 'Deposit',
    badgeClass: 'badge-deposit',
    amountClass: 'text-emerald-400',
    sign: '+',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
    ),
  },
  withdrawal: {
    label: 'Withdrawal',
    badgeClass: 'badge-withdrawal',
    amountClass: 'text-rose-400',
    sign: '-',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </div>
    ),
  },
  transfer: {
    label: 'Transfer',
    badgeClass: 'badge-transfer',
    amountClass: 'text-navy-300',
    sign: '',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-navy-500/20 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
    ),
  },
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TransactionList({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="card-p flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">No transactions found</p>
        <p className="text-slate-600 text-sm mt-1">Your activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-surface-border overflow-hidden">
      {transactions.map((tx) => {
        const meta = TX_META[tx.type] || TX_META.transfer;
        const desc = tx.description ||
          (tx.type === 'transfer' && tx.to_account !== tx.from_account
            ? `Transfer → ${tx.to_account}`
            : meta.label);
        const amount = parseFloat(tx.amount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return (
          <div
            key={tx.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-surface-hover transition-colors duration-150"
          >
            {meta.icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{desc}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(tx.created_at)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-semibold font-mono ${meta.amountClass}`}>
                {meta.sign}${amount}
              </p>
              <span className={`${meta.badgeClass} mt-1`}>{meta.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}