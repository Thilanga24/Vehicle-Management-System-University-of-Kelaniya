import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './Dashboard.css'; // Using the established University theme
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

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

    // Performance State
    const [performanceData, setPerformanceData] = useState([]);

    // Calendar & Assignment States
    const [currentDate, setCurrentDate] = useState(new Date());
    const [assignments, setAssignments] = useState([]);

    // Notification Helper
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, visible: true });
        setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
    };

    const fetchAssignments = async () => {
        try {
            const response = await fetch('/api/reservations');
            const data = await response.json();
            if (response.ok) {
                // Approved reservations are considered active assignments
                setAssignments(data.filter(r => r.status === 'approved' && r.registration_number));
            }
        } catch (error) {
            console.error("Error fetching assignments:", error);
        }
    };

    // Calendar Helper Functions
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const monthName = currentDate.toLocaleString('default', { month: 'long' });

        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayAssignments = assignments.filter(a => a.start_datetime.startsWith(dateStr));
            
            days.push(
                <div key={day} className={`calendar-day ${dayAssignments.length > 0 ? 'has-assignment' : ''}`}>
                    <span className="day-number">{day}</span>
                    <div className="day-dots">
                        {dayAssignments.slice(0, 3).map((a, idx) => (
                            <div key={idx} className="assignment-dot" title={`${a.driver_first_name}: ${a.destination}`}></div>
                        ))}
                        {dayAssignments.length > 3 && <div className="assignment-more">+{dayAssignments.length - 3}</div>}
                    </div>
                </div>
            );
        }

        return (
            <div className="calendar-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                <div className="calendar-header flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">{monthName} {year}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><i className="fas fa-chevron-left"></i></button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors uppercase tracking-wider">Today</button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><i className="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="calendar-weekday text-center text-[10px] font-black uppercase text-slate-400 mb-2">{day}</div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    // Fetch drivers
    const fetchDrivers = async () => {
        try {
            const response = await fetch('/api/drivers');
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

    const fetchPerformance = async () => {
        try {
            const response = await fetch('/api/drivers/performance');
            const data = await response.json();
            if (response.ok) setPerformanceData(data);
        } catch (error) {
            console.error("Error fetching performance:", error);
        }
    };

    useEffect(() => {
        fetchDrivers();
        if (activeSection === 'assignments') {
            fetchAssignments();
        }
        if (activeSection === 'performance') {
            fetchPerformance();
        }
    }, [activeSection]);

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
            ? `/api/drivers/${editingId}`
            : '/api/drivers';
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

    const generateDriverReport = async () => {
        const doc = new jsPDF();
        
        // Professional Header
        doc.setFillColor(102, 0, 0);
        doc.rect(0, 0, 210, 40, 'F');

        // Add Logo (Above the rectangle)
        const logoImg = new Image();
        logoImg.src = '/assets/uok_logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });
        doc.addImage(logoImg, 'PNG', 10, 8, 15, 15);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('UNIVERSITY OF KELANIYA', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('TRANSPORT DIVISION - MASTER DRIVER ROSTER', 105, 32, { align: 'center' });
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 48);

        const tableColumn = ["Name", "NIC", "Phone", "License No", "License Type", "Status"];
        const tableRows = drivers.map(d => [
            `${d.firstName} ${d.lastName}`,
            d.nic,
            d.phone,
            d.license,
            d.licenseType,
            d.status.toUpperCase()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [102, 0, 0], textColor: [255, 255, 255] },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        doc.save(`UOK_Driver_Roster_Report.pdf`);
        showNotification("Driver PDF Report Generated", "success");
    };

    const backToDashboard = () => {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const role = user.role;
        if (role === 'registrar') navigate('/registrar-dashboard');
        else if (role === 'sar') navigate('/sar-dashboard');
        else if (role === 'hod') navigate('/hod-dashboard');
        else if (role === 'dean') navigate('/dean-dashboard');
        else if (role === 'admin') navigate('/admin-dashboard');
        else if (role === 'management_assistant') navigate('/management-dashboard');
        else navigate('/dashboard');
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
                        <button 
                            onClick={generateDriverReport}
                            className="bg-white text-maroon p-2 rounded-lg border border-maroon hover:bg-maroon hover:text-white transition-all flex items-center gap-2 font-bold shadow-sm mr-4"
                            title="Generate PDF Roster"
                        >
                            <i className="fas fa-file-pdf"></i>
                            <span className="hidden md:inline">Generate PDF</span>
                        </button>
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
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm rounded-lg transition-colors font-semibold"
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

                    {/* Assignments (Full Calendar View) */}
                    {activeSection === 'assignments' && (
                        <div className="section animation-fade-in">
                            <div className="section-header">
                                <h2>Driver Assignment Schedule</h2>
                                <p className="text-slate-500 text-sm">Monthly overview of fleet deployments and driver schedules.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                <div className="xl:col-span-8">
                                    {renderCalendar()}
                                </div>
                                
                                <div className="xl:col-span-4 space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <i className="fas fa-list-ul text-blue-500"></i> Active Assignments
                                        </h3>
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {assignments.filter(a => a.start_datetime.startsWith(currentDate.toISOString().split('T')[0].substring(0, 7)))
                                                .length === 0 ? (
                                                    <p className="text-center py-8 text-slate-400 italic text-sm">No assignments for this month.</p>
                                                ) : (
                                                    assignments.filter(a => a.start_datetime.startsWith(currentDate.toISOString().split('T')[0].substring(0, 7)))
                                                    .map((assign, i) => (
                                                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-100 transition-colors">
                                                            <div>
                                                                <div className="font-bold text-slate-800 text-sm">{assign.driver_first_name} {assign.driver_last_name}</div>
                                                                <div className="text-[11px] text-slate-500 mt-1">
                                                                    <i className="fas fa-car mr-1 text-blue-400"></i> {assign.registration_number} • <i className="fas fa-map-marker-alt mr-1 text-red-400"></i> {assign.destination}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                                                                    {new Date(assign.start_datetime).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-tighter">
                                                                    {new Date(assign.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                                <div className="text-[9px] text-green-600 font-bold mt-2 flex items-center justify-end gap-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Confirmed
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-red-800 to-red-900 p-6 rounded-2xl text-white shadow-lg border border-red-700">
                                        <h4 className="font-bold flex items-center gap-2 mb-2">
                                            <i className="fas fa-info-circle"></i> Deployment Tip
                                        </h4>
                                        <p className="text-xs text-red-100 leading-relaxed">
                                            Click on dot indicators in the calendar to view assignment details. Dot colors represent vehicle types (Car, Bus, Van).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Performance Module */}
                    {activeSection === 'performance' && (
                        <div className="section animation-fade-in">
                            <div className="section-header">
                                <h2>Driver Performance Analytics</h2>
                                <p className="text-slate-500 text-sm">Quantifiable metrics for driver efficiency, safety, and reliability.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-blue-200">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Fleet Avg Rating</p>
                                    <h3 className="text-2xl font-black text-slate-800">
                                        {(performanceData.reduce((acc, curr) => acc + parseFloat(curr.rating), 0) / (performanceData.length || 1)).toFixed(1)}
                                        <i className="fas fa-star text-yellow-500 ml-2 text-lg"></i>
                                    </h3>
                                    <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
                                        <i className="fas fa-chevron-up"></i> Stable Performance
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-red-200">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Trips (Completed)</p>
                                    <h3 className="text-2xl font-black text-slate-800">{performanceData.reduce((acc, curr) => acc + curr.total_trips, 0)}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">Current Lifecycle</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-amber-200">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Distance Covered</p>
                                    <h3 className="text-2xl font-black text-slate-800">{performanceData.reduce((acc, curr) => acc + parseFloat(curr.total_distance), 0).toLocaleString()} <span className="text-xs font-medium text-slate-400 uppercase">km</span></h3>
                                    <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1 uppercase tracking-tighter">
                                        <i className="fas fa-route"></i> Cumulative Fleet Usage
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-red-50 to-white">
                                    <p className="text-[10px] font-black uppercase text-maroon tracking-widest mb-1">Top Performer</p>
                                    <h3 className="text-sm font-bold text-slate-800 truncate mt-2">{performanceData[0]?.first_name} {performanceData[0]?.last_name}</h3>
                                    <p className="text-[10px] text-maroon font-black mt-2 uppercase tracking-widest">
                                        {performanceData[0]?.rating} Rating • {performanceData[0]?.total_trips} Trips
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-8">Trips Comparison</h3>
                                    <div className="h-64">
                                        {/* Using simple Bar chart logic from react-chartjs-2 */}
                                        <Bar 
                                            data={{
                                                labels: performanceData.slice(0, 5).map(d => `${d.first_name} ${d.last_name.charAt(0)}.`),
                                                datasets: [{
                                                    label: 'Total Completed Trips',
                                                    data: performanceData.slice(0, 5).map(d => d.total_trips),
                                                    backgroundColor: ['#660000', '#800000', '#a52a2a', '#b22222', '#dc143c'],
                                                    borderRadius: 8
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: { y: { beginAtZero: true, grid: { display: false } } }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800">Performance Leaderboard</h3>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Ranked by Rating</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50">
                                                <tr className="text-[10px] font-black uppercase text-slate-500">
                                                    <th className="p-4">Rank</th>
                                                    <th className="p-4">Driver</th>
                                                    <th className="p-4 text-center">Rating</th>
                                                    <th className="p-4 text-center">Trips</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {performanceData.map((d, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 text-center font-black text-slate-300">#{i + 1}</td>
                                                        <td className="p-4">
                                                            <p className="font-bold text-slate-800 text-sm">{d.first_name} {d.last_name}</p>
                                                            <p className="text-[10px] text-slate-400">{d.total_distance.toLocaleString()} km total</p>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex justify-center items-center gap-1 text-yellow-500">
                                                                <span className="font-black text-slate-800 mr-1 text-sm">{d.rating}</span>
                                                                <i className="fas fa-star text-[10px]"></i>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">{d.total_trips}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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

export default DriverManagement;
