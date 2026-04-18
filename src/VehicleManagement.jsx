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
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

    const [vehicles, setVehicles] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [driversList, setDriversList] = useState([]);
    const [formData, setFormData] = useState({
        type: '', registrationNumber: '', make: '', model: '', year: '',
        seatingCapacity: '', fuelType: '', mileage: '', status: 'available',
        driverId: '', notes: ''
    });
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [selectedMaintenance, setSelectedMaintenance] = useState(null);

    // Fuel States
    const [fuelList, setFuelList] = useState([]);
    const [fuelFormData, setFuelFormData] = useState({
        vehicle_id: '',
        date: new Date().toISOString().split('T')[0],
        liters: '',
        cost: ''
    });
    const [fuelReport, setFuelReport] = useState({ total_cost: 0, total_liters: 0 });
    const [reportFilter, setReportFilter] = useState({
        vehicle_id: 'all',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [reservations, setReservations] = useState([]);
    const [trendData, setTrendData] = useState({
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
            label: 'Total Trips',
            data: [0, 0, 0, 0],
            borderColor: '#660000',
            backgroundColor: 'rgba(102, 0, 0, 0.1)',
            tension: 0.4,
            fill: true
        }]
    });

    const [notification, setNotification] = useState({ message: '', type: '', visible: false });

    // Insurance States
    const [insuranceRecords, setInsuranceRecords] = useState([]);
    const [insuranceFormData, setInsuranceFormData] = useState({
        vehicle_id: '',
        provider_name: '',
        policy_number: '',
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        premium_amount: '',
        status: 'active'
    });

    // Notification Helper
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, visible: true });
        setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
    };

    // Fetch drivers for dropdown
    const fetchDrivers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/drivers');
            const data = await response.json();
            if (response.ok) {
                setDriversList(data);
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
        }
    };

    // Fetch maintenance records
    const fetchMaintenance = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/maintenance');
            const data = await response.json();
            if (response.ok) {
                setMaintenanceRecords(data);
            }
        } catch (error) {
            console.error("Error fetching maintenance:", error);
        }
    };

    // Fetch vehicles from backend
    const fetchVehicles = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vehicles');
            const data = await response.json();
            if (response.ok) {
                const mappedVehicles = data.map(v => ({
                    id: v.vehicle_id,
                    type: v.type,
                    make: v.make,
                    model: v.model,
                    number: v.registration_number,
                    seats: v.seating_capacity,
                    status: v.status,
                    driver: v.driver_name || 'Unassigned',
                    driverId: v.driver_id, // Store ID for editing
                    fuelType: v.fuel_type,
                    year: v.year,
                    mileage: v.current_mileage || 0
                }));
                setVehicles(mappedVehicles);
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
            showNotification("Failed to fetch vehicles", "error");
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchDrivers();
        fetchMaintenance();
        fetchFuelRecords();
        fetchInsurance();
    }, []);

    const fetchInsurance = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/insurance');
            const data = await response.json();
            if (response.ok) setInsuranceRecords(data);
        } catch (error) {
            console.error("Error fetching insurance:", error);
        }
    };

    const fetchReservationsTrend = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/reservations');
            const data = await response.json();
            if (response.ok) {
                setReservations(data);

                // Group by week for the last 30 days
                const now = new Date();
                const weeks = [[], [], [], []];
                const weekLabels = [];

                for (let i = 3; i >= 0; i--) {
                    const start = new Date();
                    start.setDate(now.getDate() - (i + 1) * 7);
                    const end = new Date();
                    end.setDate(now.getDate() - i * 7);
                    weekLabels.push(`Week ${4 - i}`);

                    const count = data.filter(r => {
                        const rDate = new Date(r.start_datetime);
                        return rDate >= start && rDate < end;
                    }).length;
                    weeks[3 - i] = count;
                }

                setTrendData({
                    labels: weekLabels,
                    datasets: [{
                        label: 'Total Trips',
                        data: weeks,
                        borderColor: '#660000',
                        backgroundColor: 'rgba(102, 0, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                });
            }
        } catch (error) {
            console.error("Error fetching reservations trend:", error);
        }
    };

    const handleInsuranceSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/insurance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(insuranceFormData)
            });
            if (response.ok) {
                showNotification("Insurance policy added successfully!");
                setInsuranceFormData({
                    vehicle_id: '',
                    provider_name: '',
                    policy_number: '',
                    start_date: new Date().toISOString().split('T')[0],
                    expiry_date: '',
                    premium_amount: '',
                    status: 'active'
                });
                fetchInsurance();
            } else {
                const data = await response.json();
                showNotification(data.message || "Failed to add insurance", "error");
            }
        } catch (error) {
            showNotification("Failed to add insurance record", "error");
        }
    };

    const fetchFuelRecords = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/fuel');
            const data = await response.json();
            if (response.ok) setFuelList(data);
        } catch (error) {
            console.error("Error fetching fuel:", error);
        }
    };

    const fetchFuelReport = async () => {
        try {
            const query = new URLSearchParams(reportFilter).toString();
            const response = await fetch(`http://localhost:5000/api/fuel/report?${query}`);
            const data = await response.json();
            if (response.ok) setFuelReport(data);
        } catch (error) {
            console.error("Error fetching fuel report:", error);
        }
    };

    useEffect(() => {
        if (activeSection === 'fuel-management') {
            fetchFuelReport();
        }
        if (activeSection === 'statistics') {
            fetchReservationsTrend();
        }
    }, [activeSection, reportFilter]);

    const handleFuelSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/fuel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fuelFormData)
            });
            if (response.ok) {
                showNotification("Fuel record added successfully!");
                setFuelFormData({
                    vehicle_id: '',
                    date: new Date().toISOString().split('T')[0],
                    liters: '',
                    cost: ''
                });
                fetchFuelRecords();
                fetchFuelReport();
            }
        } catch (error) {
            showNotification("Failed to add fuel record", "error");
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Add Header
        doc.setFontSize(18);
        doc.setTextColor(128, 0, 0); // Maroon
        doc.text("UNIVERSITY OF KELANIYA", 105, 15, { align: "center" });
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Fuel Consumption Report", 105, 25, { align: "center" });

        // Add Filter Info
        doc.setFontSize(10);
        doc.text(`Period: ${reportFilter.startDate} to ${reportFilter.endDate}`, 20, 40);
        const vehicleInfo = reportFilter.vehicle_id === 'all' ? 'All Vehicles' : (vehicles.find(v => v.id == reportFilter.vehicle_id)?.number || 'Selected Vehicle');
        doc.text(`Vehicle: ${vehicleInfo}`, 20, 45);

        // Add Summary
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Cost: LKR ${fuelReport.total_cost?.toLocaleString() || '0'}`, 20, 55);
        doc.text(`Total Liters: ${fuelReport.total_liters || '0'} L`, 20, 62);

        // Add Table
        const tableData = fuelList.map(rec => [
            new Date(rec.date).toLocaleDateString(),
            rec.registration_number,
            `${rec.liters} L`,
            `Rs. ${rec.cost.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 70,
            head: [['Date', 'Vehicle Reg', 'Liters', 'Cost (LKR)']],
            body: tableData,
            headStyles: { fillStyle: 'maroon', fillColor: [128, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        const fileName = `Fuel_Report_${reportFilter.startDate}_to_${reportFilter.endDate}.pdf`;
        doc.save(fileName);
        showNotification("PDF Report Generated Successfully!");
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (vehicle) => {
        setEditingId(vehicle.id);
        setFormData({
            type: vehicle.type,
            registrationNumber: vehicle.number,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            seatingCapacity: vehicle.seats,
            fuelType: vehicle.fuelType,
            mileage: vehicle.mileage,
            status: vehicle.status,
            driverId: vehicle.driverId || '',
            notes: ''
        });
        setActiveSection('add-vehicle');
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        const url = editingId
            ? `http://localhost:5000/api/vehicles/${editingId}`
            : 'http://localhost:5000/api/vehicles';

        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showNotification(editingId ? "Vehicle Updated Successfully!" : "Vehicle Added Successfully!", "success");
                setFormData({
                    type: '', registrationNumber: '', make: '', model: '', year: '',
                    seatingCapacity: '', fuelType: '', mileage: '', status: 'available', driverId: '', notes: ''
                });
                setEditingId(null);
                fetchVehicles(); // Refresh list
                setActiveSection('vehicle-list'); // Go back to list
            } else {
                showNotification("Failed to save vehicle.", "error");
            }
        } catch (error) {
            console.error("Error saving vehicle:", error);
            showNotification("Server Error", "error");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            type: '', registrationNumber: '', make: '', model: '', year: '',
            seatingCapacity: '', fuelType: '', mileage: '', status: 'available', notes: ''
        });
        setActiveSection('vehicle-list');
    };

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

    // Chart Data logic moved to fetchReservationsTrend effect

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [navigate]);

    const generateVehicleReport = async () => {
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
        doc.text('FLEET MANAGEMENT - MASTER VEHICLE REPORT', 105, 32, { align: 'center' });
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 48);

        const tableColumn = ["Reg Number", "Make/Model", "Type", "Capacity", "Fuel", "Status"];
        const tableRows = vehicles.map(v => [
            v.registration_number,
            `${v.make} ${v.model}`,
            v.type,
            v.seating_capacity,
            v.fuel_type,
            v.status.toUpperCase()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [102, 0, 0], textColor: [255, 255, 255] },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        doc.save(`UOK_Vehicle_Fleet_Report.pdf`);
        showNotification("PDF Report Generated Successfully", "success");
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const renderMaintenanceModal = () => {
        if (!selectedMaintenance) return null;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedMaintenance(null)}></div>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden animation-pop-in">
                    <div className="bg-maroon p-6 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Maintenance Details</h3>
                            <p className="text-maroon-light text-sm opacity-80">{selectedMaintenance.registration_number} • {selectedMaintenance.service_type}</p>
                        </div>
                        <button onClick={() => setSelectedMaintenance(null)} className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Service Date</label>
                                <p className="text-slate-800 font-medium">{new Date(selectedMaintenance.service_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Status</label>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${selectedMaintenance.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {selectedMaintenance.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Garage / Service Center</label>
                                <p className="text-slate-800 font-medium">{selectedMaintenance.garage_name || 'Not Specified'}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Final Cost</label>
                                <p className="text-slate-800 font-bold text-lg">LKR {selectedMaintenance.cost?.toLocaleString() || '0'}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Issue / Service Description</label>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedMaintenance.issue_description || 'No description provided.'}
                            </div>
                        </div>

                        {selectedMaintenance.completion_date && (
                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                                <i className="fas fa-info-circle"></i>
                                <span>Completed on {new Date(selectedMaintenance.completion_date).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-6 flex justify-end">
                        <button
                            onClick={() => setSelectedMaintenance(null)}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        );
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
                        <button 
                            onClick={generateVehicleReport}
                            className="bg-white text-maroon p-2 rounded-lg border border-maroon hover:bg-maroon hover:text-white transition-all flex items-center gap-2 font-bold shadow-sm"
                            title="Generate PDF Report"
                        >
                            <i className="fas fa-file-pdf"></i>
                            <span className="hidden md:inline">Generate PDF</span>
                        </button>
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
                                        <option value="Bus (Standard)">Bus (Standard)</option>
                                        <option value="Bus (Rosa)">Bus (Rosa)</option>
                                        <option value="Cab">Cab</option>
                                        <option value="Lorry">Lorry</option>
                                        <option value="Three-wheeler">Three-wheeler</option>
                                        <option value="Ambulance">Ambulance</option>
                                    </select>
                                </div>
                            </div>
                            {vehicles.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No vehicles found. Add a vehicle first.</div>
                            ) : (
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
                                                <div className="flex justify-between"><span>Mileage:</span> <span className="font-medium text-slate-800">{vehicle.mileage ? vehicle.mileage.toLocaleString() : '0'} km</span></div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleEdit(vehicle)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
                                                >
                                                    Edit
                                                </button>
                                                <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">History</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add/Edit Vehicle */}
                    {activeSection === 'add-vehicle' && (
                        <div className="section animation-fade-in">
                            <div className="section-header">
                                <h2>
                                    <i className={`fas ${editingId ? 'fa-edit' : 'fa-plus-circle'} mr-2`}></i>
                                    {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
                                </h2>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
                                <form className="space-y-6" onSubmit={handleAddVehicle}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="">Select Type</option>
                                                <option value="Car">Car</option>
                                                <option value="Van">Van</option>
                                                <option value="Bus (Standard)">Bus (Standard)</option>
                                                <option value="Bus (Rosa)">Bus (Rosa)</option>
                                                <option value="Cab">Cab</option>
                                                <option value="Lorry">Lorry</option>
                                                <option value="Three-wheeler">Three-wheeler</option>
                                                <option value="Ambulance">Ambulance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Number</label>
                                            <input
                                                type="text"
                                                name="registrationNumber"
                                                value={formData.registrationNumber}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                                placeholder="e.g. KI-1234"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Make</label>
                                            <input
                                                type="text"
                                                name="make"
                                                value={formData.make}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                                placeholder="Toyota"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                                            <input
                                                type="text"
                                                name="model"
                                                value={formData.model}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                                placeholder="Axio"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                                            <input
                                                type="number"
                                                name="year"
                                                value={formData.year}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                                placeholder="2020"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Seating Capacity</label>
                                            <input
                                                type="number"
                                                name="seatingCapacity"
                                                value={formData.seatingCapacity}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                                placeholder="4"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Fuel Type</label>
                                            <select
                                                name="fuelType"
                                                value={formData.fuelType}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="">Select Fuel Type</option>
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Assign Driver</label>
                                            <select
                                                name="driverId"
                                                value={formData.driverId}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="">Select Driver (Optional)</option>
                                                {driversList.map(driver => (
                                                    <option key={driver.driver_id} value={driver.driver_id}>
                                                        {driver.first_name} {driver.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Mileage (km)</label>
                                            <input
                                                type="number"
                                                name="mileage"
                                                value={formData.mileage}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                                placeholder="50000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 h-24 focus:ring-2 focus:ring-maroon focus:border-transparent outline-none transition-all"
                                            placeholder="Any additional information..."
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end pt-4 gap-4">
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setFormData({
                                                        type: '', registrationNumber: '', make: '', model: '', year: '',
                                                        seatingCapacity: '', fuelType: '', mileage: '', status: 'available', notes: ''
                                                    });
                                                    setActiveSection('vehicle-list');
                                                }}
                                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold shadow-sm transition-all duration-200"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-md transform hover:-translate-y-0.5 transition-all duration-200">
                                            {editingId ? 'Update Vehicle' : 'Add Vehicle'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}



                    {/* Fuel Management */}
                    {activeSection === 'fuel-management' && (
                        <div className="section animation-fade-in">
                            <div className="section-header"><h2><i className="fas fa-gas-pump mr-2"></i> Fuel Management</h2></div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 text-slate-800">
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-red-50 shadow-sm border border-red-100 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">Total Fuel Cost</span>
                                        <i className="fas fa-wallet text-red-400 text-sm opacity-60"></i>
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-800">LKR {fuelReport.total_cost?.toLocaleString() || '0'}</h4>
                                    <p className="text-[10px] text-red-400 mt-1 font-medium bg-red-50 px-2 py-0.5 rounded inline-block">For selected period</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-red-50 shadow-sm border border-red-100 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">Total Liters</span>
                                        <i className="fas fa-gas-pump text-red-400 text-sm opacity-60"></i>
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-800">{fuelReport.total_liters || '0'} <span className="text-xs font-normal text-slate-400">L</span></h4>
                                    <p className="text-[10px] text-red-400 mt-1 font-medium bg-red-50 px-2 py-0.5 rounded inline-block">For selected period</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-red-50 shadow-sm border border-red-100 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">Vehicles Tracked</span>
                                        <i className="fas fa-check-circle text-red-400 text-sm opacity-60"></i>
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-800">{reportFilter.vehicle_id === 'all' ? vehicles.length : 1}</h4>
                                    <p className="text-[10px] text-red-400 mt-1 font-medium bg-red-50 px-2 py-0.5 rounded inline-block">Active in query</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Add Record Form */}
                                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-maroon/10 text-maroon flex items-center justify-center"><i className="fas fa-plus text-xs"></i></span>
                                        Add Daily Fuel Entry
                                    </h3>
                                    <form onSubmit={handleFuelSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Vehicle</label>
                                            <select
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-maroon outline-none"
                                                value={fuelFormData.vehicle_id}
                                                onChange={(e) => setFuelFormData({ ...fuelFormData, vehicle_id: e.target.value })}
                                            >
                                                <option value="">Select a vehicle</option>
                                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.number} - {v.make}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Date</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                                    value={fuelFormData.date}
                                                    onChange={(e) => setFuelFormData({ ...fuelFormData, date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Liters (L)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                                    placeholder="0.00"
                                                    value={fuelFormData.liters}
                                                    onChange={(e) => setFuelFormData({ ...fuelFormData, liters: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Cost (LKR)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-maroon"
                                                    placeholder="0"
                                                    value={fuelFormData.cost}
                                                    onChange={(e) => setFuelFormData({ ...fuelFormData, cost: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            style={{ color: 'white' }}
                                            className="w-full bg-[#800000] py-4 rounded-xl font-bold hover:bg-[#660000] transition-all transform hover:-translate-y-0.5 shadow-sm mt-4 border-2 border-transparent hover:border-white"
                                        >
                                            Save Fuel Entry
                                        </button>
                                    </form>
                                </div>

                                {/* Reports & History */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i className="fas fa-filter text-xs"></i></span>
                                            Filter Consumption Report
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
                                                    value={reportFilter.vehicle_id}
                                                    onChange={(e) => setReportFilter({ ...reportFilter, vehicle_id: e.target.value })}
                                                >
                                                    <option value="all">All Vehicles</option>
                                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.number}</option>)}
                                                </select>
                                            </div>
                                            <input
                                                type="date"
                                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
                                                value={reportFilter.startDate}
                                                onChange={(e) => setReportFilter({ ...reportFilter, startDate: e.target.value })}
                                            />
                                            <input
                                                type="date"
                                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
                                                value={reportFilter.endDate}
                                                onChange={(e) => setReportFilter({ ...reportFilter, endDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtered Summary:</span>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-maroon">LKR {fuelReport.total_cost?.toLocaleString() || '0'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{fuelReport.total_liters || '0'} Liters Total</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleDownloadPDF}
                                            style={{ color: 'white' }}
                                            className="w-full mt-6 bg-[#800000] py-4 rounded-xl text-xs font-black hover:bg-[#660000] transition-all flex items-center justify-center gap-3 border-2 border-white uppercase tracking-[0.2em]"
                                        >
                                            <i className="fas fa-file-pdf text-base" style={{ color: 'white' }}></i> GENERATE PDF REPORT
                                        </button>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-h-[400px] overflow-hidden flex flex-col">
                                        <h3 className="text-md font-bold text-slate-800 mb-4 px-2">Recent Consumption History</h3>
                                        <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {fuelList.map((rec, i) => (
                                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{rec.registration_number}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{new Date(rec.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-maroon text-sm">Rs. {rec.cost.toLocaleString()}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{rec.liters} Liters</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {fuelList.length === 0 && <p className="text-center py-8 text-slate-400 text-sm italic">No entries found yet.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Insurance */}
                    {activeSection === 'insurance' && (
                        <div className="section animation-fade-in">
                            <div className="section-header"><h2><i className="fas fa-shield-alt mr-2"></i> Insurance Management</h2></div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Add Insurance Form */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><i className="fas fa-plus text-xs"></i></span>
                                            New Insurance Policy
                                        </h3>
                                        <form onSubmit={handleInsuranceSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Vehicle</label>
                                                <select
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    value={insuranceFormData.vehicle_id}
                                                    onChange={(e) => setInsuranceFormData({ ...insuranceFormData, vehicle_id: e.target.value })}
                                                >
                                                    <option value="">Select Vehicle</option>
                                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.number}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Provider Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. SLIC, Ceylinco"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                                    value={insuranceFormData.provider_name}
                                                    onChange={(e) => setInsuranceFormData({ ...insuranceFormData, provider_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Policy Number</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="POL-000000"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                                    value={insuranceFormData.policy_number}
                                                    onChange={(e) => setInsuranceFormData({ ...insuranceFormData, policy_number: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                                        value={insuranceFormData.start_date}
                                                        onChange={(e) => setInsuranceFormData({ ...insuranceFormData, start_date: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Expiry Date</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                                        value={insuranceFormData.expiry_date}
                                                        onChange={(e) => setInsuranceFormData({ ...insuranceFormData, expiry_date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Premium Amount (LKR)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    placeholder="0.00"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                                    value={insuranceFormData.premium_amount}
                                                    onChange={(e) => setInsuranceFormData({ ...insuranceFormData, premium_amount: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Initial Status</label>
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                                                    value={insuranceFormData.status}
                                                    onChange={(e) => setInsuranceFormData({ ...insuranceFormData, status: e.target.value })}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="pending_renewal">Pending Renewal</option>
                                                </select>
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md mt-4"
                                            >
                                                Register Policy
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Records Table */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left data-table">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="p-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Vehicle</th>
                                                        <th className="p-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Provider</th>
                                                        <th className="p-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Policy No</th>
                                                        <th className="p-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Validity</th>
                                                        <th className="p-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Premium</th>
                                                        <th className="p-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {insuranceRecords.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="p-10 text-center text-slate-400 italic">No insurance records found.</td>
                                                        </tr>
                                                    ) : (
                                                        insuranceRecords.map((rec, i) => (
                                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="p-4 text-center">
                                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700">{rec.registration_number}</span>
                                                                </td>
                                                                <td className="p-4 font-bold text-slate-700 text-sm">{rec.provider_name}</td>
                                                                <td className="p-4 text-slate-500 font-mono text-xs">{rec.policy_number}</td>
                                                                <td className="p-4 text-slate-600 text-[11px] font-semibold">
                                                                    {new Date(rec.start_date).toLocaleDateString()} - {new Date(rec.expiry_date).toLocaleDateString()}
                                                                </td>
                                                                <td className="p-4 text-emerald-600 font-bold text-sm">
                                                                    Rs. {parseFloat(rec.premium_amount).toLocaleString()}
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${new Date(rec.expiry_date) < new Date() || rec.status === 'expired' ? 'bg-rose-100 text-rose-700' :
                                                                        rec.status === 'pending_renewal' ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-emerald-100 text-emerald-700'
                                                                        }`}>
                                                                        {new Date(rec.expiry_date) < new Date() ? 'Expired' : rec.status.replace('_', ' ')}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
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
                                        <Line data={trendData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {renderMaintenanceModal()}
        </div>
    );
};

export default VehicleManagement;
