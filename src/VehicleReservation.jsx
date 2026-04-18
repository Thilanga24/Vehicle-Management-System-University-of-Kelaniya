import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

const VehicleReservation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [successMessage, setSuccessMessage] = useState('');
    const [allReservations, setAllReservations] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const [formData, setFormData] = useState({
        start_place: '',
        destinations: [''],
        distance: '',
        date: '',
        time: '',
        returnDate: '',
        returnTime: '',
        passengers: '',
        emergency_contact: '',
        purpose: '',
        remarks: '',
        attachment: null
    });

    const [distanceWarning, setDistanceWarning] = useState(false);

    useEffect(() => {
        if (location.state) {
            if (location.state.date) {
                setFormData(prev => ({ ...prev, date: location.state.date }));
            }
        }
    }, [location]);

    const [vehicles, setVehicles] = useState([]);

    const fetchAllData = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Vehicles
            const vResponse = await fetch('http://localhost:5000/api/vehicles', { headers });
            const vData = await vResponse.json();
            if (vResponse.ok) {
                const mappedVehicles = vData.map(v => ({
                    id: v.vehicle_id,
                    type: v.type,
                    model: v.model,
                    number: v.registration_number,
                    seats: v.seating_capacity,
                    status: v.status,
                    driver: v.driver_name || 'Not Assigned',
                    fuelType: v.fuel_type
                }));
                setVehicles(mappedVehicles);
            }

            // Fetch Reservations for availability check
            const rResponse = await fetch('http://localhost:5000/api/reservations', { headers });
            const rData = await rResponse.json();
            if (rResponse.ok) {
                setAllReservations(rData);
            }

        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'distance') {
            setDistanceWarning(parseInt(value) > 100);
        }
    };

    const handleDestinationChange = (index, value) => {
        const newDestinations = [...formData.destinations];
        newDestinations[index] = value;
        setFormData(prev => ({ ...prev, destinations: newDestinations }));
    };

    const addDestination = () => {
        setFormData(prev => ({ ...prev, destinations: [...prev.destinations, ''] }));
    };

    const removeDestination = (index) => {
        if (formData.destinations.length > 1) {
            const newDestinations = formData.destinations.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, destinations: newDestinations }));
        }
    };

    const validateStep1 = () => !!selectedType && !!formData.date;

    const validateStep2 = () => {
        const required = ['start_place', 'distance', 'date', 'time', 'returnDate', 'returnTime', 'passengers', 'emergency_contact', 'purpose'];
        const isDestinationsValid = formData.destinations && formData.destinations.some(d => String(d).trim() !== '');
        return isDestinationsValid && required.every(field => formData[field] && String(formData[field]).trim() !== '');
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!validateStep1()) return alert('Please select a date and vehicle type.');
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!validateStep2()) return alert('Please fill in all fields.');
            setCurrentStep(3);
        }
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const getVehicleIcon = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('bus')) return 'fa-bus';
        if (t.includes('van')) return 'fa-shuttle-van';
        if (t.includes('car')) return 'fa-car';
        return 'fa-car';
    };

    const submitReservation = async () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const requesterId = currentUser.id;

        if (!requesterId) {
            alert('You must be logged in to make a reservation.');
            navigate('/');
            return;
        }

        // Logic to assign first available vehicle of the selected type
        const availableInfo = getAvailableTypesForDate(formData.date).find(t => t.type === selectedType);
        const autoAssignedVehicle = availableInfo?.vehicleList?.[0];

        if (!autoAssignedVehicle) {
            alert('Sorry, no ' + selectedType + 's are available for this date.');
            return;
        }

        const payload = new FormData();
        payload.append('requesterId', requesterId);
        payload.append('vehicleId', autoAssignedVehicle.id); // Map backend ID
        payload.append('start_place', formData.start_place);

        formData.destinations.filter(d => String(d).trim() !== '').forEach(d => {
            payload.append('destinations[]', d);
        });

        payload.append('distance', formData.distance);
        payload.append('passengers', formData.passengers);
        payload.append('emergency_contact', formData.emergency_contact);
        payload.append('date', formData.date);
        payload.append('time', formData.time);
        payload.append('returnDate', formData.returnDate);
        payload.append('returnTime', formData.returnTime);
        payload.append('purpose', formData.purpose);
        payload.append('remarks', formData.remarks);

        if (formData.attachment) {
            payload.append('attachment', formData.attachment);
        }

        try {
            const token = sessionStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/reservations', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: payload
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Reservation submitted successfully! Redirecting to dashboard...');
                setTimeout(() => {
                    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    const role = user.role;
                    if (role === 'registrar') navigate('/registrar-dashboard');
                    else if (role === 'sar') navigate('/sar-dashboard');
                    else if (role === 'hod') navigate('/hod-dashboard');
                    else if (role === 'dean') navigate('/dean-dashboard');
                    else if (role === 'admin') navigate('/admin-dashboard');
                    else if (role === 'management_assistant') navigate('/management-dashboard');
                    else navigate('/dashboard');
                }, 3000);
            } else {
                alert(`Error: ${data.message || 'Failed to submit reservation'}`);
            }
        } catch (error) {
            console.error('Reservation Error:', error);
            alert('Server error. Please try again later.');
        }
    };

    // Calendar Helpers
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (offset) => {
        const updatedDate = new Date(currentMonth);
        updatedDate.setMonth(updatedDate.getMonth() + offset);
        setCurrentMonth(updatedDate);
    };

    const getAvailabilityStatus = (dateStr) => {
        const dayReservations = allReservations.filter(r => 
            r.date === dateStr && r.status !== 'rejected' && r.status !== 'cancelled'
        );
        const total = vehicles.length;
        if (total === 0) return 'limited';
        
        const reserved = dayReservations.length;
        const availableCount = total - reserved;
        
        if (availableCount <= 0) return 'none';
        if (availableCount < total * 0.4) return 'limited';
        return 'available';
    };

    const getAvailableTypesForDate = (dateStr) => {
        const dayReservations = allReservations.filter(r => 
            r.date === dateStr && r.status !== 'rejected'
        );
        const reservedIds = dayReservations.map(r => r.vehicle_id);
        
        // Filter to only include Car, Van, Bus as per user requirement
        const allowedTypes = ['Van', 'Car', 'Bus'];
        
        return allowedTypes.map(type => {
            const vt = vehicles.filter(v => v.type.toLowerCase() === type.toLowerCase());
            const av = vt.filter(v => !reservedIds.includes(v.id));
            return {
                type,
                total: vt.length,
                available: av.length,
                vehicleList: av
            };
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];
        const monthName = currentMonth.toLocaleString('default', { month: 'long' });
        const year = currentMonth.getFullYear();

        // Empty cells before start
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = formData.date === dateStr;
            const status = getAvailabilityStatus(dateStr);

            days.push(
                <div 
                    key={d} 
                    className={`calendar-day status-${status} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                        setFormData(prev => ({ ...prev, date: dateStr }));
                        setSelectedType(null);
                    }}
                >
                    <span className="calendar-day-num">{d}</span>
                    <div className={`day-availability-dot dot-${status}`}></div>
                </div>
            );
        }

        return (
            <div className="calendar-container">
                <div className="calendar-header">
                    <h2>{monthName} {year}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="calendar-nav-btn"><i className="fas fa-chevron-left"></i></button>
                        <button onClick={() => changeMonth(1)} className="calendar-nav-btn"><i className="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="calendar-day-header">{day}</div>
                    ))}
                    {days}
                </div>
                
                {/* Legend */}
                <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">High Availability</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">Limited Seats</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">Fully Booked</span>
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

            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
                <div className="logo">
                    <div className="logo-content justify-center">
                        <img src="/assets/banner.png" alt="University of Kelaniya VMS" className="w-full h-auto object-contain" />
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Schedule Steps</div>
                    <div className={`menu-item ${currentStep === 1 ? 'active' : ''}`} onClick={() => setCurrentStep(1)}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${currentStep >= 1 ? 'bg-yellow-500 text-white' : 'bg-slate-600 text-slate-300'}`}>1</div>
                        <span>Pick Vehicle</span>
                    </div>
                    <div className={`menu-item ${currentStep === 2 ? 'active' : ''}`} onClick={() => { if (selectedType) setCurrentStep(2) }}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${currentStep >= 2 ? 'bg-yellow-500 text-white' : 'bg-slate-600 text-slate-300'}`}>2</div>
                        <span>Trip Details</span>
                    </div>
                    <div className={`menu-item ${currentStep === 3 ? 'active' : ''}`} onClick={() => { if (selectedType && validateStep2()) setCurrentStep(3) }}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${currentStep >= 3 ? 'bg-yellow-500 text-white' : 'bg-slate-600 text-slate-300'}`}>3</div>
                        <span>Final Review</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Navigation</div>
                    <div className="menu-item" onClick={() => {
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
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="top-nav">
                    <div className="welcome">
                        <h1>Vehicle Reservation</h1>
                        <p>{currentStep === 1 ? 'Step 1: Choose a category' : currentStep === 2 ? 'Step 2: Trip logistics' : 'Step 3: Submit request'}</p>
                    </div>
                </div>

                <div className="content-area">
                    {successMessage && (
                        <div className="flex flex-col items-center justify-center p-12 bg-emerald-50 rounded-xl shadow-lg border border-emerald-100 text-center my-10 animate-fade-in-up">
                            <i className="fas fa-check-circle text-6xl text-emerald-500 mb-6 animate-bounce"></i>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Submitted!</h2>
                            <p className="text-lg text-slate-600 mb-6">{successMessage}</p>
                        </div>
                    )}

                    {/* Step 1: Simplified Schedule & Type Selection */}
                    {currentStep === 1 && !successMessage && (
                        <div className="animation-fade-in">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4"><i className="fas fa-calendar-alt mr-2 text-maroon"></i> 1. Select Date</p>
                                    {renderCalendar()}
                                </div>
                                
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4"><i className="fas fa-car-side mr-2 text-maroon"></i> 2. Choose Category</p>
                                    {!formData.date ? (
                                        <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-10 text-slate-400">
                                            <i className="fas fa-calendar-day text-5xl mb-4 opacity-20"></i>
                                            <p className="font-medium">Please select a date from the calendar first</p>
                                        </div>
                                    ) : (
                                        <div className="availability-grid">
                                            {getAvailableTypesForDate(formData.date).map(info => (
                                                <div 
                                                    key={info.type}
                                                    className={`type-card ${selectedType === info.type ? 'selected' : ''} ${info.available === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    onClick={() => info.available > 0 && setSelectedType(info.type)}
                                                >
                                                    <div className="type-icon">
                                                        <i className={`fas ${getVehicleIcon(info.type)}`}></i>
                                                    </div>
                                                    <div className="type-info">
                                                        <h4>{info.type} Category</h4>
                                                        <p className={info.available > 0 ? 'text-emerald-600 font-black' : 'text-red-500'}>
                                                            {info.available} Units Available
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedType && (
                                        <div className="mt-8 p-4 bg-maroon/5 border border-maroon/10 rounded-xl animate-fade-in">
                                            <p className="text-maroon text-sm font-bold flex items-center gap-2">
                                                <i className="fas fa-info-circle"></i>
                                                A specific {selectedType} will be automatically assigned for your trip on {formData.date}.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={nextStep} 
                                    disabled={!selectedType} 
                                    className={`px-10 py-4 rounded-xl font-black text-white transition-all shadow-xl hover:scale-105 active:scale-95 ${selectedType ? 'bg-maroon' : 'bg-slate-300 cursor-not-allowed'}`}
                                >
                                    Proceed to Details <i className="fas fa-arrow-right ml-2 text-yellow-500"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Trip Details */}
                    {currentStep === 2 && !successMessage && (
                        <div className="section animation-fade-in">
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white mb-6 shadow-lg">
                                <h2 className="text-2xl font-bold mb-1">Trip Logistics</h2>
                                <p className="text-emerald-100 text-sm">Booking a <span className="font-bold text-yellow-400">{selectedType}</span> for {formData.date}</p>
                            </div>
                            <div className="bg-white rounded-xl p-2 md:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Start Place</label>
                                        <input type="text" name="start_place" value={formData.start_place} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon" placeholder="e.g. Faculty Main Entrance" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Destinations</label>
                                        {formData.destinations.map((dest, index) => (
                                            <div key={index} className="flex items-center mb-2 gap-2">
                                                <div className="flex-1">
                                                    <input type="text" value={dest} onChange={(e) => handleDestinationChange(index, e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon" placeholder={`Destination ${index + 1}`} />
                                                </div>
                                                {index > 0 && (
                                                    <button type="button" onClick={() => removeDestination(index)} className="p-3 text-red-500 hover:text-red-700 bg-red-50 rounded-lg">
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                )}
                                                {index === formData.destinations.length - 1 && (
                                                    <button type="button" onClick={addDestination} className="p-3 text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg whitespace-nowrap">
                                                        <i className="fas fa-plus mr-1"></i> Add
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Estimated Distance (km)</label>
                                        <input type="number" name="distance" value={formData.distance} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon" />
                                        {distanceWarning && <p className="text-amber-600 text-[10px] font-bold mt-1 uppercase"><i className="fas fa-exclamation-triangle"></i> &gt;100km requires Registrar authorization.</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Preferred Time</label>
                                        <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Return Date</label>
                                        <input type="date" name="returnDate" value={formData.returnDate} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Return Time</label>
                                        <input type="time" name="returnTime" value={formData.returnTime} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">No. of Passengers</label>
                                        <input type="number" name="passengers" value={formData.passengers} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Emergency Contact</label>
                                        <input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Purpose of Visit</label>
                                        <textarea name="purpose" value={formData.purpose} onChange={handleInputChange} rows="2" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-maroon"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 uppercase mb-2">Supportive Document (Optional)</label>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center justify-center px-6 py-3 bg-slate-100 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-200 transition font-bold text-sm">
                                                <i className="fas fa-paperclip mr-2"></i> Choose File
                                                <input type="file" name="attachment" className="hidden" onChange={handleInputChange} />
                                            </label>
                                            <span className="text-xs text-slate-500 font-bold">
                                                {formData.attachment ? formData.attachment.name : 'No file chosen...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 flex justify-between border-t border-slate-100 pt-6">
                                    <button onClick={prevStep} className="px-8 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition">Previous</button>
                                    <button onClick={nextStep} className="px-10 py-3 bg-maroon hover:bg-red-900 text-white rounded-xl font-black shadow-xl">Next Step <i className="fas fa-arrow-right ml-2"></i></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && !successMessage && (
                        <div className="section animation-fade-in">
                            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-lg p-6 text-white mb-6 shadow-lg">
                                <h2 className="text-2xl font-bold mb-1">Final Submission</h2>
                                <p className="text-purple-100 text-sm">Review your transportation request for {selectedType} Category</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fas fa-info-circle text-purple-600"></i> Request Information
                                    </h3>
                                    <div className="space-y-4 text-sm font-medium">
                                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Vehicle Type:</span> <span className="font-bold text-maroon uppercase">{selectedType}</span></div>
                                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Departure:</span> <span className="font-bold text-slate-800">{formData.date} at {formData.time}</span></div>
                                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Returning:</span> <span className="font-bold text-slate-800">{formData.returnDate} at {formData.returnTime}</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fas fa-route text-purple-600"></i> Route Information
                                    </h3>
                                    <div className="space-y-4 text-sm font-medium">
                                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Start:</span> <span className="font-bold text-slate-800">{formData.start_place}</span></div>
                                        <div className="flex flex-col gap-2 border-b border-slate-200 pb-2">
                                            <span className="text-slate-500">Destinations:</span>
                                            <span className="font-bold text-slate-800">{formData.destinations.filter(d => String(d).trim() !== '').join(' ➔ ')}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Distance:</span> <span className="font-bold text-slate-800">{formData.distance} km total</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-6 border-t border-slate-100">
                                <button onClick={prevStep} className="px-8 py-4 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition">Previous</button>
                                <button onClick={submitReservation} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-xl transform hover:scale-105 active:scale-95 transition-all">
                                    <i className="fas fa-check-circle mr-2"></i> Confirm Booking Request
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleReservation;
