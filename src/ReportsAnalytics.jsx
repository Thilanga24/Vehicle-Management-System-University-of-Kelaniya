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
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Aggregated Stats
    const [overviewStats, setOverviewStats] = useState({
        totalVehicles: 0,
        activeBookings: 0,
        monthlyCost: 0,
        utilizationRate: 0
    });

    const [chartData, setChartData] = useState({
        trends: null,
        vehicleTypes: null,
        peakHours: null,
        departments: null,
        availability: null,
        costComparison: null
    });

    const [topVehicles, setTopVehicles] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

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
            
            // Add Logo (Wait for load)
            const logoImg = new Image();
            logoImg.src = '/assets/uok_logo.png';
            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });
            doc.addImage(logoImg, 'PNG', 15, 10, 15, 15);

            doc.setFontSize(22);
            doc.setTextColor(128, 0, 0);
            doc.text("UNIVERSITY OF KELANIYA", 105, 20, { align: "center" });
            doc.setFontSize(16);
            doc.setTextColor(51, 65, 85);
            doc.text("Fuel Consumption Analytical Report", 105, 30, { align: "center" });
            doc.setDrawColor(128, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);
            doc.text(`Reporting Period: ${startDate} to ${endDate}`, 20, 50);
            const vName = vehicleId === 'all' ? 'All Vehicles' : (vehicles.find(v => v.vehicle_id == vehicleId)?.registration_number || 'Selected Vehicle');
            doc.text(`Vehicle Scope: ${vName}`, 20, 55);
            doc.setFillColor(248, 250, 252);
            doc.rect(20, 60, 170, 20, 'F');
            doc.setFontSize(12);
            doc.setTextColor(128, 0, 0);
            doc.setFont(undefined, 'bold');
            doc.text("Financial Summary", 25, 68);
            doc.setFontSize(11);
            doc.setTextColor(51, 65, 85);
            doc.setFont(undefined, 'normal');
            doc.text(`Total Volume: ${fuelReport.total_liters || 0} Liters`, 25, 75);
            doc.text(`Total Expenditure: Rs. ${parseFloat(fuelReport.total_cost || 0).toLocaleString()}`, 100, 75);

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
            
            // Add Logo (Wait for load)
            const logoImg = new Image();
            logoImg.src = '/assets/uok_logo.png';
            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });
            doc.addImage(logoImg, 'PNG', 15, 10, 15, 15);

            doc.setFontSize(22);
            doc.setTextColor(128, 0, 0);
            doc.text("UNIVERSITY OF KELANIYA", 105, 20, { align: "center" });
            doc.setFontSize(16);
            doc.setTextColor(51, 65, 85);
            doc.text("Maintenance Cost Analytical Report", 105, 30, { align: "center" });
            doc.setDrawColor(128, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);
            doc.text(`Reporting Period: ${startDate} to ${endDate}`, 20, 50);
            const vName = vehicleId === 'all' ? 'All Vehicles' : (vehicles.find(v => v.vehicle_id == vehicleId)?.registration_number || 'Selected Vehicle');
            doc.text(`Vehicle Scope: ${vName}`, 20, 55);
            doc.setFillColor(248, 250, 252);
            doc.rect(20, 60, 170, 20, 'F');
            doc.setFontSize(12);
            doc.setTextColor(128, 0, 0);
            doc.setFont(undefined, 'bold');
            doc.text("Maintenance Financial Summary", 25, 68);
            doc.setFontSize(11);
            doc.setTextColor(51, 65, 85);
            doc.setFont(undefined, 'normal');
            doc.text(`Total Tasks: ${maintenanceReport.total_records || 0}`, 25, 75);
            doc.text(`Total Maintenance Cost: Rs. ${parseFloat(maintenanceReport.total_cost || 0).toLocaleString()}`, 100, 75);

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

    const handleDownloadOverviewPDF = async () => {
        const doc = new jsPDF();
        
        // Add Logo (Wait for load)
        const logoImg = new Image();
        logoImg.src = '/assets/uok_logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });
        doc.addImage(logoImg, 'PNG', 10, 8, 15, 15);

        // Header
        doc.setFillColor(102, 0, 0);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('UNIVERSITY OF KELANIYA', 105, 20, { align: 'center' });
        doc.setFontSize(16);
        doc.text('Fleet Operational Intelligence Report', 105, 30, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 38, { align: 'center' });

        // Executive Summary
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('1. Executive Fleet Summary', 14, 60);
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const summaryData = [
            ['Total Registered Fleet', `${overviewStats.totalVehicles} Vehicles`],
            ['Active Reservation Volume', `${overviewStats.activeBookings} Bookings`],
            ['Monthly Maintenance & Fuel Cost', `Rs. ${overviewStats.monthlyCost.toLocaleString()}`],
            ['Resource Utilization Rate', `${overviewStats.utilizationRate}% Capacity`]
        ];

        doc.autoTable({
            startY: 65,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [102, 0, 0] },
            styles: { fontSize: 11, cellPadding: 5 }
        });

        // Recent Activity Table
        if (recentActivity && recentActivity.length > 0) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('2. Recent Deployment Activities', 14, doc.lastAutoTable.finalY + 15);

            const activityRows = recentActivity.map(act => [
                new Date(act.start_datetime).toLocaleDateString(),
                act.department || 'N/A',
                act.destination,
                act.status.toUpperCase()
            ]);

            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Date', 'Department', 'Destination', 'Status']],
                body: activityRows,
                theme: 'striped',
                headStyles: { fillColor: [70, 70, 70] },
                styles: { fontSize: 9 }
            });
        }

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('This is an automatically generated system report from UOK-VMS Analytics Engine.', 105, doc.internal.pageSize.height - 10, { align: 'center' });

        doc.save(`UOK_Fleet_Overview_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [resVehicles, resReservations, resMaint, resFuel] = await Promise.all([
                fetch('http://localhost:5000/api/vehicles').then(r => r.json()),
                fetch('http://localhost:5000/api/reservations').then(r => r.json()),
                fetch(`http://localhost:5000/api/maintenance/report?vehicle_id=all&startDate=${new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`).then(r => r.json()),
                fetch(`http://localhost:5000/api/fuel/report?vehicle_id=all&startDate=${new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`).then(r => r.json())
            ]);

            setVehicles(resVehicles);
            setReservations(resReservations);
            setMaintenanceReport(resMaint);
            setFuelReport(resFuel);

            // Calculate Overview Stats
            const active = resReservations.filter(r => r.status === 'approved' || r.status === 'pending').length;
            const totalCost = parseFloat(resMaint.total_cost || 0) + parseFloat(resFuel.total_cost || 0);
            
            setOverviewStats({
                totalVehicles: resVehicles.length,
                activeBookings: active,
                monthlyCost: totalCost,
                utilizationRate: resVehicles.length > 0 ? Math.round((active / resVehicles.length) * 100) : 0
            });

            // Calculate Chart Data
            // Booking Trends (Last 6 Months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonthIdx = new Date().getMonth();
            const last6Months = [];
            for(let i = 5; i >= 0; i--) {
                const idx = (currentMonthIdx - i + 12) % 12;
                last6Months.push(months[idx]);
            }

            const trendsData = last6Months.map(m => {
                return resReservations.filter(r => months[new Date(r.start_datetime).getMonth()] === m).length;
            });

            // Vehicle Distribution
            const vTypes = {};
            resVehicles.forEach(v => {
                const typeName = v.type || 'Other';
                vTypes[typeName] = (vTypes[typeName] || 0) + 1;
            });

            // Peak Hours
            const hourLabels = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM'];
            const peaks = [0, 0, 0, 0, 0, 0, 0];
            resReservations.forEach(r => {
                const hour = new Date(r.start_datetime).getHours();
                if (hour >= 5 && hour < 7) peaks[0]++;
                else if (hour >= 7 && hour < 9) peaks[1]++;
                else if (hour >= 9 && hour < 11) peaks[2]++;
                else if (hour >= 11 && hour < 13) peaks[3]++;
                else if (hour >= 13 && hour < 15) peaks[4]++;
                else if (hour >= 15 && hour < 17) peaks[5]++;
                else if (hour >= 17) peaks[6]++;
            });

            // Department Usage
            const depts = {};
            resReservations.forEach(r => depts[r.department || 'Other'] = (depts[r.department || 'Other'] || 0) + 1);

            // Availability Distribution
            const availStatus = { available: 0, maintenance: 0, reserved: 0 };
            resVehicles.forEach(v => availStatus[v.status] = (availStatus[v.status] || 0) + 1);

            // Top Vehicles (by reservation count)
            const vUsageCount = {};
            resReservations.forEach(r => {
                if(r.vehicle_id) vUsageCount[r.vehicle_id] = (vUsageCount[r.vehicle_id] || 0) + 1;
            });
            const topV = Object.entries(vUsageCount)
                .map(([id, count]) => ({
                    ...resVehicles.find(v => v.vehicle_id == id),
                    count
                }))
                .filter(v => v.registration_number)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            setTopVehicles(topV);

            // Recent Activity
            setRecentActivity(resReservations.slice(0, 5));

            setChartData({
                trends: {
                    labels: last6Months,
                    datasets: [{
                        label: 'Bookings',
                        data: trendsData,
                        borderColor: '#800000',
                        backgroundColor: 'rgba(128, 0, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                vehicleTypes: {
                    labels: Object.keys(vTypes),
                    datasets: [{
                        data: Object.values(vTypes),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                    }]
                },
                peakHours: {
                    labels: hourLabels,
                    datasets: [{
                        label: 'Bookings',
                        data: peaks,
                        backgroundColor: '#800000'
                    }]
                },
                departments: {
                    labels: Object.keys(depts),
                    datasets: [{
                        data: Object.values(depts),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                    }]
                },
                availability: {
                    labels: ['Available', 'Maintenance', 'Reserved'],
                    datasets: [{
                        data: [availStatus.available, availStatus.maintenance, availStatus.reserved],
                        backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
                    }]
                },
                costComparison: {
                    labels: ['Fuel', 'Maintenance'],
                    datasets: [{
                        label: 'Expense (Rs.)',
                        data: [parseFloat(resFuel.total_cost || 0), parseFloat(resMaint.total_cost || 0)],
                        backgroundColor: ['#10b981', '#ef4444']
                    }]
                }
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAllData();
        if (activeSection === 'maintenance') fetchMaintenanceDailyCosts();
        if (activeSection === 'financial') fetchFuelReport();
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

    // Data processed in fetchAllData
    
    const renderOverviewStats = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-600">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm">Total Vehicles</p>
                        <h3 className="text-3xl font-bold text-slate-800">{overviewStats.totalVehicles}</h3>
                        <p className="text-emerald-600 text-xs mt-1">Regestered in Fleet</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><i className="fas fa-car text-xl"></i></div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-emerald-600">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm">Active Bookings</p>
                        <h3 className="text-3xl font-bold text-slate-800">{overviewStats.activeBookings}</h3>
                        <p className="text-emerald-600 text-xs mt-1">Confirmed & Processing</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><i className="fas fa-calendar-check text-xl"></i></div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-amber-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm">Expense (30D)</p>
                        <h3 className="text-3xl font-bold text-slate-800">Rs. {(overviewStats.monthlyCost/1000).toFixed(1)}K</h3>
                        <p className="text-amber-600 text-xs mt-1">Fuel & Maintenance</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><i className="fas fa-wallet text-xl"></i></div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-600">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm">Utilization Rate</p>
                        <h3 className="text-3xl font-bold text-slate-800">{overviewStats.utilizationRate}%</h3>
                        <p className="text-emerald-600 text-xs mt-1">Operational Efficiency</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><i className="fas fa-chart-line text-xl"></i></div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-2">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Operational Overview</h2>
                                <p className="text-sm text-slate-500 font-medium">Global fleet metrics and performance indicators.</p>
                            </div>
                            <button onClick={handleDownloadOverviewPDF} className="bg-maroon text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#800000] transition-all shadow-lg text-sm">
                                <i className="fas fa-file-pdf"></i> Download Overview Report
                            </button>
                        </div>
                        {renderOverviewStats()}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4">6-Month Booking Trends</h3>
                                {chartData.trends && <Line data={chartData.trends} options={chartOptions} />}
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Vehicle Type Distribution</h3>
                                <div className="h-64 flex justify-center">
                                    {chartData.vehicleTypes && <Doughnut data={chartData.vehicleTypes} options={pieOptions} />}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'usage':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i className="fas fa-trophy text-yellow-500"></i> Top Performing Vehicles
                                </h3>
                                <div className="space-y-4">
                                    {topVehicles.map((v, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600 font-bold border border-slate-200">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{v.registration_number}</p>
                                                    <p className="text-xs text-slate-500">{v.model} - {v.type}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-blue-600">{v.count} Bookings</p>
                                                <div className="w-32 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                                    <div className="bg-blue-600 h-full" style={{ width: `${(v.count / topVehicles[0].count) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i className="fas fa-satellite-dish text-emerald-500"></i> Fleet Status Distribution
                                </h3>
                                <div className="h-64 flex justify-center">
                                    {chartData.availability && <Doughnut data={chartData.availability} options={pieOptions} />}
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-emerald-50 rounded-lg text-center border border-emerald-100">
                                        <p className="text-xs text-emerald-600 font-bold uppercase">Ready</p>
                                        <p className="text-xl font-bold text-slate-800">{vehicles.filter(v => v.status === 'available').length}</p>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-lg text-center border border-red-100">
                                        <p className="text-xs text-red-600 font-bold uppercase">In Shop</p>
                                        <p className="text-xl font-bold text-slate-800">{vehicles.filter(v => v.status === 'maintenance').length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Peak Operational Hours</h3>
                                {chartData.peakHours && <Bar data={chartData.peakHours} options={chartOptions} />}
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-4 font-bold flex items-center justify-between">
                                    <span>Department Usage</span>
                                    <span className="text-xs text-slate-400 font-normal">By Total Bookings</span>
                                </h3>
                                <div className="h-64 flex justify-center">
                                    {chartData.departments && <Pie data={chartData.departments} options={pieOptions} />}
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <i className="fas fa-file-invoice-dollar text-red-500"></i> Financial Performance (Fuel vs Maintenance)
                                </h3>
                                <div className="h-80">
                                    {chartData.costComparison && (
                                        <Bar 
                                            data={chartData.costComparison} 
                                            options={{
                                                ...chartOptions,
                                                indexAxis: 'y',
                                                plugins: { legend: { display: false } }
                                            }} 
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow p-6 flex flex-col justify-center text-center">
                                <div className="mb-4">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                                        <i className="fas fa-chart-line text-2xl"></i>
                                    </div>
                                    <h3 className="text-slate-800 font-bold text-xl">Total Operating Cost</h3>
                                    <p className="text-slate-500 text-sm">Last 30 Active Days</p>
                                </div>
                                <div className="text-4xl font-black text-slate-800 mb-2">Rs. {overviewStats.monthlyCost.toLocaleString()}</div>
                                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                                    <i className="fas fa-check-circle"></i>
                                    Within Allocated Budget
                                </div>
                            </div>
                        </div>
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
                    </div>
                );
            case 'trends':
                return (
                    <div className="space-y-6 animation-fade-in">
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <i className="fas fa-history text-blue-500"></i> 6-Month Reservation Growth & Volume
                            </h3>
                            <div className="h-[400px]">
                                {chartData.trends && <Line data={chartData.trends} options={{ ...chartOptions, maintainAspectRatio: false }} />}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-slate-500 text-sm font-medium">Busiest Month</p>
                                <h4 className="text-2xl font-bold text-slate-800 mt-1">
                                    {chartData.trends ? chartData.trends.labels[chartData.trends.datasets[0].data.indexOf(Math.max(...chartData.trends.datasets[0].data))] : 'N/A'}
                                </h4>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-slate-500 text-sm font-medium">Monthly Avg</p>
                                <h4 className="text-2xl font-bold text-slate-800 mt-1">
                                    {chartData.trends ? Math.round(chartData.trends.datasets[0].data.reduce((a, b) => a + b, 0) / 6) : 0} Bookings
                                </h4>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                                <button className="sar-btn sar-btn-primary w-full" onClick={fetchAllData}>
                                    <i className="fas fa-sync-alt mr-2"></i> Refresh Data
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'custom':
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

            {/* Sidebar Navigation */}
            <div className={`sidebar bg-[#1a0505] w-80 fixed h-full z-40 transition-transform duration-300 flex flex-col border-r border-[#F6DD26]/20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-white/10 shrink-0">
                    <div className="flex flex-col items-center mb-4">
                        <img src="/assets/banner.png" alt="University of Kelaniya" className="w-44 h-auto object-contain mb-4" />
                        <div className="text-center">
                            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Analytics Console</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Intelligence & Reporting Portal</p>
                        </div>
                    </div>
                </div>

                <div className="menu-section flex-1 overflow-y-auto px-4 py-6 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">Analytical Insights</p>
                    <div className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeSection === 'overview' ? 'active bg-white/10 border-[#F6DD26] text-[#F6DD26] font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`} onClick={() => setActiveSection('overview')}>
                        <i className={`fas fa-chart-pie text-lg w-6 text-center ${activeSection === 'overview' ? 'text-[#F6DD26]' : 'text-gray-400'}`}></i>
                        <span className="flex-1 text-sm font-medium">Overview</span>
                    </div>
                    <div className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeSection === 'usage' ? 'active bg-white/10 border-[#F6DD26] text-[#F6DD26] font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`} onClick={() => setActiveSection('usage')}>
                        <i className={`fas fa-chart-line text-lg w-6 text-center ${activeSection === 'usage' ? 'text-[#F6DD26]' : 'text-gray-400'}`}></i>
                        <span className="flex-1 text-sm font-medium">Usage Analytics</span>
                    </div>
                    <div className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeSection === 'financial' ? 'active bg-white/10 border-[#F6DD26] text-[#F6DD26] font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`} onClick={() => setActiveSection('financial')}>
                        <i className={`fas fa-dollar-sign text-lg w-6 text-center ${activeSection === 'financial' ? 'text-[#F6DD26]' : 'text-gray-400'}`}></i>
                        <span className="flex-1 text-sm font-medium">Financial Reports</span>
                    </div>
                    <div className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeSection === 'maintenance' ? 'active bg-white/10 border-[#F6DD26] text-[#F6DD26] font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`} onClick={() => setActiveSection('maintenance')}>
                        <i className={`fas fa-wrench text-lg w-6 text-center ${activeSection === 'maintenance' ? 'text-[#F6DD26]' : 'text-gray-400'}`}></i>
                        <span className="flex-1 text-sm font-medium">Maintenance Logs</span>
                    </div>
                    <div className={`menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 ${activeSection === 'trends' ? 'active bg-white/10 border-[#F6DD26] text-[#F6DD26] font-bold shadow-lg' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'}`} onClick={() => setActiveSection('trends')}>
                        <i className={`fas fa-calendar-check text-lg w-6 text-center ${activeSection === 'trends' ? 'text-[#F6DD26]' : 'text-gray-400'}`}></i>
                        <span className="flex-1 text-sm font-medium">Historical Trends</span>
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-6 pt-6">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-4">System Navigation</p>
                        <div className="menu-item p-4 cursor-pointer flex items-center space-x-3 rounded-xl transition-all duration-200 border-l-4 border-transparent text-gray-300 hover:bg-white/5 hover:text-white" onClick={() => {
                            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                            const role = user.role;
                            if (role === 'registrar') navigate('/registrar-dashboard');
                            else if (role === 'sar') navigate('/sar-dashboard');
                            else if (role === 'hod') navigate('/hod-dashboard');
                            else if (role === 'dean') navigate('/dean-dashboard');
                            else if (role === 'admin') navigate('/admin-dashboard');
                            else if (role === 'management_assistant') navigate('/management-dashboard');
                            else navigate('/dashboard');
                        }}>
                            <i className="fas fa-arrow-left text-lg w-6 text-center text-gray-400"></i>
                            <span className="flex-1 text-sm font-medium">Back to Portal</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-black/10 border-t border-white/5 shrink-0">
                    <button onClick={() => navigate('/login')} className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg transition duration-200 text-white flex items-center justify-center border border-white/10 font-bold">
                        <i className="fas fa-sign-out-alt mr-2"></i>Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-80 flex flex-col min-h-screen bg-slate-50 relative">
                {/* Top Navigation */}
                <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-30 shadow-sm flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                           {activeSection === 'overview' ? 'Operational Overview' :
                            activeSection === 'usage' ? 'Fleet Utilization' :
                            activeSection === 'financial' ? 'Financial Intelligence' :
                            activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Analytics
                        </h1>
                        <p className="text-slate-500 text-sm italic">University Vehicle Management Intelligence System</p>
                    </div>
                    <div className="flex items-center space-x-6">
                    </div>
                </header>

                <div className="p-8 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <div className="animate-spin text-4xl mb-4"><i className="fas fa-circle-notch"></i></div>
                            <p className="font-medium text-lg text-slate-600">Aggregating real-time data...</p>
                            <p className="text-sm text-slate-400">Calculating metrics from University systems</p>
                        </div>
                    ) : renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ReportsAnalytics;
