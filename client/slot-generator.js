/**
 * CLIENT-SIDE SLOT GENERATOR
 * 
 * Ultra-fast slot generation that runs entirely on the client.
 * Only communicates with server for:
 * 1. Getting current availability 
 * 2. Validating appointments before booking
 * 3. Creating appointments
 */

// Hospital schedule configuration (embed in your client app)
const HOSPITAL_SCHEDULES = {
  gomoti: {
    id: "gomoti",
    name: "Gomoti Hospital",
    schedule: {
      // Days: 0=Sunday, 1=Monday, ..., 6=Saturday
      1: { // Monday: 5:00 PM - 10:00 PM
        name: "Monday",
        timeRange: "05:00 PM - 10:00 PM",
        slots: [
          { id: "mon-1", start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { id: "mon-2", start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { id: "mon-3", start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { id: "mon-4", start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { id: "mon-5", start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      3: { // Wednesday: 5:00 PM - 10:00 PM
        name: "Wednesday", 
        timeRange: "05:00 PM - 10:00 PM",
        slots: [
          { id: "wed-1", start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { id: "wed-2", start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { id: "wed-3", start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { id: "wed-4", start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { id: "wed-5", start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      4: { // Thursday: 4:00 PM - 10:00 PM
        name: "Thursday",
        timeRange: "04:00 PM - 10:00 PM", 
        slots: [
          { id: "thu-1", start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" },
          { id: "thu-2", start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { id: "thu-3", start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { id: "thu-4", start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { id: "thu-5", start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { id: "thu-6", start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      6: { // Saturday: 5:00 PM - 10:00 PM
        name: "Saturday",
        timeRange: "05:00 PM - 10:00 PM",
        slots: [
          { id: "sat-1", start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { id: "sat-2", start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { id: "sat-3", start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { id: "sat-4", start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { id: "sat-5", start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      }
      // Friday (5) intentionally missing = CLOSED
    },
    maxPerSlot: 15,
    advanceBookingDays: 60,
    doctorName: "Dr. Helal"
  },
  moon: {
    id: "moon",
    name: "Moon Hospital",
    schedule: {
      // Days: 0=Sunday, 1=Monday, ..., 6=Saturday (all except Friday)
      0: { // Sunday: 3:00 PM - 5:00 PM
        name: "Sunday",
        timeRange: "03:00 PM - 05:00 PM",
        slots: [
          { id: "sun-1", start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
          { id: "sun-2", start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" }
        ]
      },
      1: { // Monday: 3:00 PM - 5:00 PM
        name: "Monday",
        timeRange: "03:00 PM - 05:00 PM",
        slots: [
          { id: "mon-1", start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
          { id: "mon-2", start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" }
        ]
      },
      2: { // Tuesday: 3:00 PM - 5:00 PM
        name: "Tuesday",
        timeRange: "03:00 PM - 05:00 PM",
        slots: [
          { id: "tue-1", start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
          { id: "tue-2", start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" }
        ]
      },
      3: { // Wednesday: 3:00 PM - 5:00 PM
        name: "Wednesday",
        timeRange: "03:00 PM - 05:00 PM",
        slots: [
          { id: "wed-1", start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
          { id: "wed-2", start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" }
        ]
      },
      4: { // Thursday: 3:00 PM - 5:00 PM
        name: "Thursday",
        timeRange: "03:00 PM - 05:00 PM",
        slots: [
          { id: "thu-1", start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
          { id: "thu-2", start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" }
        ]
      },
      6: { // Saturday: 3:00 PM - 5:00 PM
        name: "Saturday",
        timeRange: "03:00 PM - 05:00 PM",
        slots: [
          { id: "sat-1", start: "15:00", end: "16:00", display: "03:00 PM - 04:00 PM" },
          { id: "sat-2", start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" }
        ]
      }
      // Friday (5) intentionally missing = CLOSED
    },
    maxPerSlot: 20,
    advanceBookingDays: 60,
    doctorName: "Dr. Helal"
  }
  // Add more hospitals here as needed
};

/**
 * CLIENT-SIDE SLOT GENERATOR CLASS
 */
class ClientSlotGenerator {
  constructor(apiBaseUrl = '/api') {
    this.schedules = HOSPITAL_SCHEDULES;
    this.apiBaseUrl = apiBaseUrl;
    this.availabilityCache = new Map();
    this.cacheTimeouts = new Map();
  }

  /**
   * Generate slots for a specific date (INSTANT - runs on client)
   */
  generateSlots(hospitalId, dateString) {
    const hospital = this.schedules[hospitalId];
    if (!hospital) {
      return { 
        success: false, 
        error: 'Hospital not found',
        availableSlots: []
      };
    }

    // Parse date consistently - avoid timezone issues
    const date = new Date(dateString.replace(/-/g, '/'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (date < today) {
      return {
        success: false,
        error: 'Cannot book appointments for past dates',
        availableSlots: []
      };
    }

    // Check if date is too far in advance
    const maxAdvanceDate = new Date(today);
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + hospital.advanceBookingDays);
    if (date > maxAdvanceDate) {
      return {
        success: false,
        error: `Cannot book more than ${hospital.advanceBookingDays} days in advance`,
        availableSlots: []
      };
    }

    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
    const daySchedule = hospital.schedule[dayOfWeek];

    // Check if hospital is closed on this day
    if (!daySchedule) {
      const dayName = this.getDayName(dayOfWeek);
      const message = dayOfWeek === 5 
        ? 'Hospital is closed on Fridays' 
        : `Hospital is closed on ${dayName}s`;
      
      return {
        success: true,
        hospitalId: hospitalId,
        hospitalName: hospital.name,
        date: dateString,
        dayOfWeek: dayName,
        isClosed: true,
        message: message,
        availableSlots: []
      };
    }

    // Generate slots for this day
    const slots = daySchedule.slots.map(slot => ({
      id: slot.id,
      timeSlot: slot.display,
      startTime: slot.start,
      endTime: slot.end,
      maxAppointments: hospital.maxPerSlot,
      currentAppointments: 0, // Will be updated from server
      availableSpots: hospital.maxPerSlot,
      isAvailable: true,
      needsAvailabilityCheck: true
    }));

    return {
      success: true,
      hospitalId: hospitalId,
      hospitalName: hospital.name,
      doctorName: hospital.doctorName,
      date: dateString,
      dayOfWeek: daySchedule.name,
      timeRange: daySchedule.timeRange,
      isClosed: false,
      availableSlots: slots,
      totalSlots: slots.length,
      totalCapacity: slots.length * hospital.maxPerSlot,
      needsAvailabilityCheck: true
    };
  }

  /**
   * Generate calendar view for multiple days (INSTANT)
   */
  generateCalendar(hospitalId, startDate, numberOfDays = 30) {
    const hospital = this.schedules[hospitalId];
    if (!hospital) {
      return { success: false, error: 'Hospital not found' };
    }

    const calendar = [];
    const start = new Date(startDate.replace(/-/g, '/'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < numberOfDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      const dateString = this.formatDate(currentDate);
      const dayOfWeek = currentDate.getDay();
      const daySchedule = hospital.schedule[dayOfWeek];
      const dayName = this.getDayName(dayOfWeek);
      
      let status = 'available';
      let slotsCount = 0;
      let totalCapacity = 0;

      if (currentDate < today) {
        status = 'past';
      } else if (!daySchedule) {
        status = dayOfWeek === 5 ? 'closed-friday' : 'closed';
      } else {
        slotsCount = daySchedule.slots.length;
        totalCapacity = slotsCount * hospital.maxPerSlot;
      }

      calendar.push({
        date: dateString,
        dayName: dayName,
        dayOfWeek: dayOfWeek,
        status: status,
        isPast: currentDate < today,
        isClosed: !daySchedule,
        slotsCount: slotsCount,
        totalCapacity: totalCapacity,
        timeRange: daySchedule?.timeRange || null,
        needsAvailabilityCheck: status === 'available'
      });
    }

    return {
      success: true,
      hospitalId: hospitalId,
      hospitalName: hospital.name,
      doctorName: hospital.doctorName,
      startDate: this.formatDate(start),
      numberOfDays: numberOfDays,
      calendar: calendar
    };
  }

  /**
   * Update slots with real-time availability from server
   */
  async updateAvailability(hospitalId, dateString, slots = null) {
    try {
      // Check cache first (5 minute cache)
      const cacheKey = `${hospitalId}-${dateString}`;
      const cached = this.availabilityCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes
        if (slots) this.applyAvailabilityToSlots(slots, cached.data);
        return cached.data;
      }

      // Fetch from server
      const response = await fetch(`${this.apiBaseUrl}/availability/${hospitalId}/${dateString}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const availabilityData = await response.json();
      
      // Update cache
      this.availabilityCache.set(cacheKey, {
        data: availabilityData,
        timestamp: Date.now()
      });

      // Apply to slots if provided
      if (slots) {
        this.applyAvailabilityToSlots(slots, availabilityData);
      }

      return availabilityData;
      
    } catch (error) {
      console.warn(`Failed to update availability for ${hospitalId} on ${dateString}:`, error);
      return null;
    }
  }

  /**
   * Apply server availability data to client-generated slots
   */
  applyAvailabilityToSlots(slots, availabilityData) {
    const hospital = this.schedules[availabilityData.hospital_id];
    if (!hospital) return;

    slots.forEach(slot => {
      // Match by timeSlot display string (e.g., "05:00 PM - 06:00 PM")
      const currentBookings = availabilityData.slot_counts[slot.timeSlot] || 0;
      const availableSpots = Math.max(0, hospital.maxPerSlot - currentBookings);
      
      slot.currentAppointments = currentBookings;
      slot.availableSpots = availableSpots;
      slot.isAvailable = availableSpots > 0;
      slot.needsAvailabilityCheck = false;
    });
  }

  /**
   * Validate appointment data before sending to server
   */
  validateAppointment(appointmentData) {
    const { hospitalId, date, timeSlot } = appointmentData;
    
    // Generate slots for validation
    const slotsResult = this.generateSlots(hospitalId, date);
    
    if (!slotsResult.success) {
      return { valid: false, error: slotsResult.error };
    }

    if (slotsResult.isClosed) {
      return { 
        valid: false, 
        error: slotsResult.message 
      };
    }

    // Check if time slot exists
    const slot = slotsResult.availableSlots.find(s => s.timeSlot === timeSlot);
    if (!slot) {
      return { 
        valid: false, 
        error: 'Selected time slot is not available' 
      };
    }

    return {
      valid: true,
      hospitalName: slotsResult.hospitalName,
      doctorName: slotsResult.doctorName,
      slot: slot
    };
  }

  /**
   * Create appointment with server validation
   */
  async createAppointment(appointmentData) {
    try {
      // Client-side validation first
      const validation = this.validateAppointment(appointmentData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Send to server
      const response = await fetch(`${this.apiBaseUrl}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || 'Failed to create appointment' 
        };
      }

      const result = await response.json();
      
      // Clear availability cache for this date
      const cacheKey = `${appointmentData.hospitalId || appointmentData.hospital}-${appointmentData.date || appointmentData.appointment_date}`;
      this.availabilityCache.delete(cacheKey);

      return {
        success: true,
        appointment: result.appointment,
        message: result.message
      };

    } catch (error) {
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    }
  }

  /**
   * Get all available hospitals
   */
  getHospitals() {
    return Object.values(this.schedules).map(hospital => ({
      id: hospital.id,
      name: hospital.name,
      doctorName: hospital.doctorName,
      maxPerSlot: hospital.maxPerSlot,
      advanceBookingDays: hospital.advanceBookingDays,
      operatingDays: Object.keys(hospital.schedule).map(day => ({
        dayNumber: parseInt(day),
        dayName: this.getDayName(parseInt(day)),
        timeRange: hospital.schedule[day].timeRange,
        slotsCount: hospital.schedule[day].slots.length
      }))
    }));
  }

  /**
   * Utility functions
   */
  getDayName(dayOfWeek) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  formatDate(date) {
    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  clearCache() {
    this.availabilityCache.clear();
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClientSlotGenerator;
} else if (typeof window !== 'undefined') {
  window.ClientSlotGenerator = ClientSlotGenerator;
}

export default ClientSlotGenerator;
