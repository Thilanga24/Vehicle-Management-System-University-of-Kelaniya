import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const RegistrarDashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Toggle Sidebar
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    // Render Content
    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="stat-card bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm">Long Distance Req</p>
                                        <h3 className="text-3xl font-bold text-slate-800">6</h3>
                                        <p className="text-emerald-600 text-xs mt-1"><i className="fas fa-arrow-up"></i> +2 pending</p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600"><i className="fas fa-exclamation-triangle text-xl"></i></div>
                                </div>
                            </div>
                            <div className="stat-card bg-white p-6 rounded-xl shadow border-l-4 border-indigo-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm">Total Fleet</p>
                                        <h3 className="text-3xl font-bold text-slate-800">24</h3>
                                        <p className="text-indigo-600 text-xs mt-1"><i className="fas fa-car text-sm"></i> University Vehicles</p>
                                    </div>
                                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><i className="fas fa-bus text-xl"></i></div>
                                </div>
                            </div>
                            <div className="stat-card bg-white p-6 rounded-xl shadow border-l-4 border-emerald-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm">Approvals (M)</p>
                                        <h3 className="text-3xl font-bold text-slate-800">89</h3>
                                        <p className="text-emerald-600 text-xs mt-1"><i className="fas fa-check text-sm"></i> Decisions made</p>
                                    </div>
                                    <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><i className="fas fa-file-signature text-xl"></i></div>
                                </div>
                            </div>
                            <div className="stat-card bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm">Annual Budget</p>
                                        <h3 className="text-3xl font-bold text-slate-800">8.2M</h3>
                                        <p className="text-blue-600 text-xs mt-1"><i className="fas fa-wallet text-sm"></i> LKR utilized</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><i className="fas fa-coins text-xl"></i></div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Exec Decisions & Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Approvals Required */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center">
                                    <i className="fas fa-gavel text-maroon mr-2"></i> Executive Approvals Required
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-800">Intl Research Conf</h4>
                                                <p className="text-xs text-slate-500">Multiple Faculties • 320km</p>
                                            </div>
                                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">30 mins ago</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                                            <div><span className="font-semibold">Dates:</span> Oct 25-28</div>
                                            <div><span className="font-semibold">Fleet:</span> 2 Buses</div>
                                            <div><span className="font-semibold">Cost:</span> LKR 180k</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 bg-emerald-600 text-white text-xs py-2 rounded hover:bg-emerald-700">Approve</button>
                                            <button className="flex-1 bg-red-600 text-white text-xs py-2 rounded hover:bg-red-700">Reject</button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-800">Uni Collaboration</h4>
                                                <p className="text-xs text-slate-500">Faculty of Science • 250km</p>
                                            </div>
                                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">2 hrs ago</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                                            <div><span className="font-semibold">Dates:</span> Oct 22-24</div>
                                            <div><span className="font-semibold">Fleet:</span> 1 Bus</div>
                                            <div><span className="font-semibold">Cost:</span> LKR 125k</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 bg-emerald-600 text-white text-xs py-2 rounded hover:bg-emerald-700">Approve</button>
                                            <button className="flex-1 bg-red-600 text-white text-xs py-2 rounded hover:bg-red-700">Reject</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fleet Analytics */}
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center">
                                    <i className="fas fa-chart-pie text-maroon mr-2"></i> Fleet Analytics
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">Fuel Expenses</p>
                                            <p className="text-xs text-slate-500">Oct 2025</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-red-600">LKR 245k</p>
                                            <p className="text-xs text-red-500"><i className="fas fa-arrow-up"></i> 8%</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">Maintenance</p>
                                            <p className="text-xs text-slate-500">Oct 2025</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-emerald-600">LKR 95k</p>
                                            <p className="text-xs text-emerald-500"><i className="fas fa-arrow-down"></i> 12%</p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase">Utilization</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-600"><span>High Usage</span> <span>92%</span></div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[92%]"></div></div>
                                            <div className="flex justify-between text-xs text-slate-600"><span>Medium Usage</span> <span>67%</span></div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[67%]"></div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Decisions & Strategic Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 text-lg mb-4">Strategic Insights</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded text-center">
                                        <p className="text-2xl font-bold text-emerald-600">94%</p>
                                        <p className="text-xs text-slate-500">Approval Rate</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded text-center">
                                        <p className="text-2xl font-bold text-blue-600">1.2h</p>
                                        <p className="text-xs text-slate-500">Avg Time</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                                        <strong>Budget Optimization:</strong> Consider fuel-efficient vehicles for long trips.
                                    </div>
                                    <div className="p-2 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-100">
                                        <strong>Fleet Expansion:</strong> High utilization suggests need for 2 more vehicles.
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 text-lg mb-4">Recent Decisions</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded transition">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">Approved Science Fac Conf</p>
                                            <p className="text-xs text-slate-500">LKR 150k • 2 days ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded transition">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">Rejected Budget Request</p>
                                            <p className="text-xs text-slate-500">Excessive • 5 days ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded transition">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">Modified Trip Duration</p>
                                            <p className="text-xs text-slate-500">Reduced to 3 days • 1 week ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'drivers':
                return (
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Driver Management</h2>
                            <button className="bg-maroon text-white px-4 py-2 rounded lg text-sm hover:bg-red-900">Add Driver</button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'Sunil Bandara', license: 'B-7854321', status: 'Active', rating: 4.8 },
                                { name: 'Kamal Fernando', license: 'B-9876543', status: 'Active', rating: 4.9 },
                                { name: 'Nimal Perera', license: 'B-5432167', status: 'On Leave', rating: 4.7 }
                            ].map((dr, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg hover:shadow-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">{dr.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold text-slate-800">{dr.name}</p>
                                            <p className="text-xs text-slate-500">Lic: {dr.license}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs ${dr.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{dr.status}</span>
                                        <p className="text-xs text-slate-400 mt-1"><i className="fas fa-star text-yellow-400"></i> {dr.rating}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'longdistance':
                return (
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Long Distance Trips (&gt;100km)</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                                <p className="text-2xl font-bold text-yellow-500">6</p>
                                <p className="text-xs text-slate-500">Pending</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                                <p className="text-2xl font-bold text-emerald-500">23</p>
                                <p className="text-xs text-slate-500">Approved</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                                <p className="text-2xl font-bold text-blue-500">5,240</p>
                                <p className="text-xs text-slate-500">Total KM</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                                <p className="text-2xl font-bold text-red-500">485k</p>
                                <p className="text-xs text-slate-500">LKR Fuel</p>
                            </div>
                        </div>
                        {/* List would go here */}
                        <div className="p-10 text-center text-slate-400 bg-slate-50 rounded border border-dashed border-slate-300">
                            Long Distance Request List populated from backend...
                        </div>
                    </div>
                );
            default:
                return <div className="p-6 text-slate-500">Select a tab to view content.</div>;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Toggle */}
            <div className="lg:hidden fixed top-5 left-5 z-50 p-2 bg-maroon text-white rounded cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
                    <div className="menu-section-title">Registrar</div>
                    <div className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <i className="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/vehicles')}>
                        <i className="fas fa-car"></i>
                        <span>Vehicle Mgmt</span>
                    </div>
                    <div className={`menu-item ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveTab('drivers')}>
                        <i className="fas fa-users-cog"></i>
                        <span>Driver Mgmt</span>
                    </div>
                    <div className={`menu-item ${activeTab === 'longdistance' ? 'active' : ''}`} onClick={() => setActiveTab('longdistance')}>
                        <i className="fas fa-road"></i>
                        <span>Long Dist. Trips</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/reports')}>
                        <i className="fas fa-chart-line"></i>
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
                        <h1>Registrar Dashboard <i className="fas fa-user-tie text-maroon ml-2"></i></h1>
                        <p>Executive management panel</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="user-profile">
                            <div className="text-right mr-3 hidden md:block">
                                <p className="text-sm font-bold text-slate-800">Dr. Gunawardane</p>
                                <p className="text-xs text-slate-500">Registrar</p>
                            </div>
                            <div className="user-avatar bg-indigo-600">RG</div>
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default RegistrarDashboard;
