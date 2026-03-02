import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistrarDashboard.css'; // Uses the new University Theme CSS

// --- Mock Data ---
const MOCK_FLEET = [
    { id: 'CAR-001', model: 'Toyota Corolla 2020', status: 'available', mileage: '45,230 km', nextService: '2024-02-15' },
    { id: 'VAN-002', model: 'Toyota Hiace 2019', status: 'in-use', mileage: '67,890 km', nextService: '2024-01-28' },
    { id: 'BUS-003', model: 'Mitsubishi Rosa 2021', status: 'available', mileage: '23,450 km', nextService: '2024-03-10' },
    { id: 'VAN-004', model: 'Nissan Caravan 2018', status: 'maintenance', mileage: '89,230 km', nextService: 'In Progress' }
];

const MOCK_DRIVERS = [
    { name: 'Sunil Bandara', license: 'B-7854321', status: 'active', rating: '4.8', trips: 234 },
    { name: 'Kamal Fernando', license: 'B-9876543', status: 'active', rating: '4.9', trips: 187 },
    { name: 'Nimal Perera', license: 'B-5432167', status: 'on-leave', rating: '4.7', trips: 156 },
    { name: 'Gamini Silva', license: 'B-8765432', status: 'active', rating: '4.6', trips: 298 }
];

const MOCK_MAINTENANCE = [
    { vehicle: 'CAR-001', service: 'Regular Service', date: '2024-01-20', status: 'scheduled' },
    { vehicle: 'VAN-002', service: 'Oil Change', date: '2024-01-22', status: 'overdue' },
    { vehicle: 'BUS-003', service: 'Tire Replacement', date: '2024-01-25', status: 'scheduled' },
    { vehicle: 'VAN-004', service: 'Engine Repair', date: '2024-01-18', status: 'in-progress' }
];

const MOCK_PENDING_REQUESTS = [
    {
        id: 'REQ-2024-001',
        department: 'Engineering Faculty',
        purpose: 'Student Field Trip - Mahaweli Project Site',
        date: '2024-01-15',
        time: '08:00 AM',
        passengers: 45,
        distance: '120 km',
        duration: '1 day',
        priority: 'High',
        submittedBy: 'Prof. Kamal Perera'
    },
    {
        id: 'REQ-2024-002',
        department: 'Medical Faculty',
        purpose: 'Hospital Visit - Teaching Hospital Kandy',
        date: '2024-01-16',
        time: '09:30 AM',
        passengers: 25,
        distance: '45 km',
        duration: '4 hours',
        priority: 'Medium',
        submittedBy: 'Dr. Nimal Silva'
    },
    {
        id: 'REQ-2024-003',
        department: 'Agriculture Faculty',
        purpose: 'Research Site Visit - Peradeniya Botanical Garden',
        date: '2024-01-18',
        time: '07:00 AM',
        passengers: 30,
        distance: '15 km',
        duration: '6 hours',
        priority: 'Medium',
        submittedBy: 'Prof. Sunila Jayawardena'
    }
];

const RegistrarDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{"name": "Registrar", "role": "registrar"}'));
    const [searchQuery, setSearchQuery] = useState('');

    // Data States
    const [fleetData, setFleetData] = useState(MOCK_FLEET);
    const [driverData, setDriverData] = useState(MOCK_DRIVERS);
    const [maintenanceData, setMaintenanceData] = useState(MOCK_MAINTENANCE);

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
    };

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/reservations');
            if (response.ok) {
                const data = await response.json();
                setReservations(data);
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
        const interval = setInterval(fetchReservations, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filtered lists for the Registrar
    const pendingRequests = reservations
        .filter(r => r.status === 'pending_registrar')
        .map(r => ({
            id: r.reservation_id,
            department: r.department || 'N/A',
            purpose: r.description,
            date: new Date(r.start_datetime).toLocaleDateString(),
            time: new Date(r.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            passengers: r.passengers_count,
            distance: `${r.distance_km} km`,
            priority: r.distance_km > 200 ? 'Executive' : 'High',
            remarks: r.remarks,
            attachment_url: r.attachment_url,
            emergency_contact: r.emergency_contact,
            submittedBy: `${r.first_name || ''} ${r.last_name || 'Staff'}`
        }));

    // Modal State
    const [modal, setModal] = useState({ show: false, type: '', data: null });
    const [approvalComment, setApprovalComment] = useState('');

    // --- Effects ---
    useEffect(() => {
        const storedUser = sessionStorage.getItem('userName');
        if (storedUser) {
            setUser(prev => ({ ...prev, name: storedUser }));
        }
    }, []);

    const logout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
    };

    // --- Helper Functions ---
    const handleModalClose = () => {
        setModal({ show: false, type: '', data: null });
        setApprovalComment('');
    };

    const handleAction = async (action) => {
        if (!modal.data) return;
        const id = modal.data.id;

        try {
            const apiStatus = action === 'reject' ? 'rejected' : 'approved';
            const response = await fetch(`http://localhost:5000/api/reservations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: apiStatus,
                    level: 'registrar',
                    comments: approvalComment
                })
            });

            if (response.ok) {
                showNotification(`Request #${id} ${action === 'approve' ? 'Approved' : 'Rejected'} Successfully.`, 'success');
                fetchReservations();
            } else {
                showNotification('Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Registrar Action Error:', error);
            showNotification('Error processing request', 'error');
        }
        handleModalClose();
    };

    const openReviewModal = (req) => {
        setModal({ show: true, type: 'review', data: req });
    };

    // --- Render Components ---
    const renderOverview = () => (
        <div className="animation-fade-in space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-2 w-full">
                        <div className="bg-yellow-100 p-3 rounded-lg"><i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i></div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">{pendingRequests.length}</p>
                            <p className="text-xs text-slate-500">requests</p>
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Pending Approvals</h3>
                </div>
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-2 w-full">
                        <div className="bg-indigo-100 p-3 rounded-lg"><i className="fas fa-car text-indigo-600 text-xl"></i></div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">{fleetData.length}</p>
                            <p className="text-xs text-slate-500">vehicles</p>
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Total Fleet</h3>
                </div>
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-2 w-full">
                        <div className="bg-green-100 p-3 rounded-lg"><i className="fas fa-check-circle text-green-600 text-xl"></i></div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">89</p>
                            <p className="text-xs text-slate-500 text-green-600">+15%</p>
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Processed Trips</h3>
                </div>
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-2 w-full">
                        <div className="bg-blue-100 p-3 rounded-lg"><i className="fas fa-coins text-blue-600 text-xl"></i></div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">8.2M</p>
                            <p className="text-xs text-slate-500">LKR</p>
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Annual Budget</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Executive Approvals Queue */}
                <div className="card-gradient p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <i className="fas fa-university text-yellow-600"></i> Executive Approvals
                        </h2>
                        <button className="btn-primary text-sm px-4 py-2" onClick={() => setActiveTab('longdistance')}>View All</button>
                    </div>
                    <div className="space-y-4">
                        {pendingRequests.slice(0, 2).map((req) => (
                            <div key={req.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-medium text-slate-800">{req.purpose}</h3>
                                        <p className="text-sm text-slate-500">{req.department} • {req.distance}</p>
                                        <p className="text-xs text-slate-400 mt-1">Submitted: {req.date}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium border border-yellow-200">Registrar Decision</span>
                                </div>
                                <div className="bg-indigo-50 p-2 rounded text-xs mb-3 text-indigo-700 border border-indigo-100">
                                    <p><i className="fas fa-info-circle mr-1"></i> <strong>Distance &gt; 100km:</strong> Requires executive approval.</p>
                                </div>
                                <button onClick={() => openReviewModal(req)} className="w-full btn-primary py-2 text-sm">
                                    Review Request
                                </button>
                            </div>
                        ))}
                        {pendingRequests.length === 0 && <p className="text-center text-slate-400 py-4">No pending requests.</p>}
                    </div>
                </div>

                {/* Fleet Analytics */}
                <div className="card-gradient p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <i className="fas fa-chart-pie text-blue-600"></i> Fleet Performance
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            <div><p className="text-sm font-medium text-slate-700">Fuel Expenses</p><p className="text-xs text-slate-500">Oct 2025</p></div>
                            <div className="text-right"><p className="text-lg font-bold text-red-500">LKR 2,45,000</p><p className="text-xs text-slate-400">↑ 8% from Sept</p></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            <div><p className="text-sm font-medium text-slate-700">Maintenance</p><p className="text-xs text-slate-500">Oct 2025</p></div>
                            <div className="text-right"><p className="text-lg font-bold text-yellow-500">LKR 95,000</p><p className="text-xs text-slate-400">↓ 12% from Sept</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFleet = () => (
        <div className="animation-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-gradient p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">University Fleet Status</h2>
                    <button onClick={() => setModal({ show: true, type: 'addVehicle' })} className="btn-primary text-sm">Add Vehicle</button>
                </div>
                <div className="space-y-4">
                    {fleetData.map(vehicle => (
                        <div key={vehicle.id} className="bg-white p-4 rounded-lg flex justify-between items-center border border-slate-200 hover:shadow-sm transition">
                            <div>
                                <h3 className="font-semibold text-slate-800">{vehicle.id}</h3>
                                <p className="text-sm text-slate-500">{vehicle.model}</p>
                                <p className="text-xs text-slate-400 mt-1">Next Service: {vehicle.nextService}</p>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.status === 'available' ? 'bg-green-100 text-green-700' : vehicle.status === 'in-use' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {vehicle.status}
                                </span>
                                <div className="text-xs text-slate-400 mt-1">Mileage: {vehicle.mileage}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card-gradient p-6 rounded-xl h-fit">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Fleet Overview</h3>
                <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-500">Total Vehicles</span><span className="font-bold text-slate-800">{fleetData.length}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Available</span><span className="text-green-600 font-bold">{fleetData.filter(v => v.status === 'available').length}</span></div>
                </div>
            </div>
        </div>
    );

    const renderApprovals = () => (
        <div className="animation-fade-in card-gradient p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Long Distance Trip Approvals</h2>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-sm hover:bg-slate-200">Filter: All</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Request ID</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Purpose</th>
                            <th className="px-4 py-3">Distance</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pendingRequests.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50 transition">
                                <td className="px-4 py-3 font-medium text-slate-700">{req.id}</td>
                                <td className="px-4 py-3 text-slate-600">{req.department}</td>
                                <td className="px-4 py-3 text-slate-600">{req.purpose}</td>
                                <td className="px-4 py-3 text-slate-600">{req.distance}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => openReviewModal(req)} className="btn-primary px-3 py-1 text-xs">Review</button>
                                </td>
                            </tr>
                        ))}
                        {pendingRequests.length === 0 && (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No pending approvals found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // --- Main JSX ---
    return (
        <div className="registrar-dashboard-container">
            {/* Sidebar */}
            <div className={`sidebar bg-gradient-to-b from-[#1a0505] to-[#2d0a0a] border-none w-80 fixed h-full z-40 transition-transform duration-300 overflow-y-auto`}>
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold text-white mb-2">Registrar Portal</h1>
                    <p className="text-sm text-gray-400">Executive Administration</p>
                </div>

                <nav className="p-4 space-y-2 pb-24">
                    {[
                        { id: 'overview', label: 'Dashboard', sub: 'Overview & Metrics', icon: 'fa-tachometer-alt' },
                        { id: 'longdistance', label: 'Approvals', sub: 'Trip Requests', icon: 'fa-file-signature' },
                        { id: 'approved-reservations', label: 'Approved Reservations', sub: 'Status Overview', icon: 'fa-check-double' },
                    ].map(item => (
                        <div key={item.id}
                            className={`nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition ${activeTab === item.id ? 'active bg-white/10 text-yellow-400 border-l-4 border-yellow-400' : ''}`}
                            onClick={() => setActiveTab(item.id)}>
                            <i className={`fas ${item.icon} text-lg w-6 text-center`}></i>
                            <div className="flex-1">
                                <div className="font-medium">{item.label}</div>
                                <div className="text-xs opacity-70">{item.sub}</div>
                            </div>
                            {item.id === 'longdistance' && pendingRequests.length > 0 && (
                                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                            )}
                        </div>
                    ))}

                    <div
                        className="nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition"
                        onClick={() => navigate('/vehicles')}>
                        <i className="fas fa-car text-lg w-6 text-center"></i>
                        <div className="flex-1">
                            <div className="font-medium">Vehicles</div>
                            <div className="text-xs opacity-70">Vehicle Records</div>
                        </div>
                    </div>

                    <div
                        className="nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition"
                        onClick={() => navigate('/drivers')}>
                        <i className="fas fa-users-cog text-lg w-6 text-center"></i>
                        <div className="flex-1">
                            <div className="font-medium">Drivers</div>
                            <div className="text-xs opacity-70">Driver Profiles</div>
                        </div>
                    </div>

                    <div
                        className="nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition"
                        onClick={() => navigate('/maintenance')}>
                        <i className="fas fa-tools text-lg w-6 text-center"></i>
                        <div className="flex-1">
                            <div className="font-medium">Maintenance</div>
                            <div className="text-xs opacity-70">Service Schedules</div>
                        </div>
                    </div>

                    <div
                        className="nav-item p-4 cursor-pointer flex items-center space-x-3 text-gray-300 hover:bg-white/5 rounded-xl transition"
                        onClick={() => navigate('/reports')}>
                        <i className="fas fa-chart-line text-lg w-6 text-center"></i>
                        <div className="flex-1">
                            <div className="font-medium">Reports</div>
                            <div className="text-xs opacity-70">Analytics</div>
                        </div>
                    </div>
                </nav>

                <div className="fixed bottom-0 left-0 w-80 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <button onClick={logout} className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition duration-200 text-white flex items-center justify-center border border-white/10">
                        <i className="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-80 flex flex-col min-h-screen bg-slate-50 text-slate-800 relative">
                {/* Notification Toast */}
                {notification.show && (
                    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 animate-fade-in ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' :
                        notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                            'bg-blue-50 border-blue-500 text-blue-800'
                        }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-500 text-white' :
                            notification.type === 'error' ? 'bg-red-500 text-white' :
                                'bg-blue-500 text-white'
                            }`}>
                            <i className={`fas ${notification.type === 'success' ? 'fa-check' :
                                notification.type === 'error' ? 'fa-exclamation-triangle' :
                                    'fa-info'
                                }`}></i>
                        </div>
                        <div className="flex-1 pr-4">
                            <p className="font-bold text-sm uppercase">System Status</p>
                            <p className="text-sm font-medium">{notification.message}</p>
                        </div>
                        <button onClick={() => setNotification({ ...notification, show: false })} className="text-slate-400 hover:text-slate-600 transition">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}
                <div className="p-8 flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-slate-800">
                                {activeTab === 'overview' ? `Good Morning, ${user.name} 👋` :
                                    activeTab === 'longdistance' ? 'Approval Management' :
                                        activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </h1>
                            <p className="text-slate-500">Executive Management Dashboard</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input type="text" placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:border-red-800 text-slate-700 w-64 shadow-sm" />
                                <i className="fas fa-search absolute right-3 top-3 text-slate-400 text-xs"></i>
                            </div>
                            <div className="relative cursor-pointer">
                                <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition shadow-md">
                                    <span className="text-xs font-bold">{pendingRequests.length}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-105 transition">
                                <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Rendering */}
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'longdistance' && renderApprovals()}
                    {activeTab === 'approved-reservations' && (
                        <div className="animation-fade-in card-gradient p-6 rounded-xl">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-check-double text-green-600"></i> Approved Reservations
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Request ID</th>
                                            <th className="px-4 py-3">Department</th>
                                            <th className="px-4 py-3">Destination</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {reservations.filter(r => r.status === 'approved').map(req => (
                                            <tr key={req.reservation_id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 font-medium text-slate-700">{req.reservation_id}</td>
                                                <td className="px-4 py-3 text-slate-600">{req.department || 'N/A'}</td>
                                                <td className="px-4 py-3 text-slate-600">{req.destination}</td>
                                                <td className="px-4 py-3 text-slate-600">{new Date(req.start_datetime).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <i className="fas fa-check-circle"></i> Approved
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {reservations.filter(r => r.status === 'approved').length === 0 && (
                                            <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No approved reservations found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'fleet' && renderFleet()}

                    {/* Other tabs placeholders */}
                    {!['overview', 'longdistance', 'fleet', 'approved-reservations'].includes(activeTab) && (
                        <div className="card-gradient p-10 rounded-xl text-center">
                            <i className="fas fa-wrench text-6xl text-slate-300 mb-6"></i>
                            <h2 className="text-2xl font-bold text-slate-700">Under Maintenance</h2>
                            <p className="text-slate-500 mt-2">The {activeTab} module is currently being updated to the new system.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Layer */}
            {modal.show && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animation-fade-in p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                        {modal.type === 'review' && modal.data && (
                            <>
                                <div className="bg-[#800000] p-4 flex justify-between items-center text-white">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <i className="fas fa-file-signature"></i> Review Request {modal.data.id}
                                    </h3>
                                    <button onClick={handleModalClose} className="hover:text-yellow-400 transition"><i className="fas fa-times"></i></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><p className="text-xs font-bold text-slate-400 uppercase">Department</p><p className="font-semibold text-slate-800">{modal.data.department}</p></div>
                                        <div><p className="text-xs font-bold text-slate-400 uppercase">Priority</p><p className="font-semibold text-slate-800">{modal.data.priority}</p></div>
                                        <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase">Purpose</p><p className="text-slate-700 italic">"{modal.data.purpose}"</p></div>
                                        {modal.data.remarks && (
                                            <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase">Remarks</p><p className="text-slate-700 bg-gray-50 p-2 rounded border-l-2 border-gray-300">{modal.data.remarks}</p></div>
                                        )}
                                        {modal.data.emergency_contact && (
                                            <div className="col-span-2"><p className="text-xs font-bold text-slate-400 uppercase">Emergency Contact</p><p className="text-slate-700 bg-gray-50 p-2 rounded border-l-2 border-gray-300">{modal.data.emergency_contact}</p></div>
                                        )}
                                        {modal.data.attachment_url && (
                                            <div className="col-span-2 mt-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Attachment</p>
                                                <a href={`http://localhost:5000${modal.data.attachment_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 text-sm">
                                                    <i className="fas fa-paperclip"></i> View Attached Document
                                                </a>
                                            </div>
                                        )}
                                        <div><p className="text-xs font-bold text-slate-400 uppercase">Distance</p><p className="font-semibold text-slate-800">{modal.data.distance}</p></div>
                                        <div><p className="text-xs font-bold text-slate-400 uppercase">Date</p><p className="font-semibold text-slate-800">{modal.data.date}</p></div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Registrar Comments</label>
                                        <textarea
                                            className="w-full mt-1 p-3 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-red-800"
                                            rows="3"
                                            placeholder="Enter approval notes or rejection reason..."
                                            value={approvalComment}
                                            onChange={(e) => setApprovalComment(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => handleAction('approve')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition shadow-md">
                                            <i className="fas fa-check-circle mr-2"></i> Approve
                                        </button>
                                        <button onClick={() => handleAction('reject')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-bold transition border border-red-200">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {modal.type === 'addVehicle' && (
                            <>
                                <div className="bg-[#800000] p-4 flex justify-between items-center text-white">
                                    <h3 className="text-lg font-bold">Add New Vehicle</h3>
                                    <button onClick={handleModalClose}><i className="fas fa-times"></i></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <input type="text" placeholder="Vehicle Number" className="w-full p-3 border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-red-800" />
                                    <input type="text" placeholder="Make & Model" className="w-full p-3 border border-slate-300 rounded-lg text-slate-800 outline-none focus:border-red-800" />
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => { alert('Vehicle Added'); handleModalClose(); }} className="flex-1 btn-primary py-2">Add Vehicle</button>
                                        <button onClick={handleModalClose} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg">Cancel</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrarDashboard;
