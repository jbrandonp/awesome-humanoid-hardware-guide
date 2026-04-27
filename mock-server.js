const http = require('http');
const url = require('url');

// Mock data matching the API responses
const mockBeds = [
  {
    id: 'bed-1',
    roomNumber: '101A',
    bedType: 'STANDARD',
    status: 'OCCUPIED',
    currentPatientId: 'patient-1',
    features: ['OXYGEN', 'MONITOR'],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bed-2',
    roomNumber: '101B',
    bedType: 'GENERAL',
    status: 'AVAILABLE',
    currentPatientId: null,
    features: ['OXYGEN'],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bed-3',
    roomNumber: '102A',
    bedType: 'ICU',
    status: 'OCCUPIED',
    currentPatientId: 'patient-2',
    features: ['VENTILATOR', 'MONITOR', 'DEFIBRILLATOR'],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockPatients = [
  {
    id: 'patient-1',
    firstName: 'Jean',
    lastName: 'Dupont',
    dateOfBirth: new Date('1950-05-15').toISOString(),
    phone: '+33123456789',
    otp: null,
    otpExpiresAt: null,
    zipCode: '75001',
    status: 'created',
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'patient-2',
    firstName: 'Marie',
    lastName: 'Leroy',
    dateOfBirth: new Date('1965-08-22').toISOString(),
    phone: '+33198765432',
    otp: null,
    otpExpiresAt: null,
    zipCode: '75002',
    status: 'created',
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockVitals = [
  {
    id: 'vital-1',
    patientId: 'patient-1',
    bloodPressure: '120/80',
    heartRate: 72,
    temperature: 36.6,
    glucose: 5.2,
    recordedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'created',
    deletedAt: null,
  },
  {
    id: 'vital-2',
    patientId: 'patient-1',
    bloodPressure: '118/78',
    heartRate: 70,
    temperature: 36.8,
    glucose: 5.0,
    recordedAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'created',
    deletedAt: null,
  },
  {
    id: 'vital-3',
    patientId: 'patient-2',
    bloodPressure: '135/85',
    heartRate: 80,
    temperature: 37.2,
    glucose: 6.1,
    recordedAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'created',
    deletedAt: null,
  },
];

const mockAlerts = [
  {
    id: 'RPM-1744521600000-test-uuid',
    patientId: 'patient-1',
    type: 'SYSTEM',
    message: '🚨 ALERTE CLINIQUE (HAUTE PRIORITÉ) : Le patient a une Tension Systolique critique de 185 mmHg sur 2 mesures consécutives.',
    timestamp: new Date().toISOString(),
    systolicMmHg: 185,
    diastolicMmHg: 110,
    pulseRateBpm: 95,
  },
];

const mockQueue = [
  {
    patientId: 'patient-1',
    esiScore: 2,
    arrivalTime: new Date(Date.now() - 300000).toISOString(),
    input: {
      age: 65,
      spO2: 94,
      heartRate: 88,
      temperature: 37.8,
      systolicBP: 150,
      diastolicBP: 95,
      painScale: 7,
      chiefComplaint: 'Douleur thoracique',
      estimatedResources: 2,
    },
    isOverridden: false,
  },
  {
    patientId: 'patient-2',
    esiScore: 4,
    arrivalTime: new Date(Date.now() - 600000).toISOString(),
    input: {
      age: 40,
      spO2: 98,
      heartRate: 72,
      temperature: 36.9,
      systolicBP: 120,
      diastolicBP: 80,
      painScale: 2,
      chiefComplaint: 'Consultation de routine',
      estimatedResources: 1,
    },
    isOverridden: false,
  },
];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health endpoint
  if (pathname === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Nursing station endpoints
  if (pathname === '/nursing-station/beds' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockBeds));
    return;
  }

  if (pathname.startsWith('/nursing-station/beds/') && method === 'GET') {
    const id = pathname.split('/')[3];
    const bed = mockBeds.find(b => b.id === id);
    if (bed) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(bed));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bed not found' }));
    }
    return;
  }

  if (pathname.startsWith('/nursing-station/beds/') && pathname.endsWith('/status') && method === 'PUT') {
    const id = pathname.split('/')[3];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const bedIndex = mockBeds.findIndex(b => b.id === id);
        if (bedIndex >= 0) {
          mockBeds[bedIndex].status = data.status;
          mockBeds[bedIndex].updatedAt = new Date().toISOString();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(mockBeds[bedIndex]));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Bed not found' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (pathname === '/nursing-station/patients' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockPatients));
    return;
  }

  // Remote patient monitoring endpoints
  if (pathname === '/remote-patient-monitoring/vitals' && method === 'GET') {
    const patientId = parsedUrl.query.patientId;
    let vitals = mockVitals;
    if (patientId) {
      vitals = mockVitals.filter(v => v.patientId === patientId);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(vitals));
    return;
  }

  if (pathname.startsWith('/remote-patient-monitoring/vitals/latest/') && method === 'GET') {
    const patientId = pathname.split('/')[4];
    const vitals = mockVitals.filter(v => v.patientId === patientId);
    const latest = vitals.length > 0 ? vitals.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0] : null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latest));
    return;
  }

  if (pathname === '/remote-patient-monitoring/alerts' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockAlerts));
    return;
  }

  // Queue endpoints
  if (pathname === '/queue' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockQueue));
    return;
  }

  if (pathname === '/queue/add' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newEntry = {
          patientId: data.patientId,
          esiScore: 3, // default score
          arrivalTime: new Date().toISOString(),
          input: data.input,
          isOverridden: false,
        };
        mockQueue.push(newEntry);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newEntry));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/queue/') && pathname.endsWith('/override') && method === 'PUT') {
    const patientId = pathname.split('/')[2];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const entryIndex = mockQueue.findIndex(q => q.patientId === patientId);
        if (entryIndex >= 0) {
          mockQueue[entryIndex].esiScore = data.newScore;
          mockQueue[entryIndex].isOverridden = true;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(mockQueue[entryIndex]));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Patient not found in queue' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down mock server...');
  server.close(() => {
    process.exit(0);
  });
});