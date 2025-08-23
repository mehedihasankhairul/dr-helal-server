# Enhanced Appointment Tracking API Documentation

## Overview
This document describes the enhanced appointment tracking API endpoints that provide comprehensive appointment information for the frontend application.

## Endpoints

### 1. Track Appointment (Original Endpoint)
**GET** `/api/appointments/track/:refNumber`

### 2. Reference Lookup (New Endpoint)
**GET** `/api/appointments/reference/:refNumber`

Both endpoints return the same response format for consistency.

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Appointment found",
  "appointment": {
    // Basic appointment details
    "id": "64b8f4a2e1234567890abcdef",
    "reference_number": "APT-2024-0823-1234-5678",
    "status": "pending",
    
    // Date and time information
    "appointment_date": "2024-08-25T00:00:00.000Z",
    "appointment_time": "10:00",
    
    // Hospital and doctor info
    "hospital": "Al-Sefa Hospital",
    "doctor_name": "Dr. Helal Uddin",
    
    // Patient information
    "patient_name": "John Doe",
    "patient_email": "john.doe@example.com",
    "patient_phone": "+880 1712-345678",
    "patient_age": 35,
    "patient_gender": "Male",
    "patient_address": "123 Main Street, Dhaka, Bangladesh",
    "problem_description": "Chest pain and shortness of breath",
    
    // Visit information
    "visit_completed": false,
    "visit_summary": null,
    "follow_up_required": false,
    "doctor_notes": null,
    
    // Prescription information
    "has_prescription": false,
    "prescription_reference": null,
    "prescription_date": null,
    
    // Timestamps
    "created_at": "2024-08-23T15:30:00.000Z",
    "updated_at": "2024-08-23T15:30:00.000Z",
    
    // Alternative field names for frontend compatibility
    "patientName": "John Doe",
    "patientEmail": "john.doe@example.com",
    "patientPhone": "+880 1712-345678",
    "patientAge": 35,
    "patientGender": "Male",
    "problemDescription": "Chest pain and shortness of breath",
    "date": "2024-08-25T00:00:00.000Z",
    "time": "10:00"
  }
}
```

### Error Response (404)
```json
{
  "success": false,
  "error": "Appointment not found",
  "message": "No appointment found with this reference number"
}
```

### Server Error Response (500)
```json
{
  "success": false,
  "error": "Failed to track appointment",
  "message": "An error occurred while retrieving appointment information"
}
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | MongoDB ObjectId as string |
| `reference_number` | String | Unique appointment reference (APT-YYYY-MMDD-XXXX-YYYY) |
| `status` | String | Appointment status: 'pending', 'confirmed', 'completed', 'cancelled', 'no-show' |
| `appointment_date` | Date | ISO date of the appointment |
| `appointment_time` | String | Time in HH:MM format |
| `hospital` | String | Hospital name |
| `doctor_name` | String | Doctor's name (defaults to "Dr. Helal Uddin") |
| `patient_name` | String | Patient's full name |
| `patient_email` | String | Patient's email address |
| `patient_phone` | String | Patient's phone number |
| `patient_age` | Number | Patient's age |
| `patient_gender` | String | Patient's gender |
| `patient_address` | String | Patient's address (fallback: "Not provided") |
| `problem_description` | String | Description of the medical issue |
| `visit_completed` | Boolean | Whether the appointment visit is completed |
| `visit_summary` | String | Summary of the visit (if completed) |
| `follow_up_required` | Boolean | Whether follow-up is required |
| `doctor_notes` | String | Notes from the doctor |
| `has_prescription` | Boolean | Whether prescription exists |
| `prescription_reference` | String | Reference number of associated prescription |
| `prescription_date` | Date | Date when prescription was created |
| `created_at` | Date | When appointment was created |
| `updated_at` | Date | When appointment was last updated |

## Alternative Field Names

For frontend compatibility, the following alternative field names are also included:

- `patientName` → `patient_name`
- `patientEmail` → `patient_email`
- `patientPhone` → `patient_phone`
- `patientAge` → `patient_age`
- `patientGender` → `patient_gender`
- `problemDescription` → `problem_description`
- `date` → `appointment_date`
- `time` → `appointment_time`

## Database Field Mapping

The API handles different possible field names in the database:

| API Response Field | Database Field Options |
|-------------------|----------------------|
| `patient_gender` | `gender` |
| `patient_address` | `address` |
| `problem_description` | `symptoms` OR `problemDescription` |

## Prescription Integration

If the appointment has an associated prescription:
- The API automatically looks up prescription data from the prescriptions collection
- Sets `has_prescription: true`
- Includes `prescription_reference` and `prescription_date`

## Error Handling

- **404**: Appointment not found with the provided reference number
- **500**: Server error (database connection issues, etc.)

## Security Notes

- These are public endpoints (no authentication required)
- All patient information is returned as it's accessed via unique reference number
- Reference numbers are cryptographically secure and hard to guess

## Usage Examples

### JavaScript/Frontend
```javascript
// Using the enhanced API service
const appointment = await apiService.trackAppointment('APT-2024-0823-1234-5678');

// Or the alternative endpoint
const appointment = await apiService.getAppointmentByReference('APT-2024-0823-1234-5678');

// Both return the same format
console.log(appointment.appointment.patient_name);
console.log(appointment.appointment.patientName); // Same value
```

### curl
```bash
# Track appointment
curl -X GET "https://drhelal-server.vercel.app/api/appointments/track/APT-2024-0823-1234-5678"

# Reference lookup (alternative)
curl -X GET "https://drhelal-server.vercel.app/api/appointments/reference/APT-2024-0823-1234-5678"
```

## Migration Notes

- The original `/track/:refNumber` endpoint maintains backward compatibility
- Added new `/reference/:refNumber` endpoint with identical functionality
- Both endpoints now return comprehensive patient information
- Response format is consistent with success/error indicators
- Field name variations support different frontend implementations

## Testing

Use the provided `test-tracking-api.js` script to test both endpoints:

```bash
node test-tracking-api.js
```

This will verify:
- Both endpoints are accessible
- Response format is consistent
- All required fields are present
- Server health and connectivity
