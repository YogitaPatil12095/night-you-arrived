const express = require('express');
const cors = require('cors');
const pdfRoutes = require('./routes/pdf');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/pdf', pdfRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Night You Arrived PDF server listening on :${PORT}`);
});
