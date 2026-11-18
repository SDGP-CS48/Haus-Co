import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, ShieldCheck, Smartphone, UserCheck } from 'lucide-react';
import { getDefaultRouteForRole, SYSTEM_ROLES_INFO, type SystemRole } from '@hausco/shared';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  SampleDataPill,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { PublicLayout } from '../../components/ui/PublicLayout';
import { ApiError, apiFetch } from '../../services/api';
import { useAuth } from '../../stores/authContext';

export const RoleSelectionPage: React.FC = () => {
  const { setSelectedRoleForAuth, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [busyRole, setBusyRole] = useState<SystemRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Public role cards exclude PLATFORM_ADMIN so System Operations is not exposed as a public portal.
  const publicRoles = SYSTEM_ROLES_INFO.filter((r) => r.role !== 'PLATFORM_ADMIN');

  const handleChoose = (role: SystemRole, dest: 'login' | 'register') => {
    setSelectedRoleForAuth(role);
    navigate(`/auth/${dest}?role=${role}`);
  };

  const handleDemo = async (role: SystemRole) => {
    setError(null);
    setBusyRole(role);
    try {
      const user = await demoLogin(role);
      navigate(getDefaultRouteForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login unavailable.');
    } finally {
      setBusyRole(null);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono-num text-xs font-semibold uppercase tracking-wider text-[#D9940A]">
              Multi-Role Gateway
            </span>
            <h1 className="font-display text-3xl font-extrabold mt-1">
              Select your Haus & Co role
            </h1>
            <p className="text-sm text-[#1C1C1A]/80 mt-1">
              Every portal enforces strict role permissions and KYC checks where applicable.
            </p>
          </div>
          <SampleDataPill label="Demo mode quick sign-in available" />
        </div>

        {error ? <DisclaimerBanner title="Sign-in Notice" body={error} tone="warning" /> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {publicRoles.map((info) => (
            <SurfaceCard key={info.role} tone="pale" className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="yellow">{info.portal.replace(/_/g, ' ')}</Badge>
                  {info.requiresKyc ? <Badge tone="pale">NIC / KYC</Badge> : null}
                </div>
                <h2 className="font-display text-xl font-bold">{info.label}</h2>
                <p className="text-xs text-[#1C1C1A]/80 leading-relaxed">{info.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1C1C1A]/10">
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={() => handleChoose(info.role, 'register')}>
                    Register
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleChoose(info.role, 'login')}>
                    Sign In
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  loading={busyRole === info.role}
                  onClick={() => handleDemo(info.role)}
                >
                  Launch Sample {info.label} Demo
                </Button>
              </div>
            </SurfaceCard>
          ))}
        </div>

        {/* Internal Operations Sign-In Link (not listed as a public customer portal) */}
        <div className="border-t border-[#1C1C1A]/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#1C1C1A]/75">
          <span>
            Sri Lankan Mobile OTP (Dialog / Mobitel compatible) can also be verified directly after selecting a role.
          </span>
          <div className="flex items-center gap-3">
            <Link to="/auth/verify-otp" className="font-semibold text-[#D9940A] hover:underline">
              Verify Phone OTP
            </Link>
            <button
              type="button"
              onClick={() => handleDemo('PLATFORM_ADMIN')}
              className="text-[#1C1C1A]/60 hover:text-[#D9940A] underline cursor-pointer"
            >
              Internal Operations Console (Admin Demo)
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export const LoginPage: React.FC = () => {
  const { selectedRoleForAuth, loginWithCredentials, demoLogin } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const roleParam = (params.get('role') as SystemRole | null) ?? selectedRoleForAuth;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithCredentials(email, password, roleParam);
      navigate(getDefaultRouteForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14">
        <SurfaceCard tone="pale" className="p-6 sm:p-8 space-y-5">
          <div>
            <Badge tone="yellow">{roleParam.replace(/_/g, ' ')}</Badge>
            <h1 className="font-display text-2xl font-bold mt-2">Sign in to Haus & Co</h1>
            <p className="text-xs text-[#1C1C1A]/75 mt-1">
              Wrong role? <Link to="/auth/role-selection" className="text-[#D9940A] font-semibold underline">Switch role</Link>
            </p>
          </div>

          {error ? <DisclaimerBanner title="Authentication Error" body={error} tone="warning" /> : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.lk" />
            </div>
            <div>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              <KeyRound className="h-4 w-4" />
              Sign In
            </Button>
          </form>

          <div className="pt-3 border-t border-[#1C1C1A]/12 space-y-2">
            <Link to="/auth/verify-otp" className="block">
              <Button variant="outline" size="sm" className="w-full">
                <Smartphone className="h-4 w-4" />
                Sign In / Verify via Sri Lankan Phone OTP
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={async () => {
                const user = await demoLogin(roleParam);
                navigate(getDefaultRouteForRole(user.role));
              }}
            >
              Use Sample Demo Account ({roleParam.replace(/_/g, ' ')})
            </Button>
          </div>
        </SurfaceCard>
      </div>
    </PublicLayout>
  );
};

export const RegisterPage: React.FC = () => {
  const { selectedRoleForAuth, registerUser } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const roleParam = (params.get('role') as SystemRole | null) ?? selectedRoleForAuth;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneE164, setPhoneE164] = useState('+9477');
  const [password, setPassword] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [credentialCode, setCredentialCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requiresKyc = roleParam !== 'HOME_BUILDER' && roleParam !== 'PLATFORM_ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await registerUser({ fullName, email, phoneE164, password, role: roleParam });
      if (requiresKyc && nicNumber.trim() && credentialCode.trim()) {
        await apiFetch('/auth/kyc', {
          method: 'POST',
          body: JSON.stringify({
            nicNumber,
            credentialCode,
            documentName: `${roleParam.toLowerCase()}_kyc_bundle.pdf`,
          }),
        });
      }
      navigate(getDefaultRouteForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-lg px-4 py-12">
        <SurfaceCard tone="pale" className="p-6 sm:p-8 space-y-5">
          <div>
            <Badge tone="yellow">{roleParam.replace(/_/g, ' ')}</Badge>
            <h1 className="font-display text-2xl font-bold mt-2">Create your account</h1>
            <p className="text-xs text-[#1C1C1A]/75 mt-1">
              Already registered? <Link to={`/auth/login?role=${roleParam}`} className="text-[#D9940A] font-semibold underline">Sign in</Link>
            </p>
          </div>

          {error ? <DisclaimerBanner title="Registration Error" body={error} tone="warning" /> : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel htmlFor="reg-name">Full Name / Business Name</FieldLabel>
              <Input id="reg-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g., Dilshan Fernando" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="reg-email">Email</FieldLabel>
                <Input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.lk" />
              </div>
              <div>
                <FieldLabel htmlFor="reg-phone">Sri Lankan Mobile (+94)</FieldLabel>
                <Input id="reg-phone" required value={phoneE164} onChange={(e) => setPhoneE164(e.target.value)} placeholder="+94771234567" />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="reg-pass">Password (min 8 chars)</FieldLabel>
              <Input id="reg-pass" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {requiresKyc ? (
              <div className="rounded-lg border border-[#D9940A]/35 bg-[#FAF7EE] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D9940A]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Service Provider NIC & Credential KYC</span>
                </div>
                <div>
                  <FieldLabel htmlFor="reg-nic">Sri Lankan NIC Number (Masked & Protected)</FieldLabel>
                  <Input id="reg-nic" required value={nicNumber} onChange={(e) => setNicNumber(e.target.value)} placeholder="e.g., 199212345678" />
                </div>
                <div>
                  <FieldLabel htmlFor="reg-cred">CIDA / IESL / Trade / BR Registration Code</FieldLabel>
                  <Input id="reg-cred" required value={credentialCode} onChange={(e) => setCredentialCode(e.target.value)} placeholder="e.g., CIDA-C5-XXXX or IESL-XXXX" />
                </div>
              </div>
            ) : null}

            <Button type="submit" className="w-full" loading={loading}>
              <UserCheck className="h-4 w-4" />
              Create Account & Enter Portal
            </Button>
          </form>
        </SurfaceCard>
      </div>
    </PublicLayout>
  );
};

export const VerifyOtpPage: React.FC = () => {
  const { setSessionFromToken } = useAuth();
  const navigate = useNavigate();

  const [phoneE164, setPhoneE164] = useState('+94771234501');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [carrier, setCarrier] = useState<string | null>(null);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMsg(null);
    setLoading(true);
    try {
      const res = await apiFetch<{
        otpId: string;
        carrier: string;
        providerMode: string;
        message: string;
        demoOtpCode?: string;
      }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phoneE164 }),
      });
      setOtpId(res.otpId);
      setCarrier(res.carrier);
      setDemoOtpHint(res.demoOtpCode ?? null);
      setStatusMsg(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not request OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{
        verified: boolean;
        token: string | null;
        user: { id: string; email: string; phoneE164: string; fullName: string; role: SystemRole; portal: never; verificationStatus: never; phoneVerified: boolean } | null;
      }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ otpId, phoneE164, code }),
      });
      if (res.verified && res.token && res.user) {
        setSessionFromToken(res.token, res.user);
        navigate(getDefaultRouteForRole(res.user.role));
      } else {
        setStatusMsg('Phone number verified. Continue to sign in or register.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14">
        <SurfaceCard tone="pale" className="p-6 sm:p-8 space-y-5">
          <div>
            <Badge tone="yellow">Dialog & Mobitel Compatible</Badge>
            <h1 className="font-display text-2xl font-bold mt-2">Sri Lankan Phone OTP</h1>
            <p className="text-xs text-[#1C1C1A]/80 mt-1">
              Routes automatically by +94 mobile prefix (077/076/074 Dialog · 071/070 Mobitel).
            </p>
          </div>

          {error ? <DisclaimerBanner title="OTP Gateway Notice" body={error} tone="warning" /> : null}
          {statusMsg ? <DisclaimerBanner title={`Carrier: ${carrier ?? 'Detected'}`} body={statusMsg} /> : null}
          {demoOtpHint ? (
            <div className="rounded bg-[#FAF7EE] border border-[#D9940A] p-3 text-xs font-mono-num">
              Demo Adapter OTP Code (non-production): <strong>{demoOtpHint}</strong>
            </div>
          ) : null}

          {!otpId ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <FieldLabel htmlFor="otp-phone">Mobile Number (E.164)</FieldLabel>
                <Input id="otp-phone" required value={phoneE164} onChange={(e) => setPhoneE164(e.target.value)} placeholder="+94771234501" />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Request 6-Digit OTP
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <FieldLabel htmlFor="otp-code">Enter 6-Digit OTP</FieldLabel>
                <Input id="otp-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className="font-mono-num tracking-widest" />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Verify OTP & Continue
              </Button>
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setOtpId(null)}>
                Change Phone Number
              </Button>
            </form>
          )}
        </SurfaceCard>
      </div>
    </PublicLayout>
  );
};
