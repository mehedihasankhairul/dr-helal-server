import express from 'express';
import Slot from '../models/Slot.js';
import dayjs from 'dayjs';

const router = express.Router();

// Get slots for Gomoti Hospital for a specific date
router.get('/gomoti/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    const requestedDate = dayjs(date);
    if (!requestedDate.isValid() || requestedDate.isBefore(dayjs(), 'day')) {
      return res.status(400).json({ error: 'Invalid date or date is in the past' });
    }
    
    const dayOfWeek = requestedDate.day(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Check if it's Friday (day 5) - Hospital closed
    if (dayOfWeek === 5) {
      return res.json({ 
        message: 'Gomoti Hospital is closed on Fridays',
        slots: [],
        hospital_name: 'Gomoti Hospital',
        date: date,
        is_closed: true
      });
    }
    
    // Determine which template to use
    let templateType;
    if (dayOfWeek === 4) { // Thursday
      templateType = 'thursday';
    } else if ([0, 1, 2, 3, 6].includes(dayOfWeek)) { // Sun, Mon, Tue, Wed, Sat
      templateType = 'regular';
    } else {
      return res.json({ 
        message: 'Hospital is closed on this day',
        slots: [],
        hospital_name: 'Gomoti Hospital',
        date: date,
        is_closed: true
      });
    }
    
    // Get template slots
    const templateSlots = await Slot.find({
      hospital_id: 'gomoti',
      day_type: templateType
    }).sort({ start_time: 1 });
    
    if (templateSlots.length === 0) {
      return res.status(404).json({ error: 'Template slots not found' });
    }
    
    // Check for existing appointments for this specific date
    // This would check actual appointment bookings for the date
    const existingSlots = await Slot.find({
      hospital_id: 'gomoti',
      date: date // Real date-specific slots
    });
    
    // Create dynamic slots based on template + existing bookings
    const dynamicSlots = [];
    
    for (const template of templateSlots) {
      // Check if there's an existing slot for this time on this date
      const existingSlot = existingSlots.find(
        slot => slot.start_time === template.start_time
      );
      
      let slotData;
      if (existingSlot) {
        // Use existing slot data (with real booking counts)
        slotData = {
          time_slot: existingSlot.time_slot,
          start_time: existingSlot.start_time,
          end_time: existingSlot.end_time,
          max_appointments: existingSlot.max_appointments,
          current_appointments: existingSlot.current_appointments,
          remaining_slots: existingSlot.max_appointments - existingSlot.current_appointments,
          is_available: existingSlot.is_available && (existingSlot.current_appointments < existingSlot.max_appointments)
        };
      } else {
        // Use template data (no bookings yet)
        slotData = {
          time_slot: template.time_slot,
          start_time: template.start_time,
          end_time: template.end_time,
          max_appointments: template.max_appointments,
          current_appointments: 0,
          remaining_slots: template.max_appointments,
          is_available: true
        };
      }
      
      dynamicSlots.push(slotData);
    }
    
    res.json({
      hospital_id: 'gomoti',
      hospital_name: 'Gomoti Hospital',
      date: date,
      day_of_week: requestedDate.format('dddd'),
      day_type: templateType,
      is_closed: false,
      slots: dynamicSlots,
      total_slots: dynamicSlots.length,
      available_slots: dynamicSlots.filter(slot => slot.is_available).length
    });
    
  } catch (error) {
    console.error('Get Gomoti slots error:', error);
    res.status(500).json({ error: 'Failed to get Gomoti hospital slots' });
  }
});

