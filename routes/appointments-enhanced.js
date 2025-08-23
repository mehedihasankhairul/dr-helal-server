import express from 'express';
import mongoose from 'mongoose';
import { getCollection, toObjectId, generateObjectId } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateReferenceNumber } from '../utils/helpers.js';
import dayjs from 'dayjs';

const router = express.Router();

// Hospital capacity configuration - 25 booking limit per slot for all hospitals
const HOSPITAL_CONFIG = {
    'Gomoti Hospital': { maxPerSlot: 25 },
    'gomoti': { maxPerSlot: 25 },
    'Moon Hospital': { maxPerSlot: 25 },
    'moon': { maxPerSlot: 25 },
    'Al-Sefa Hospital': { maxPerSlot: 25 },
    'alsefa': { maxPerSlot: 25 }
};

// Get hospital capacity with fallback
function getHospitalCapacity(hospital) {
    const config = HOSPITAL_CONFIG[hospital] || HOSPITAL_CONFIG[hospital.toLowerCase()];
    return config ? config.maxPerSlot : 25; // Default capacity set to 25
}

// Enhanced appointment booking with capacity validation and race condition protection
router.post('/', async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        const { date, appointment_date, appointment_time, hospital } = req.body;
        
        // Use date or appointment_date (frontend might send either)
        const dateToCheck = date || appointment_date;
        
        // Check if the appointment is for Friday
        const appointmentDateObj = dayjs(dateToCheck);
        if (appointmentDateObj.day() === 5) {
            return res.status(400).json({ error: 'Both hospitals are closed on Fridays' });
        }
        
        // Start transaction for atomic operation
        await session.startTransaction();
        
        const appointmentsCollection = getCollection('appointments');
        
        // Get hospital capacity
        const maxCapacity = getHospitalCapacity(hospital);
        
        // Check current bookings for this slot (within transaction)
        const currentBookings = await appointmentsCollection.countDocuments({
            $or: [
                { hospital: hospital },
                { hospital: hospital.charAt(0).toUpperCase() + hospital.slice(1) + ' Hospital' }
            ],
            appointment_date: {
                $gte: new Date(dateToCheck + 'T00:00:00.000Z'),
                $lt: new Date(dateToCheck + 'T23:59:59.999Z')
            },
            appointment_time: appointment_time,
            status: { $ne: 'cancelled' }
        }, { session });
        
        // Validate capacity
        if (currentBookings >= maxCapacity) {
            await session.abortTransaction();
            return res.status(409).json({ 
                error: 'Slot is fully booked',
                details: {
                    hospital: hospital,
                    date: dateToCheck,
                    time: appointment_time,
                    current_bookings: currentBookings,
                    max_capacity: maxCapacity,
                    available_slots: 0
                }
            });
        }
        
        // Generate reference number
        const referenceNumber = generateReferenceNumber();
        
        // Create the appointment document
        const appointmentDoc = {
            _id: generateObjectId(),
            reference_number: referenceNumber,
            user_id: req.user ? toObjectId(req.user.id) : null,
            ...req.body,
            appointment_date: new Date(dateToCheck),
            created_at: new Date(),
            updated_at: new Date(),
            status: 'pending'
        };
        
        // Insert appointment within transaction
        const result = await appointmentsCollection.insertOne(appointmentDoc, { session });
        
        // Double-check capacity after insertion (prevent race conditions)
        const finalBookings = await appointmentsCollection.countDocuments({
            $or: [
                { hospital: hospital },
                { hospital: hospital.charAt(0).toUpperCase() + hospital.slice(1) + ' Hospital' }
            ],
            appointment_date: {
                $gte: new Date(dateToCheck + 'T00:00:00.000Z'),
                $lt: new Date(dateToCheck + 'T23:59:59.999Z')
            },
            appointment_time: appointment_time,
            status: { $ne: 'cancelled' }
        }, { session });
        
        if (finalBookings > maxCapacity) {
            // Rollback if capacity exceeded due to race condition
            await session.abortTransaction();
            return res.status(409).json({ 
                error: 'Slot became fully booked during reservation process',
                details: {
                    hospital: hospital,
                    date: dateToCheck,
                    time: appointment_time,
                    reason: 'Race condition detected'
                }
            });
        }
        
        // Commit transaction
        await session.commitTransaction();
        
        // Get the created appointment
        const appointment = await appointmentsCollection.findOne({ _id: result.insertedId });
        
        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment: {
                ...appointment,
                id: appointment._id.toString()
            },
            slot_info: {
                hospital: hospital,
                date: dateToCheck,
                time: appointment_time,
                bookings_after: finalBookings,
                max_capacity: maxCapacity,
                remaining_slots: maxCapacity - finalBookings
            }
        });
        
    } catch (error) {
        await session.abortTransaction();
        console.error('Appointment creation error:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(409).json({ 
                error: 'Duplicate booking detected',
                message: 'An appointment with the same details already exists'
            });
        }
        
        res.status(500).json({ error: 'Failed to book appointment' });
    } finally {
        await session.endSession();
    }
});

