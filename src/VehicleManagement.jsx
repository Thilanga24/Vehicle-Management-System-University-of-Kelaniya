import React, { useState, useEffect } from 'react';
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
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const VehicleManagement = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('vehicle-list');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sample Data
    const initialVehicles = [
        { id: 1, type: 'Car', make: 'Toyota', model: 'Axio', number: 'KI-1234', seats: 4, status: 'available', driver: 'Mr. Perera', fuelType: 'Petrol', year: 2020, mileage: 45000 },
        { id: 2, type: 'Van', make: 'Toyota', model: 'Hiace', number: 'KI-5678', seats: 15, status: 'available', driver: 'Mr. Fernando', fuelType: 'Diesel', year: 2019, mileage: 80000 },
        { id: 3, type: 'Car', make: 'Nissan', model: 'Sunny', number: 'KI-9012', seats: 4, status: 'maintenance', driver: 'Mr. Silva', fuelType: 'Petrol', year: 2018, mileage: 95000 },
        { id: 4, type: 'Bus', make: 'Mitsubishi', model: 'Rosa', number: 'KI-3456', seats: 30, status: 'available', driver: 'Mr. Kumara', fuelType: 'Diesel', year: 2021, mileage: 25000 },
        { id: 5, type: 'Van', make: 'Suzuki', model: 'Every', number: 'KI-7890', seats: 8, status: 'booked', driver: 'Mr. Ranasinghe', fuelType: 'Petrol', year: 2020, mileage: 35000 }
    ];

    const [vehicles, setVehicles] = useState(initialVehicles);

    const maintenanceRecords = [
        { vehicle: 'KI-1234', service: 'Oil Change', date: '2024-10-01', cost: 'Rs. 5,000', status: 'Completed' },
        { vehicle: 'KI-5678', service: 'Brake Service', date: '2024-09-28', cost: 'Rs. 15,000', status: 'Completed' },
        { vehicle: 'KI-9012', service: 'Engine Repair', date: '2024-10-10', cost: 'Rs. 45,000', status: 'In Progress' }
    ];

    const insuranceRecords = [
        { vehicle: 'KI-1234', company: 'SLIC', policy: 'POL001234', expiry: '2025-05-15', premium: 'Rs. 25,000', status: 'Active' },
        { vehicle: 'KI-5678', company: 'Ceylinco', policy: 'POL005678', expiry: '2025-03-20', premium: 'Rs. 35,000', status: 'Active' },
        { vehicle: 'KI-9012', company: 'SLIC', policy: 'POL009012', expiry: '2024-12-10', premium: 'Rs. 28,000', status: 'Expiring Soon' }
    ];

    const fuelRecords = [
        { vehicle: 'KI-1234', date: '2024-10-25', liters: 35, cost: '12,500', driver: 'Mr. Perera' },
        { vehicle: 'KI-3456', date: '2024-10-24', liters: 60, cost: '21,000', driver: 'Mr. Kumara' },
        { vehicle: 'KI-5678', date: '2024-10-23', liters: 45, cost: '15,750', driver: 'Mr. Fernando' },
    ];

    // Chart Data
    const fuelChartData = {
        labels: ['Aug', 'Sep', 'Oct'],
        datasets: [
            {
                label: 'Petrol (L)',
                data: [450, 480, 520],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
            },
            {
                label: 'Diesel (L)',
                data: [1200, 1150, 1250],
                backgroundColor: 'rgba(245, 158, 11, 0.5)',
            }
        ]
    };

    const usageTrendData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
            label: 'Total Trips',
            data: [25, 32, 28, 35],
            borderColor: '#660000',
            backgroundColor: 'rgba(102, 0, 0, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [navigate]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const backToDashboard = () => {
        const role = sessionStorage.getItem('userRole');
        if (role === 'sar') {
            navigate('/sar-dashboard');
            return;
        }
        if (role === 'registrar') {
            navigate('/registrar-dashboard');
            return;
        }
        navigate('/admin-dashboard');
    };

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
                    <div className="menu-section-title">Module</div>
                    <div className={`menu-item ${activeSection === 'vehicle-list' ? 'active' : ''}`} onClick={() => setActiveSection('vehicle-list')}>
                        <i className="fas fa-car"></i>
                        <span>Vehicle List</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'add-vehicle' ? 'active' : ''}`} onClick={() => setActiveSection('add-vehicle')}>
                        <i className="fas fa-plus-circle"></i>
                        <span>Add Vehicle</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Records</div>
                    <div className={`menu-item ${activeSection === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveSection('maintenance')}>
                        <i className="fas fa-wrench"></i>
                        <span>Maintenance</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'fuel-management' ? 'active' : ''}`} onClick={() => setActiveSection('fuel-management')}>
                        <i className="fas fa-gas-pump"></i>
                        <span>Fuel Mgmt</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'insurance' ? 'active' : ''}`} onClick={() => setActiveSection('insurance')}>
                        <i className="fas fa-shield-alt"></i>
                        <span>Insurance</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'statistics' ? 'active' : ''}`} onClick={() => setActiveSection('statistics')}>
                        <i className="fas fa-chart-bar"></i>
                        <span>Statistics</span>
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

            {/* Main Content */}
            <div className="main-content">
                <div className="top-nav">
                    <div className="welcome">
                        <h1>Vehicle Management</h1>
                        <p>Manage university fleet, maintenance, and records.</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="user-profile">
                            <div className="user-avatar text-white font-bold flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #660000 0%, #800000 100%)', width: '40px', height: '40px', borderRadius: '50%' }}>
                                {JSON.parse(localStorage.getItem('currentUser') || '{}').name ? JSON.parse(localStorage.getItem('currentUser') || '{}').name.substring(0, 2).toUpperCase() : 'AD'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    {/* Vehicle List */}
                    {activeSection === 'vehicle-list' && (
                        <div className="section animation-fade-in">
                            <div className="section-header">
                                <h2><i className="fas fa-car mr-2"></i> Vehicle Fleet</h2>
                                <div className="filter-section flex gap-4" style={{ margin: 0 }}>
                                    <select className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-maroon focus:border-transparent">
                                        <option value="">All Status</option>
                                        <option value="available">Available</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="booked">Booked</option>
                                    </select>
                                    <select className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-maroon focus:border-transparent">
                                        <option value="">All Types</option>
                                        <option value="Car">Car</option>
                                        <option value="Van">Van</option>
                                        <option value="Bus">Bus</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {vehicles.map(vehicle => (
                                    <div key={vehicle.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-all duration-200 vehicle-card">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{vehicle.number}</h3>
                                                <p className="text-slate-500 text-sm">{vehicle.make} {vehicle.model}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                                                    vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm text-slate-600 mb-6">
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>Type:</span> <span className="font-medium text-slate-800">{vehicle.type}</span></div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>Seats:</span> <span className="font-medium text-slate-800">{vehicle.seats}</span></div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>Fuel:</span> <span className="font-medium text-slate-800">{vehicle.fuelType}</span></div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>Driver:</span> <span className="font-medium text-slate-800">{vehicle.driver}</span></div>
                                            <div className="flex justify-between"><span>Mileage:</span> <span className="font-medium text-slate-800">{vehicle.mileage.toLocaleString()} km</span></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">Edit</button>
                                            <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">History</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Vehicle */}
                    {activeSection === 'add-vehicle' && (
                        <div className="section animation-fade-in">
                            <div className="section-header">
                                <h2><i className="fas fa-plus-circle mr-2"></i> Add New Vehicle</h2>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
                                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Vehicle Added!"); }}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
                                            <select required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all">
                                                <option value="">Select Type</option>
                                                <option value="Car">Car</option>
                                                <option value="Van">Van</option>
                                                <option value="Bus">Bus</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Number</label>
                                            <input type="text" required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all" placeholder="e.g. KI-1234" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Make</label>
                                            <input type="text" required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all" placeholder="Toyota" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                                            <input type="text" required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all" placeholder="Axio" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                                            <input type="number" required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all" placeholder="2020" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Seating Capacity</label>
                                            <input type="number" required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all" placeholder="4" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Fuel Type</label>
                                            <select required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all">
                                                <option value="">Select Fuel Type</option>
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Mileage (km)</label>
                                            <input type="number" required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all" placeholder="50000" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes</label>
                                        <textarea className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 h-24 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all" placeholder="Any additional information..."></textarea>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-md transform hover:-translate-y-0.5 transition-all duration-200">
                                            Add Vehicle
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Maintenance */}
                    {activeSection === 'maintenance' && (
                        <div className="section animation-fade-in">
                            <div className="section-header"><h2><i className="fas fa-wrench mr-2"></i> Maintenance Records</h2></div>
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                                <table className="w-full text-left data-table">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Vehicle</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Service Type</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Date</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Cost</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Status</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {maintenanceRecords.map((rec, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800">{rec.vehicle}</td>
                                                <td className="p-4 text-slate-600">{rec.service}</td>
                                                <td className="p-4 text-slate-500">{rec.date}</td>
                                                <td className="p-4 font-medium text-slate-800">{rec.cost}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${rec.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {rec.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">View Details</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Fuel Management */}
                    {activeSection === 'fuel-management' && (
                        <div className="section animation-fade-in">
                            <div className="section-header"><h2><i className="fas fa-gas-pump mr-2"></i> Fuel Management</h2></div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Fuel Consumption Overview</h3>
                                    <div className="h-64">
                                        <Bar data={fuelChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Fuel Records</h3>
                                    <div className="overflow-y-auto h-64 pr-2 space-y-3">
                                        {fuelRecords.map((rec, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{rec.vehicle}</p>
                                                    <p className="text-xs text-slate-500">{rec.date} • {rec.driver}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-800 text-sm">{rec.liters} L</p>
                                                    <p className="text-xs text-slate-600">Rs. {rec.cost}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Insurance */}
                    {activeSection === 'insurance' && (
                        <div className="section animation-fade-in">
                            <div className="section-header"><h2><i className="fas fa-shield-alt mr-2"></i> Insurance Management</h2></div>
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                                <table className="w-full text-left data-table">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Vehicle</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Company</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Policy No</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Expiry</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Premium</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {insuranceRecords.map((rec, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800">{rec.vehicle}</td>
                                                <td className="p-4 text-slate-600">{rec.company}</td>
                                                <td className="p-4 text-slate-500">{rec.policy}</td>
                                                <td className="p-4 text-slate-600 font-medium">{rec.expiry}</td>
                                                <td className="p-4 text-slate-600">{rec.premium}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${rec.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {rec.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    {activeSection === 'statistics' && (
                        <div className="section animation-fade-in">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold mb-4 text-slate-800">Fleet Statistics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                                            <div className="text-3xl font-bold text-blue-700">{vehicles.length}</div>
                                            <div className="text-sm text-blue-600 font-medium">Total Vehicles</div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                                            <div className="text-3xl font-bold text-green-700">{vehicles.filter(v => v.status === 'available').length}</div>
                                            <div className="text-sm text-green-600 font-medium">Available</div>
                                        </div>
                                        <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-100">
                                            <div className="text-3xl font-bold text-yellow-700">{vehicles.filter(v => v.status === 'maintenance').length}</div>
                                            <div className="text-sm text-yellow-600 font-medium">Maintenance</div>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100">
                                            <div className="text-3xl font-bold text-red-700">{vehicles.filter(v => v.status === 'booked').length}</div>
                                            <div className="text-sm text-red-600 font-medium">Booked</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold mb-4 text-slate-800">Usage Trends</h3>
                                    <div className="h-64 w-full">
                                        <Line data={usageTrendData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default VehicleManagement;
