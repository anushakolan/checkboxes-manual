const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

// Mock data endpoint for Section 1 tests
app.get('/api/checkboxes', (req, res) => {
    const checkboxes = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        isChecked: false,
        etag: `etag-${i}`
    }));
    res.json({ checkboxes });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
