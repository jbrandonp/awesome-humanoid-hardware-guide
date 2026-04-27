# API Endpoints Documentation

This document lists all available API endpoints for the healthcare system backend.

## Authentication & Authorization

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|-------------------------|
| POST   | `/auth/login` | Login with credentials | No |
| POST   | `/auth/logout` | Logout current session | Yes |
| GET    | `/auth/profile` | Get current user profile | Yes |

## IoT Medical Devices

| Method | Endpoint | Description | Request Body Schema |
|--------|----------|-------------|----------------------|
| POST   | `/iot/ble/blood-pressure` | Receive blood pressure data from BLE devices | `BleBloodPressurePayload` |
| POST   | `/iot/smart-pen/ink` | Receive smart pen ink data for prescriptions | `SmartPenInkPayload` |
| POST   | `/iot/device/heartbeat` | Device health check and configuration | `DeviceHeartbeatSchema` |

**Schemas:**
- `BleBloodPressurePayload`: `{ patientId: UUID, practitionerId: UUID, deviceMetadata: IotDeviceMetadata, systolicMmHg: number, diastolicMmHg: number, meanArterialPressureMmHg: number, pulseRateBpm?: number, acquisitionTimestampIso: ISO8601 }`
- `SmartPenInkPayload`: `{ patientId: UUID, practitionerId: UUID, deviceMetadata: IotDeviceMetadata, rawSvgPathData: string, acquisitionTimestampIso: ISO8601 }`
- `DeviceHeartbeatSchema`: `{ deviceId: string, firmwareVersion?: string, batteryLevel?: number }`

## HL7 MLLP Interface

| Method | Endpoint | Description | Notes |
|--------|----------|-------------|-------|
| POST   | `/hl7-mllp/send` | Send HL7 message via MLLP | Accepts raw HL7 v2.x message |
| POST   | `/hl7-mllp/receive` | Receive HL7 message via HTTP | For systems that cannot use MLLP directly |
| GET    | `/hl7-mllp/status` | Get MLLP connection status | Returns active connections |

## Kiosk Management

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET    | `/kiosk/state` | Get current kiosk state | None |
| POST   | `/kiosk/call-next` | Call next patient in queue | None |
| POST   | `/kiosk/reset` | Reset kiosk queue and state | None |
| WS     | `/kiosk` | WebSocket for real-time updates | Connection required |

## FHIR Resources

| Method | Endpoint | Description | FHIR Resource |
|--------|----------|-------------|---------------|
| GET    | `/fhir/Patient` | Search patients | Patient |
| GET    | `/fhir/Patient/:id` | Get patient by ID | Patient |
| POST   | `/fhir/Patient` | Create patient | Patient |
| PUT    | `/fhir/Patient/:id` | Update patient | Patient |
| GET    | `/fhir/Observation` | Search observations | Observation |
| GET    | `/fhir/Encounter` | Search encounters | Encounter |

## eMAR (Electronic Medication Administration Record)

| Method | Endpoint | Description | Scope |
|--------|----------|-------------|-------|
| GET    | `/emar/medications` | Get patient medications | Patient context required |
| POST   | `/emar/administration` | Record medication administration | Requires nurse authentication |
| GET    | `/emar/history/:patientId` | Get administration history | Patient or practitioner |

## Clinical Records

| Method | Endpoint | Description | Access Level |
|--------|----------|-------------|--------------|
| GET    | `/clinical-record/:patientId` | Get patient clinical record | Practitioner |
| POST   | `/clinical-record/:patientId` | Add to clinical record | Practitioner |
| PUT    | `/clinical-record/:recordId` | Update clinical record | Practitioner |
| DELETE | `/clinical-record/:recordId` | Delete clinical record (soft) | Admin |

## Billing & POS

| Method | Endpoint | Description | Module |
|--------|----------|-------------|--------|
| POST   | `/billing/invoice` | Create invoice | Billing |
| GET    | `/billing/invoice/:id` | Get invoice | Billing |
| POST   | `/billing/pos/transaction` | Process POS transaction | POS |
| POST   | `/billing/pos/reconcile` | Reconcile POS transactions | POS |

## Drug Interaction Checker

| Method | Endpoint | Description | Input |
|--------|----------|-------------|-------|
| POST   | `/drug-interaction/check` | Check drug interactions | List of medications |
| GET    | `/drug-interaction/history/:patientId` | Get patient interaction history | Patient ID |

## Nursing Station

| Method | Endpoint | Description | Real-time |
|--------|----------|-------------|-----------|
| GET    | `/nursing-station/patients` | Get patients in station | Yes |
| POST   | `/nursing-station/assign` | Assign patient to bed | No |
| WS     | `/nursing-station` | Real-time patient updates | Yes |

