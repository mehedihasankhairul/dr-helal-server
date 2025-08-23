// Frontend utilities for handling 25-slot capacity system
// This file provides JavaScript functions for React/vanilla JS frontend integration

// API endpoints for capacity checking
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Get capacity configuration from backend
 */
export async function getCapacityConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/capacity-config`);
        if (!response.ok) throw new Error('Failed to fetch capacity config');
        return await response.json();
    } catch (error) {
        console.error('Error fetching capacity config:', error);
        return {
            hospital_capacities: {
                'Gomoti Hospital': { maxPerSlot: 25, hospital_id: 'gomoti' },
                'Moon Hospital': { maxPerSlot: 25, hospital_id: 'moon' },
                'Al-Sefa Hospital': { maxPerSlot: 25, hospital_id: 'alsefa' }
            },
            default_capacity: 25
        };
    }
}

/**
 * Check availability for a specific slot
 * @param {string} hospitalId - Hospital ID (gomoti, moon, alsefa)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time slot (e.g., "05:00 PM - 06:00 PM")
 */
export async function checkSlotAvailability(hospitalId, date, time) {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/availability/${hospitalId}/${date}/${time}`);
        if (!response.ok) throw new Error('Failed to check availability');
        return await response.json();
    } catch (error) {
        console.error('Error checking slot availability:', error);
        return {
            hospital_id: hospitalId,
            date: date,
            time: time,
            max_capacity: 25,
            current_bookings: 0,
            available_slots: 25,
            is_available: true,
            status: 'available',
            error: error.message
        };
    }
}

/**
 * Check availability for multiple slots (bulk operation)
 * @param {string} hospitalId - Hospital ID
 * @param {Array} dateTimeSlots - Array of {date, time} objects
 */
export async function checkBulkAvailability(hospitalId, dateTimeSlots) {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/availability/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hospital_id: hospitalId,
                date_time_slots: dateTimeSlots
            })
        });
        
        if (!response.ok) throw new Error('Failed to check bulk availability');
        return await response.json();
    } catch (error) {
        console.error('Error checking bulk availability:', error);
        return {
            hospital_id: hospitalId,
            slots: dateTimeSlots.map(slot => ({
                date: slot.date,
                time: slot.time,
                max_capacity: 25,
                current_bookings: 0,
                available_slots: 25,
                is_available: true,
                status: 'available'
            })),
            error: error.message
        };
    }
}

/**
 * Book an appointment with capacity validation
 * @param {Object} appointmentData - Appointment details
 */
export async function bookAppointment(appointmentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            // Handle capacity-specific errors
            if (response.status === 409) {
                return {
                    success: false,
                    error: 'capacity_full',
                    message: result.error || 'Slot is fully booked',
                    details: result.details
                };
            }
            
            return {
                success: false,
                error: 'booking_failed',
                message: result.error || 'Failed to book appointment'
            };
        }
        
        return {
            success: true,
            appointment: result.appointment,
            slot_info: result.slot_info
        };
        
    } catch (error) {
        console.error('Error booking appointment:', error);
        return {
            success: false,
            error: 'network_error',
            message: 'Network error occurred. Please try again.'
        };
    }
}

/**
 * Format capacity information for display
 * @param {Object} availabilityData - Data from checkSlotAvailability
 */
export function formatCapacityInfo(availabilityData) {
    const { current_bookings, max_capacity, available_slots, status } = availabilityData;
    
    return {
        text: `${available_slots} of ${max_capacity} slots available`,
        percentage: ((current_bookings / max_capacity) * 100).toFixed(0),
        status_text: status === 'available' ? 'Available' : 'Full',
        is_nearly_full: available_slots <= 5 && available_slots > 0,
        is_full: available_slots === 0,
        color_class: available_slots === 0 ? 'text-red-500' : 
                    available_slots <= 5 ? 'text-orange-500' : 'text-green-500'
    };
}

/**
 * Handle booking errors with user-friendly messages
 * @param {Object} error - Error from bookAppointment
 */
