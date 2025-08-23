import express from 'express';
import { getCollection } from '../config/database.js';

const router = express.Router();

// Get all hospital schedules
router.get('/', async (req, res) => {
    try {
        const hospitalSchedulesCollection = getCollection('hospital_schedules');
        
        const schedules = await hospitalSchedulesCollection.find({ 
            is_active: true 
        }).sort({ 
            hospital_name: 1 
        }).toArray();
        
        // Transform for client-side use
        const formattedSchedules = schedules.map(schedule => ({
            id: schedule._id.toString(),
            hospital_id: schedule.hospital_id,
            hospital_name: schedule.hospital_name,
            schedule: schedule.schedule,
            max_appointments_per_slot: schedule.max_appointments_per_slot,
            advance_booking_days: schedule.advance_booking_days,
            doctor_name: schedule.doctor_name,
            last_updated: schedule.updated_at
        }));
        
        res.json({
            success: true,
            schedules: formattedSchedules,
            total: formattedSchedules.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching hospital schedules:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hospital schedules',
            message: error.message
        });
    }
});

// Get schedule for specific hospital
router.get('/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        
        const hospitalSchedulesCollection = getCollection('hospital_schedules');
        
        const schedule = await hospitalSchedulesCollection.findOne({
            hospital_id: hospitalId,
            is_active: true
        });
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                error: 'Hospital schedule not found',
                hospital_id: hospitalId
            });
        }
        
        // Transform for client-side use
        const formattedSchedule = {
            id: schedule._id.toString(),
            hospital_id: schedule.hospital_id,
            hospital_name: schedule.hospital_name,
            schedule: schedule.schedule,
            max_appointments_per_slot: schedule.max_appointments_per_slot,
            advance_booking_days: schedule.advance_booking_days,
            doctor_name: schedule.doctor_name,
            last_updated: schedule.updated_at
        };
        
        res.json({
            success: true,
            schedule: formattedSchedule,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching hospital schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hospital schedule',
            message: error.message
        });
    }
});

// Get available days for a hospital (helper endpoint)
router.get('/:hospitalId/days', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        
        const hospitalSchedulesCollection = getCollection('hospital_schedules');
        
        const schedule = await hospitalSchedulesCollection.findOne({
            hospital_id: hospitalId,
            is_active: true
        });
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                error: 'Hospital schedule not found'
            });
        }
        
        const availableDays = Object.keys(schedule.schedule).map(day => parseInt(day));
        const dayNames = availableDays.map(day => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return {
                day_number: day,
                day_name: days[day],
                slots: schedule.schedule[day].slots,
                slot_count: schedule.schedule[day].slots.length
            };
        });
        
        res.json({
            success: true,
            hospital_id: hospitalId,
            hospital_name: schedule.hospital_name,
            available_days: dayNames,
            total_days: availableDays.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching hospital days:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hospital days',
            message: error.message
        });
    }
});

// Get time slots for a specific hospital and day
router.get('/:hospitalId/day/:dayNumber/slots', async (req, res) => {
    try {
        const { hospitalId, dayNumber } = req.params;
        
        const hospitalSchedulesCollection = getCollection('hospital_schedules');
        
        const schedule = await hospitalSchedulesCollection.findOne({
            hospital_id: hospitalId,
            is_active: true
        });
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                error: 'Hospital schedule not found'
            });
        }
        
        const daySchedule = schedule.schedule[dayNumber];
        
        if (!daySchedule) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return res.status(404).json({
                success: false,
                error: `Hospital is closed on ${days[parseInt(dayNumber)]}`,
                hospital_id: hospitalId,
                day_number: parseInt(dayNumber)
            });
        }
        
        res.json({
            success: true,
            hospital_id: hospitalId,
            hospital_name: schedule.hospital_name,
            day_number: parseInt(dayNumber),
            day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(dayNumber)],
            slots: daySchedule.slots,
            slot_count: daySchedule.slots.length,
            max_appointments_per_slot: schedule.max_appointments_per_slot,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching hospital slots:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hospital slots',
            message: error.message
        });
    }
});

export default router;
