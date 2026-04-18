import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope,
    faLock,
    faEye,
    faEyeSlash,
    faSpinner,
    faUser,
    faBuilding,
    faPhone,
    faIdCard,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        department: '',
        faculty: '',
        phone: '',
        employeeId: '',
        password: '',
        confirmPassword: '',
        terms: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
    };

    const checkPasswordStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (pass.match(/[a-z]/)) strength++;
        if (pass.match(/[A-Z]/)) strength++;
        if (pass.match(/[0-9]/)) strength++;
        if (pass.match(/[^a-zA-Z0-9]/)) strength++;
        setPasswordStrength(strength);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));

        if (name === 'password') {
            checkPasswordStrength(val);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message || 'Account created successfully! You can now log in.', 'success');
                setTimeout(() => navigate('/'), 2000);
            } else {
                showNotification(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration Error:', error);
            showNotification('An error occurred. Please check your connection and try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - University Information */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 text-white relative overflow-hidden bg-gradient-to-br from-[#2d0a0a] to-[#400f0f]">
                {/* Background Image Overlay */}
                <div
                    className="absolute inset-0 z-0 opacity-20"
                    style={{
                        backgroundImage: "url('/assets/background.JPG')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                {/* Decorative Elements */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#660000]/90 to-[#2d0a0a]/95" />

                <div className="max-w-md relative z-10 mx-auto">
                    {/* University Logo and Title */}
                    <div className="mb-8 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 relative">
                            <img
                                src="/assets/uok_logo.png"
                                alt="University of Kelaniya Logo"
                                className="w-full h-full object-contain drop-shadow-2xl"
                            />
                        </div>
                        <h1 className="text-4xl font-bold mb-4 font-serif !text-white" style={{ color: 'white' }}>University of Kelaniya</h1>
                        <p className="text-xl text-[#F6DD26] mb-2 font-medium tracking-wide">Vehicle Management System</p>
                        <p className="text-lg text-white/80">Transportation Division</p>
                    </div>

                    {/* University Information */}
                    <div className="bg-[#1a0505]/60 backdrop-blur-md rounded-xl p-6 mb-6 border border-[#F6DD26]/20 shadow-xl">
                        <h3 className="text-xl font-semibold mb-4 text-[#F6DD26] border-b border-[#F6DD26]/20 pb-2">About Transportation Division</h3>
                        <div className="space-y-4 text-white/90">
                            <div className="flex items-start space-x-3 group">
                                <div className="p-2 rounded-lg bg-[#660000]/30 group-hover:bg-[#660000]/50 transition-colors">
                                    <FontAwesomeIcon icon={faBuilding} className="text-[#F6DD26]" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wider text-gray-300">Location</p>
                                    <p className="text-sm font-light">General Administration Office<br />2nd Floor, Main Building</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 group">
                                <div className="p-2 rounded-lg bg-[#660000]/30 group-hover:bg-[#660000]/50 transition-colors">
                                    <FontAwesomeIcon icon={faTimes} className="text-[#F6DD26] rotate-45" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wider text-gray-300">Operating Hours</p>
                                    <p className="text-sm font-light">Monday - Friday<br />7:00 AM - 6:00 PM</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 group">
                                <div className="p-2 rounded-lg bg-[#660000]/30 group-hover:bg-[#660000]/50 transition-colors">
                                    <FontAwesomeIcon icon={faPhone} className="text-[#F6DD26]" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wider text-gray-300">Contact</p>
                                    <p className="text-sm font-light">Registrar: +94 11 293 5151</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Established */}
                    <div className="mt-8 text-center border-t border-white/10 pt-6">
                        <p className="text-[#F6DD26]/80 text-sm font-serif italic">Est. 1959</p>
                        <p className="text-white/40 text-xs mt-1 uppercase tracking-widest">Dalugama, Kelaniya, Sri Lanka</p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-[#0f172a] relative">
                <div
                    className="absolute inset-0 z-0 opacity-10 lg:hidden"
                    style={{
                        backgroundImage: "url('/assets/background.JPG')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                <div className="w-full max-w-xl relative z-10">
                    <div className="login-card rounded-2xl card-shadow p-6 sm:p-10 border border-[#F6DD26]/20">
                        <AnimatePresence>
                            {notification.show && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`mb-6 p-4 rounded-lg flex items-center justify-between ${notification.type === 'success' ? 'bg-green-900/40 text-green-200 border border-green-800/50' : 'bg-red-900/40 text-red-100 border border-red-800/50'} backdrop-blur-sm`}
                                >
                                    <div className="flex items-center">
                                        <FontAwesomeIcon
                                            icon={notification.type === 'success' ? faBuilding : faLock}
                                            className={`mr-3 ${notification.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                                        />
                                        <span className="text-sm font-medium">{notification.message}</span>
                                    </div>
                                    <button
                                        onClick={() => setNotification({ ...notification, show: false })}
                                        className="ml-4 text-white/60 hover:text-white transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold !text-white mb-2" style={{ color: 'white' }}>Create Account</h2>
                            <p className="text-gray-300">Join the University Transportation System</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">First Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            className="input-field block w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                            placeholder="First Name"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Last Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            className="input-field block w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                            placeholder="Last Name"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">University Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="input-field block w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                        placeholder="your.name@kln.ac.lk"
                                    />
                                </div>
                            </div>

                            {/* Role & Dept */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Role</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                        className="input-field block w-full px-3 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                    >
                                        <option value="">Select Role</option>
                                        <option value="staff">Staff</option>
                                        <option value="hod">Head of Department</option>
                                        <option value="dean">Dean</option>
                                        <option value="management_assistant">Management Assistant</option>
                                        <option value="sar">Senior Assistant Registrar</option>
                                        <option value="registrar">Registrar</option>
                                        <option value="admin">System Administrator</option>
                                    </select>
                                </div>

                                {formData.role === 'dean' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Faculty</label>
                                        <select
                                            name="faculty"
                                            value={formData.faculty}
                                            onChange={handleChange}
                                            required
                                            className="input-field block w-full px-3 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                        >
                                            <option value="">Select Faculty</option>
                                            <option value="science">Faculty of Science</option>
                                            <option value="humanities">Faculty of Humanities</option>
                                            <option value="social-sciences">Faculty of Social Sciences</option>
                                            <option value="commerce">Commerce & Management</option>
                                        </select>
                                    </div>
                                ) : (
                                    (!['sar', 'registrar', 'management_assistant', 'admin', ''].includes(formData.role)) && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Department</label>
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                required
                                                className="input-field block w-full px-3 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                            >
                                                <option value="">Select Department</option>
                                                <option value="Accountancy">Accountancy</option>
                                                <option value="Archaeology">Archaeology</option>
                                                <option value="Botany">Botany / Plant and Molecular Biology</option>
                                                <option value="Chemistry">Chemistry</option>
                                                <option value="Commerce_Financial_Management">Commerce & Financial Management</option>
                                                <option value="Drama_Cinema_Television">Drama, Cinema and Television</option>
                                                <option value="Economics">Economics</option>
                                                <option value="English">English</option>
                                                <option value="English_Language_Teaching">English Language Teaching</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Fine_Arts">Fine Arts</option>
                                                <option value="Geography">Geography</option>
                                                <option value="Hindi_Studies">Hindi Studies</option>
                                                <option value="History">History</option>
                                                <option value="Human_Resource_Management">Human Resource Management</option>
                                                <option value="Industrial_Management">Industrial Management</option>
                                                <option value="International_Studies">International Studies</option>
                                                <option value="Library_Information_Science">Library and Information Science</option>
                                                <option value="Linguistics">Linguistics</option>
                                                <option value="Marketing_Management">Marketing Management</option>
                                                <option value="Mathematics">Mathematics</option>
                                                <option value="Microbiology">Microbiology</option>
                                                <option value="Modern_Languages">Modern Languages (Chinese, French, German, Japanese, Korean, Russian)</option>
                                                <option value="Pali_Buddhist_Studies">Pali & Buddhist Studies</option>
                                                <option value="Philosophy">Philosophy</option>
                                                <option value="Physics_Electronics">Physics and Electronics</option>
                                                <option value="Political_Science">Political Science</option>
                                                <option value="Sanskrit_Eastern_Studies">Sanskrit and Eastern Studies</option>
                                                <option value="Sinhala">Sinhala</option>
                                                <option value="Social_Statistics">Social Statistics</option>
                                                <option value="Sociology">Sociology</option>
                                                <option value="Sport_Science_Physical_Education">Sport Science and Physical Education</option>
                                                <option value="Statistics_Computer_Science">Statistics and Computer Science</option>
                                                <option value="Western_Classical_Culture">Western Classical Culture & Christian Culture</option>
                                                <option value="Zoology_Environmental_Management">Zoology and Environmental Management</option>
                                            </select>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Phone</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="input-field block w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                            placeholder="+94 77 XXX XXXX"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Employee ID</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FontAwesomeIcon icon={faIdCard} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="employeeId"
                                            value={formData.employeeId}
                                            onChange={handleChange}
                                            required
                                            className="input-field block w-full pl-10 pr-3 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                            placeholder="UOK/XXX/XXXX"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className="input-field block w-full pl-10 pr-10 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                            placeholder="********"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-gray-400 hover:text-gray-300" />
                                        </button>
                                    </div>
                                    {/* Strength Indicator */}
                                    <div className="mt-2 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${passwordStrength < 2 ? 'bg-red-500' :
                                                passwordStrength < 4 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            className="input-field block w-full pl-10 pr-10 py-3 rounded-lg focus:ring-2 focus:ring-[#F6DD26] transition"
                                            placeholder="********"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="text-gray-400 hover:text-gray-300" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start pt-2">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        checked={formData.terms}
                                        onChange={handleChange}
                                        required
                                        className="h-4 w-4 text-[#660000] focus:ring-[#660000] border-gray-600 rounded bg-gray-700"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="terms" className="text-gray-300">
                                        I agree to the <a href="#" className="text-[#F6DD26] hover:underline">University Transportation Policy</a>.
                                    </label>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-[#660000] hover:bg-[#800000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#660000] transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm">
                            <span className="text-gray-400">Already have an account? </span>
                            <button
                                onClick={() => navigate('/')}
                                className="font-semibold text-[#F6DD26] hover:text-[#F6DD26]/80 transition-colors"
                            >
                                Sign in
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
