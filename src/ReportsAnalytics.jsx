import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

ChartJS.register(...registerables);

const ReportsAnalytics = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');

    // Data State
    const [vehicles, setVehicles] = useState([]);
    const [maintenanceDailyCosts, setMaintenanceDailyCosts] = useState([]);
    const [fuelReport, setFuelReport] = useState({ total_cost: 0, total_liters: 0 });
    const [fuelFilters, setFuelFilters] = useState({
        vehicleId: 'all',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [maintenanceReport, setMaintenanceReport] = useState({ total_cost: 0, total_records: 0 });
    const [maintenanceFilters, setMaintenanceFilters] = useState({
        vehicleId: 'all',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchVehicles = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vehicles');
            if (response.ok) {
                const data = await response.json();
                setVehicles(data);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const fetchMaintenanceDailyCosts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/maintenance/daily-costs');
            if (response.ok) {
                const data = await response.json();
                setMaintenanceDailyCosts(data);
            }
        } catch (error) {
            console.error('Error fetching maintenance costs:', error);
        }
    };

    const fetchFuelReport = async () => {
        try {
            const { vehicleId, startDate, endDate } = fuelFilters;
            const response = await fetch(`http://localhost:5000/api/fuel/report?vehicle_id=${vehicleId}&startDate=${startDate}&endDate=${endDate}`);
            if (response.ok) {
                const data = await response.json();
                setFuelReport(data);
            }
        } catch (error) {
            console.error('Error fetching fuel report:', error);
        }
    };

    const fetchMaintenanceReport = async () => {
        try {
            const { vehicleId, startDate, endDate } = maintenanceFilters;
            const response = await fetch(`http://localhost:5000/api/maintenance/report?vehicle_id=${vehicleId}&startDate=${startDate}&endDate=${endDate}`);
            if (response.ok) {
                const data = await response.json();
                setMaintenanceReport(data);
            }
        } catch (error) {
            console.error('Error fetching maintenance report:', error);
        }
    };

    const handleDownloadFuelPDF = async () => {
        try {
            const { vehicleId, startDate, endDate } = fuelFilters;
            const query = `vehicle_id=${vehicleId}&startDate=${startDate}&endDate=${endDate}`;
            const response = await fetch(`http://localhost:5000/api/fuel?${query}`);

            if (!response.ok) throw new Error('Failed to fetch records');
            const fuelList = await response.json();

            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(128, 0, 0);
            doc.text("UNIVERSITY OF KELANIYA", 105, 15, { align: "center" });
            doc.setFontSize(16);
            doc.setTextColor(51, 65, 85);
            doc.text("Fuel Consumption Analytical Report", 105, 25, { align: "center" });
            doc.setDrawColor(128, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(20, 30, 190, 30);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
            doc.text(`Reporting Period: ${startDate} to ${endDate}`, 20, 45);
            const vName = vehicleId === 'all' ? 'All Vehicles' : (vehicles.find(v => v.vehicle_id == vehicleId)?.registration_number || 'Selected Vehicle');
            doc.text(`Vehicle Scope: ${vName}`, 20, 50);
            doc.setFillColor(248, 250, 252);
            doc.rect(20, 55, 170, 25, 'F');
            doc.setFontSize(12);
            doc.setTextColor(128, 0, 0);
            doc.setFont(undefined, 'bold');
            doc.text("Financial Summary", 25, 63);
            doc.setFontSize(11);
            doc.setTextColor(51, 65, 85);
            doc.setFont(undefined, 'normal');
            doc.text(`Total Volume: ${fuelReport.total_liters || 0} Liters`, 25, 72);
            doc.text(`Total Expenditure: Rs. ${parseFloat(fuelReport.total_cost || 0).toLocaleString()}`, 100, 72);

            const tableData = fuelList.map(rec => [
                new Date(rec.date).toLocaleDateString(),
                rec.registration_number,
                `${rec.liters} L`,
                `Rs. ${parseFloat(rec.cost).toLocaleString()}`
            ]);

            autoTable(doc, {
                startY: 85,
                head: [['Date', 'Vehicle Number', 'Fuel Volume', 'Transaction Cost']],
                body: tableData,
                headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 4 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 85 }
            });

            doc.save(`Fuel_Report_${startDate}_to_${endDate}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF.');
        }
    };

    const handleDownloadMaintenancePDF = async () => {
        try {
            const { vehicleId, startDate, endDate } = maintenanceFilters;
            const response = await fetch(`http://localhost:5000/api/maintenance`);
            if (!response.ok) throw new Error('Failed to fetch records');
            let allRecords = await response.json();
            const filteredRecords = allRecords.filter(rec => {
                const date = new Date(rec.service_date);
                const sDate = new Date(startDate);
                const eDate = new Date(endDate);
                const vehicleMatch = vehicleId === 'all' || rec.vehicle_id == vehicleId;
                return date >= sDate && date <= eDate && vehicleMatch;
            });

            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(128, 0, 0);
            doc.text("UNIVERSITY OF KELANIYA", 105, 15, { align: "center" });
            doc.setFontSize(16);
            doc.setTextColor(51, 65, 85);
            doc.text("Maintenance Cost Analytical Report", 105, 25, { align: "center" });
            doc.setDrawColor(128, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(20, 30, 190, 30);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
            doc.text(`Reporting Period: ${startDate} to ${endDate}`, 20, 45);
            const vName = vehicleId === 'all' ? 'All Vehicles' : (vehicles.find(v => v.vehicle_id == vehicleId)?.registration_number || 'Selected Vehicle');
            doc.text(`Vehicle Scope: ${vName}`, 20, 50);
            doc.setFillColor(248, 250, 252);
            doc.rect(20, 55, 170, 25, 'F');
            doc.setFontSize(12);
            doc.setTextColor(128, 0, 0);
            doc.setFont(undefined, 'bold');
            doc.text("Maintenance Financial Summary", 25, 63);
            doc.setFontSize(11);
            doc.setTextColor(51, 65, 85);
            doc.setFont(undefined, 'normal');
            doc.text(`Total Tasks: ${maintenanceReport.total_records || 0}`, 25, 72);
            doc.text(`Total Maintenance Cost: Rs. ${parseFloat(maintenanceReport.total_cost || 0).toLocaleString()}`, 100, 72);

            const tableData = filteredRecords.map(rec => [
                new Date(rec.service_date).toLocaleDateString(),
                rec.registration_number,
                rec.service_type,
                rec.garage_name || 'N/A',
                `Rs. ${parseFloat(rec.cost).toLocaleString()}`
            ]);

            autoTable(doc, {
                startY: 85,
                head: [['Date', 'Vehicle', 'Service Type', 'Garage', 'Cost (LKR)']],
                body: tableData,
                headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 85 }
            });

            doc.save(`Maintenance_Report_${startDate}_to_${endDate}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF.');
        }
    };

    React.useEffect(() => {
        fetchVehicles();
        if (activeSection === 'maintenance' || activeSection === 'financial') {
            if (activeSection === 'maintenance') fetchMaintenanceDailyCosts();
            fetchMaintenanceReport();
        }
        if (activeSection === 'financial') {
            fetchFuelReport();
        }
    }, [activeSection, fuelFilters, maintenanceFilters]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#475569' } }
        },
        scales: {
            y: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' } },
            x: { grid: { display: false }, ticks: { color: '#64748b' } }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right', labels: { color: '#475569' } }
        }
    };

    // Mock Data
    const bookingTrendsData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        datasets: [{
            label: 'Bookings',
            data: [45, 52, 48, 61, 55, 67, 73, 69, 75, 82],
            borderColor: '#800000',
            backgroundColor: 'rgba(128, 0, 0, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    const vehicleTypeData = {
        labels: ['Cars', 'Vans', 'Buses'],
        datasets: [{
            data: [12, 8, 4],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
        }]
    };

    const peakHoursData = {
        labels: ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM'],
        datasets: [{
            label: 'Bookings',
            data: [5, 15, 25, 30, 22, 28, 12],
            backgroundColor: '#800000'
        }]
    };

    const departmentUsageData = {
        labels: ['Computer Science', 'Engineering', 'Business', 'Arts'],
        datasets: [{
            data: [35, 28, 22, 15],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        }]
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-600">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm">Total Vehicles</p>
                                        <h3 className="text-3xl font-bold text-slate-800">24</h3>
                                        <p className="text-emerald-600 text-xs mt-1"><i className="fas fa-arrow-up"></i> +2 this month</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><i className="fas fa-car text-xl"></i></div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-emerald-600">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm">Active Bookings</p>
                                        <h3 className="text-3xl font-bold text-slate-800">18</h3>
                                        <p className="text-emerald-600 text-xs mt-1"><i className="fas fa-arrow-up"></i> +5 today</p>
                                    </div>
                                    <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><i className="fas fa-calendar-check text-xl"></i></div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-amber-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm">Monthly Cost</p>
                                        <h3 className="text-3xl font-bold text-slate-800">Rs. 450K</h3>
                                        <p className="text-red-500 text-xs mt-1"><i className="fas fa-arrow-down"></i> -8% vs last month</p>
                                    </div>
                                    <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><i className="fas fa-dollar-sign text-xl"></i></div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-600">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-sm">Utilization Rate</p>
                                        <h3 className="text-3xl font-bold text-slate-800">78%</h3>
                                        <p className="text-emerald-600 text-xs mt-1"><i className="fas fa-arrow-up"></i> +3% this week</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><i className="fas fa-chart-line text-xl"></i></div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Monthly Booking Trends</h3>
                                <Line data={bookingTrendsData} options={chartOptions} />
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Vehicle Type Distribution</h3>
                                <div className="h-64 flex justify-center">
                                    <Doughnut data={vehicleTypeData} options={pieOptions} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'usage':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Peak Hours</h3>
                                <Bar data={peakHoursData} options={chartOptions} />
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Department Usage</h3>
                                <div className="h-64 flex justify-center">
                                    <Pie data={departmentUsageData} options={pieOptions} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'maintenance':
                return (
                    <div className="space-y-6 animation-fade-in">
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-wrench text-amber-500"></i> Daily Maintenance Costs (Last 30 Days)
                            </h3>
                            <div className="h-96">
                                <Line
                                    data={{
                                        labels: maintenanceDailyCosts.map(d => new Date(d.date).toLocaleDateString()),
                                        datasets: [{
                                            label: 'Daily Cost (Rs.)',
                                            data: maintenanceDailyCosts.map(d => d.total_cost),
                                            borderColor: '#f59e0b',
                                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                            tension: 0.3,
                                            fill: true
                                        }]
                                    }}
                                    options={{ ...chartOptions, maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-file-invoice-dollar text-red-500"></i> Maintenance Cost Analysis & Report
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Vehicle</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-red-500"
                                        value={maintenanceFilters.vehicleId}
                                        onChange={(e) => setMaintenanceFilters({ ...maintenanceFilters, vehicleId: e.target.value })}
                                    >
                                        <option value="all">All Vehicles</option>
                                        {vehicles.map(v => (
                                            <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                                        value={maintenanceFilters.startDate}
                                        onChange={(e) => setMaintenanceFilters({ ...maintenanceFilters, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                                        value={maintenanceFilters.endDate}
                                        onChange={(e) => setMaintenanceFilters({ ...maintenanceFilters, endDate: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button onClick={fetchMaintenanceReport} className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm font-bold hover:bg-slate-900 transition" style={{ color: 'white' }}>Update</button>
                                    <button onClick={handleDownloadMaintenancePDF} className="flex-1 bg-maroon text-white rounded-lg py-2 text-sm font-bold hover:bg-red-900 transition flex items-center justify-center gap-2" style={{ color: 'white' }}>Generate PDF</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
                                    <i className="fas fa-tools text-3xl text-red-500 mb-2"></i>
                                    <p className="text-red-700 font-bold uppercase text-xs">Total Cost</p>
                                    <h4 className="text-4xl font-black text-slate-800 mt-2">Rs. {parseFloat(maintenanceReport?.total_cost || 0).toLocaleString()}</h4>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <i className="fas fa-clipboard-list text-3xl text-slate-600 mb-2"></i>
                                    <p className="text-slate-700 font-bold uppercase text-xs">Total Records</p>
                                    <h4 className="text-4xl font-black text-slate-800 mt-2">{maintenanceReport?.total_records || 0} Tasks</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'financial':
                return (
                    <div className="space-y-6 animation-fade-in">
                        {/* Fuel Analytics Section */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-gas-pump text-emerald-500"></i> Fuel Cost Analytics & Report
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Vehicle</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                                        value={fuelFilters.vehicleId}
                                        onChange={(e) => setFuelFilters({ ...fuelFilters, vehicleId: e.target.value })}
                                    >
                                        <option value="all">All Vehicles</option>
                                        {vehicles.map(v => (
                                            <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Start Date</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={fuelFilters.startDate} onChange={(e) => setFuelFilters({ ...fuelFilters, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">End Date</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={fuelFilters.endDate} onChange={(e) => setFuelFilters({ ...fuelFilters, endDate: e.target.value })} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button onClick={fetchFuelReport} className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm font-bold hover:bg-slate-900 transition" style={{ color: 'white' }}>Update</button>
                                    <button onClick={handleDownloadFuelPDF} className="flex-1 bg-maroon text-white rounded-lg py-2 text-sm font-bold hover:bg-red-900 transition flex items-center justify-center gap-2" style={{ color: 'white' }}>Generate PDF</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                    <i className="fas fa-wallet text-3xl text-emerald-500 mb-2"></i>
                                    <p className="text-emerald-700 font-bold uppercase text-xs">Total Fuel Cost</p>
                                    <h4 className="text-4xl font-black text-slate-800 mt-2">Rs. {parseFloat(fuelReport?.total_cost || 0).toLocaleString()}</h4>
                                </div>
                                <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                    <i className="fas fa-tint text-3xl text-blue-500 mb-2"></i>
                                    <p className="text-blue-700 font-bold uppercase text-xs">Total Consumed</p>
                                    <h4 className="text-4xl font-black text-slate-800 mt-2">{parseFloat(fuelReport?.total_liters || 0).toLocaleString()} L</h4>
                                </div>
                            </div>
                        </div>

                        {/* Duplicated Maintenance Analysis Section for Financials */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-file-invoice-dollar text-red-500"></i> Maintenance Cost Analysis
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Vehicle</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-red-500"
                                        value={maintenanceFilters.vehicleId}
                                        onChange={(e) => setMaintenanceFilters({ ...maintenanceFilters, vehicleId: e.target.value })}
                                    >
                                        <option value="all">All Vehicles</option>
                                        {vehicles.map(v => (
                                            <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                                        value={maintenanceFilters.startDate}
                                        onChange={(e) => setMaintenanceFilters({ ...maintenanceFilters, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
                                        value={maintenanceFilters.endDate}
                                        onChange={(e) => setMaintenanceFilters({ ...maintenanceFilters, endDate: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button onClick={fetchMaintenanceReport} className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm font-bold hover:bg-slate-900 transition" style={{ color: 'white' }}>Update</button>
                                    <button onClick={handleDownloadMaintenancePDF} className="flex-1 bg-maroon text-white rounded-lg py-2 text-sm font-bold hover:bg-red-900 transition flex items-center justify-center gap-2" style={{ color: 'white' }}>Generate PDF</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
                                    <i className="fas fa-tools text-3xl text-red-500 mb-2"></i>
                                    <p className="text-red-700 font-bold uppercase text-xs">Total Maintenance Cost</p>
                                    <h4 className="text-4xl font-black text-slate-800 mt-2">Rs. {parseFloat(maintenanceReport?.total_cost || 0).toLocaleString()}</h4>
                                </div>
                                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <i className="fas fa-clipboard-list text-3xl text-slate-600 mb-2"></i>
                                    <p className="text-slate-700 font-bold uppercase text-xs">Total Service Records</p>
                                    <h4 className="text-4xl font-black text-slate-800 mt-2">{maintenanceReport?.total_records || 0} Tasks</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'trends':
            case 'custom':
                return (
                    <div className="bg-white rounded-xl shadow p-10 text-center">
                        <div className="text-slate-300 text-6xl mb-4"><i className="fas fa-hard-hat"></i></div>
                        <h2 className="text-2xl font-bold text-slate-800">Section Under Construction</h2>
                        <p className="text-slate-500 mt-2">The {activeSection} module is being updated with real-time data integration.</p>
                    </div>
                );
            default:
                return null;
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
                    <div className="menu-section-title">Reports</div>
                    <div className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => setActiveSection('overview')}>
                        <i className="fas fa-chart-pie"></i>
                        <span>Overview</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'usage' ? 'active' : ''}`} onClick={() => setActiveSection('usage')}>
                        <i className="fas fa-chart-line"></i>
                        <span>Usage Analytics</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'financial' ? 'active' : ''}`} onClick={() => setActiveSection('financial')}>
                        <i className="fas fa-dollar-sign"></i>
                        <span>Financials</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveSection('maintenance')}>
                        <i className="fas fa-wrench"></i>
                        <span>Maintenance</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'trends' ? 'active' : ''}`} onClick={() => setActiveSection('trends')}>
                        <i className="fas fa-calendar-check"></i>
                        <span>Booking Trends</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'custom' ? 'active' : ''}`} onClick={() => setActiveSection('custom')}>
                        <i className="fas fa-file-alt"></i>
                        <span>Custom Reports</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Navigation</div>
                    <div className="menu-item" onClick={() => {
                        const role = sessionStorage.getItem('userRole');
                        if (role === 'sar') navigate('/sar-dashboard');
                        else if (role === 'registrar') navigate('/registrar-dashboard');
                        else if (role === 'management_assistant') navigate('/management-dashboard');
                        else if (role === 'admin') navigate('/admin-dashboard');
                        else navigate('/dashboard');
                    }}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="top-nav">
                    <div className="welcome">
                        <h1>Reports & Analytics <i className="fas fa-chart-bar text-yellow-500 ml-2"></i></h1>
                        <p>Insights & performance metrics</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="user-profile">
                            <div className="user-avatar bg-maroon">AD</div>
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

export default ReportsAnalytics;
