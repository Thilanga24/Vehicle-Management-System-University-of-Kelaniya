import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const MaintenanceManagement = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [user, setUser] = useState({ name: 'User', role: 'admin' });

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userRole = sessionStorage.getItem('userRole');
        const storedUser = sessionStorage.getItem('userName');

        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (storedUser) {
            setUser({ name: storedUser, role: userRole });
        }
    }, [navigate]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const backToDashboard = () => {
        const role = sessionStorage.getItem('userRole');
        if (role === 'sar') return navigate('/sar-dashboard');
        if (role === 'registrar') return navigate('/registrar-dashboard');
        return navigate('/admin-dashboard');
    };

    // --- Mock Data ---
    const criticalAlerts = [
        { vehicle: 'KI-1234', issue: 'Engine overheating', reported: '2 hours ago', priority: 'critical' },
        { vehicle: 'KI-5678', issue: 'Brake system warning', reported: '5 hours ago', priority: 'critical' },
        { vehicle: 'KI-9012', issue: 'Transmission problem', reported: '1 day ago', priority: 'high' }
    ];

    const activeJobs = [
        { vehicle: 'KI-3456', service: 'Engine overhaul', mechanic: 'Mr. Silva', progress: 65, eta: '2 days' },
        { vehicle: 'KI-7890', service: 'Brake replacement', mechanic: 'Mr. Perera', progress: 90, eta: '4 hours' },
        { vehicle: 'KI-2345', service: 'Tire replacement', mechanic: 'Mr. Fernando', progress: 40, eta: '1 day' }
    ];

    const upcomingServices = [
        { date: 'Oct 17', vehicle: 'KI-1234', service: 'Routine Service', priority: 'medium', status: 'scheduled' },
        { date: 'Oct 18', vehicle: 'KI-5678', service: 'Engine Check', priority: 'high', status: 'scheduled' },
        { date: 'Oct 19', vehicle: 'KI-9012', service: 'AC Service', priority: 'low', status: 'scheduled' },
        { date: 'Oct 20', vehicle: 'KI-3456', service: 'Oil Change', priority: 'medium', status: 'scheduled' }
    ];

    const maintenanceHistoryData = [
        { date: 'Oct 10, 2025', vehicle: 'KI-1234', service: 'Routine Service', cost: 25000, mechanic: 'Mr. Silva', duration: '4 hours' },
        { date: 'Oct 08, 2025', vehicle: 'KI-5678', service: 'Brake Pad Replacement', cost: 35000, mechanic: 'Mr. Perera', duration: '3 hours' },
        { date: 'Oct 05, 2025', vehicle: 'KI-9012', service: 'Engine Oil Change', cost: 15000, mechanic: 'Mr. Fernando', duration: '2 hours' }
    ];

    // --- Renders ---

    const renderSidebar = () => (
        <div className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
            <div className="logo">
                <div className="logo-content justify-center">
                    <img src="/assets/banner.png" alt="University of Kelaniya VMS" className="w-full h-auto object-contain" />
                </div>
            </div>

            <div className="menu-section">
                <div className="menu-section-title">Maintenance</div>
                <div className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
                    <i className="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </div>
                <div className={`menu-item ${activeSection === 'schedule' ? 'active' : ''}`} onClick={() => setActiveSection('schedule')}>
                    <i className="fas fa-calendar-alt"></i>
                    <span>Schedule</span>
                </div>
                <div className={`menu-item ${activeSection === 'active' ? 'active' : ''}`} onClick={() => setActiveSection('active')}>
                    <i className="fas fa-wrench"></i>
                    <span>Active Jobs</span>
                </div>
                <div className={`menu-item ${activeSection === 'history' ? 'active' : ''}`} onClick={() => setActiveSection('history')}>
                    <i className="fas fa-history"></i>
                    <span>History</span>
                </div>
                <div className={`menu-item ${activeSection === 'report-issue' ? 'active' : ''}`} onClick={() => setActiveSection('report-issue')}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Report Issue</span>
                </div>
                <div className={`menu-item ${activeSection === 'analytics' ? 'active' : ''}`} onClick={() => setActiveSection('analytics')}>
                    <i className="fas fa-chart-line"></i>
                    <span>Analytics</span>
                </div>
            </div>

            <div className="menu-section">
                <div className="menu-section-title">Navigation</div>
                <div className="menu-item" onClick={backToDashboard}>
                    <i className="fas fa-arrow-left"></i>
                    <span>Back to Dashboard</span>
                </div>
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div className="section animation-fade-in">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Maintenance Dashboard</h2>
                <p className="text-slate-500">Vehicle service tracking and management</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-red-50 p-3 rounded-lg"><i className="fas fa-exclamation-triangle text-2xl text-red-600"></i></div>
                        <div className="text-right"><p className="text-3xl font-bold text-slate-800">5</p><p className="text-xs text-slate-400">↑ +2 this week</p></div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Critical Issues</h3>
                    <p className="text-red-600 text-sm font-semibold">⚠️ Requires attention</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-yellow-50 p-3 rounded-lg"><i className="fas fa-tools text-2xl text-yellow-500"></i></div>
                        <div className="text-right"><p className="text-3xl font-bold text-slate-800">12</p><p className="text-xs text-slate-400">3 overdue</p></div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Scheduled Services</h3>
                    <p className="text-yellow-600 text-sm font-semibold">📅 Next 30 days</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg"><i className="fas fa-wrench text-2xl text-blue-600"></i></div>
                        <div className="text-right"><p className="text-3xl font-bold text-slate-800">7</p><p className="text-xs text-slate-400">Est. 3 days</p></div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Active Jobs</h3>
                    <p className="text-blue-600 text-sm font-semibold">🔧 In progress</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-50 p-3 rounded-lg"><i className="fas fa-dollar-sign text-2xl text-pink-600"></i></div>
                        <div className="text-right"><p className="text-3xl font-bold text-slate-800">425K</p><p className="text-xs text-slate-400">LKR this month</p></div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Maintenance Cost</h3>
                    <p className="text-pink-600 text-sm font-semibold">💰 Budget: 500K</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Critical Alerts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">🚨 Critical Alerts</h2>
                        <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
                    </div>
                    <div className="space-y-4">
                        {criticalAlerts.map((alert, i) => (
                            <div key={i} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-100">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-2"></div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-slate-800">{alert.vehicle}</p>
                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 font-bold rounded-full uppercase">{alert.priority}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{alert.issue}</p>
                                    <p className="text-xs text-slate-400 mt-1">{alert.reported}</p>
                                </div>
                                <button className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-sm text-slate-600 shadow-sm">View</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Jobs Preview */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">🔧 Active Jobs Preview</h2>
                        <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => setActiveSection('active')}>View Detailed</button>
                    </div>
                    <div className="space-y-4">
                        {activeJobs.map((job, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div><p className="font-bold text-slate-800">{job.vehicle}</p><p className="text-sm text-slate-500">{job.service}</p></div>
                                    <p className="text-xs text-blue-600 font-medium">ETA: {job.eta}</p>
                                </div>
                                <div className="mb-2">
                                    <div className="flex justify-between text-xs mb-1 text-slate-500"><span>Progress</span><span>{job.progress}%</span></div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${job.progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">📅 Upcoming Maintenance</h2>
                    <button onClick={() => setActiveSection('schedule')} className="text-sm text-blue-600 hover:text-blue-800">Full Calendar</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Vehicle</th>
                                <th className="p-3">Service Type</th>
                                <th className="p-3">Priority</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {upcomingServices.map((service, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition">
                                    <td className="p-3 font-medium text-slate-700">{service.date}</td>
                                    <td className="p-3 text-slate-600">{service.vehicle}</td>
                                    <td className="p-3 text-slate-600">{service.service}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${service.priority === 'high' ? 'bg-orange-100 text-orange-700' : service.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {service.priority}
                                        </span>
                                    </td>
                                    <td className="p-3"><span className="text-blue-600 font-medium">{service.status}</span></td>
                                    <td className="p-3">
                                        <button className="text-blue-600 hover:text-blue-800 mr-2"><i className="fas fa-eye"></i></button>
                                        <button className="text-yellow-600 hover:text-yellow-800"><i className="fas fa-edit"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderIssueForm = () => (
        <div className="section animation-fade-in bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Report Maintenance Issue</h2>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Issue Reported!"); setActiveSection('dashboard'); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle *</label>
                        <select required className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900">
                            <option value="">Select Vehicle</option>
                            <option>KI-1234 - Toyota Hiace</option>
                            <option>KI-5678 - Honda Civic</option>
                            <option>KI-9012 - Toyota Prado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Priority Level *</label>
                        <select required className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900">
                            <option value="">Select Priority</option>
                            <option value="critical">Critical - Immediate</option>
                            <option value="high">High - Within 24 hours</option>
                            <option value="medium">Medium - Within 3 days</option>
                            <option value="low">Low - Routine service</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Issue Category *</label>
                        <select required className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900">
                            <option value="">Select Category</option>
                            <option>Engine Problem</option>
                            <option>Brake System</option>
                            <option>Tire Issue</option>
                            <option>Electrical System</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Current Mileage (km)</label>
                        <input type="number" placeholder="e.g., 45000" className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Issue Description *</label>
                    <textarea required rows="4" placeholder="Describe the problem in detail..." className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900"></textarea>
                </div>
                <div className="flex items-center space-x-3">
                    <input type="checkbox" id="markUnavailable" className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300" />
                    <label htmlFor="markUnavailable" className="text-sm text-slate-700">Mark vehicle as unavailable immediately</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setActiveSection('dashboard')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Cancel</button>
                    <button type="submit" className="px-6 py-3 bg-red-800 hover:bg-red-900 text-white rounded-lg font-medium transition shadow-md">
                        <i className="fas fa-exclamation-triangle mr-2"></i>Submit Report
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="dashboard-container">
            {/* Mobile Hamburger */}
            <div className="lg:hidden fixed top-5 left-5 z-50 p-2 bg-maroon text-white rounded cursor-pointer" onClick={toggleSidebar}>
                <i className="fas fa-bars text-xl"></i>
            </div>

            {renderSidebar()}

            <div className="main-content">
                <div className="top-nav">
                    <div className="welcome">
                        <h1>Maintenance Center <i className="fas fa-tools text-yellow-500 ml-2"></i></h1>
                        <p>Manage fleet health and service schedules.</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="user-profile">
                            <div className="user-avatar text-white font-bold flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #660000 0%, #800000 100%)', width: '40px', height: '40px', borderRadius: '50%' }}>
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    {activeSection === 'dashboard' && renderDashboard()}
                    {activeSection === 'report-issue' && renderIssueForm()}
                    {/* Placeholders for other sections */}
                    {['schedule', 'active', 'history', 'analytics'].includes(activeSection) && (
                        <div className="section text-center py-20 animation-fade-in">
                            <i className={`fas ${activeSection === 'schedule' ? 'fa-calendar-alt' :
                                    activeSection === 'active' ? 'fa-wrench' :
                                        activeSection === 'history' ? 'fa-history' : 'fa-chart-line'
                                } text-slate-300 text-6xl mb-6`}></i>
                            <h3 className="text-xl text-slate-800 font-bold mb-2 capitalize">{activeSection} Module</h3>
                            <p className="text-slate-500">The <strong>{activeSection}</strong> interface is currently populated with mock data in the Dashboard view. <br />Full detailed view coming soon.</p>
                            <button onClick={() => setActiveSection('dashboard')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Back to Dashboard</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaintenanceManagement;