// Book a slot for Gomoti Hospital
router.post('/gomoti/:date/:time/book', async (req, res) => {
  try {
    const { date, time } = req.params;
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }
    
    // Validate date
    const requestedDate = dayjs(date);
    if (!requestedDate.isValid() || requestedDate.isBefore(dayjs(), 'day')) {
      return res.status(400).json({ error: 'Invalid date or date is in the past' });
    }
    
    // Check if Friday
    if (requestedDate.day() === 5) {
      return res.status(400).json({ error: 'Hospital is closed on Fridays' });
    }
    
    // Find or create slot for this specific date and time
    let slot = await Slot.findOne({
      hospital_id: 'gomoti',
      date: date,
      start_time: time
    });
    
    if (!slot) {
      // Create new slot based on template
      const dayOfWeek = requestedDate.day();
      const templateType = dayOfWeek === 4 ? 'thursday' : 'regular';
      
      const template = await Slot.findOne({
        hospital_id: 'gomoti',
        day_type: templateType,
        start_time: time
      });
      
      if (!template) {
        return res.status(404).json({ error: 'Invalid time slot' });
      }
      
      // Create new slot based on template
      slot = new Slot({
        hospital_id: 'gomoti',
        hospital_name: 'Gomoti Hospital',
        date: date,
        time_slot: template.time_slot,
        start_time: template.start_time,
        end_time: template.end_time,
        max_appointments: template.max_appointments,
        current_appointments: 0,
        is_available: true,
        appointment_ids: []
      });
    }
    
    // Check if slot is available
    if (!slot.isSlotAvailable()) {
      return res.status(400).json({ error: 'Slot is fully booked' });
    }
    
    // Book the appointment
    await slot.bookAppointment(appointmentId);
    
    res.json({
      message: 'Slot booked successfully',
      slot: {
        date: slot.date,
        time_slot: slot.time_slot,
        current_appointments: slot.current_appointments,
        max_appointments: slot.max_appointments,
        remaining_slots: slot.max_appointments - slot.current_appointments
      }
    });
    
  } catch (error) {
    console.error('Book Gomoti slot error:', error);
    if (error.message === 'Slot is not available for booking') {
      res.status(400).json({ error: 'Slot is fully booked' });
    } else {
      res.status(500).json({ error: 'Failed to book slot' });
    }
  }
});

// Get calendar availability for Gomoti Hospital
router.get('/gomoti/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const startDate = dayjs(`${year}-${month}-01`);
    const endDate = startDate.endOf('month');
    
    const calendarData = [];
    let current = startDate;
    
    while (current.isSame(endDate) || current.isBefore(endDate)) {
      const dateStr = current.format('YYYY-MM-DD');
      const dayOfWeek = current.day();
      
      let dayData = {
        date: dateStr,
        day_name: current.format('dddd'),
        is_past: current.isBefore(dayjs(), 'day'),
        is_closed: dayOfWeek === 5, // Friday
        day_type: dayOfWeek === 4 ? 'thursday' : 'regular',
        total_slots: 0,
        available_slots: 0,
        booked_slots: 0
      };
      
      if (!dayData.is_closed && !dayData.is_past) {
        // Determine slot count based on day
        const slotCount = dayOfWeek === 4 ? 6 : 5;
        dayData.total_slots = slotCount;
        
        // Check actual bookings for this date
        const bookedSlots = await Slot.countDocuments({
          hospital_id: 'gomoti',
          date: dateStr
        });
        
        const totalBookings = await Slot.aggregate([
          { $match: { hospital_id: 'gomoti', date: dateStr } },
          { $group: { _id: null, total: { $sum: '$current_appointments' } } }
        ]);
        
        dayData.booked_slots = totalBookings.length > 0 ? totalBookings[0].total : 0;
        dayData.available_slots = (slotCount * 20) - dayData.booked_slots; // 20 appointments per slot
      }
      
      calendarData.push(dayData);
      current = current.add(1, 'day');
    }
    
    res.json({
      hospital_id: 'gomoti',
      hospital_name: 'Gomoti Hospital',
      year: parseInt(year),
      month: parseInt(month),
      month_name: startDate.format('MMMM'),
      calendar: calendarData
    });
    
  } catch (error) {
    console.error('Get Gomoti calendar error:', error);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
});

export default router;
