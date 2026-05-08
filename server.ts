import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy Types (Match src/types.ts to avoid complex imports if needed, but we'll try importing)
import { ParkingSlot } from './src/types';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  // Authoritative State
  let slots: ParkingSlot[] = Array.from({ length: 24 }).map((_, i) => ({
    id: `S${i + 1}`,
    zone: i < 12 ? 'Zone A' : 'Zone B',
    isOccupied: Math.random() > 0.7,
    isOnline: true,
    lastUpdated: new Date(),
  }));

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial state immediately on connection
    socket.emit('slots:init', slots);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Simulated IoT event every 8 seconds to reflect real-world activity
  setInterval(() => {
    const randomIndex = Math.floor(Math.random() * slots.length);
    const prevStatus = slots[randomIndex].isOccupied;
    slots[randomIndex].isOccupied = !slots[randomIndex].isOccupied;
    slots[randomIndex].lastUpdated = new Date();
    
    // Broadcast the individual update to all clients
    io.emit('slots:update', slots[randomIndex]);
    
    console.log(`[IoT Simulation] Slot ${slots[randomIndex].id} changed: ${prevStatus} -> ${slots[randomIndex].isOccupied}`);
  }, 8000);

  // Simulated System Alerts every 45 seconds (decreased frequency)
  const alertTypes = [
    { type: 'CRITICAL', message: 'Zone A1 Capacity Critical: 95% Occupied', icon: 'AlertTriangle' },
    { type: 'ERROR', message: 'Communication Failure: Gate E_02 Sensor Timeout', icon: 'Cpu' },
    { type: 'SECURITY', message: 'Unauthorized Tailgating Detected at Exit 4', icon: 'ShieldCheck' },
    { type: 'MAINTENANCE', message: 'Battery Low: Wireless Node S-15 (Zone B)', icon: 'Cpu' }
  ];

  let alertInterval = setInterval(() => {
    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const alertData = {
      ...randomAlert,
      id: Date.now(),
      timestamp: new Date()
    };
    io.emit('system:alert', alertData);
    console.log(`[System Alert] ${randomAlert.type}: ${randomAlert.message}`);
  }, 45000);

  // Allow clients to "resolve" alerts
  io.on('connection', (socket) => {
    socket.on('alert:resolve', (alertId) => {
      console.log(`[Alert] Resolved: ${alertId}`);
      // In a real system, we might update a DB or tell the hardware to reset
    });

    socket.on('gate:reset', (gateId) => {
      console.log(`[System] Resetting gate: ${gateId}`);
      io.emit('system:alert', {
        id: Date.now(),
        type: 'SUCCESS',
        message: `System Recovery: Communication restored for ${gateId}`,
        icon: 'CheckCircle2',
        timestamp: new Date()
      });
    });
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', slotsCount: slots.length });
  });

  app.get('/api/slots', (req, res) => {
    res.json(slots);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
