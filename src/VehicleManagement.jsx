import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const VehicleManagement = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('vehicle-list');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sample Data
    const vehicles = [
        { id: 1, type: 'Car', make: 'Toyota', model: 'Axio', number: 'KI-1234', seats: 4, status: 'available', driver: 'Mr. Perera', fuelType: 'Petrol', year: 2020, mileage: 45000 },
        { id: 2, type: 'Van', make: 'Toyota', model: 'Hiace', number: 'KI-5678', seats: 15, status: 'available', driver: 'Mr. Fernando', fuelType: 'Diesel', year: 2019, mileage: 80000 },
        { id: 3, type: 'Car', make: 'Nissan', model: 'Sunny', number: 'KI-9012', seats: 4, status: 'maintenance', driver: 'Mr. Silva', fuelType: 'Petrol', year: 2018, mileage: 95000 },
        { id: 4, type: 'Bus', make: 'Mitsubishi', model: 'Rosa', number: 'KI-3456', seats: 30, status: 'available', driver: 'Mr. Kumara', fuelType: 'Diesel', year: 2021, mileage: 25000 },
        { id: 5, type: 'Van', make: 'Suzuki', model: 'Every', number: 'KI-7890', seats: 8, status: 'booked', driver: 'Mr. Ranasinghe', fuelType: 'Petrol', year: 2020, mileage: 35000 }
    ];

    const maintenanceRecords = [
        { vehicle: 'KI-1234', service: 'Oil Change', date: '2024-10-01', cost: 'Rs. 5,000', status: 'Completed' },
        { vehicle: 'KI-5678', service: 'Brake Service', date: '2024-09-28', cost: 'Rs. 15,000', status: 'Completed' },
        { vehicle: 'KI-9012', service: 'Engine Repair', date: '2024-10-10', cost: 'Rs. 45,000', status: 'In Progress' }
    ];

    const insuranceRecords = [
        { vehicle: 'KI-1234', company: 'SLIC', policy: 'POL001234', expiry: '2025-05-15', premium: 'Rs. 25,000', status: 'Active' },
        { vehicle: 'KI-5678', company: 'Ceylinco', policy: 'POL005678', expiry: '2025-03-20', premium: 'Rs. 35,000', status: 'Active' },
    ];

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            // navigate('/');
        }
    }, [navigate]);

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
                    <div className="menu-item" onClick={() => navigate('/dashboard')}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="top-nav">
                    <div className="welcome">
                        <h1>Vehicle Management <i className="fas fa-bus text-yellow-500 ml-2"></i></h1>
                        <p>Manage university fleet, maintenance, and records.</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="user-profile">
                            <div className="user-avatar">
                                {JSON.parse(localStorage.getItem('currentUser') || '{}').name ? JSON.parse(localStorage.getItem('currentUser') || '{}').name.substring(0, 2).toUpperCase() : 'DS'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    {/* Vehicle List */}
                    {activeSection === 'vehicle-list' && (
                        <div className="section">
                            <div className="section-header">
                                <h2>Vehicle Fleet</h2>
                                <div className="filter-section" style={{ margin: 0 }}>
                                    <select className="p-2 border rounded-md">
                                        <option value="">All Status</option>
                                        <option value="available">Available</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                    <select className="p-2 border rounded-md ml-2">
                                        <option value="">All Types</option>
                                        <option value="Car">Car</option>
                                        <option value="Van">Van</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {vehicles.map(vehicle => (
                                    <div key={vehicle.id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{vehicle.number}</h3>
                                                <p className="text-slate-500 text-sm">{vehicle.make} {vehicle.model}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs text-white ${vehicle.status === 'available' ? 'bg-emerald-500' : vehicle.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'}`}>
                                                {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm text-slate-600">
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>Type:</span> <span className="font-medium">{vehicle.type}</span></div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>Seats:</span> <span className="font-medium">{vehicle.seats}</span></div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>Driver:</span> <span className="font-medium">{vehicle.driver}</span></div>
                                            <div className="flex justify-between"><span>Mileage:</span> <span className="font-medium">{vehicle.mileage.toLocaleString()} km</span></div>
                                        </div>
                                        <div className="mt-6 flex gap-2">
                                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dev-btn py-2 text-sm rounded-lg transition-colors">Edit</button>
                                            <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-sm rounded-lg transition-colors">History</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Vehicle */}
                    {activeSection === 'add-vehicle' && (
                        <div className="section">
                            <div className="section-header">
                                <h2>Add New Vehicle</h2>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
                                            <select className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                                                <option>Select Type</option>
                                                <option>Car</option>
                                                <option>Van</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Number</label>
                                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. KI-1234" />
                                        </div>
                                        {/* Add other fields similarly... */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Make</label>
                                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Toyota" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Axio" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="bg-maroon hover:bg-red-900 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                            Register Vehicle
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Maintenance */}
                    {activeSection === 'maintenance' && (
                        <div className="section">
                            <div className="section-header"><h2>Maintenance Records</h2></div>
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-700">Vehicle</th>
                                            <th className="p-4 font-semibold text-slate-700">Service</th>
                                            <th className="p-4 font-semibold text-slate-700">Date</th>
                                            <th className="p-4 font-semibold text-slate-700">Cost</th>
                                            <th className="p-4 font-semibold text-slate-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {maintenanceRecords.map((rec, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="p-4">{rec.vehicle}</td>
                                                <td className="p-4">{rec.service}</td>
                                                <td className="p-4 text-slate-500">{rec.date}</td>
                                                <td className="p-4 font-medium">{rec.cost}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs text-white ${rec.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}>{rec.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Report Placeholder for others */}
                    {(activeSection === 'fuel-management' || activeSection === 'insurance' || activeSection === 'statistics') && (
                        <div className="text-center py-20">
                            <i className="fas fa-tools text-slate-300 text-6xl mb-4"></i>
                            <h3 className="text-xl text-slate-600 font-bold">{activeSection.replace('-', ' ').toUpperCase()}</h3>
                            <p className="text-slate-400">Module under construction.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default VehicleManagement;
