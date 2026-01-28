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
            alert('Passwords do not match!');
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            alert('Account created successfully! Please check your email for verification.');
            navigate('/');
        }, 2000);
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
                        <h1 className="text-4xl font-bold mb-4 font-serif">University of Kelaniya</h1>
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
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
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
                                        <option value="lecturer">Lecturer</option>
                                        <option value="hod">Head of Department</option>
                                        <option value="dean">Dean</option>
                                        <option value="sar">Senior Assistant Registrar</option>
                                        <option value="registrar">Registrar</option>
                                        <option value="driver">Driver</option>
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
                                    (!['sar', 'registrar', ''].includes(formData.role)) && (
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
                                                <option value="cs">Computer Science</option>
                                                <option value="math">Mathematics</option>
                                                <option value="physics">Physics</option>
                                                <option value="chemistry">Chemistry</option>
                                                <option value="biology">Biology</option>
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
