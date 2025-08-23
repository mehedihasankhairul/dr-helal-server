/**
 * CLIENT-SIDE SLOT GENERATOR
 * 
 * This approach generates slots on the client-side for better performance,
 * but still validates with server for security and real-time availability.
 */

// Hospital schedule configuration (loaded once from server)
const HOSPITAL_SCHEDULES = {
  gomoti: {
    hospital_id: "gomoti",
    hospital_name: "Gomoti Hospital",
    schedule: {
      1: { // Monday
        slots: [
          { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      3: { // Wednesday
        slots: [
          { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      4: { // Thursday
        slots: [
          { start: "16:00", end: "17:00", display: "04:00 PM - 05:00 PM" },
          { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      },
      6: { // Saturday
        slots: [
          { start: "17:00", end: "18:00", display: "05:00 PM - 06:00 PM" },
          { start: "18:00", end: "19:00", display: "06:00 PM - 07:00 PM" },
          { start: "19:00", end: "20:00", display: "07:00 PM - 08:00 PM" },
          { start: "20:00", end: "21:00", display: "08:00 PM - 09:00 PM" },
          { start: "21:00", end: "22:00", display: "09:00 PM - 10:00 PM" }
        ]
      }
      // Friday (5) is missing = CLOSED
    },
    max_appointments_per_slot: 15,
    advance_booking_days: 60
  }
};

/**
 * CLIENT-SIDE SLOT GENERATOR CLASS
 */
class ClientSlotGenerator {
  constructor() {
    this.schedules = HOSPITAL_SCHEDULES;
    this.cachedAvailability = new Map(); // Cache availability data
  }

  /**
   * Generate slots for a specific hospital and date (CLIENT-SIDE)
   * This runs instantly on the client without server calls
   */
  generateSlotsForDate(hospitalId, dateString) {
    const hospital = this.schedules[hospitalId];
    if (!hospital) {
      return { error: 'Hospital not found', slots: [] };
    }

    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
    const daySchedule = hospital.schedule[dayOfWeek];

    // Check if hospital is closed
    if (!daySchedule) {
      return {
        hospital_id: hospitalId,
        hospital_name: hospital.hospital_name,
        date: dateString,
        day_of_week: this.getDayName(dayOfWeek),
        is_closed: true,
        slots: [],
        message: dayOfWeek === 5 ? 'Hospital closed on Fridays' : 'Hospital closed on this day'
      };
    }

    // Generate available slots (without real-time availability - that comes from server)
    const slots = daySchedule.slots.map(slot => ({
      time_slot: slot.display,
      start_time: slot.start,
      end_time: slot.end,
      max_appointments: hospital.max_appointments_per_slot,
      current_appointments: 0, // Will be updated from server
      available_spots: hospital.max_appointments_per_slot,
      is_available: true // Will be updated from server
    }));

    return {
      hospital_id: hospitalId,
      hospital_name: hospital.hospital_name,
      date: dateString,
      day_of_week: this.getDayName(dayOfWeek),
      is_closed: false,
      slots: slots,
      total_slots: slots.length,
      needs_availability_check: true // Flag to indicate server validation needed
    };
  }

  /**
   * Generate calendar view for multiple dates (CLIENT-SIDE)
   */
  generateCalendar(hospitalId, startDate, days = 7) {
    const hospital = this.schedules[hospitalId];
    if (!hospital) {
      return { error: 'Hospital not found' };
    }

    const calendar = [];
    const start = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const daySchedule = hospital.schedule[dayOfWeek];
      
      let totalSlots = 0;
      let totalCapacity = 0;

      if (daySchedule) {
        totalSlots = daySchedule.slots.length;
        totalCapacity = totalSlots * hospital.max_appointments_per_slot;
      }

      calendar.push({
        date: dateString,
        day_name: this.getDayName(dayOfWeek),
        is_past: currentDate < new Date(),
        is_closed: !daySchedule,
        total_slots: totalSlots,
        total_capacity: totalCapacity,
        // Availability will be updated from server
        used_capacity: 0,
        available_capacity: totalCapacity,
        needs_availability_check: !daySchedule ? false : true
      });
    }

    return {
      hospital_id: hospitalId,
      hospital_name: hospital.hospital_name,
      start_date: startDate,
      calendar: calendar,
      needs_availability_check: true
    };
  }

  /**
   * Update slots with real-time availability from server
   */
  async updateAvailability(hospitalId, dateString, slots = null) {
    try {
      // This would be your actual API call
      const response = await fetch(`/api/appointments/availability/${hospitalId}/${dateString}`);
      const serverData = await response.json();

      // Update local slots with server availability data
      if (slots && serverData.availability) {
        slots.forEach(slot => {
          const serverSlot = serverData.availability.find(s => s.time_slot === slot.time_slot);
          if (serverSlot) {
            slot.current_appointments = serverSlot.current_appointments;
            slot.available_spots = serverSlot.available_spots;
            slot.is_available = serverSlot.is_available;
          }
        });
      }

      // Cache the availability data
      this.cachedAvailability.set(`${hospitalId}-${dateString}`, {
        data: serverData,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutes cache
      });

      return serverData;
    } catch (error) {
      console.error('Failed to update availability:', error);
      return null;
    }
  }

  /**
   * Get availability from cache if still valid
   */
  getCachedAvailability(hospitalId, dateString) {
    const key = `${hospitalId}-${dateString}`;
    const cached = this.cachedAvailability.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Validate appointment data before sending to server
   */
  validateAppointment(appointmentData) {
    const { hospitalId, date, timeSlot } = appointmentData;
    
    // Client-side validation
    const slotInfo = this.generateSlotsForDate(hospitalId, date);
    
    if (slotInfo.is_closed) {
      return {
        valid: false,
        error: `${slotInfo.hospital_name} is closed on ${slotInfo.day_of_week}`
      };
    }

    const slot = slotInfo.slots.find(s => s.time_slot === timeSlot);
    if (!slot) {
      return {
        valid: false,
        error: 'Invalid time slot selected'
      };
    }

    // Check if date is in the past
    const appointmentDate = new Date(date);
    if (appointmentDate < new Date()) {
      return {
        valid: false,
        error: 'Cannot book appointments for past dates'
      };
    }

    return {
      valid: true,
      slot: slot,
      hospital_name: slotInfo.hospital_name
    };
  }

  getDayName(dayOfWeek) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }
}

/**
 * USAGE EXAMPLES
 */

// Initialize the client-side slot generator
const slotGenerator = new ClientSlotGenerator();

// Example 1: Generate slots for today (INSTANT - no server call)
const todaySlots = slotGenerator.generateSlotsForDate('gomoti', '2025-08-21');
console.log('Today slots (client-side):', todaySlots);

// Example 2: Generate 7-day calendar (INSTANT - no server call) 
const calendar = slotGenerator.generateCalendar('gomoti', '2025-08-21', 7);
console.log('7-day calendar (client-side):', calendar);

// Example 3: Validate appointment before sending to server
const appointmentData = {
  hospitalId: 'gomoti',
  date: '2025-08-23',
  timeSlot: '05:00 PM - 06:00 PM'
};

const validation = slotGenerator.validateAppointment(appointmentData);
if (validation.valid) {
  console.log('✅ Appointment is valid, can proceed to server');
  // Send to server: POST /api/appointments
} else {
  console.log('❌ Validation failed:', validation.error);
}

export default ClientSlotGenerator;