// Enhanced availability check with real-time capacity info
router.get('/availability/:hospitalId/:date/:time', async (req, res) => {
    try {
        const { hospitalId, date, time } = req.params;
        
        const appointmentsCollection = getCollection('appointments');
        const maxCapacity = getHospitalCapacity(hospitalId);
        
        // Get current bookings for specific slot
        const currentBookings = await appointmentsCollection.countDocuments({
            $or: [
                { hospital: hospitalId },
                { hospital: hospitalId.charAt(0).toUpperCase() + hospitalId.slice(1) + ' Hospital' }
            ],
            appointment_date: {
                $gte: new Date(date + 'T00:00:00.000Z'),
                $lt: new Date(date + 'T23:59:59.999Z')
            },
            appointment_time: time,
            status: { $ne: 'cancelled' }
        });
        
        const availableSlots = Math.max(0, maxCapacity - currentBookings);
        const isAvailable = availableSlots > 0;
        
        res.json({
            hospital_id: hospitalId,
            date: date,
            time: time,
            max_capacity: maxCapacity,
            current_bookings: currentBookings,
            available_slots: availableSlots,
            is_available: isAvailable,
            status: isAvailable ? 'available' : 'full',
            last_updated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Availability check error:', error);
        res.status(500).json({ error: 'Failed to check availability' });
    }
});

// Bulk slot availability check (optimized for calendar view)
router.post('/availability/bulk', async (req, res) => {
    try {
        const { hospital_id, date_time_slots } = req.body;
        
        if (!hospital_id || !Array.isArray(date_time_slots)) {
            return res.status(400).json({ error: 'hospital_id and date_time_slots array required' });
        }
        
        const appointmentsCollection = getCollection('appointments');
        const maxCapacity = getHospitalCapacity(hospital_id);
        
        // Get all appointments for the hospital in the requested date range
        const dates = [...new Set(date_time_slots.map(slot => slot.date))];
        const startDate = new Date(Math.min(...dates.map(d => new Date(d))));
        const endDate = new Date(Math.max(...dates.map(d => new Date(d))));
        endDate.setDate(endDate.getDate() + 1);
        
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
                _id: 0
            }
        }).toArray();
        
        // Count bookings per slot
        const bookingCounts = {};
        appointments.forEach(apt => {
            const dateKey = apt.appointment_date.toISOString().split('T')[0];
            const timeKey = apt.appointment_time;
            const slotKey = `${dateKey}_${timeKey}`;
            bookingCounts[slotKey] = (bookingCounts[slotKey] || 0) + 1;
        });
        
        // Build response for each requested slot
        const slotAvailability = date_time_slots.map(slot => {
            const slotKey = `${slot.date}_${slot.time}`;
            const currentBookings = bookingCounts[slotKey] || 0;
            const availableSlots = Math.max(0, maxCapacity - currentBookings);
            
            return {
                date: slot.date,
                time: slot.time,
                max_capacity: maxCapacity,
                current_bookings: currentBookings,
                available_slots: availableSlots,
                is_available: availableSlots > 0,
                status: availableSlots > 0 ? 'available' : 'full'
            };
        });
        
        res.json({
            hospital_id: hospital_id,
            slots: slotAvailability,
            last_updated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Bulk availability check error:', error);
        res.status(500).json({ error: 'Failed to check bulk availability' });
    }
});

// ... (rest of the routes remain the same as the original file)
// Track appointment by reference number (public endpoint)
router.get('/track/:refNumber', async (req, res) => {
    try {
        const { refNumber } = req.params;
        
        // Find appointment by reference number
        const appointmentsCollection = getCollection('appointments');
        const appointment = await appointmentsCollection.findOne({ reference_number: refNumber });
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found with this reference number' });
        }
        
        // Return limited information for privacy
        const appointmentInfo = {
            reference_number: appointment.reference_number,
            patient_name: appointment.patient_name,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            hospital: appointment.hospital,
            status: appointment.status || 'pending',
            doctor_name: appointment.doctor_name,
            visit_completed: appointment.visit_completed || false,
            visit_summary: appointment.visit_summary,
            follow_up_required: appointment.follow_up_required || false,
            created_at: appointment.created_at,
            updated_at: appointment.updated_at
        };
        
        // Check for prescription
        if (appointment.prescription_id) {
            const prescriptionsCollection = getCollection('prescriptions');
            const prescription = await prescriptionsCollection.findOne({ _id: appointment.prescription_id });
            if (prescription) {
                appointmentInfo.has_prescription = true;
                appointmentInfo.prescription_reference = prescription.reference_number;
            } else {
                appointmentInfo.has_prescription = false;
            }
        } else {
            appointmentInfo.has_prescription = false;
        }
        
        res.json({ appointment: appointmentInfo });
    } catch (error) {
        console.error('Track appointment error:', error);
        res.status(500).json({ error: 'Failed to track appointment' });
    }
});