## Sync & CRDT

| Method | Endpoint | Description | Use Case |
|--------|----------|-------------|----------|
| POST   | `/sync/update` | Apply CRDT update | Offline sync |
| GET    | `/sync/state/:documentId` | Get document state | Conflict resolution |
| POST   | `/sync/merge` | Merge multiple updates | Multi-device sync |

## Intelligence & AI

| Method | Endpoint | Description | Model |
|--------|----------|-------------|-------|
| POST   | `/intelligence/predict-readmission` | Predict patient readmission risk | ML Model |
| POST   | `/intelligence/clinical-insights` | Generate clinical insights | NLP |

## Whisper Speech-to-Text

| Method | Endpoint | Description | Input Format |
|--------|----------|-------------|--------------|
| POST   | `/whisper/transcribe` | Transcribe audio to text | WAV/MP3 file |
| GET    | `/whisper/models` | List available models | None |

## OCR Processing

| Method | Endpoint | Description | Input |
|--------|----------|-------------|-------|
| POST   | `/ocr/process` | Process image to text | Image file |
| POST   | `/ocr/medical-prescription` | Extract prescription data | Prescription image |

## Epidemiology Reporting

| Method | Endpoint | Description | Reporting Period |
|--------|----------|-------------|-----------------|
| GET    | `/epidemiology-report/daily` | Get daily epidemiology report | Daily |
| POST   | `/epidemiology-report/submit` | Submit new report | Ad-hoc |

## Peer Consultation

| Method | Endpoint | Description | Privacy |
|--------|----------|-------------|---------|
| POST   | `/peer-consult/request` | Request consultation | End-to-end encrypted |
| GET    | `/peer-consult/:id` | Get consultation details | Participant only |

## Engagement & Notifications

| Method | Endpoint | Description | Channel |
|--------|----------|-------------|---------|
| POST   | `/engagement/notify` | Send notification | SMS/Email/Push |
| GET    | `/engagement/subscriptions` | Get user subscriptions | User context |

## Consent Management

| Method | Endpoint | Description | Regulation |
|--------|----------|-------------|------------|
| GET    | `/consent-manager/status/:patientId` | Get consent status | DPDPA 2023 |
| POST   | `/consent-manager/grant` | Grant consent | DPDPA 2023 |
| POST   | `/consent-manager/revoke` | Revoke consent | DPDPA 2023 |

## ABDM (Ayushman Bharat Digital Mission)

| Method | Endpoint | Description | ABDM API |
|--------|----------|-------------|----------|
| POST   | `/abdm/health-id/create` | Create ABHA health ID | Health ID |
| GET    | `/abdm/health-record/:healthId` | Get health record | Health Record |

## Procurement

| Method | Endpoint | Description | Category |
|--------|----------|-------------|----------|
| POST   | `/procurement/order` | Create procurement order | Inventory |
| GET    | `/procurement/orders` | List orders | Inventory |

## High Alert Medication

| Method | Endpoint | Description | Alert Level |
|--------|----------|-------------|-------------|
| GET    | `/high-alert-medication/list` | List high alert medications | System-wide |
| POST   | `/high-alert-medication/override` | Override alert with reason | Practitioner |

## System Ticker

| Method | Endpoint | Description | Update Frequency |
|--------|----------|-------------|------------------|
| GET    | `/ticker` | Get system ticker messages | Real-time |
| POST   | `/ticker/broadcast` | Broadcast ticker message | Admin only |

## Audit & Monitoring

All endpoints are automatically audited. Audit logs can be queried via the database directly.

## WebSocket Endpoints

- `/kiosk` - Kiosk real-time updates
- `/nursing-station` - Nursing station patient updates
- `/sync` - Real-time document synchronization

## Authentication Notes

- JWT tokens are required for most endpoints (except public ones)
- Tokens should be included in the `Authorization` header as `Bearer <token>`
- Role-based access control (RBAC) is implemented for sensitive operations

## Rate Limiting

- Default: 100 requests per minute per IP
- Authentication endpoints: 10 requests per minute per IP
- IoT endpoints: 1000 requests per minute per device (by API key)

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["field must be a valid UUID"],
  "timestamp": "2023-01-01T12:00:00.000Z"
}
```

## Versioning

API versioning is not yet implemented. All endpoints are under `/` (v1 implied).

## Base URL

- Development: `http://localhost:3000`
- Production: `https://api.healthcare-system.example.com`

---

*Last Updated: 2025-04-11*  
*Generated from source code analysis*