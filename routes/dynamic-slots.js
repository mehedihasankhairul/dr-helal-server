import express from 'express';
import dayjs from 'dayjs';
import { getCollection } from '../config/database.js';

const router = express.Router();

// Get available slots for a hospital on a specific date (EFFICIENT APPROACH)
router.get('/available/:hospitalId/:date', async (req, res) => {
  try {
    const { hospitalId, date } = req.params;
    
    // Validate date format
    const requestDate = dayjs(date);
    if (!requestDate.isValid()) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Don't allow booking in the past
    if (requestDate.isBefore(dayjs(), 'day')) {
      return res.status(400).json({ error: 'Cannot book appointments for past dates' });
    }
    
    // Get hospital schedule configuration
    const schedulesCollection = getCollection('hospital_schedules');
    const hospitalSchedule = await schedulesCollection.findOne({ hospital_id: hospitalId });
    
    if (!hospitalSchedule) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    // Check if hospital is open on this day
    const dayOfWeek = requestDate.day(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const daySchedule = hospitalSchedule.schedule[dayOfWeek];
    
    if (!daySchedule) {
      return res.status(200).json({ 
        message: 'Hospital is closed on this day',
        available_slots: [],
        hospital_name: hospitalSchedule.hospital_name,
        date: date,
        is_closed: true
      });
    }
    
    // Get existing appointments for this date and hospital
    const appointmentsCollection = getCollection('appointments');
    const existingAppointments = await appointmentsCollection.find({
      $or: [
        { hospital: hospitalId },
        { hospital: hospitalSchedule.hospital_name }
      ],
      appointment_date: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: { $ne: 'cancelled' } // Don't count cancelled appointments
    }).toArray();
    
    // Count appointments per time slot
    const appointmentCounts = {};
    existingAppointments.forEach(appointment => {
      const timeKey = appointment.appointment_time || appointment.time;
      appointmentCounts[timeKey] = (appointmentCounts[timeKey] || 0) + 1;
    });
    
    // Generate available slots dynamically
    const availableSlots = [];
    const maxAppointments = hospitalSchedule.max_appointments_per_slot;
    
    for (const slot of daySchedule.slots) {
      const currentBookings = appointmentCounts[slot.display] || 0;
      const remainingSlots = maxAppointments - currentBookings;
      
      availableSlots.push({
        time_slot: slot.display,
        start_time: slot.start,
        end_time: slot.end,
        max_appointments: maxAppointments,
        current_appointments: currentBookings,
        available_spots: remainingSlots,
        is_available: remainingSlots > 0
      });
    }
    
    res.json({
      hospital_id: hospitalId,
      hospital_name: hospitalSchedule.hospital_name,
      date: date,
      day_of_week: requestDate.format('dddd'),
      is_closed: false,
      available_slots: availableSlots,
      total_slots: availableSlots.length,
      total_available_spots: availableSlots.reduce((sum, slot) => sum + slot.available_spots, 0)
    });
    
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

// Get available slots for multiple days (for calendar view)
router.get('/calendar/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { start_date, end_date, days = 7 } = req.query;
    
    // Determine date range
    const startDate = start_date ? dayjs(start_date) : dayjs();
    const endDate = end_date ? dayjs(end_date) : startDate.add(parseInt(days), 'day');
    
    // Get hospital schedule
    const schedulesCollection = getCollection('hospital_schedules');
    const hospitalSchedule = await schedulesCollection.findOne({ hospital_id: hospitalId });
    
    if (!hospitalSchedule) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    // Get all appointments in date range
    const appointmentsCollection = getCollection('appointments');
    const appointments = await appointmentsCollection.find({
      hospital: hospitalId,
      appointment_date: {
        $gte: new Date(startDate.format('YYYY-MM-DD') + 'T00:00:00.000Z'),
        $lte: new Date(endDate.format('YYYY-MM-DD') + 'T23:59:59.999Z')
      },
      status: { $ne: 'cancelled' }
    }).toArray();
    
    // Group appointments by date and time
    const appointmentsByDate = {};
    appointments.forEach(apt => {
      const dateKey = dayjs(apt.appointment_date).format('YYYY-MM-DD');
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = {};
      }
      const timeKey = apt.appointment_time || apt.time;
      appointmentsByDate[dateKey][timeKey] = (appointmentsByDate[dateKey][timeKey] || 0) + 1;
    });
    
    // Generate calendar data
    const calendarData = [];
    let currentDate = startDate;
    
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayOfWeek = currentDate.day();
      const daySchedule = hospitalSchedule.schedule[dayOfWeek];
      const dateAppointments = appointmentsByDate[dateStr] || {};
      
      let totalSlots = 0;
      let availableSlots = 0;
      let totalCapacity = 0;
      let usedCapacity = 0;
      
      if (daySchedule) {
        totalSlots = daySchedule.slots.length;
        totalCapacity = totalSlots * hospitalSchedule.max_appointments_per_slot;
        
        daySchedule.slots.forEach(slot => {
          const currentBookings = dateAppointments[slot.display] || 0;
          const remaining = hospitalSchedule.max_appointments_per_slot - currentBookings;
          if (remaining > 0) availableSlots++;
          usedCapacity += currentBookings;
        });
      }
      
      calendarData.push({
        date: dateStr,
        day_name: currentDate.format('dddd'),
        is_past: currentDate.isBefore(dayjs(), 'day'),
        is_closed: !daySchedule,
        total_slots: totalSlots,
        available_slots: availableSlots,
        total_capacity: totalCapacity,
        used_capacity: usedCapacity,
        available_capacity: totalCapacity - usedCapacity,
        utilization_rate: totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0
      });
      
      currentDate = currentDate.add(1, 'day');
    }
    
    res.json({
      hospital_id: hospitalId,
      hospital_name: hospitalSchedule.hospital_name,
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD'),
      calendar_data: calendarData,
      summary: {
        total_days: calendarData.length,
        open_days: calendarData.filter(d => !d.is_closed && !d.is_past).length,
        closed_days: calendarData.filter(d => d.is_closed).length,
        total_available_capacity: calendarData.reduce((sum, d) => sum + d.available_capacity, 0)
      }
    });
    
  } catch (error) {
    console.error('Get calendar slots error:', error);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
});

// Get all hospital schedules
router.get('/hospitals', async (req, res) => {
  try {
    const schedulesCollection = getCollection('hospital_schedules');
    const hospitals = await schedulesCollection.find({}, {
      projection: {
        hospital_id: 1,
        hospital_name: 1,
        max_appointments_per_slot: 1,
        advance_booking_days: 1,
        schedule: 1
      }
    }).toArray();
    
    // Transform schedule data for easier frontend consumption
    const transformedHospitals = hospitals.map(hospital => {
      const operatingDays = [];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let day = 0; day < 7; day++) {
        if (hospital.schedule[day]) {
          const slots = hospital.schedule[day].slots;
          operatingDays.push({
            day_number: day,
            day_name: dayNames[day],
            slots_count: slots.length,
            first_slot: slots[0].display,
            last_slot: slots[slots.length - 1].display,
            time_range: `${slots[0].display.split(' - ')[0]} - ${slots[slots.length - 1].display.split(' - ')[1]}`
          });
        }
      }
      
      return {
        hospital_id: hospital.hospital_id,
        hospital_name: hospital.hospital_name,
        max_appointments_per_slot: hospital.max_appointments_per_slot,
        advance_booking_days: hospital.advance_booking_days,
        operating_days: operatingDays,
        total_operating_days: operatingDays.length,
        is_closed_friday: !hospital.schedule[5] // Friday check
      };
    });
    
    res.json({
      hospitals: transformedHospitals,
      total_hospitals: transformedHospitals.length
    });
    
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Failed to get hospitals data' });
  }
});

export default router;
