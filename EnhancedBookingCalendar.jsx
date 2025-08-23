// Enhanced React component for appointment booking with 25-slot capacity management
// This replaces the previous BookingCalendar component with capacity validation

import React, { useState, useEffect, useCallback } from 'react';
import { 
    checkSlotAvailability, 
    checkBulkAvailability,
    bookAppointment, 
    handleBookingError, 
    CapacityUtils,
    CapacityStyles 
} from './frontend-capacity-utils.js';

const EnhancedBookingCalendar = ({ hospital = 'Gomoti Hospital', onBookingSuccess, onBookingError }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(false);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [patientInfo, setPatientInfo] = useState({
        patient_name: '',
        patientEmail: '',
        patientPhone: '',
        problemDescription: ''
    });

    // Hospital schedule configuration
    const hospitalSchedules = {
        'Gomoti Hospital': {
            days: ['Monday', 'Wednesday', 'Thursday', 'Saturday'],
            times: [
                '05:00 PM - 06:00 PM',
                '06:00 PM - 07:00 PM',
                '07:00 PM - 08:00 PM',
                '08:00 PM - 09:00 PM',
                '09:00 PM - 10:00 PM'
            ]
        },
        'Moon Hospital': {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
            times: [
                '03:00 PM - 04:00 PM',
                '04:00 PM - 05:00 PM'
            ]
        },
        'Al-Sefa Hospital': {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            times: [
                '09:00 AM - 10:00 AM',
                '10:00 AM - 11:00 AM',
                '11:00 AM - 12:00 PM'
            ]
        }
    };

    // Get hospital ID for API calls
    const getHospitalId = (hospitalName) => {
        const idMap = {
            'Gomoti Hospital': 'gomoti',
            'Moon Hospital': 'moon',
            'Al-Sefa Hospital': 'alsefa'
        };
        return idMap[hospitalName] || 'gomoti';
    };

    // Check if date is valid for hospital
    const isDateAvailable = (date) => {
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        const schedule = hospitalSchedules[hospital];
        return schedule?.days.includes(dayName) || false;
    };

    // Fetch availability for all time slots on selected date
    const fetchAvailabilityForDate = useCallback(async (date) => {
        if (!date || !isDateAvailable(date)) return;

        setLoading(true);
        const hospitalId = getHospitalId(hospital);
        const schedule = hospitalSchedules[hospital];
        
        const dateTimeSlots = schedule.times.map(time => ({ date, time }));
        
        try {
            const result = await checkBulkAvailability(hospitalId, dateTimeSlots);
            
            const availabilityMap = {};
            result.slots.forEach(slot => {
                availabilityMap[slot.time] = slot;
            });
            
            setAvailability(availabilityMap);
        } catch (error) {
            console.error('Error fetching availability:', error);
            setAvailability({});
        } finally {
            setLoading(false);
        }
    }, [hospital]);

    // Effect to fetch availability when date changes
    useEffect(() => {
        if (selectedDate) {
            fetchAvailabilityForDate(selectedDate);
        }
    }, [selectedDate, fetchAvailabilityForDate]);

    // Handle appointment booking
    const handleBookAppointment = async () => {
        if (!selectedDate || !selectedTime || !patientInfo.patient_name || !patientInfo.patientEmail) {
            alert('Please fill in all required fields');
            return;
        }

        setBookingInProgress(true);

        const appointmentData = {
            ...patientInfo,
            hospital,
            appointment_date: selectedDate,
            appointment_time: selectedTime,
            doctor_name: 'Dr. Helal',
            created_at: new Date().toISOString()
        };

        try {
            const result = await bookAppointment(appointmentData);

            if (result.success) {
                // Success - show confirmation
                const successMessage = `Appointment booked successfully!\n\nReference: ${result.appointment.reference_number}\nHospital: ${result.slot_info.hospital}\nDate: ${result.slot_info.date}\nTime: ${result.slot_info.time}\nRemaining slots: ${result.slot_info.remaining_slots}/${result.slot_info.max_capacity}`;
                
                alert(successMessage);
                
                // Clear form
                setPatientInfo({
                    patient_name: '',
                    patientEmail: '',
                    patientPhone: '',
                    problemDescription: ''
                });
                setSelectedTime('');
                
                // Refresh availability
                await fetchAvailabilityForDate(selectedDate);
                
                // Call success callback
                if (onBookingSuccess) {
                    onBookingSuccess(result);
                }
            } else {
                // Handle booking error
                const errorInfo = handleBookingError(result);
                alert(`${errorInfo.title}\n\n${errorInfo.message}`);
                
                if (errorInfo.action === 'select_different_slot') {
                    setSelectedTime('');
                    await fetchAvailabilityForDate(selectedDate); // Refresh availability
                }
                
                // Call error callback
                if (onBookingError) {
                    onBookingError(result, errorInfo);
                }
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setBookingInProgress(false);
        }
    };

    // Render time slot button
    const renderTimeSlot = (time) => {
        const slotAvailability = availability[time];
        const isLoading = loading || !slotAvailability;
        const isSelected = selectedTime === time;
        const isDisabled = slotAvailability ? CapacityUtils.shouldDisableSlot(slotAvailability) : false;
        const warning = slotAvailability ? CapacityUtils.getNearlyFullWarning(slotAvailability) : null;
        
        let buttonClass = 'px-4 py-2 m-1 rounded border transition-all duration-200 ';
        
        if (isLoading) {
            buttonClass += 'bg-gray-100 border-gray-300 text-gray-500 cursor-wait';
        } else if (isDisabled) {
            buttonClass += CapacityStyles.full;
        } else if (isSelected) {
            buttonClass += 'bg-blue-500 border-blue-500 text-white';
        } else if (slotAvailability?.available_slots <= 5) {
            buttonClass += CapacityStyles.nearly_full + ' hover:bg-orange-200';
        } else {
            buttonClass += CapacityStyles.available + ' hover:bg-green-200';
        }

        return (
            <div key={time} className="mb-2">
                <button
                    onClick={() => !isDisabled && !isLoading && setSelectedTime(time)}
                    disabled={isDisabled || isLoading || bookingInProgress}
                    className={buttonClass}
                >
                    <div className="flex items-center justify-between">
                        <span>{time}</span>
                        {slotAvailability && (
                            <span className="ml-2 text-sm">
                                {CapacityUtils.getStatusEmoji(slotAvailability)}
                                {slotAvailability.available_slots}/{slotAvailability.max_capacity}
                            </span>
                        )}
                        {isLoading && <span className="ml-2">⏳</span>}
                    </div>
                    {isDisabled && (
                        <div className="text-xs mt-1">Slot Full</div>
                    )}
                </button>
                {warning && (
                    <div className="text-orange-600 text-xs mt-1 ml-2">
                        {warning}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">
                Book Appointment - {hospital}
            </h2>

            {/* Date Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime(''); // Reset time selection
                    }}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedDate && !isDateAvailable(selectedDate) && (
                    <p className="text-red-500 text-sm mt-1">
                        {hospital} is closed on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}s
                    </p>
                )}
            </div>

            {/* Time Slot Selection */}
            {selectedDate && isDateAvailable(selectedDate) && (
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Select Time Slot 
                        <span className="text-gray-500 text-xs ml-2">
                            (25 patients per slot)
                        </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {hospitalSchedules[hospital].times.map(renderTimeSlot)}
                    </div>
                    
                    {loading && (
                        <div className="text-center text-gray-500 mt-4">
                            Loading availability...
                        </div>
                    )}
                </div>
            )}

            {/* Patient Information Form */}
            {selectedTime && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Patient Name *</label>
                            <input
                                type="text"
                                value={patientInfo.patient_name}
                                onChange={(e) => setPatientInfo({...patientInfo, patient_name: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter patient name"
                                disabled={bookingInProgress}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Email *</label>
                            <input
                                type="email"
                                value={patientInfo.patientEmail}
                                onChange={(e) => setPatientInfo({...patientInfo, patientEmail: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter email address"
                                disabled={bookingInProgress}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                type="tel"
                                value={patientInfo.patientPhone}
                                onChange={(e) => setPatientInfo({...patientInfo, patientPhone: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter phone number"
                                disabled={bookingInProgress}
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Problem Description</label>
                            <textarea
                                value={patientInfo.problemDescription}
                                onChange={(e) => setPatientInfo({...patientInfo, problemDescription: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="Describe your health concern (optional)"
                                disabled={bookingInProgress}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Button */}
            {selectedTime && (
                <div className="text-center">
                    <button
                        onClick={handleBookAppointment}
                        disabled={bookingInProgress || !patientInfo.patient_name || !patientInfo.patientEmail}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                            bookingInProgress || !patientInfo.patient_name || !patientInfo.patientEmail
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                        {bookingInProgress ? 'Booking...' : 'Book Appointment'}
                    </button>
                    
                    <div className="mt-4 text-sm text-gray-600">
                        <p><strong>Selected:</strong> {hospital}</p>
                        <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {selectedTime}</p>
                        {availability[selectedTime] && (
                            <p className="mt-2">
                                <strong>Availability:</strong> {' '}
                                <span className={CapacityStyles.capacity_text.available}>
                                    {availability[selectedTime].available_slots} of {availability[selectedTime].max_capacity} slots remaining
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Capacity Legend */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Availability Legend:</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                        <span className="mr-1">🟢</span>
                        <span>Available (6+ slots)</span>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-1">🟡</span>
                        <span>Nearly Full (1-5 slots)</span>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-1">🔴</span>
                        <span>Fully Booked</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Each time slot accommodates up to 25 patients. Book early to secure your preferred time!
                </p>
            </div>
        </div>
    );
};

export default EnhancedBookingCalendar;
