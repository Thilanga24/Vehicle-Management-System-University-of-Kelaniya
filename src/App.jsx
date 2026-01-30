import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope,
    faLock,
    faEye,
    faEyeSlash,
    faInfoCircle,
    faTimes,
    faSpinner,
    faBuilding,
    faPhone,
    faGraduationCap,
    faUniversity
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
    const navigate = useNavigate();
    // --- States ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Forgot Password Modal States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [fpEmail, setFpEmail] = useState('');
    const [fpStep, setFpStep] = useState(1);
    const [fpLoading, setFpLoading] = useState(false);
    const [fpAlert, setFpAlert] = useState({ show: false, type: '', message: '' });
    const [fpCode, setFpCode] = useState('');
    const [fpNewPassword, setFpNewPassword] = useState('');
    const [fpConfirmPassword, setFpConfirmPassword] = useState('');

    // --- Constants ---
    const demoAccounts = {
        'admin@uok.lk': { password: 'Admin@123', role: 'admin', name: 'System Administrator' },
        'staff@uok.lk': { password: 'Staff@123', role: 'staff', name: 'Dr. John Silva' },
        'hod@uok.lk': { password: 'Hod@123', role: 'hod', name: 'Prof. Jane Perera' },
        'dean@uok.lk': { password: 'Dean@123', role: 'dean', name: 'Prof. Michael Fernando' },
        'sar@uok.lk': { password: 'Sar@123', role: 'sar', name: 'SAR Officer Kumar' },
        'registrar@uok.lk': { password: 'Registrar@123', role: 'registrar', name: 'Registrar Bandara' }
    };

    const PASSWORD_OVERRIDES_KEY = 'vmsPasswordOverrides';
    const FP_DEMO_PREFIX = 'vms_fp_demo_';

    // --- Helpers ---
    const getPasswordOverrides = () => {
        try {
            return JSON.parse(localStorage.getItem(PASSWORD_OVERRIDES_KEY) || '{}') || {};
        } catch {
            return {};
        }
    };

    const setPasswordOverride = (email, newPassword) => {
        const overrides = getPasswordOverrides();
        overrides[email] = newPassword;
        localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(overrides));
    };

    const getPasswordForEmail = (email) => {
        const overrides = getPasswordOverrides();
        if (overrides[email]) return overrides[email];
        return demoAccounts[email]?.password;
    };

    const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim());

    const showAlert = (type, message) => {
        setFpAlert({ show: true, type, message });
    };

    const clearAlert = () => {
        setFpAlert({ show: false, type: '', message: '' });
    };

    const redirectToDashboard = (role) => {
        if (role === 'registrar') {
            navigate('/registrar-dashboard');
        } else if (role === 'sar') {
            navigate('/sar-dashboard');
        } else if (role === 'hod') {
            navigate('/hod-dashboard');
        } else if (role === 'dean') {
            navigate('/dean-dashboard');
        } else if (role === 'admin') {
            navigate('/admin-dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    // --- Handlers ---
    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoggingIn(true);

        setTimeout(() => {
            setIsLoggingIn(false);
            const normalizedEmail = email.toLowerCase().trim();

            if (demoAccounts[normalizedEmail]) {
                const account = demoAccounts[normalizedEmail];
                const expectedPassword = getPasswordForEmail(normalizedEmail);

                if (expectedPassword === password && account.role === role) {
                    const userData = {
                        email: normalizedEmail,
                        name: account.name,
                        role: role,
                        loginTime: new Date().toISOString()
                    };
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userRole', role);
                    sessionStorage.setItem('userName', account.name);
                    localStorage.setItem('currentUser', JSON.stringify(userData));

                    redirectToDashboard(role);
                } else if (account.role !== role) {
                    alert(`Error: Selected role does not match this account. Please select role: ${account.role}`);
                } else {
                    alert('Invalid password. Please try again.');
                }
            } else {
                alert('Account not found. Please use a valid demo account email.');
            }
        }, 1500);
    };

    const handleSendCode = async () => {
        clearAlert();
        const email = fpEmail.trim().toLowerCase();
        if (!isValidEmail(email)) {
            showAlert('error', 'Please enter a valid email address.');
            return;
        }

        setFpLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const code = String(Math.floor(100000 + Math.random() * 900000));
            sessionStorage.setItem(`${FP_DEMO_PREFIX}${email}`, JSON.stringify({ code, createdAt: Date.now() }));
            console.log(`[VMS Demo] Password reset code for ${email}: ${code}`);
            showAlert('warning', `Demo mode: backend not reachable. Use code: ${code}`);
            setFpStep(2);
        } catch (err) {
            showAlert('error', 'Something went wrong. Please try again.');
        } finally {
            setFpLoading(false);
        }
    };

    const handleResetPassword = async () => {
        clearAlert();
        const email = fpEmail.trim().toLowerCase();

        if (!/^\d{6}$/.test(fpCode)) {
            showAlert('error', 'Please enter the 6-digit verification code.');
            return;
        }
        if (fpNewPassword.length < 8) {
            showAlert('error', 'Password must be at least 8 characters.');
            return;
        }
        if (fpNewPassword !== fpConfirmPassword) {
            showAlert('error', 'Passwords do not match.');
            return;
        }

        setFpLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const raw = sessionStorage.getItem(`${FP_DEMO_PREFIX}${email}`);
            const parsed = raw ? JSON.parse(raw) : null;

            if (!parsed || Date.now() - parsed.createdAt > 15 * 60 * 1000) {
                showAlert('error', 'Demo code expired. Please resend the code.');
                return;
            }
            if (parsed.code !== fpCode) {
                showAlert('error', 'Invalid code. Please try again.');
                return;
            }

            setPasswordOverride(email, fpNewPassword);
            showAlert('success', 'Demo mode: Password reset successful. You can sign in now.');

            setTimeout(() => {
                setShowForgotModal(false);
                setEmail(email);
                setPassword('');
                setFpStep(1);
            }, 1500);
        } catch (err) {
            showAlert('error', 'Reset failed. Please try again.');
        } finally {
            setFpLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding (Matches Signup.jsx) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 text-white relative overflow-hidden bg-gradient-to-br from-[#2d0a0a] to-[#400f0f]">
                {/* Overlay */}
                <div
                    className="absolute inset-0 z-0 opacity-20"
                    style={{
                        backgroundImage: "url('/assets/background.JPG')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                {/* Elements */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#660000]/90 to-[#2d0a0a]/95" />

                <div className="max-w-md relative z-10 mx-auto text-center lg:text-left">
                    <div className="mb-8">
                        <div className="w-24 h-24 mb-6 relative mx-auto lg:mx-0">
                            <img src="/assets/uok_logo.png" alt="University Log" className="w-full h-full object-contain drop-shadow-2xl" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4 font-serif !text-white" style={{ color: 'white' }}>University of Kelaniya</h1>
                        <p className="text-xl text-[#F6DD26] mb-2 font-medium tracking-wide">Vehicle Management System</p>
                        <p className="text-lg text-white/80">Authorized Access Only</p>
                    </div>

                    <div className="sapce-y-6 text-white/80 font-light">
                        <p className="mb-4">Welcome to the official transportation management portal. Please sign in with your academic or administrative credentials to access fleet services.</p>

                        <div className="flex items-center space-x-4 text-sm mt-8 border-t border-white/10 pt-6">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faUniversity} className="text-[#F6DD26] mr-2" />
                                <span>Administration</span>
                            </div>
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faBuilding} className="text-[#F6DD26] mr-2" />
                                <span>Faculties</span>
                            </div>
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faGraduationCap} className="text-[#F6DD26] mr-2" />
                                <span>Departments</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/30">
                    © 2025 University of Kelaniya • Dalugama, Sri Lanka
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-[#0f172a]">
                {/* Background Image - Increased Visibility */}
                <div
                    className="absolute inset-0 z-0 opacity-40"
                    style={{
                        backgroundImage: "url('/assets/background.JPG')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                {/* Gradient Overlay - Reduced Opacity to let image show through */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0f172a]/75 to-[#1e293b]/75" />

                <div className="w-full max-w-md relative z-10">
                    <div className="login-card rounded-2xl card-shadow p-8 border border-[#F6DD26]/20 bg-[#1e293b]/90 backdrop-blur">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold !text-white" style={{ color: 'white' }}>Sign In</h2>
                            <p className="text-gray-300 mt-2">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-gray-500" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="block w-full pl-10 pr-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F6DD26] transition bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FontAwesomeIcon icon={faLock} className="text-gray-500" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="block w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F6DD26] transition bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                                        placeholder="Enter your password"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-gray-500 hover:text-gray-700" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Login as</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                    className="block w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F6DD26] transition bg-white border border-gray-300 text-gray-900"
                                >
                                    <option value="" className="text-gray-500">Select your role</option>
                                    <option value="staff" className="text-gray-900">Staff</option>
                                    <option value="hod" className="text-gray-900">Head of Department</option>
                                    <option value="dean" className="text-gray-900">Dean</option>
                                    <option value="sar" className="text-gray-900">Senior Assistant Registrar</option>
                                    <option value="registrar" className="text-gray-900">Registrar</option>
                                    <option value="admin" className="text-gray-900">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 text-[#660000] focus:ring-[#660000] border-gray-600 rounded bg-gray-700"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">Remember me</label>
                                </div>
                                <div className="text-sm">
                                    <button type="button" onClick={() => { setShowForgotModal(true); setFpEmail(email); }} className="font-medium text-[#F6DD26] hover:text-yellow-300 transition">
                                        Forgot password?
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#660000] hover:bg-[#800000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#660000] transition transform hover:-translate-y-0.5 disabled:opacity-70"
                            >
                                {isLoggingIn && <FontAwesomeIcon icon={faSpinner} className="animate-spin -ml-1 mr-3 h-5 w-5" />}
                                <span>{isLoggingIn ? 'Signing in...' : 'Sign In'}</span>
                            </button>
                        </form>

                        {/* Demo Accounts */}
                        <div className="mt-6 bg-[#0f172a]/50 border border-[#F6DD26]/30 rounded-lg p-4 text-left">
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-[#F6DD26] mt-1 mr-2" />
                                <div>
                                    <h4 className="text-sm font-medium text-[#F6DD26] mb-2">Demo Accounts</h4>
                                    <div className="text-[10px] sm:text-xs text-gray-400 space-y-1">
                                        <p><strong>Admin:</strong> admin@uok.lk / Admin@123</p>
                                        <p><strong>Registrar:</strong> registrar@uok.lk / Registrar@123</p>
                                        <p><strong>SAR:</strong> sar@uok.lk / Sar@123</p>
                                        <p><strong>HOD:</strong> hod@uok.lk / Hod@123</p>
                                        <p><strong>Dean:</strong> dean@uok.lk / Dean@123</p>
                                        <p><strong>Staff:</strong> staff@uok.lk / Staff@123</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center pt-4 border-t border-gray-700">
                            <span className="text-gray-400 text-sm">New to UoK VMS? </span>
                            <Link to="/signup.html" className="font-semibold text-[#F6DD26] hover:text-yellow-300 transition text-sm">
                                Create an account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForgotModal(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-[#1e293b] rounded-2xl p-6 border border-[#F6DD26]/30 z-10 shadow-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">Reset Password</h3>
                                <button onClick={() => setShowForgotModal(false)}><FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-white" /></button>
                            </div>

                            {fpAlert.show && (
                                <div className={`mb-4 p-3 rounded text-sm ${fpAlert.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-900' : 'bg-green-900/50 text-green-200 border border-green-900'}`}>
                                    {fpAlert.message}
                                </div>
                            )}

                            {fpStep === 1 && (
                                <div className="space-y-4">
                                    <p className="text-gray-300 text-sm">Enter your university email to receive a code.</p>
                                    <input type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} className="w-full p-3 rounded bg-[#0f172a] border border-gray-600 text-white focus:border-[#F6DD26]" placeholder="Email Address" />
                                    <button onClick={handleSendCode} disabled={fpLoading} className="w-full py-3 bg-[#660000] hover:bg-[#800000] text-white rounded font-bold disabled:opacity-50">
                                        {fpLoading ? 'Sending...' : 'Send Code'}
                                    </button>
                                </div>
                            )}

                            {fpStep === 2 && (
                                <div className="space-y-4">
                                    <p className="text-gray-300 text-sm">Enter the code sent to {fpEmail}</p>
                                    <input type="text" value={fpCode} onChange={(e) => setFpCode(e.target.value)} className="w-full p-3 rounded bg-[#0f172a] border border-gray-600 text-white" placeholder="6-Digit Code" />
                                    <input type="password" value={fpNewPassword} onChange={(e) => setFpNewPassword(e.target.value)} className="w-full p-3 rounded bg-[#0f172a] border border-gray-600 text-white" placeholder="New Password" />
                                    <input type="password" value={fpConfirmPassword} onChange={(e) => setFpConfirmPassword(e.target.value)} className="w-full p-3 rounded bg-[#0f172a] border border-gray-600 text-white" placeholder="Confirm Password" />
                                    <button onClick={handleResetPassword} disabled={fpLoading} className="w-full py-3 bg-[#660000] hover:bg-[#800000] text-white rounded font-bold disabled:opacity-50">
                                        {fpLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default App;
