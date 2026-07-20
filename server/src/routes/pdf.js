const express = require('express');
const { generateCardPdf } = require('../pdf/generateCardPdf');

const router = express.Router();

function validateCard(body) {
  const errors = [];
  if (!body.recipientName || typeof body.recipientName !== 'string') errors.push('recipientName is required');
  if (!body.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)) errors.push('birthDate must be YYYY-MM-DD');
  if (body.birthTime && !/^\d{2}:\d{2}$/.test(body.birthTime)) errors.push('birthTime must be HH:MM');
  if (!body.location || typeof body.location.lat !== 'number' || typeof body.location.lon !== 'number') {
    errors.push('location.lat and location.lon are required numbers');
  }
  if (!body.theme) errors.push('theme is required');
  return errors;
}

router.post('/generate', async (req, res) => {
  const errors = validateCard(req.body || {});
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  try {
    const pdfBuffer = await generateCardPdf(req.body);
    const filename = `${(req.body.recipientName || 'card').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-night-you-arrived.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

module.exports = router;
