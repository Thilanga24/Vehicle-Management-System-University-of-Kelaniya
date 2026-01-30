import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

const VehicleReservation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [formData, setFormData] = useState({
        destination: '',
        distance: '',
        date: '',
        time: '',
        returnDate: '',
        returnTime: '',
        passengers: '',
        emergency_contact: '',
        purpose: ''
    });

    const [distanceWarning, setDistanceWarning] = useState(false);
    const [capacityWarning, setCapacityWarning] = useState(false);

    useEffect(() => {
        if (location.state) {
            if (location.state.selectedVehicle) {
                setSelectedVehicle(location.state.selectedVehicle);
                setCurrentStep(2); // Auto-advance to details step
            }
            if (location.state.date) {
                setFormData(prev => ({ ...prev, date: location.state.date }));
            }
        }
    }, [location]);

    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/vehicles');
                const data = await response.json();
                if (response.ok) {
                    const mappedVehicles = data.map(v => ({
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
                } else {
                    console.error('Failed to fetch vehicles');
                }
            } catch (error) {
                console.error('Error loading vehicles:', error);
            }
        };

        fetchVehicles();
    }, []);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'distance') {
            setDistanceWarning(parseInt(value) > 100);
        }
        if (name === 'passengers' && selectedVehicle) {
            setCapacityWarning(parseInt(value) > selectedVehicle.seats);
        }
    };

    const validateStep1 = () => !!selectedVehicle;

    const validateStep2 = () => {
        const required = ['destination', 'distance', 'date', 'time', 'returnDate', 'returnTime', 'passengers', 'emergency_contact', 'purpose'];
        return required.every(field => formData[field] && formData[field].trim() !== '');
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!validateStep1()) return alert('Please select a vehicle.');
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
        if (t.includes('ambulance')) return 'fa-ambulance';
        if (t.includes('van')) return 'fa-shuttle-van';
        if (t.includes('car')) return 'fa-car';
        if (t.includes('cab')) return 'fa-taxi';
        if (t.includes('lorry')) return 'fa-truck';
        if (t.includes('three-wheeler')) return 'fa-motorcycle';
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

        const payload = {
            requesterId,
            vehicleId: selectedVehicle.id,
            destination: formData.destination,
            distance: formData.distance,
            passengers: formData.passengers,
            emergency_contact: formData.emergency_contact,
            date: formData.date,
            time: formData.time,
            returnDate: formData.returnDate,
            returnTime: formData.returnTime,
            purpose: formData.purpose
        };

        try {
            const response = await fetch('http://localhost:5000/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Reservation submitted successfully! Redirecting to dashboard...');
                setTimeout(() => navigate('/dashboard'), 3000);
            } else {
                alert(`Error: ${data.message || 'Failed to submit reservation'}`);
            }
        } catch (error) {
            console.error('Reservation Error:', error);
            alert('Server error. Please try again later.');
        }
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
                    <div className="menu-section-title">Steps</div>
                    <div className={`menu-item ${currentStep === 1 ? 'active' : ''}`} onClick={() => setCurrentStep(1)}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${currentStep >= 1 ? 'bg-yellow-500 text-white' : 'bg-slate-600 text-slate-300'}`}>1</div>
                        <span>Select Vehicle</span>
                    </div>
                    <div className={`menu-item ${currentStep === 2 ? 'active' : ''}`} onClick={() => { if (selectedVehicle) setCurrentStep(2) }}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${currentStep >= 2 ? 'bg-yellow-500 text-white' : 'bg-slate-600 text-slate-300'}`}>2</div>
                        <span>Trip Details</span>
                    </div>
                    <div className={`menu-item ${currentStep === 3 ? 'active' : ''}`} onClick={() => { if (selectedVehicle && validateStep2()) setCurrentStep(3) }}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${currentStep >= 3 ? 'bg-yellow-500 text-white' : 'bg-slate-600 text-slate-300'}`}>3</div>
                        <span>Review</span>
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
                        <h1>Vehicle Reservation <i className="fas fa-calendar-check text-yellow-500 ml-2"></i></h1>
                        <p>{currentStep === 1 ? 'Choose a vehicle' : currentStep === 2 ? 'Enter trip details' : 'Review and submit'}</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="user-profile">
                            <div className="user-avatar bg-blue-600">DS</div>
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    {successMessage && (
                        <div className="flex flex-col items-center justify-center p-12 bg-emerald-50 rounded-xl shadow-lg border border-emerald-100 text-center my-10 animate-fade-in-up">
                            <i className="fas fa-check-circle text-6xl text-emerald-500 mb-6 animate-bounce"></i>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Success!</h2>
                            <p className="text-lg text-slate-600 mb-6">{successMessage}</p>
                            <p className="text-sm text-slate-400 font-medium">Redirecting to Dashboard...</p>
                        </div>
                    )}
                    {/* Step 1: Vehicle Selection */}
                    {currentStep === 1 && !successMessage && (
                        <div className="section">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white mb-6 shadow-lg">
                                <h2 className="text-2xl font-bold mb-1">Available Vehicles</h2>
                                <p className="text-blue-100 text-sm">Select the vehicle that best suits your travel needs</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {vehicles.map(vehicle => (
                                    <div
                                        key={vehicle.id}
                                        className={`rounded-xl p-6 border transition cursor-pointer relative ${selectedVehicle?.id === vehicle.id
                                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                                            : 'bg-white border-slate-200 hover:shadow-lg'
                                            } ${vehicle.status !== 'available' ? 'opacity-60 pointer-events-none grayscale' : ''}`}
                                        onClick={() => vehicle.status === 'available' && setSelectedVehicle(vehicle)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                                                    <i className={`fas ${getVehicleIcon(vehicle.type)}`}></i>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{vehicle.model}</h3>
                                                    <p className="text-xs text-slate-500">{vehicle.type}</p>
                                                </div>
                                            </div>
                                            {vehicle.status === 'available' && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">Available</span>}
                                            {vehicle.status === 'booked' && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">Booked</span>}
                                            {vehicle.status === 'maintenance' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Maintenance</span>}
                                        </div>
                                        <div className="space-y-2 text-sm text-slate-600">
                                            <div className="flex justify-between"><span>Number:</span> <span className="font-medium text-slate-800">{vehicle.number}</span></div>
                                            <div className="flex justify-between"><span>Seats:</span> <span className="font-medium text-slate-800">{vehicle.seats}</span></div>
                                            <div className="flex justify-between"><span>Driver:</span> <span className="font-medium text-slate-800">{vehicle.driver}</span></div>
                                        </div>
                                        {selectedVehicle?.id === vehicle.id && (
                                            <div className="absolute top-4 right-4 text-blue-600">
                                                <i className="fas fa-check-circle text-xl"></i>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button onClick={nextStep} disabled={!selectedVehicle} className={`px-6 py-2 rounded-lg font-medium text-white transition ${selectedVehicle ? 'bg-maroon hover:bg-red-900' : 'bg-slate-300 cursor-not-allowed'}`}>
                                    Next Step <i className="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Trip Details */}
                    {currentStep === 2 && !successMessage && (
                        <div className="section">
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white mb-6 shadow-lg">
                                <h2 className="text-2xl font-bold mb-1">Trip Details</h2>
                                <p className="text-emerald-100 text-sm">Provide detailed information about your travel requirements</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                                        <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Peradeniya" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Distance (km)</label>
                                        <input type="number" name="distance" value={formData.distance} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                        {distanceWarning && <p className="text-amber-600 text-xs mt-1"><i className="fas fa-exclamation-triangle"></i> &gt;100km requires Registrar approval.</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Departure Date</label>
                                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                                        <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Return Date</label>
                                        <input type="date" name="returnDate" value={formData.returnDate} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Return Time</label>
                                        <input type="time" name="returnTime" value={formData.returnTime} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Passengers</label>
                                        <input type="number" name="passengers" value={formData.passengers} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                        {capacityWarning && <p className="text-red-600 text-xs mt-1"><i className="fas fa-exclamation-circle"></i> Exceeds vehicle capacity ({selectedVehicle?.seats}).</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                                        <input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                                        <textarea name="purpose" value={formData.purpose} onChange={handleInputChange} rows="2" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-between">
                                    <button onClick={prevStep} className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition">Previous</button>
                                    <button onClick={nextStep} className="px-6 py-2 bg-maroon hover:bg-red-900 text-white rounded-lg font-medium transition">Next Step <i className="fas fa-arrow-right ml-2"></i></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && !successMessage && (
                        <div className="section">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white mb-6 shadow-lg">
                                <h2 className="text-2xl font-bold mb-1">Review & Submit</h2>
                                <p className="text-purple-100 text-sm">Please review your request details before submission</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">Vehicle</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Model:</span> <span className="font-medium">{selectedVehicle?.model}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Number:</span> <span className="font-medium">{selectedVehicle?.number}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Driver:</span> <span className="font-medium">{selectedVehicle?.driver}</span></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">Trip</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Destination:</span> <span className="font-medium">{formData.destination}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Departs:</span> <span className="font-medium">{formData.date} {formData.time}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Return:</span> <span className="font-medium">{formData.returnDate} {formData.returnTime}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Distance:</span> <span className="font-medium">{formData.distance} km</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 mb-6">
                                <h3 className="font-bold text-lg text-slate-800 mb-4">Approval Chain</h3>
                                <div className="flex items-center text-sm text-slate-600">
                                    <div className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span> HOD</div>
                                    <i className="fas fa-chevron-right mx-4 text-slate-300"></i>
                                    <div className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span> Dean</div>
                                    {parseInt(formData.distance) > 100 && (
                                        <>
                                            <i className="fas fa-chevron-right mx-4 text-slate-300"></i>
                                            <div className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span> Registrar (Distance &gt;100km)</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={prevStep} className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition">Previous</button>
                                <button onClick={submitReservation} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition shadow-md">
                                    <i className="fas fa-check-circle mr-2"></i> Submit Request
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default VehicleReservation;
