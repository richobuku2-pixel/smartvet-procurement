import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// ── Shared UI helpers ────────────────────────────────────────────────────────
function Alert({ type = 'error', children }) {
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info:    'bg-teal-50 border-teal-200 text-teal-700',
  };
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️' };
  return (
    <div className={`border text-sm px-4 py-3 rounded-lg flex items-start gap-2 ${styles[type]}`}>
      <span className="mt-0.5 flex-shrink-0">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = 'Enter your password', autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10"
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
        tabIndex={-1}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

// ── Shell (logo + card wrapper) ──────────────────────────────────────────────
function LoginShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-800 to-green-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)', backgroundSize: '50px 50px' }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-2xl mb-4 overflow-hidden">
            <img src="/logo.png" alt="SmartVet Africa" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-wide">SmartVet Africa</h1>
          <p className="text-green-200 text-sm mt-1 font-medium tracking-widest uppercase">Procurement System</p>
          <p className="text-green-300 text-xs mt-1 italic">Animal Health meets Innovation</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-800 to-teal-700 px-6 py-4">
            <h2 className="text-white font-bold text-lg">{title}</h2>
            {subtitle && <p className="text-green-200 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <div className="p-6 space-y-5">
            {children}
          </div>
        </div>

        <p className="text-center text-green-300 text-xs mt-6">
          SmartVet Africa Procurement System v1.0 · Kampala, Uganda
        </p>
      </div>
    </div>
  );
}

// ── 1. Normal login ──────────────────────────────────────────────────────────
function NormalLogin({ onForgotPassword }) {
  const { loginWithEmail, loginWithGoogle, authError, setAuthError } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setAuthError('Please enter your email and password.'); return; }
    setLoading(true);
    await loginWithEmail(email, password);
    setLoading(false);
  };

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      loginWithGoogle({ email: decoded.email, name: decoded.name, picture: decoded.picture });
    } catch {
      setAuthError('Google sign-in failed. Please try again.');
    }
  };

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <LoginShell title="Welcome back" subtitle="Sign in to your account to continue">
      {authError && <Alert type="error">{authError}</Alert>}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setAuthError(''); }}
            placeholder="you@smartvet.ug"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Password</label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput value={password} onChange={e => { setPassword(e.target.value); setAuthError(''); }} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-green-700 to-teal-600 text-white rounded-lg font-semibold text-sm hover:from-green-800 hover:to-teal-700 transition-all disabled:opacity-60 shadow-md"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or continue with</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="flex justify-center">
        {GOOGLE_CLIENT_ID ? (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setAuthError('Google sign-in failed. Please try again.')}
            theme="outline" shape="rectangular" text="signin_with" width="340"
          />
        ) : (
          <div className="w-full border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 font-medium">Google Sign-In</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Add <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to{' '}
              <code className="bg-gray-100 px-1 rounded">.env</code> to enable
            </p>
          </div>
        )}
      </div>
    </LoginShell>
  );
}

// ── 2. Forgot password ───────────────────────────────────────────────────────
function ForgotPassword({ onBack }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginShell title="Reset Password" subtitle="We'll email you a link to set a new password">
      {sent ? (
        <div className="space-y-4">
          <Alert type="success">
            Password reset link sent to <strong>{email}</strong>. Check your inbox (and spam folder).
            The link expires in 1 hour.
          </Alert>
          <button
            onClick={onBack}
            className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Your Account Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="you@smartvet.ug"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoComplete="email"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 bg-gradient-to-r from-green-700 to-teal-600 text-white rounded-lg font-semibold text-sm hover:from-green-800 hover:to-teal-700 transition-all disabled:opacity-60 shadow-md"
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ← Back to Sign In
          </button>
        </form>
      )}
    </LoginShell>
  );
}

// ── 3. Set new password (arrived via reset link) ─────────────────────────────
function SetNewPassword({ token, onDone }) {
  const { confirmPasswordReset } = useAuth();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <LoginShell title="Password Updated" subtitle="Your new password is ready">
        <div className="space-y-4">
          <Alert type="success">
            Your password has been updated successfully. You can now sign in with your new password.
          </Alert>
          <button
            onClick={onDone}
            className="w-full py-3 bg-gradient-to-r from-green-700 to-teal-600 text-white rounded-lg font-semibold text-sm hover:from-green-800 hover:to-teal-700 transition-all shadow-md"
          >
            Sign In →
          </button>
        </div>
      </LoginShell>
    );
  }

  return (
    <LoginShell title="Set New Password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">New Password</label>
          <PasswordInput
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Confirm Password</label>
          <PasswordInput
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(''); }}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
        </div>

        {/* Strength hint */}
        {password.length > 0 && (
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                password.length >= [6, 8, 10, 12][i]
                  ? ['bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-600'][i]
                  : 'bg-gray-200'
              }`} />
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full py-3 bg-gradient-to-r from-green-700 to-teal-600 text-white rounded-lg font-semibold text-sm hover:from-green-800 hover:to-teal-700 transition-all disabled:opacity-60 shadow-md"
        >
          {loading ? 'Saving…' : 'Set New Password'}
        </button>
      </form>
    </LoginShell>
  );
}

// ── Root export: picks the right view ────────────────────────────────────────
export default function Login() {
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState(null);

  // Check for ?resetToken= in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setResetToken(token);
      setView('reset');
      // Clean the token from the URL without a page reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (view === 'forgot') {
    return <ForgotPassword onBack={() => setView('login')} />;
  }

  if (view === 'reset' && resetToken) {
    return (
      <SetNewPassword
        token={resetToken}
        onDone={() => { setResetToken(null); setView('login'); }}
      />
    );
  }

  return <NormalLogin onForgotPassword={() => setView('forgot')} />;
}
