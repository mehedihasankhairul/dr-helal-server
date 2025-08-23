// Enhanced client-side utilities with hospital schedule caching
// This replaces the previous client-side slot generator with database-driven approach

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Cache configuration
const CACHE_KEYS = {
    HOSPITAL_SCHEDULES: 'hospital_schedules',
    AVAILABILITY_DATA: 'availability_data'
};

const CACHE_DURATION = {
    SCHEDULES: 24 * 60 * 60 * 1000, // 24 hours
    AVAILABILITY: 5 * 60 * 1000      // 5 minutes
};

/**
 * Hospital Schedule Cache Manager
 */
class HospitalScheduleCache {
    constructor() {
        this.schedules = null;
        this.lastFetched = null;
        this.availabilityCache = new Map();
    }

    // Check if schedules cache is valid
    isCacheValid() {
        if (!this.schedules || !this.lastFetched) return false;
        return (Date.now() - this.lastFetched) < CACHE_DURATION.SCHEDULES;
    }

    // Fetch hospital schedules from API and cache them
    async fetchAndCacheSchedules() {
        try {
            console.log('🏥 Fetching hospital schedules from database...');
            
            const response = await fetch(`${API_BASE_URL}/hospital-schedules`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success && data.schedules) {
                this.schedules = data.schedules;
                this.lastFetched = Date.now();
                
                // Store in localStorage for persistence
                localStorage.setItem(CACHE_KEYS.HOSPITAL_SCHEDULES, JSON.stringify({
                    schedules: this.schedules,
                    timestamp: this.lastFetched
                }));
                
                console.log(`✅ Cached ${data.schedules.length} hospital schedules`);
                return this.schedules;
            } else {
                throw new Error('Invalid response format from hospital schedules API');
            }
            
        } catch (error) {
            console.error('❌ Error fetching hospital schedules:', error);
            
            // Try to load from localStorage as fallback
            const cached = this.loadFromLocalStorage();
            if (cached) {
                console.log('📦 Using cached schedules from localStorage');
                return cached;
            }
            
            // Return fallback schedules if API fails
            return this.getFallbackSchedules();
        }
    }

    // Load schedules from localStorage
    loadFromLocalStorage() {
        try {
            const cached = localStorage.getItem(CACHE_KEYS.HOSPITAL_SCHEDULES);
            if (cached) {
                const data = JSON.parse(cached);
                
                // Check if cache is still valid
                if ((Date.now() - data.timestamp) < CACHE_DURATION.SCHEDULES) {
                    this.schedules = data.schedules;
                    this.lastFetched = data.timestamp;
                    return this.schedules;
                }
            }
        } catch (error) {
            console.error('❌ Error loading schedules from localStorage:', error);
        }
        return null;
    }

    // Get hospital schedules (with caching)
    async getSchedules() {
        // Try to use cached data first
        if (this.isCacheValid()) {
            return this.schedules;
        }

        // Try to load from localStorage
        const cached = this.loadFromLocalStorage();
        if (cached) {
            return cached;
        }

        // Fetch fresh data from API
        return await this.fetchAndCacheSchedules();
    }

    // Get specific hospital schedule
    async getHospitalSchedule(hospitalId) {
        const schedules = await this.getSchedules();
        return schedules.find(schedule => schedule.hospital_id === hospitalId);
    }

    // Get available days for a hospital
    async getHospitalDays(hospitalId) {
        const schedule = await this.getHospitalSchedule(hospitalId);
        if (!schedule) return [];

        const days = Object.keys(schedule.schedule).map(dayNumber => {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayNum = parseInt(dayNumber);
            
            return {
                day_number: dayNum,
                day_name: dayNames[dayNum],
                slots: schedule.schedule[dayNumber].slots,
                slot_count: schedule.schedule[dayNumber].slots.length
            };
        });

        return days.sort((a, b) => a.day_number - b.day_number);
    }