export function handleBookingError(error) {
    switch (error.error) {
        case 'capacity_full':
            return {
                title: 'Slot Fully Booked',
                message: `This time slot is currently full (${error.details?.current_bookings || 25}/${error.details?.max_capacity || 25} appointments). Please select a different time slot.`,
                type: 'warning',
                action: 'select_different_slot'
            };
            
        case 'booking_failed':
            return {
                title: 'Booking Failed',
                message: error.message || 'Unable to process your booking request.',
                type: 'error',
                action: 'retry'
            };
            
        case 'network_error':
            return {
                title: 'Connection Error',
                message: 'Unable to connect to the server. Please check your internet connection and try again.',
                type: 'error',
                action: 'retry'
            };
            
        default:
            return {
                title: 'Unexpected Error',
                message: 'An unexpected error occurred. Please try again.',
                type: 'error',
                action: 'retry'
            };
    }
}

/**
 * Utility functions for React components
 */
export const CapacityUtils = {
    // Format slot display text
    formatSlotDisplay: (availabilityData) => {
        const info = formatCapacityInfo(availabilityData);
        return `${info.text} (${info.status_text})`;
    },
    
    // Get status indicator emoji
    getStatusEmoji: (availabilityData) => {
        if (availabilityData.available_slots === 0) return '🔴';
        if (availabilityData.available_slots <= 5) return '🟡';
        return '🟢';
    },
    
    // Check if slot should be disabled
    shouldDisableSlot: (availabilityData) => {
        return availabilityData.available_slots === 0;
    },
    
    // Get warning message for nearly full slots
    getNearlyFullWarning: (availabilityData) => {
        if (availabilityData.available_slots <= 5 && availabilityData.available_slots > 0) {
            return `⚠️ Only ${availabilityData.available_slots} slots remaining!`;
        }
        return null;
    }
};

// CSS classes for styling (Tailwind CSS compatible)
export const CapacityStyles = {
    available: 'bg-green-100 border-green-300 text-green-800',
    nearly_full: 'bg-orange-100 border-orange-300 text-orange-800',
    full: 'bg-red-100 border-red-300 text-red-800 opacity-50 cursor-not-allowed',
    capacity_text: {
        available: 'text-green-600',
        nearly_full: 'text-orange-600',
        full: 'text-red-600'
    }
};

// Example usage in React component:
/*
import { checkSlotAvailability, bookAppointment, handleBookingError, CapacityUtils } from './frontend-capacity-utils.js';

function AppointmentSlot({ hospital, date, time }) {
    const [availability, setAvailability] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchAvailability = async () => {
            const result = await checkSlotAvailability(hospital, date, time);
            setAvailability(result);
            setLoading(false);
        };
        
        fetchAvailability();
    }, [hospital, date, time]);
    
    const handleBooking = async () => {
        const result = await bookAppointment({
            hospital,
            appointment_date: date,
            appointment_time: time,
            // ... other appointment data
        });
        
        if (!result.success) {
            const errorInfo = handleBookingError(result);
            alert(`${errorInfo.title}: ${errorInfo.message}`);
        } else {
            alert('Appointment booked successfully!');
        }
    };
    
    if (loading) return <div>Loading...</div>;
    
    const isDisabled = CapacityUtils.shouldDisableSlot(availability);
    const warning = CapacityUtils.getNearlyFullWarning(availability);
    
    return (
        <div className={`slot ${isDisabled ? 'opacity-50' : ''}`}>
            <div>{time}</div>
            <div>{CapacityUtils.getStatusEmoji(availability)} {CapacityUtils.formatSlotDisplay(availability)}</div>
            {warning && <div className="text-orange-600 text-sm">{warning}</div>}
            <button 
                onClick={handleBooking} 
                disabled={isDisabled}
                className={`btn ${isDisabled ? 'btn-disabled' : 'btn-primary'}`}
            >
                {isDisabled ? 'Slot Full' : 'Book Appointment'}
            </button>
        </div>
    );
}
*/