// Get all appointments for doctor portal (admin/doctor only)
router.get('/all', authenticateToken, requireRole(['admin', 'doctor']), async (req, res) => {
    try {
        const { date, hospital, status, limit = 100, skip = 0 } = req.query;
        
        // Build query filter
        const filter = {};
        
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            filter.appointment_date = {
                $gte: startDate,
                $lt: endDate
            };
        }
        
        if (hospital) {
            filter.hospital = hospital;
        }
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        // Get appointments from database
        const appointmentsCollection = getCollection('appointments');
        const appointments = await appointmentsCollection
            .find(filter)
            .sort({ appointment_date: -1, time: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .toArray();
        
        // Transform data for frontend
        const formattedAppointments = appointments.map(appointment => ({
            id: appointment._id.toString(),
            reference_number: appointment.reference_number,
            name: appointment.patientName,
            email: appointment.patientEmail,
            phoneNumber: appointment.patientPhone,
            age: appointment.patientAge,
            gender: appointment.patientGender,
            address: appointment.patientAddress,
            problemDescription: appointment.problemDescription,
            hospital: {
                id: appointment.hospital,
                name: appointment.hospital
            },
            date: appointment.date,
            time: appointment.time,
            appointment_date: appointment.appointment_date,
            status: appointment.status || 'pending',
            doctorNotes: appointment.doctor_notes,
            created_at: appointment.created_at,
            updated_at: appointment.updated_at
        }));
        
        res.json({ 
            appointments: formattedAppointments,
            total: appointments.length 
        });
    } catch (error) {
        console.error('Fetch appointments error:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Update appointment status and notes (admin/doctor only)
router.put('/:id', authenticateToken, requireRole(['admin', 'doctor']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, doctor_notes } = req.body;
        
        // Validate appointment ID
        if (!id) {
            return res.status(400).json({ error: 'Appointment ID is required' });
        }
        
        const updateData = {
            updated_at: new Date()
        };
        
        if (status) {
            updateData.status = status;
        }
        
        if (doctor_notes !== undefined) {
            updateData.doctor_notes = doctor_notes;
        }
        
        // Update appointment
        const appointmentsCollection = getCollection('appointments');
        const result = await appointmentsCollection.updateOne(
            { _id: toObjectId(id) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        // Get updated appointment
        const updatedAppointment = await appointmentsCollection.findOne({ _id: toObjectId(id) });
        
        res.json({
            message: 'Appointment updated successfully',
            appointment: {
                ...updatedAppointment,
                id: updatedAppointment._id.toString()
            }
        });
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// Get appointment statistics (admin/doctor only)
router.get('/stats/overview', authenticateToken, requireRole(['admin', 'doctor']), async (req, res) => {
    try {
        const appointmentsCollection = getCollection('appointments');
        const today = new Date().toISOString().slice(0, 10);
        
        const totalAppointments = await appointmentsCollection.countDocuments();
        const pendingAppointments = await appointmentsCollection.countDocuments({ status: 'pending' });
        const confirmedAppointments = await appointmentsCollection.countDocuments({ status: 'confirmed' });
        const completedAppointments = await appointmentsCollection.countDocuments({ status: 'completed' });
        const cancelledAppointments = await appointmentsCollection.countDocuments({ status: 'cancelled' });
        const todayAppointments = await appointmentsCollection.countDocuments({ 
            appointment_date: { 
                $gte: new Date(today), 
                $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) 
            } 
        });
        const upcomingAppointments = await appointmentsCollection.countDocuments({ 
            appointment_date: { $gt: new Date(today) } 
        });

        res.json({
            stats: {
                total_appointments: totalAppointments,
                pending_appointments: pendingAppointments,
                confirmed_appointments: confirmedAppointments,
                completed_appointments: completedAppointments,
                cancelled_appointments: cancelledAppointments,
                today_appointments: todayAppointments,
                upcoming_appointments: upcomingAppointments
            }
        });
    } catch (error) {
        console.error('Fetch stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
