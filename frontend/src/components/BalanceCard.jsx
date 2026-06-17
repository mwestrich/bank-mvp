import React, { useState } from 'react';

export default function BalanceCard({ balance, accountNumber, jointText }) {
  const [revealed, setRevealed] = useState(false);
  const masked = accountNumber
    ? `•••• •••• ${accountNumber.slice(-4)}`
    : '•••• •••• ••••';

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-glow"
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #2563eb 100%)',
        minHeight: '180px',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute top-1/2 right-16 w-24 h-24 rounded-full bg-purple-500/20" />

      <div className="relative p-6 sm:p-8 flex flex-col justify-between h-full" style={{ minHeight: '180px' }}>
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Total Balance</p>
              {jointText && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  {jointText}
                </span>
              )}
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-1">
              ${parseFloat(balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {/* Chip icon */}
          <div className="hidden sm:block opacity-80">
            <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="38" height="30" rx="5" fill="#f59e0b" opacity="0.9" />
              <rect x="14" y="1" width="12" height="30" fill="#d97706" opacity="0.5" />
              <rect x="1" y="11" width="38" height="10" fill="#d97706" opacity="0.5" />
              <rect x="14" y="11" width="12" height="10" fill="#b45309" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between mt-8">
          <div>
            <p className="text-white/50 text-xs mb-1 tracking-wider uppercase">Account Number</p>
            <div className="flex items-center gap-2">
              <p className="text-white font-mono text-sm tracking-widest">
                {revealed ? accountNumber : masked}
              </p>
              <button
                onClick={() => setRevealed(!revealed)}
                className="text-white/50 hover:text-white transition-colors"
                aria-label={revealed ? 'Hide account number' : 'Reveal account number'}
              >
                {revealed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>
          {/* Azem Bank wordmark on card */}
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase">Azem Bank</p>
        </div>
      </div>
    </div>
  );
}