    // Get time slots for a specific hospital and day
    async getHospitalSlots(hospitalId, dayNumber) {
        const schedule = await this.getHospitalSchedule(hospitalId);
        if (!schedule || !schedule.schedule[dayNumber]) {
            return null;
        }

        const daySchedule = schedule.schedule[dayNumber];
        return {
            hospital_id: hospitalId,
            hospital_name: schedule.hospital_name,
            day_number: parseInt(dayNumber),
            day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(dayNumber)],
            slots: daySchedule.slots,
            slot_count: daySchedule.slots.length,
            max_appointments_per_slot: schedule.max_appointments_per_slot
        };
    }

    // Check if hospital is open on specific date
    async isHospitalOpen(hospitalId, date) {
        const dayNumber = new Date(date).getDay();
        const schedule = await this.getHospitalSchedule(hospitalId);
        return schedule && schedule.schedule[dayNumber] !== undefined;
    }

    // Get slots for a specific date
    async getSlotsForDate(hospitalId, date) {
        const dayNumber = new Date(date).getDay();
        const isOpen = await this.isHospitalOpen(hospitalId, date);
        
        if (!isOpen) {
            return {
                hospital_id: hospitalId,
                date: date,
                is_open: false,
                reason: 'Hospital is closed on this day',
                slots: []
            };
        }

        const slotsData = await this.getHospitalSlots(hospitalId, dayNumber);
        return {
            hospital_id: hospitalId,
            hospital_name: slotsData.hospital_name,
            date: date,
            is_open: true,
            day_name: slotsData.day_name,
            slots: slotsData.slots,
            max_appointments_per_slot: slotsData.max_appointments_per_slot
        };
    }

    // Fallback schedules (in case API is down)
    getFallbackSchedules() {
        console.log('📋 Using fallback hospital schedules');
        return [
            {
                id: 'fallback-gomoti',
                hospital_id: 'gomoti',
                hospital_name: 'Gomoti Hospital',
                schedule: {
                    1: { slots: ['05:00 PM - 06:00 PM', '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM', '09:00 PM - 10:00 PM'] },
                    3: { slots: ['05:00 PM - 06:00 PM', '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM', '09:00 PM - 10:00 PM'] },
                    4: { slots: ['04:00 PM - 05:00 PM', '05:00 PM - 06:00 PM', '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM', '09:00 PM - 10:00 PM'] },
                    6: { slots: ['05:00 PM - 06:00 PM', '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM', '09:00 PM - 10:00 PM'] }
                },
                max_appointments_per_slot: 25,
                advance_booking_days: 60,
                doctor_name: 'Dr. Helal'
            },
            {
                id: 'fallback-moon',
                hospital_id: 'moon',
                hospital_name: 'Moon Hospital',
                schedule: {
                    0: { slots: ['03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM'] },
                    1: { slots: ['03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM'] },
                    2: { slots: ['03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM'] },
                    3: { slots: ['03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM'] },
                    4: { slots: ['03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM'] },
                    6: { slots: ['03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM'] }
                },
                max_appointments_per_slot: 25,
                advance_booking_days: 60,
                doctor_name: 'Dr. Helal'
            },
            {
                id: 'fallback-alsefa',
                hospital_id: 'alsefa',
                hospital_name: 'Al-Sefa Hospital',
                schedule: {
                    0: { slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'] },
                    1: { slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'] },
                    2: { slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'] },
                    3: { slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'] },
                    4: { slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'] },
                    6: { slots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'] }
                },
                max_appointments_per_slot: 25,
                advance_booking_days: 60,
                doctor_name: 'Dr. Helal'
            }
        ];
    }

    // Clear cache (useful for debugging or forcing refresh)
    clearCache() {
        this.schedules = null;
        this.lastFetched = null;
        this.availabilityCache.clear();
        localStorage.removeItem(CACHE_KEYS.HOSPITAL_SCHEDULES);
        console.log('🧹 Hospital schedule cache cleared');
    }

    // Get cache info for debugging
    getCacheInfo() {
        return {
            has_schedules: !!this.schedules,
            last_fetched: this.lastFetched ? new Date(this.lastFetched) : null,
            cache_valid: this.isCacheValid(),
            schedule_count: this.schedules ? this.schedules.length : 0,
            availability_cache_size: this.availabilityCache.size
        };
    }
}

// Create global instance
const scheduleCache = new HospitalScheduleCache();

/**
 * Enhanced availability checking with database-driven schedules
 */
export async function checkSlotAvailability(hospitalId, date, time) {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/availability/${hospitalId}/${date}/${encodeURIComponent(time)}`);
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
 * Enhanced bulk availability checking
 */
export async function checkBulkAvailability(hospitalId, dateTimeSlots) {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/availability/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
 * Book appointment with enhanced validation
 */
export async function bookAppointment(appointmentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
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
 * Public API functions that use the cache
 */

// Get all hospital schedules
export async function getHospitalSchedules() {
    return await scheduleCache.getSchedules();
}

// Get specific hospital schedule
export async function getHospitalSchedule(hospitalId) {
    return await scheduleCache.getHospitalSchedule(hospitalId);
}

// Get available days for hospital
export async function getHospitalDays(hospitalId) {
    return await scheduleCache.getHospitalDays(hospitalId);
}

// Get slots for specific date
export async function getSlotsForDate(hospitalId, date) {
    return await scheduleCache.getSlotsForDate(hospitalId, date);
}

// Check if hospital is open on date
export async function isHospitalOpen(hospitalId, date) {
    return await scheduleCache.isHospitalOpen(hospitalId, date);
}

// Utility functions for React components
export const EnhancedCapacityUtils = {
    // Format capacity display
    formatCapacityInfo: (availabilityData) => {
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
    },

    // Get status emoji
    getStatusEmoji: (availabilityData) => {
        if (availabilityData.available_slots === 0) return '🔴';
        if (availabilityData.available_slots <= 5) return '🟡';
        return '🟢';
    },

    // Check if slot should be disabled
    shouldDisableSlot: (availabilityData) => {
        return availabilityData.available_slots === 0;
    },

    // Get cache information
    getCacheInfo: () => {
        return scheduleCache.getCacheInfo();
    },

    // Clear cache
    clearCache: () => {
        scheduleCache.clearCache();
    },

    // Pre-load schedules (call this on app init)
    preloadSchedules: async () => {
        console.log('🚀 Pre-loading hospital schedules...');
        const schedules = await scheduleCache.getSchedules();
        console.log(`✅ Pre-loaded ${schedules.length} hospital schedules`);
        return schedules;
    }
};

// Error handling utility (unchanged)
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

// CSS styles (unchanged)
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

export default {
    getHospitalSchedules,
    getHospitalSchedule, 
    getHospitalDays,
    getSlotsForDate,
    isHospitalOpen,
    checkSlotAvailability,
    checkBulkAvailability,
    bookAppointment,
    handleBookingError,
    EnhancedCapacityUtils,
    CapacityStyles
};
