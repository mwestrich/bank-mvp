import React, { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [fullName, setFullName] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Funding Sources state
  const [fundingSources, setFundingSources] = useState([]);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [addingSource, setAddingSource] = useState(false);
  const [loadingSource, setLoadingSource] = useState(false);
  
  // Joint Account state
  const [jointEmail, setJointEmail] = useState('');
  const [addingJoint, setAddingJoint] = useState(false);
  const [loadingJoint, setLoadingJoint] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/profile'),
      api.get('/funding'),
      api.get('/accounts/me')
    ]).then(([profRes, fundRes, accRes]) => {
      setProfile(profRes.data);
      setFullName(profRes.data.full_name);
      setFundingSources(fundRes.data);
      setAccountInfo(accRes.data);
    }).catch(console.error).finally(() => setFetching(false));
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (fullName === profile.full_name) { toast('No changes to save'); return; }
    setLoadingProfile(true);
    try {
      await api.put('/profile', { full_name: fullName });
      toast.success('Name updated!');
      setProfile(prev => ({ ...prev, full_name: fullName }));
    } catch { /* toasted */ } finally { setLoadingProfile(false); }
  };

  const handleUpdatePw = async (e) => {
    e.preventDefault();
    if (!newPw || newPw.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setLoadingPw(true);
    try {
      await api.put('/profile', { password: newPw });
      toast.success('Password updated!');
      setCurrentPw('');
      setNewPw('');
    } catch { /* toasted */ } finally { setLoadingPw(false); }
  };

  const handleAddFundingSource = async (e) => {
    e.preventDefault();
    if (!bankName || accountNumber.length < 4) return;
    setLoadingSource(true);
    try {
      const res = await api.post('/funding', { bankName, accountNumber });
      setFundingSources([res.data, ...fundingSources]);
      setBankName('');
      setAccountNumber('');
      setAddingSource(false);
      toast.success('Linked account added!');
    } catch { /* toasted */ } finally { setLoadingSource(false); }
  };

  const handleAddJointUser = async (e) => {
    e.preventDefault();
    if (!jointEmail) return;
    setLoadingJoint(true);
    try {
      const res = await api.post('/accounts/joint', { email: jointEmail });
      toast.success(res.data.message);
      setJointEmail('');
      setAddingJoint(false);
      // Refresh account info to show the new joint user
      const accRes = await api.get('/accounts/me');
      setAccountInfo(accRes.data);
    } catch { /* toasted */ } finally { setLoadingJoint(false); }
  };

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email?.[0]?.toUpperCase() ?? 'U';

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse-slow">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal information and security.</p>
      </div>

      {/* Avatar card */}
      <div className="card-p flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-navy-700 border-2 border-navy-500 flex items-center justify-center text-2xl font-bold text-navy-200 flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-100">{profile.full_name}</p>
          <p className="text-slate-400 text-sm">{profile.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Active account</span>
          </div>
        </div>
      </div>

      {/* Update name */}
      <div className="card-p">
        <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Personal Information
        </h2>
        <form onSubmit={handleUpdateName} className="space-y-4">
          <div className="form-group">
            <label htmlFor="profile-email" className="input-label">Email Address</label>
            <input id="profile-email" type="email" className="input" value={profile.email} disabled />
            <p className="text-xs text-slate-600 mt-1">Email cannot be changed.</p>
          </div>
          <div className="form-group">
            <label htmlFor="profile-name" className="input-label">Full Name</label>
            <input
              id="profile-name"
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              id="save-name-btn"
              type="submit"
              disabled={loadingProfile || fullName === profile.full_name}
              className="btn-primary btn"
            >
              {loadingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card-p">
        <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Change Password
        </h2>
        <form onSubmit={handleUpdatePw} className="space-y-4">
          <div className="form-group">
            <label htmlFor="new-pw" className="input-label">New Password</label>
            <div className="relative">
              <input
                id="new-pw"
                type={showNewPw ? 'text' : 'password'}
                className="input pr-12"
                placeholder="Min 6 characters"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" aria-label="Toggle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            You will be asked to sign in again after changing your password.
          </div>
          <div className="flex justify-end">
            <button id="save-pw-btn" type="submit" disabled={loadingPw || !newPw} className="btn-primary btn">
              {loadingPw ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Linked Accounts */}
      <div className="card-p">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Linked Accounts
          </h2>
          {!addingSource && (
            <button type="button" onClick={() => setAddingSource(true)} className="text-sm text-navy-400 hover:text-navy-300 font-medium">
              + Add Account
            </button>
          )}
        </div>

        {addingSource && (
          <form onSubmit={handleAddFundingSource} className="mb-6 p-4 rounded-xl bg-surface-hover border border-surface-border space-y-4">
            <div className="form-group">
              <label htmlFor="bank-name" className="input-label">Bank Name</label>
              <input id="bank-name" type="text" className="input" placeholder="e.g. Chase Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="acc-num" className="input-label">Account Number</label>
              <input id="acc-num" type="text" className="input font-mono" placeholder="Minimum 4 digits" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} required minLength={4} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAddingSource(false)} className="btn-secondary btn px-4 py-2">Cancel</button>
              <button type="submit" disabled={loadingSource || !bankName || accountNumber.length < 4} className="btn-primary btn px-4 py-2">
                {loadingSource ? 'Adding…' : 'Link Account'}
              </button>
            </div>
          </form>
        )}

        {fundingSources.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No linked accounts yet. Add one to make deposits.</p>
        ) : (
          <div className="space-y-3">
            {fundingSources.map(source => (
              <div key={source.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-600/20 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{source.bank_name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">•••• {source.account_last4}</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Linked</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Joint Account */}
      <div className="card-p">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Joint Account
          </h2>
          {!addingJoint && (!accountInfo || !accountInfo.joint_owner_name) && (
            <button type="button" onClick={() => setAddingJoint(true)} className="text-sm text-navy-400 hover:text-navy-300 font-medium">
              + Share Account
            </button>
          )}
        </div>

        {addingJoint && (
          <form onSubmit={handleAddJointUser} className="mb-6 p-4 rounded-xl bg-surface-hover border border-surface-border space-y-4">
            <div className="form-group">
              <label htmlFor="joint-email" className="input-label">User Email to Invite</label>
              <input id="joint-email" type="email" className="input" placeholder="user@example.com" value={jointEmail} onChange={(e) => setJointEmail(e.target.value)} required />
              <p className="text-xs text-slate-500 mt-2">This user will share your account balance and transaction history.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAddingJoint(false)} className="btn-secondary btn px-4 py-2">Cancel</button>
              <button type="submit" disabled={loadingJoint || !jointEmail} className="btn-primary btn px-4 py-2">
                {loadingJoint ? 'Inviting…' : 'Share Account'}
              </button>
            </div>
          </form>
        )}

        {!addingJoint && accountInfo && accountInfo.joint_owner_name && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 font-bold">{accountInfo.joint_owner_name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Shared with {accountInfo.joint_owner_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">They have full access to this account.</p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Shared</span>
          </div>
        )}
        
        {!addingJoint && (!accountInfo || !accountInfo.joint_owner_name) && (
          <p className="text-sm text-slate-500 text-center py-4">Your account is currently private. You can invite another user to share it.</p>
        )}
      </div>
    </div>
  );
}