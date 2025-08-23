import express from 'express';
import { getCollection } from '../config/database.js';

const router = express.Router();

// Lightweight availability check endpoint (for hybrid approach)
router.get('/:hospitalId/:date', async (req, res) => {
  try {
    const { hospitalId, date } = req.params;
    
    // Get appointment counts for the specific date and hospital
    const appointmentsCollection = getCollection('appointments');
    const appointments = await appointmentsCollection.find({
      $or: [
        { hospital: hospitalId },
        { hospital: hospitalId.charAt(0).toUpperCase() + hospitalId.slice(1) + ' Hospital' }
      ],
      appointment_date: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      },
      status: { $ne: 'cancelled' }
    }, {
      projection: {
        appointment_time: 1,
        time: 1,
        _id: 0
      }
    }).toArray();

    // Count appointments per time slot
    const slotCounts = {};
    appointments.forEach(apt => {
      const timeKey = apt.appointment_time || apt.time;
      slotCounts[timeKey] = (slotCounts[timeKey] || 0) + 1;
    });

    // Return lightweight availability data
    res.json({
      hospital_id: hospitalId,
      date: date,
      slot_counts: slotCounts,
      total_appointments: appointments.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Bulk availability check for multiple dates (for calendar optimization)
router.post('/bulk', async (req, res) => {
  try {
    const { hospital_id, dates } = req.body;
    
    if (!hospital_id || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'hospital_id and dates array required' });
    }

    // Limit to reasonable number of dates
    if (dates.length > 31) {
      return res.status(400).json({ error: 'Maximum 31 dates allowed per request' });
    }

    const appointmentsCollection = getCollection('appointments');
    
    // Get all appointments for the hospital in the date range
    const startDate = new Date(Math.min(...dates.map(d => new Date(d))));
    const endDate = new Date(Math.max(...dates.map(d => new Date(d))));
    endDate.setDate(endDate.getDate() + 1); // Include end date

    const appointments = await appointmentsCollection.find({
      $or: [
        { hospital: hospital_id },
        { hospital: hospital_id.charAt(0).toUpperCase() + hospital_id.slice(1) + ' Hospital' }
      ],
      appointment_date: {
        $gte: startDate,
        $lt: endDate
      },
      status: { $ne: 'cancelled' }
    }, {
      projection: {
        appointment_date: 1,
        appointment_time: 1,
        time: 1,
        _id: 0
      }
    }).toArray();

    // Group by date
    const availabilityByDate = {};
    dates.forEach(date => {
      availabilityByDate[date] = {};
    });

    appointments.forEach(apt => {
      const dateKey = apt.appointment_date.toISOString().split('T')[0];
      if (availabilityByDate[dateKey] !== undefined) {
        const timeKey = apt.appointment_time || apt.time;
        availabilityByDate[dateKey][timeKey] = (availabilityByDate[dateKey][timeKey] || 0) + 1;
      }
    });

    res.json({
      hospital_id: hospital_id,
      availability: availabilityByDate,
      total_appointments: appointments.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bulk availability check error:', error);
    res.status(500).json({ error: 'Failed to check bulk availability' });
  }
});

export default router;
