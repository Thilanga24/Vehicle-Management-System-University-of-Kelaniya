import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope,
    faLock,
    faEye,
    faEyeSlash,
    faInfoCircle,
    faTimes,
    faSpinner,
    faBuildingColumns
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
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
    const [fpStep, setFpStep] = useState(1); // 1: Request, 2: Reset
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
        const dashboardRoutes = {
            'staff': 'lecturer-dashboard-new.html',
            'hod': 'hod-dashboard.html',
            'dean': 'dean-dashboard.html',
            'sar': 'sar-dashboard.html',
            'registrar': 'registrar-dashboard.html',
            'admin': 'admin-dashboard.html'
        };
        const dashboardUrl = dashboardRoutes[role];
        if (dashboardUrl) {
            window.location.href = dashboardUrl;
        } else {
            alert('Invalid role selected');
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
                    // Store user data
                    const userData = {
                        email: normalizedEmail,
                        name: account.name,
                        role: role,
                        loginTime: new Date().toISOString()
                    };
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userRole', role);
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
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Demo logic
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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <FontAwesomeIcon icon={faBuildingColumns} className="text-3xl text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">UoK VMS</h1>
                    <p className="text-gray-300">University of Kelaniya</p>
                    <p className="text-gray-400 text-sm">Vehicle Management System</p>
                </div>

                {/* Login Form */}
                <div className="login-card rounded-2xl card-shadow p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                        <p className="text-gray-300 mt-2">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="input-field block w-full pl-10 pr-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition duration-200"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="input-field block w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 transition duration-200"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <FontAwesomeIcon
                                        icon={showPassword ? faEyeSlash : faEye}
                                        className="text-gray-400 hover:text-gray-300 transition-colors"
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                                Login as
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                                className="input-field block w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition duration-200"
                            >
                                <option value="">Select your role</option>
                                <option value="staff">Staff</option>
                                <option value="hod">Head of Department</option>
                                <option value="dean">Dean</option>
                                <option value="sar">Senior Assistant Registrar</option>
                                <option value="registrar">Registrar</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotModal(true);
                                        setFpEmail(email);
                                    }}
                                    className="font-medium text-blue-400 hover:text-blue-300 transition duration-200"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="btn-primary w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-70"
                        >
                            {isLoggingIn && (
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            )}
                            <span>{isLoggingIn ? 'Signing in...' : 'Sign In'}</span>
                        </button>
                    </form>

                    {/* Demo Accounts Info Box */}
                    <div className="mt-6 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                        <div className="flex items-start">
                            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 mt-1 mr-2 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-medium text-blue-300 mb-2">Demo Accounts Available</h4>
                                <div className="text-[10px] sm:text-xs text-gray-300 space-y-1">
                                    <p><strong>Admin:</strong> admin@uok.lk / Admin@123</p>
                                    <p><strong>Staff:</strong> staff@uok.lk / Staff@123</p>
                                    <p><strong>HOD:</strong> hod@uok.lk / Hod@123</p>
                                    <p><strong>Dean:</strong> dean@uok.lk / Dean@123</p>
                                    <p><strong>SAR:</strong> sar@uok.lk / Sar@123</p>
                                    <p><strong>Registrar:</strong> registrar@uok.lk / Registrar@123</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mt-6 font-Inter">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-slate-700 text-gray-300 rounded">New to UoK VMS?</span>
                            </div>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <a href="signup.html" className="font-medium text-blue-400 hover:text-blue-300 transition duration-200">
                            Create an account
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-indigo-100 text-sm">
                        © 2025 University of Kelaniya. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotModal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowForgotModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md login-card rounded-2xl card-shadow p-6 border border-white/10 z-10"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Reset password</h3>
                                    <p className="text-gray-300 text-sm mt-1">
                                        {fpStep === 1
                                            ? 'Enter your email to receive a verification code.'
                                            : `We sent a code to ${fpEmail}. Enter it below to reset your password.`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowForgotModal(false)}
                                    className="text-gray-300 hover:text-white transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                </button>
                            </div>

                            {fpAlert.show && (
                                <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${fpAlert.type === 'success' ? 'border-emerald-400/40 bg-emerald-900/25 text-emerald-100' :
                                        fpAlert.type === 'warning' ? 'border-amber-400/40 bg-amber-900/25 text-amber-100' :
                                            'border-red-400/40 bg-red-900/25 text-red-100'
                                    }`}>
                                    {fpAlert.message}
                                </div>
                            )}

                            {/* Step 1: Request Code */}
                            {fpStep === 1 && (
                                <div className="mt-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={fpEmail}
                                            onChange={(e) => setFpEmail(e.target.value)}
                                            className="input-field block w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition duration-200"
                                            placeholder="Enter your email"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">If the email exists, we’ll send a reset code.</p>
                                    </div>
                                    <button
                                        onClick={handleSendCode}
                                        disabled={fpLoading}
                                        className="btn-primary w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-70"
                                    >
                                        {fpLoading && <FontAwesomeIcon icon={faSpinner} className="animate-spin -ml-1 mr-3 h-5 w-5" />}
                                        <span>{fpLoading ? 'Sending...' : 'Send code'}</span>
                                    </button>
                                    <div className="text-xs text-gray-400 italic">
                                        Demo tip: If no backend is running, a code will be logged to console.
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Verify + Reset */}
                            {fpStep === 2 && (
                                <div className="mt-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                                        <input
                                            type="text"
                                            maxLength="6"
                                            value={fpCode}
                                            onChange={(e) => setFpCode(e.target.value)}
                                            className="input-field block w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition duration-200"
                                            placeholder="Enter 6-digit code"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={fpNewPassword}
                                            onChange={(e) => setFpNewPassword(e.target.value)}
                                            className="input-field block w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition duration-200"
                                            placeholder="Create a new password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={fpConfirmPassword}
                                            onChange={(e) => setFpConfirmPassword(e.target.value)}
                                            className="input-field block w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition duration-200"
                                            placeholder="Re-enter new password"
                                        />
                                    </div>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={fpLoading}
                                        className="btn-primary w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-70"
                                    >
                                        {fpLoading && <FontAwesomeIcon icon={faSpinner} className="animate-spin -ml-1 mr-3 h-5 w-5" />}
                                        <span>{fpLoading ? 'Resetting...' : 'Reset password'}</span>
                                    </button>

                                    <div className="flex items-center justify-between text-sm">
                                        <button
                                            onClick={() => { setFpStep(1); clearAlert(); }}
                                            className="text-blue-400 hover:text-blue-300 transition duration-200"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => { setFpStep(1); handleSendCode(); }}
                                            className="text-blue-400 hover:text-blue-300 transition duration-200"
                                        >
                                            Resend code
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;
