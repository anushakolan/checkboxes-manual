const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = require('./storage');

// A4-S07 CORS configuration
app.use(cors());

app.use(express.static(path.join(__dirname, '../public')));

// A4-S06 Implement request body size limit: 1KB max
app.use(express.json({ limit: '1kb' }));

// A4-E02 Malformed request body handling
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: "Malformed request body", code: "malformed_body" });
    }
    next();
});

// A4-S05 Rate limit: 5 requests/second per client IP for GET all checkboxes
const getLimit = rateLimit({
    windowMs: 1000, 
    max: 5,
    handler: (req, res) => res.status(429).json({ error: "Rate limit exceeded", code: "rate_limit_exceeded" })
});

// A4-S04 Rate limit: 10 requests/second per client IP for PUT operations
const putLimit = rateLimit({
    windowMs: 1000, 
    max: 10,
    handler: (req, res) => res.status(429).json({ error: "Rate limit exceeded", code: "rate_limit_exceeded" })
});

app.get('/api/checkboxes', getLimit, async (req, res) => {
    try {
        const checkboxes = await storage.getAllCheckboxes();
        // A4-R03 Include Cache-Control: no-cache header
        res.setHeader('Cache-Control', 'no-cache');
        res.json({ checkboxes });
    } catch (err) {
        // A4-E06 HTTP 503 for storage unavailable
        res.status(503).json({ error: "Storage unavailable", code: "storage_unavailable" });
    }
});

const longPollingClients = new Map();

// SignalR Negotiate endpoint
app.post('/hubs/checkboxes/negotiate', (req, res) => {
    const connectionId = crypto.randomUUID();
    res.json({
        connectionId: connectionId,
        connectionToken: connectionId,
        availableTransports: [
            {
                transport: "WebSockets",
                transferFormats: ["Text"]
            },
            {
                transport: "LongPolling",
                transferFormats: ["Text"]
            }
        ]
    });
});

// SignalR Long-Polling endpoint
app.get('/hubs/checkboxes', (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).send("ID required");
    res.setHeader('Content-Type', 'text/plain;charset=UTF-8');
    
    // Support handshake over LP
    if (!longPollingClients.has(id)) {
        res.send('{}\x1e');
        return;
    }
    
    // Keep connection alive for 30s
    req.on('close', () => {
        longPollingClients.delete(id);
    });
    
    longPollingClients.set(id, res);
    setTimeout(() => {
        if (longPollingClients.has(id)) {
            // No updates within window, just return empty to maintain
            res.send('');
            longPollingClients.delete(id);
        }
    }, 25000);
});

// SignalR LP POST message endpoint
app.post('/hubs/checkboxes', (req, res) => {
    // Acknowledge LP updates (often just ignoring client messages since updates are one way)
    res.send('');
});

app.put('/api/checkboxes/:id', putLimit, async (req, res) => {
    try {
        const id = Number(req.params.id);
        
        // A4-F03, A4-S01, A4-E01 Checkbox ID must be integer 0-999
        if (!Number.isInteger(id) || id < 0 || id > 999) {
            return res.status(400).json({ error: "Invalid HTTP checkbox ID", code: "invalid_id" });
        }

        const { isChecked, etag } = req.body;
        
        // A4-F04, A4-S02, A4-S03 Validate request body content
        if (typeof isChecked !== 'boolean' || typeof etag !== 'string' || etag.trim() === '') {
            return res.status(400).json({ error: "Invalid body or missing etag", code: "invalid_body" });
        }

        const result = await storage.updateCheckbox(id, isChecked, etag);
        
        // A4-F06, A4-F05 PUT response includes new ETag
        res.setHeader('ETag', result.etag);
        
        // I5-F03 Broadcast toggle events to all connected clients after successful server update
        if (req.app.locals.broadcastCheckboxUpdate) {
            req.app.locals.broadcastCheckboxUpdate(id, result.isChecked, result.etag);
        }

        res.status(200).json({ isChecked: result.isChecked, etag: result.etag });
    } catch (err) {
        if (err.statusCode === 412) {
            // A4-E04 HTTP 412 (Precondition Failed) for ETag mismatch
            return res.status(412).json({ error: "Precondition Failed", code: "precondition_failed" });
        }
        if (err.statusCode === 404 || err.code === 'ResourceNotFound') {
            // A4-E03 HTTP 404 for checkbox ID that doesn't exist
            return res.status(404).json({ error: "Checkbox not found", code: "not_found" });
        }
        res.status(500).json({ error: err.message, code: "internal_error" });
    }
});

storage.initialize().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });

    const wss = new WebSocketServer({ noServer: true });
    
    server.on('upgrade', (request, socket, head) => {
        if (request.url.startsWith('/hubs/checkboxes')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    // Handle SignalR WebSocket Protocol
    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            const str = message.toString();
            const segments = str.split('\x1e');
            for (const segment of segments) {
                if (!segment) continue;
                try {
                    const msg = JSON.parse(segment);
                    if (msg.protocol === 'json') {
                        // Handshake response
                        ws.send('{}\x1e');
                    } else if (msg.type === 6) {
                        // Ping
                        ws.send('{"type":6}\x1e');
                    }
                } catch (e) {}
            }
        });
    });

    // Expose broadcast method for the API
    app.locals.broadcastCheckboxUpdate = (id, isChecked, etag) => {
        const payload = JSON.stringify({
            type: 1,
            target: 'CheckboxUpdated',
            arguments: [{ id, isChecked, etag }]
        }) + '\x1e';
        
        wss.clients.forEach(client => {
            if (client.readyState === 1 /* WebSocket.OPEN */) {
                client.send(payload);
            }
        });
        
        // Notify long-polling clients
        for (const [connectionId, res] of longPollingClients) {
            res.status(200).send(payload);
        }
        longPollingClients.clear();
    };

}).catch(err => {
    console.error("Failed to initialize storage", err);
    process.exit(1);
});
