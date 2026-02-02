import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MaintenanceManagement = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [user, setUser] = useState({ name: 'User', role: 'admin', id: null });

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userRole = sessionStorage.getItem('userRole');
        const storedUser = sessionStorage.getItem('userName');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        setUser({
            name: storedUser || currentUser.name || 'User',
            role: userRole || currentUser.role || 'admin',
            id: currentUser.id || currentUser.user_id || null
        });
    }, [navigate]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const backToDashboard = () => {
        const role = sessionStorage.getItem('userRole');
        if (role === 'sar') return navigate('/sar-dashboard');
        if (role === 'registrar') return navigate('/registrar-dashboard');
        return navigate('/admin-dashboard');
    };

    // --- Real Data States ---
    const [stats, setStats] = useState({
        criticalIssues: 0,
        scheduledServices: 0,
        activeJobs: 0,
        monthlyCost: 0
    });
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Stats
                const statsRes = await fetch('http://localhost:5000/api/maintenance/stats');
                const statsData = await statsRes.json();
                if (statsRes.ok) setStats(statsData);

                // Fetch All Records
                const recordsRes = await fetch('http://localhost:5000/api/maintenance');
                const recordsData = await recordsRes.json();
                if (recordsRes.ok) setRecords(recordsData);

                // Fetch Vehicles for the form
                const vehiclesRes = await fetch('http://localhost:5000/api/vehicles');
                const vehiclesData = await vehiclesRes.json();
                if (vehiclesRes.ok) setVehicles(vehiclesData);

            } catch (error) {
                console.error('Error fetching maintenance data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- Derived Data ---
    const criticalAlerts = records.filter(r => r.priority === 'critical' && r.status !== 'completed');
    const activeJobs = records.filter(r => r.status === 'in_progress');
    const upcomingServices = records.filter(r => r.status === 'scheduled');
    const maintenanceHistoryData = records.filter(r => r.status === 'completed');

    // --- Analytics Processing ---
    const costData = useMemo(() => {
        const monthlyGroups = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            monthlyGroups[key] = 0;
        }

        records.forEach(r => {
            if (r.cost && r.service_date) {
                const date = new Date(r.service_date);
                const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
                if (monthlyGroups[key] !== undefined) {
                    monthlyGroups[key] += parseFloat(r.cost);
                }
            }
        });

        return {
            labels: Object.keys(monthlyGroups),
            datasets: [{
                label: 'Maintenance Cost (LKR)',
                data: Object.values(monthlyGroups),
                borderColor: '#800000',
                backgroundColor: 'rgba(128, 0, 0, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    }, [records]);

    const frequencyData = useMemo(() => {
        const counts = { 'Routine Service': 0, 'Repair': 0, 'Inspection': 0, 'Emergency': 0 };
        records.forEach(r => {
            if (counts[r.service_type] !== undefined) {
                counts[r.service_type]++;
            }
        });

        return {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                hoverOffset: 4
            }]
        };
    }, [records]);

    const fleetHealth = useMemo(() => {
        return vehicles.map(v => {
            const vehicleRecords = records.filter(r => r.vehicle_id === v.vehicle_id);
            let score = 100;

            vehicleRecords.forEach(r => {
                if (r.service_type === 'Repair') score -= 10;
                if (r.service_type === 'Emergency') score -= 25;
                if (r.status === 'in_progress') score -= 5;
            });

            return {
                ...v,
                healthScore: Math.max(20, score)
            };
        }).sort((a, b) => a.healthScore - b.healthScore);
    }, [vehicles, records]);

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
                <div className={`menu-item ${activeSection === 'complete-job' ? 'active' : ''}`} onClick={() => setActiveSection('complete-job')}>
                    <i className="fas fa-check-double"></i>
                    <span>Update Progress</span>
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
                        <div className="text-right"><p className="text-3xl font-bold text-slate-800">{stats.criticalIssues}</p><p className="text-xs text-slate-400">Total active</p></div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Critical Issues</h3>
                    <p className="text-red-600 text-sm font-semibold">⚠️ Requires attention</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-yellow-50 p-3 rounded-lg"><i className="fas fa-tools text-2xl text-yellow-500"></i></div>
                        <div className="text-right"><p className="text-3xl font-bold text-slate-800">{stats.scheduledServices}</p><p className="text-xs text-slate-400">Next 30 days</p></div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Scheduled Services</h3>
                    <p className="text-yellow-600 text-sm font-semibold">📅 Plan ahead</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg"><i className="fas fa-wrench text-2xl text-blue-600"></i></div>
                        <div className="text-right"><p className="text-3xl font-bold text-slate-800">{stats.activeJobs}</p><p className="text-xs text-slate-400">In garage</p></div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Active Jobs</h3>
                    <p className="text-blue-600 text-sm font-semibold">🔧 In progress</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-50 p-3 rounded-lg"><i className="fas fa-dollar-sign text-2xl text-pink-600"></i></div>
                        <div className="text-right"><p className="text-3xl font-bold text-slate-800">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(stats.monthlyCost)}</p><p className="text-xs text-slate-400">This month</p></div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Maintenance Cost</h3>
                    <p className="text-pink-600 text-sm font-semibold">💰 Current spend</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">🚨 Critical Alerts</h2>
                        <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
                    </div>
                    <div className="space-y-4">
                        {criticalAlerts.length === 0 ? (
                            <p className="text-slate-400 text-center py-4">No critical alerts</p>
                        ) : criticalAlerts.map((alert, i) => (
                            <div key={i} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-100">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-2"></div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-slate-800">{alert.registration_number}</p>
                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-600 font-bold rounded-full uppercase">{alert.priority}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{alert.service_type}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(alert.service_date).toLocaleDateString()}</p>
                                </div>
                                <button className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-sm text-slate-600 shadow-sm">View</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">🔧 Active Jobs Preview</h2>
                        <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => setActiveSection('active')}>View Detailed</button>
                    </div>
                    <div className="space-y-4">
                        {activeJobs.length === 0 ? (
                            <p className="text-slate-400 text-center py-4">No active jobs</p>
                        ) : activeJobs.map((job, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div><p className="font-bold text-slate-800">{job.registration_number}</p><p className="text-sm text-slate-500">{job.service_type}</p></div>
                                    <p className="text-xs text-blue-600 font-medium">Started: {new Date(job.service_date).toLocaleDateString()}</p>
                                </div>
                                <div className="mb-2">
                                    <div className="flex justify-between text-xs mb-1 text-slate-500"><span>Status</span><span>{job.status}</span></div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `75%` }}></div>
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
                            {upcomingServices.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-400">No upcoming services scheduled</td></tr>
                            ) : upcomingServices.map((service, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition">
                                    <td className="p-3 font-medium text-slate-700">{new Date(service.service_date).toLocaleDateString()}</td>
                                    <td className="p-3 text-slate-600">{service.registration_number}</td>
                                    <td className="p-3 text-slate-600">{service.service_type}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${service.priority === 'high' || service.priority === 'critical' ? 'bg-orange-100 text-orange-700' : service.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
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

    const [formStatus, setFormStatus] = useState({ loading: false, error: null, success: false });
    const [issueData, setIssueData] = useState({
        vehicleId: '',
        priority: 'medium',
        category: '',
        mileage: '',
        description: '',
        markUnavailable: false,
        startDate: new Date().toISOString().split('T')[0]
    });

    const [completionData, setCompletionData] = useState({
        recordId: '',
        completionDate: new Date().toISOString().split('T')[0],
        cost: '',
        garageName: '',
        status: 'completed'
    });

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        setFormStatus({ loading: true, error: null, success: false });

        try {
            const response = await fetch('http://localhost:5000/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicleId: issueData.vehicleId,
                    serviceType: issueData.category,
                    issueDescription: issueData.description,
                    priority: issueData.priority,
                    serviceDate: issueData.startDate,
                    reportedByUserId: user.id,
                    status: issueData.markUnavailable ? 'in_progress' : 'scheduled'
                })
            });

            if (response.ok) {
                setFormStatus({ loading: false, error: null, success: true });
                // Reset form and go back
                setTimeout(() => {
                    setActiveSection('dashboard');
                    // Refresh data
                    window.location.reload(); // Simple refresh for now
                }, 1500);
            } else {
                const err = await response.json();
                // Show detailed error if available, otherwise generic message
                setFormStatus({
                    loading: false,
                    error: err.error || err.message || 'Failed to submit',
                    success: false
                });
            }
        } catch (error) {
            console.error('Submission error:', error);
            setFormStatus({ loading: false, error: `Error: ${error.message}`, success: false });
        }
    };

    const handleCompletionSubmit = async (e) => {
        e.preventDefault();
        setFormStatus({ loading: true, error: null, success: false });

        try {
            const response = await fetch(`http://localhost:5000/api/maintenance/${completionData.recordId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: completionData.status,
                    completionDate: completionData.completionDate,
                    cost: completionData.cost || 0,
                    garageName: completionData.garageName
                })
            });

            if (response.ok) {
                setFormStatus({ loading: false, error: null, success: true });
                setTimeout(() => {
                    setActiveSection('dashboard');
                    window.location.reload();
                }, 1500);
            } else {
                const err = await response.json();
                setFormStatus({ loading: false, error: err.message || 'Failed to update', success: false });
            }
        } catch (error) {
            console.error('Update error:', error);
            setFormStatus({ loading: false, error: `Error: ${error.message}`, success: false });
        }
    };

    const renderIssueForm = () => (
        <div className="section animation-fade-in bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Report Maintenance Issue</h2>

            {formStatus.success && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center">
                    <i className="fas fa-check-circle mr-3"></i> Issue submitted successfully!
                </div>
            )}

            {formStatus.error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
                    <i className="fas fa-exclamation-circle mr-3"></i> {formStatus.error}
                </div>
            )}

            <form className="space-y-6" onSubmit={handleIssueSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle *</label>
                        <select
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900"
                            value={issueData.vehicleId}
                            onChange={(e) => setIssueData({ ...issueData, vehicleId: e.target.value })}
                        >
                            <option value="">Select Vehicle</option>
                            {vehicles.filter(v => v.status !== 'maintenance').map(v => (
                                <option key={v.vehicle_id} value={v.vehicle_id}>
                                    {v.registration_number} - {v.make} {v.model}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Priority Level *</label>
                        <select
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900"
                            value={issueData.priority}
                            onChange={(e) => setIssueData({ ...issueData, priority: e.target.value })}
                        >
                            <option value="low">Low - Routine service</option>
                            <option value="medium">Medium - Within 3 days</option>
                            <option value="high">High - Within 24 hours</option>
                            <option value="critical">Critical - Immediate</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Issue Category *</label>
                        <select
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900"
                            value={issueData.category}
                            onChange={(e) => setIssueData({ ...issueData, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            <option value="Routine Service">Routine Service</option>
                            <option value="Repair">Repair</option>
                            <option value="Inspection">Inspection</option>
                            <option value="Emergency">Emergency</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Current Mileage (km)</label>
                        <input
                            type="number"
                            placeholder="e.g., 45000"
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900"
                            value={issueData.mileage}
                            onChange={(e) => setIssueData({ ...issueData, mileage: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Issue Description *</label>
                    <textarea
                        required
                        rows="4"
                        placeholder="Describe the problem in detail..."
                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-900"
                        value={issueData.description}
                        onChange={(e) => setIssueData({ ...issueData, description: e.target.value })}
                    ></textarea>
                </div>
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="markUnavailable"
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                        checked={issueData.markUnavailable}
                        onChange={(e) => setIssueData({ ...issueData, markUnavailable: e.target.checked })}
                    />
                    <label htmlFor="markUnavailable" className="text-sm text-slate-700">Mark vehicle as unavailable immediately (Start maintenance job now)</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setActiveSection('dashboard')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Cancel</button>
                    <button type="submit" disabled={formStatus.loading} className="px-6 py-3 bg-red-800 hover:bg-red-900 text-white rounded-lg font-medium transition shadow-md disabled:opacity-50">
                        {formStatus.loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-paper-plane mr-2"></i>}
                        Submit Report
                    </button>
                </div>
            </form>
        </div>
    );

    const renderCompletionForm = () => (
        <div className="section animation-fade-in bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Complete Maintenance Task</h2>

            <p className="text-slate-500 mb-8 text-center text-sm">
                Mark a vehicle's maintenance as finished to release it back into the active fleet.
            </p>

            {formStatus.success && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center">
                    <i className="fas fa-check-circle mr-3"></i> Job updated and vehicle set to available!
                </div>
            )}

            {formStatus.error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
                    <i className="fas fa-exclamation-circle mr-3"></i> {formStatus.error}
                </div>
            )}

            <form className="space-y-6" onSubmit={handleCompletionSubmit}>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">Active Maintenance Record *</label>
                    <select
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-600 transition"
                        value={completionData.recordId}
                        onChange={(e) => setCompletionData({ ...completionData, recordId: e.target.value })}
                    >
                        <option value="">Select an ongoing job...</option>
                        {records.filter(r => r.status !== 'completed' && r.status !== 'cancelled').map(r => (
                            <option key={r.record_id} value={r.record_id}>
                                {r.registration_number} - {r.service_type} (Date: {new Date(r.service_date).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">Completion Date *</label>
                        <input
                            type="date"
                            required
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-600 transition"
                            value={completionData.completionDate}
                            onChange={(e) => setCompletionData({ ...completionData, completionDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">Final Service Cost (LKR) *</label>
                        <input
                            type="number"
                            required
                            placeholder="0.00"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-600 transition"
                            value={completionData.cost}
                            onChange={(e) => setCompletionData({ ...completionData, cost: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">Garage / Service Center Name *</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g., Toyota Lanka, Nawala"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-600 transition"
                        value={completionData.garageName}
                        onChange={(e) => setCompletionData({ ...completionData, garageName: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">Update Status</label>
                    <select
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-600"
                        value={completionData.status}
                        onChange={(e) => setCompletionData({ ...completionData, status: e.target.value })}
                    >
                        <option value="completed">Completed (Make vehicle Available)</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="in_progress">In Progress</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={() => setActiveSection('dashboard')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition duration-200">Cancel</button>
                    <button type="submit" disabled={formStatus.loading} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition duration-200 shadow-lg disabled:opacity-50 flex items-center">
                        {formStatus.loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-check-circle mr-2"></i>}
                        Update & Release Vehicle
                    </button>
                </div>
            </form>
        </div>
    );

    // --- Calendar Logic ---
    const [calendarDate, setCalendarDate] = useState(new Date());

    const getCalendarDays = () => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const startDayOffset = (firstDay + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days = [];
        for (let i = startDayOffset - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, currentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
        }
        return days;
    };

    const changeMonth = (offset) => {
        setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + offset, 1));
    };

    const renderSchedule = () => {
        const calendarDays = getCalendarDays();
        return (
            <div className="section animation-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Maintenance Schedule</h1>
                        <p className="text-sm text-slate-500">{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-md text-slate-600 transition-colors"><i className="fas fa-chevron-left"></i></button>
                        <button onClick={() => setCalendarDate(new Date())} className="px-4 py-1.5 text-sm font-medium hover:bg-slate-50 rounded-md text-slate-700 transition-colors border-x border-slate-100">Today</button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-md text-slate-600 transition-colors"><i className="fas fa-chevron-right"></i></button>
                    </div>
                    <button className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition shadow-sm" onClick={() => setActiveSection('report-issue')}>
                        <i className="fas fa-plus mr-2"></i>Schedule Service
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                    </div>
                    <div className="grid grid-cols-7">
                        {calendarDays.map((dateObj, i) => {
                            const dateString = dateObj.date.toISOString().split('T')[0];
                            const dayEvents = records.filter(r => {
                                const recordDate = new Date(r.service_date).toISOString().split('T')[0];
                                return recordDate === dateString;
                            });

                            return (
                                <div key={i} className={`border-r border-b border-slate-100 p-2 min-h-[110px] hover:bg-slate-50 transition-colors ${!dateObj.currentMonth ? 'bg-slate-50/50' : ''}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${dateObj.date.toDateString() === new Date().toDateString()
                                            ? 'bg-red-800 text-white font-bold'
                                            : !dateObj.currentMonth ? 'text-slate-300' : 'text-slate-500 font-medium'
                                            }`}>
                                            {dateObj.day}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.map((ev, idx) => (
                                            <div key={idx} className={`p-1 text-[10px] rounded border truncate cursor-pointer transition-all hover:scale-[1.02] ${ev.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                ev.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                }`} title={`${ev.registration_number}: ${ev.service_type}`}>
                                                <span className="font-bold mr-1">{ev.registration_number}</span>
                                                {ev.service_type}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

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
                    {activeSection === 'schedule' && renderSchedule()}
                    {activeSection === 'report-issue' && renderIssueForm()}
                    {activeSection === 'complete-job' && renderCompletionForm()}

                    {(activeSection === 'active' || activeSection === 'history') && (
                        <div className="section animation-fade-in">
                            <h1 className="text-2xl font-bold text-slate-800 mb-6 capitalize">
                                {activeSection === 'active' ? '🔧 Active Maintenance Jobs' : '📜 Maintenance History'}
                            </h1>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-4">Vehicle</th>
                                            <th className="p-4">Service</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">{activeSection === 'active' ? 'Mechanic' : 'Cost'}</th>
                                            <th className="p-4">Priority</th>
                                            <th className="p-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(activeSection === 'active' ? activeJobs : maintenanceHistoryData).map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{item.registration_number}</div>
                                                    <div className="text-xs text-slate-400">{item.make} {item.model}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-slate-700">{item.service_type}</div>
                                                    <div className="text-xs text-slate-400 truncate max-w-xs">{item.issue_description}</div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600">
                                                    {new Date(item.service_date).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-700">
                                                    {activeSection === 'active' ? (item.garage_name || 'Unassigned') : `LKR ${item.cost?.toLocaleString()}`}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.priority === 'critical' ? 'bg-red-100 text-red-600' :
                                                        item.priority === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {item.priority}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button className="text-slate-400 hover:text-blue-600 transition"><i className="fas fa-ellipsis-v"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(activeSection === 'active' ? activeJobs : maintenanceHistoryData).length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="p-20 text-center">
                                                    <i className="fas fa-inbox text-slate-200 text-5xl mb-4"></i>
                                                    <p className="text-slate-400">No records found for this section.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'analytics' && (
                        <div className="section animation-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-slate-800">Maintenance Analytics</h1>
                                <div className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
                                    <i className="fas fa-sync-alt mr-2 animate-spin-slow"></i> Real-time Database Feed
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                                        <i className="fas fa-chart-line text-red-800 mr-2"></i> Cost Distribution (6 Months)
                                    </h3>
                                    <div className="h-64">
                                        <Line
                                            data={costData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: { y: { beginAtZero: true } }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                                        <i className="fas fa-chart-pie text-blue-600 mr-2"></i> Service Type Breakdown
                                    </h3>
                                    <div className="h-64 flex justify-center">
                                        <Doughnut
                                            data={frequencyData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { position: 'right' } }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-800 flex items-center">
                                        <i className="fas fa-heartbeat text-emerald-500 mr-2"></i> Fleet Health Scoring
                                    </h3>
                                    <span className="text-xs text-slate-400">Based on recent maintenance history types</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    {fleetHealth.slice(0, 10).map((v, i) => (
                                        <div key={i} className="flex items-center space-x-4">
                                            <div className="w-24">
                                                <div className="text-sm font-bold text-slate-800">{v.registration_number}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{v.make}</div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-slate-500 font-medium">Uptime Health</span>
                                                    <span className={`font-bold ${v.healthScore > 80 ? 'text-emerald-500' : v.healthScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                                        {v.healthScore}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${v.healthScore > 80 ? 'bg-emerald-500' :
                                                                v.healthScore > 50 ? 'bg-amber-500' :
                                                                    'bg-red-500'
                                                            }`}
                                                        style={{ width: `${v.healthScore}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {vehicles.length > 10 && (
                                    <div className="mt-6 text-center">
                                        <button className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest">View Complete Fleet Status</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaintenanceManagement;
