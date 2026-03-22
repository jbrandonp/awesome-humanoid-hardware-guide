import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'patients',
      columns: [
        { name: 'first_name', type: 'string' },
        { name: 'last_name', type: 'string' },
        { name: 'date_of_birth', type: 'number' },
        { name: '_status', type: 'string' }, // synced, created, updated, deleted
        { name: 'deleted_at', type: 'number', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'visits',
      columns: [
        { name: 'patient_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number' },
        { name: 'notes', type: 'string' }, // Base64 encoded Yjs update
        { name: '_status', type: 'string' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'vitals',
      columns: [
        { name: 'patient_id', type: 'string', isIndexed: true },
        { name: 'blood_pressure', type: 'string', isOptional: true },
        { name: 'heart_rate', type: 'number', isOptional: true },
        { name: 'temperature', type: 'number', isOptional: true },
        { name: 'recorded_at', type: 'number' },
        { name: '_status', type: 'string' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'prescriptions',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'patient_id', type: 'string', isIndexed: true },
        { name: 'medication_name', type: 'string' },
        { name: 'dosage', type: 'string' },
        { name: 'instructions', type: 'string', isOptional: true },
        { name: 'prescribed_at', type: 'number' },
        { name: '_status', type: 'string' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ]
    }),
  ]
})
