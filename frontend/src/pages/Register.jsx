import React, { useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { email, full_name: fullName, password });
      toast.success('Account created! Check your email for the OTP.');
      setStep('otp');
    } catch {
      // toasted by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('Account verified! You can now sign in.');
      navigate('/login');
    } catch {
      // toasted by interceptor
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    if (password.length === 0) return { score: 0, label: '', color: '' };
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    const map = [
      { score: 1, label: 'Weak',   color: 'bg-rose-500' },
      { score: 2, label: 'Fair',   color: 'bg-amber-500' },
      { score: 3, label: 'Good',   color: 'bg-yellow-400' },
      { score: 4, label: 'Strong', color: 'bg-emerald-500' },
    ];
    return { score: s, ...map[s - 1] };
  })();

  return (
    <div className="min-h-screen flex">
      {/* Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1d4ed8 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-start w-full p-16">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-6">Join Azem Bank</h2>
          <div className="space-y-5">
            {[
              { icon: '🔒', title: 'Bank-grade Security', desc: 'Your data is protected with AES-256 encryption.' },
              { icon: '⚡', title: 'Instant Transfers', desc: 'Send money anywhere in seconds, 24/7.' },
              { icon: '📊', title: 'Smart Analytics', desc: 'Track your spending with intuitive insights.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                <div>
                  <p className="text-white font-semibold">{title}</p>
                  <p className="text-white/50 text-sm mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 'form' ? 'text-navy-400' : 'text-emerald-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'form' ? 'bg-navy-600' : 'bg-emerald-600'}`}>
                {step === 'form' ? '1' : '✓'}
              </span>
              Account Info
            </div>
            <div className="flex-1 h-px bg-surface-border" />
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 'otp' ? 'text-navy-400' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-navy-600' : 'bg-surface-hover'}`}>2</span>
              Verify Email
            </div>
          </div>

          {step === 'form' ? (
            <>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">Create Account</h1>
              <p className="text-slate-400 mb-8">Fill in your details to get started in seconds.</p>
              <form onSubmit={handleRegister} className="space-y-5" noValidate>
                <div className="form-group">
                  <label htmlFor="reg-name" className="input-label">Full Name</label>
                  <input id="reg-name" type="text" className="input" placeholder="John Doe"
                    value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-email" className="input-label">Email Address</label>
                  <input id="reg-email" type="email" className="input" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-password" className="input-label">Password</label>
                  <div className="relative">
                    <input id="reg-password" type={showPw ? 'text' : 'password'} className="input pr-12"
                      placeholder="Min 6 characters" value={password}
                      onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" aria-label="Toggle password">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-surface-border'}`} />
                        ))}
                      </div>
                      <p className={`text-xs mt-1 ${strength.color?.replace('bg-', 'text-')}`}>{strength.label}</p>
                    </div>
                  )}
                </div>
                <button id="register-submit" type="submit" disabled={loading} className="btn-primary btn-lg btn w-full">
                  {loading ? (
                    <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating account…</>
                  ) : 'Create Account & Send OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-navy-600/20 border border-navy-500/30 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">Check your email</h1>
              <p className="text-slate-400 mb-2">We sent a 6-digit code to</p>
              <p className="text-navy-400 font-medium mb-8">{email}</p>
              <form onSubmit={handleVerify} className="space-y-5" noValidate>
                <div className="form-group">
                  <label htmlFor="otp-code" className="input-label">OTP Code</label>
                  <input id="otp-code" type="text" className="input text-center tracking-widest text-xl font-bold"
                    placeholder="• • • • • •" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} />
                </div>
                <button id="otp-submit" type="submit" disabled={loading || otp.length < 4} className="btn-success btn-lg btn w-full">
                  {loading ? (
                    <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Verifying…</>
                  ) : 'Verify & Activate'}
                </button>
                <button type="button" onClick={() => setStep('form')} className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  ← Back to edit details
                </button>
              </form>
            </>
          )}

          <p className="text-center text-slate-500 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-navy-400 hover:text-navy-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}