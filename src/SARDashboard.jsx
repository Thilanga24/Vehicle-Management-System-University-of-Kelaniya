import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const SARDashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Sample Data
    const stats = {
        approvals: 18,
        fleet: 24,
        available: 18,
        drivers: 16,
        onDuty: 12,
        maintenance: 5
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="dashboard-container">
            {/* Mobile Hamburger */}
            <div className="lg:hidden fixed top-5 left-5 z-50 p-2 bg-maroon text-white rounded cursor-pointer" onClick={toggleSidebar}>
                <i className="fas fa-bars text-xl"></i>
            </div>

            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
                <div className="logo">
                    <div className="logo-content justify-center">
                        <img src="/assets/banner.png" alt="University of Kelaniya VMS" className="w-full h-auto object-contain" />
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">SAR Panel</div>
                    <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <i className="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/vehicles')}>
                        <i className="fas fa-car"></i>
                        <span>Vehicles</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/users')}>
                        <i className="fas fa-users"></i>
                        <span>Drivers (Users)</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/dashboard')}>
                        <i className="fas fa-tools"></i>
                        <span>Maintenance</span>
                    </div>
                    <div className="menu-item">
                        <i className="fas fa-chart-bar"></i>
                        <span>Reports</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">System</div>
                    <div className="menu-item" onClick={() => navigate('/dashboard')}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Main Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="top-nav">
                    <div className="welcome">
                        <h1>Good Morning, Ms. Rathnayake <span className="text-2xl">👋</span></h1>
                        <p>Senior Assistant Registrar Dashboard</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="user-profile">
                            <div className="user-avatar bg-orange-600">SR</div>
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col justify-between hover:shadow-lg transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600"><i className="fas fa-clipboard-check text-xl"></i></div>
                                <div className="text-right">
                                    <h3 className="text-3xl font-bold text-slate-800">{stats.approvals}</h3>
                                    <span className="text-xs text-slate-500">+6 today</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-700">Admin Approvals</h4>
                                <p className="text-xs text-yellow-600 font-medium">⚠️ Action Required</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col justify-between hover:shadow-lg transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><i className="fas fa-car text-xl"></i></div>
                                <div className="text-right">
                                    <h3 className="text-3xl font-bold text-slate-800">{stats.fleet}</h3>
                                    <span className="text-xs text-slate-500">{stats.available} Available</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-700">Total Fleet</h4>
                                <p className="text-xs text-blue-600 font-medium">University Vehicles</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col justify-between hover:shadow-lg transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600"><i className="fas fa-user-tie text-xl"></i></div>
                                <div className="text-right">
                                    <h3 className="text-3xl font-bold text-slate-800">{stats.drivers}</h3>
                                    <span className="text-xs text-slate-500">{stats.onDuty} On Duty</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-700">Active Drivers</h4>
                                <p className="text-xs text-emerald-600 font-medium">Ready for dispatch</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col justify-between hover:shadow-lg transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-red-100 p-3 rounded-lg text-red-600"><i className="fas fa-tools text-xl"></i></div>
                                <div className="text-right">
                                    <h3 className="text-3xl font-bold text-slate-800">{stats.maintenance}</h3>
                                    <span className="text-xs text-slate-500">2 Urgent</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-700">Maintenance</h4>
                                <p className="text-xs text-red-600 font-medium">Needs Attention</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Approvals */}
                        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800">Pending Approvals</h2>
                                <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
                            </div>
                            <div className="space-y-4">
                                {/* Item 1 */}
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-800">Faculty of Science Trip</h3>
                                            <p className="text-xs text-slate-500">45km • Mount Lavinia</p>
                                        </div>
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">SAR Decision</span>
                                    </div>
                                    <div className="text-sm text-slate-600 mb-3">
                                        <div className="flex justify-between"><span>Date:</span> <span>Oct 16, 2025</span></div>
                                        <div className="flex justify-between"><span>Bus Required:</span> <span>1</span></div>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 mb-3 border border-blue-100">
                                        <i className="fas fa-info-circle mr-1"></i> Distance ≤100km: You can approve this.
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded text-sm transition">Approve</button>
                                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-sm transition">Reject</button>
                                    </div>
                                </div>
                                {/* Item 2 */}
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-800">Kandy Research Visit</h3>
                                            <p className="text-xs text-slate-500">180km • Kandy</p>
                                        </div>
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Review</span>
                                    </div>
                                    <div className="text-sm text-slate-600 mb-3">
                                        <div className="flex justify-between"><span>Date:</span> <span>Oct 20-22, 2025</span></div>
                                        <div className="flex justify-between"><span>Van Required:</span> <span>1 (3 Days)</span></div>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded text-xs text-orange-800 mb-3 border border-orange-100">
                                        <i className="fas fa-exclamation-triangle mr-1"></i> Distance &gt;100km: Forward to Registrar.
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded text-sm transition">Forward</button>
                                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-sm transition">Reject</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fleet & Quick Actions */}
                        <div className="space-y-6">
                            {/* Fleet Status */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">Fleet Status</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></span> <span className="text-sm font-medium">Available</span></div>
                                        <span className="font-bold text-emerald-600">18</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span> <span className="text-sm font-medium">In Use</span></div>
                                        <span className="font-bold text-red-600">4</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-full mr-3"></span> <span className="text-sm font-medium">Maintenance</span></div>
                                        <span className="font-bold text-amber-600">2</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex flex-col items-center justify-center gap-2" onClick={() => navigate('/vehicles')}>
                                        <i className="fas fa-plus-circle text-lg"></i> Add Vehicle
                                    </button>
                                    <button className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition flex flex-col items-center justify-center gap-2" onClick={() => navigate('/users')}>
                                        <i className="fas fa-user-plus text-lg"></i> Add Driver
                                    </button>
                                    <button className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition flex flex-col items-center justify-center gap-2">
                                        <i className="fas fa-wrench text-lg"></i> Maint. Alert
                                    </button>
                                    <button className="p-3 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition flex flex-col items-center justify-center gap-2">
                                        <i className="fas fa-file-export text-lg"></i> Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SARDashboard;
