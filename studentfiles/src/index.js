const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = require('./storage');

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Mock data endpoint for Section 1 tests
app.get('/api/checkboxes', async (req, res) => {
    try {
        const checkboxes = await storage.getAllCheckboxes();
        res.json({ checkboxes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/checkboxes/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id < 0 || id > 999) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const { isChecked, etag } = req.body;
        if (typeof isChecked !== 'boolean' || !etag) {
            return res.status(400).json({ error: "Invalid body or missing etag" });
        }

        const result = await storage.updateCheckbox(id, isChecked, etag);
        res.status(204).end();
    } catch (err) {
        if (err.statusCode === 412) {
            return res.status(412).json({ error: "Precondition Failed" });
        }
        res.status(500).json({ error: err.message });
    }
});

storage.initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize storage", err);
    process.exit(1);
});
