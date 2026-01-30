import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Using the established University theme

const DriverManagement = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('driver-list');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [drivers, setDrivers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phone: '', nic: '', address: '',
        licenseNumber: '', licenseType: '', licenseExpiry: '', experience: '', status: 'active'
    });

    const [notification, setNotification] = useState({ message: '', type: '', visible: false });

    // Notification Helper
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, visible: true });
        setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
    };

    // Fetch drivers
    const fetchDrivers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/drivers');
            const data = await response.json();
            console.log('Fetched Drivers:', data);
            if (response.ok) {
                const mappedDrivers = data.map(d => ({
                    id: d.driver_id,
                    name: `${d.first_name} ${d.last_name}`,
                    firstName: d.first_name,
                    lastName: d.last_name,
                    email: d.email,
                    phone: d.phone_number,
                    nic: d.nic,
                    address: d.address,
                    license: d.license_number,
                    licenseType: d.license_type,
                    licenseExpiry: d.license_expiry_date ? d.license_expiry_date.split('T')[0] : '',
                    experience: d.years_of_experience,
                    rating: d.rating || 5.0,
                    status: d.status,
                    assignedVehicle: 'Not Assigned' // Logic to be added later
                }));
                setDrivers(mappedDrivers);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
            showNotification('Failed to fetch drivers', 'error');
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (driver) => {
        setEditingId(driver.id);
        setFormData({
            firstName: driver.firstName,
            lastName: driver.lastName,
            phone: driver.phone,
            nic: driver.nic,
            address: driver.address,
            licenseNumber: driver.license,
            licenseType: driver.licenseType,
            licenseExpiry: driver.licenseExpiry,
            experience: driver.experience,
            status: driver.status
        });
        setActiveSection('add-driver');
    };

    const handleAddDriver = async (e) => {
        e.preventDefault();
        const url = editingId
            ? `http://localhost:5000/api/drivers/${editingId}`
            : 'http://localhost:5000/api/drivers';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                showNotification(editingId ? "Driver Updated Successfully!" : "Driver Added Successfully!", 'success');
                setFormData({
                    firstName: '', lastName: '', phone: '', nic: '', address: '',
                    licenseNumber: '', licenseType: '', licenseExpiry: '', experience: '', status: 'active'
                });
                setEditingId(null);
                fetchDrivers();
                setActiveSection('driver-list');
            } else {
                showNotification(`Failed to save driver: ${result.error || result.message}`, 'error');
            }
        } catch (error) {
            console.error("Error saving driver:", error);
            showNotification("Server Error: " + error.message, 'error');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            firstName: '', lastName: '', phone: '', nic: '', address: '',
            licenseNumber: '', licenseType: '', licenseExpiry: '', experience: '', status: 'active'
        });
        setActiveSection('driver-list');
    };

    const licenses = [
        { driver: 'Mr. Perera', licenseNo: 'B0123456', type: 'Both', issued: '2020-05-15', expiry: '2025-05-15', status: 'Valid' },
        { driver: 'Mr. Fernando', licenseNo: 'B0234567', type: 'Heavy', issued: '2019-08-20', expiry: '2024-08-20', status: 'Valid' },
        { driver: 'Mr. Silva', licenseNo: 'B0345678', type: 'Light', issued: '2021-03-10', expiry: '2026-03-10', status: 'Valid' },
        { driver: 'Mr. Kumara', licenseNo: 'B0456789', type: 'Heavy', issued: '2018-12-01', expiry: '2024-12-01', status: 'Expiring Soon' },
        { driver: 'Mr. Ranasinghe', licenseNo: 'B0567890', type: 'Light', issued: '2022-07-25', expiry: '2024-11-25', status: 'Expiring Soon' }
    ];

    const todayAssignments = [
        { driver: 'Mr. Perera', vehicle: 'KI-1234', trip: 'Colombo to Kandy', time: '08:00 AM' },
        { driver: 'Mr. Fernando', vehicle: 'KI-5678', trip: 'Campus to Airport', time: '10:30 AM' },
        { driver: 'Mr. Kumara', vehicle: 'KI-3456', trip: 'Field Trip - Galle', time: '07:00 AM' }
    ];

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [navigate]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const backToDashboard = () => {
        const role = sessionStorage.getItem('userRole');
        if (role === 'sar') return navigate('/sar-dashboard');
        if (role === 'registrar') return navigate('/registrar-dashboard');
        return navigate('/admin-dashboard');
    };

    return (
        <div className="dashboard-container">
            {/* Notification Toast */}
            {notification.visible && (
                <div style={{ zIndex: 9999 }} className={`fixed top-5 right-5 px-6 py-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-in-out flex items-center gap-3 animation-fade-in ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl`}></i>
                    <div>
                        <h4 className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                        <p className="text-sm">{notification.message}</p>
                    </div>
                </div>
            )}

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
                    <div className="menu-section-title">Driver Module</div>
                    <div className={`menu-item ${activeSection === 'driver-list' ? 'active' : ''}`} onClick={() => setActiveSection('driver-list')}>
                        <i className="fas fa-users"></i>
                        <span>Driver List</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'add-driver' ? 'active' : ''}`} onClick={() => setActiveSection('add-driver')}>
                        <i className="fas fa-user-plus"></i>
                        <span>Add Driver</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'licenses' ? 'active' : ''}`} onClick={() => setActiveSection('licenses')}>
                        <i className="fas fa-id-card"></i>
                        <span>Licenses</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'assignments' ? 'active' : ''}`} onClick={() => setActiveSection('assignments')}>
                        <i className="fas fa-calendar-alt"></i>
                        <span>Assignments</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'performance' ? 'active' : ''}`} onClick={() => setActiveSection('performance')}>
                        <i className="fas fa-chart-line"></i>
                        <span>Performance</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'training' ? 'active' : ''}`} onClick={() => setActiveSection('training')}>
                        <i className="fas fa-graduation-cap"></i>
                        <span>Training</span>
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
                        <h1>Driver Management <i className="fas fa-user-tie text-yellow-500 ml-2"></i></h1>
                        <p>Manage driver profiles, assignments, and performance.</p>
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

                    {/* Driver List Section */}
                    {activeSection === 'driver-list' && (
                        <div className="section animation-fade-in">
                            <div className="section-header">
                                <h2>Driver Directory</h2>
                                <div className="filter-section flex gap-4" style={{ margin: 0 }}>
                                    <input type="text" placeholder="Search drivers..." className="p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-900" />
                                    <select className="p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-red-900">
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="on-leave">On Leave</option>
                                    </select>
                                </div>
                            </div>

                            {drivers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No drivers found. Add a driver first.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {drivers.map(driver => (
                                        <div key={driver.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800">{driver.name}</h3>
                                                    <p className="text-slate-500 text-sm">{driver.licenseType} License</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${driver.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    driver.status === 'on-leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {driver.status.charAt(0).toUpperCase() + driver.status.slice(1).replace('-', ' ')}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm text-slate-600 mb-4">
                                                <div className="flex justify-between"><span>Experience:</span> <span className="font-medium text-slate-800">{driver.experience} years</span></div>
                                                <div className="flex justify-between">
                                                    <span>Rating:</span>
                                                    <span className="flex items-center font-medium text-slate-800">
                                                        {driver.rating} <i className="fas fa-star text-yellow-500 ml-1 text-xs"></i>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between"><span>Phone:</span> <span className="font-medium text-slate-800">{driver.phone}</span></div>
                                                <div className="flex justify-between"><span>Vehicle:</span> <span className="font-medium text-slate-800">{driver.assignedVehicle || 'Unassigned'}</span></div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(driver)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dev-btn py-2 text-sm rounded-lg transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 text-sm rounded-lg transition-colors">Profile</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add/Edit Driver Section */}
                    {activeSection === 'add-driver' && (
                        <div className="section animation-fade-in">
                            <div className="section-header">
                                <h2>
                                    <i className={`fas ${editingId ? 'fa-user-edit' : 'fa-user-plus'} mr-2`}></i>
                                    {editingId ? 'Edit Driver' : 'Add New Driver'}
                                </h2>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
                                <form className="space-y-6" onSubmit={handleAddDriver}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                                            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-900" placeholder="Enter first name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                                            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-900" placeholder="Enter last name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">NIC Number</label>
                                            <input type="text" name="nic" value={formData.nic} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-900" placeholder="e.g., 199012345678" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-900" placeholder="+94 77 XXX XXXX" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">License Number</label>
                                            <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-900" placeholder="License number" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">License Type</label>
                                            <select name="licenseType" value={formData.licenseType} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-900">
                                                <option value="">Select License Type</option>
                                                <option value="Light">Light Vehicle (B1)</option>
                                                <option value="Heavy">Heavy Vehicle (C1)</option>
                                                <option value="Both">Both (B1 + C1)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">License Expiry Date</label>
                                            <input type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-900" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Experience (Years)</label>
                                            <input type="number" name="experience" value={formData.experience} onChange={handleInputChange} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-900" placeholder="Years of experience" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                                        <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 h-24 outline-none focus:ring-2 focus:ring-red-900" placeholder="Full address"></textarea>
                                    </div>
                                    <div className="flex justify-end pt-4 gap-4">
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                                            {editingId ? 'Update Driver' : 'Register Driver'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* License Management */}
                    {activeSection === 'licenses' && (
                        <div className="section animation-fade-in">
                            <div className="section-header"><h2>License Management</h2></div>
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start">
                                <i className="fas fa-exclamation-triangle mt-1 mr-3"></i>
                                <div>
                                    <h3 className="font-bold">Expiring Soon</h3>
                                    <p className="text-sm">2 licenses are expiring within the next 30 days. Please notify drivers.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                                <table className="w-full text-left data-table">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs">Driver</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs">License No</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs">Type</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs">Issued</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs">Expiry</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs">Status</th>
                                            <th className="p-4 font-semibold text-slate-700 uppercase text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {licenses.map((lic, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800">{lic.driver}</td>
                                                <td className="p-4 text-slate-600 font-mono text-xs">{lic.licenseNo}</td>
                                                <td className="p-4 text-slate-600">{lic.type}</td>
                                                <td className="p-4 text-slate-500 text-sm">{lic.issued}</td>
                                                <td className="p-4 text-slate-500 text-sm">{lic.expiry}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${lic.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {lic.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Renew</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Assignments (Partial View) */}
                    {activeSection === 'assignments' && (
                        <div className="section animation-fade-in">
                            <div className="section-header"><h2>Driver Assignments</h2></div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Today's Schedule</h3>
                                    <div className="space-y-3">
                                        {todayAssignments.map((assign, i) => (
                                            <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-slate-800">{assign.driver}</div>
                                                    <div className="text-sm text-slate-500">{assign.vehicle} • {assign.trip}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-blue-600">{assign.time}</div>
                                                    <div className="text-xs text-green-600 font-medium">Scheduled</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                                    <div className="text-center">
                                        <i className="fas fa-calendar-alt text-slate-300 text-5xl mb-3"></i>
                                        <p className="text-slate-500">Calendar View (Coming Soon)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Performance & Training Placeholders */}
                    {(activeSection === 'performance' || activeSection === 'training') && (
                        <div className="section text-center py-20 animation-fade-in">
                            <i className={`fas ${activeSection === 'performance' ? 'fa-chart-line' : 'fa-graduation-cap'} text-slate-300 text-6xl mb-6`}></i>
                            <h3 className="text-xl text-slate-800 font-bold mb-2 capitalize">{activeSection} Module</h3>
                            <p className="text-slate-500">The <strong>{activeSection}</strong> interface is currently under development.</p>

                            {activeSection === 'performance' && (
                                <div className="mt-8 max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h4 className="font-bold text-left mb-4">Top Performers Preview</h4>
                                    {[1, 2, 3].map((rank) => (
                                        <div key={rank} className="flex items-center justify-between mb-3 last:mb-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-slate-400' : 'bg-orange-500'}`}>{rank}</div>
                                                <span className="text-sm font-medium text-slate-700">Driver Name</span>
                                            </div>
                                            <div className="flex text-yellow-500 text-xs"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default DriverManagement;
