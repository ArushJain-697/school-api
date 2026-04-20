const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Haversine distance (km mein)
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /addSchool
router.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validation
  if (!name || !address || latitude == null || longitude == null)
    return res.status(400).json({ error: 'All fields are required' });

  if (typeof name !== 'string' || typeof address !== 'string')
    return res.status(400).json({ error: 'Name and address must be strings' });

  if (isNaN(latitude) || isNaN(longitude))
    return res.status(400).json({ error: 'Latitude/Longitude must be numbers' });

  const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, address, latitude, longitude], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'School added!', id: result.insertId });
  });
});

// GET /listSchools?latitude=xx&longitude=yy
router.post('/listSchools', (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude))
    return res.status(400).json({ error: 'Valid latitude and longitude required' });

  db.query('SELECT * FROM schools', (err, schools) => {
    if (err) return res.status(500).json({ error: err.message });

    const sorted = schools
      .map(s => ({
        ...s,
        distance_km: calcDistance(
          parseFloat(latitude), parseFloat(longitude),
          s.latitude, s.longitude
        ).toFixed(2)
      }))
      .sort((a, b) => a.distance_km - b.distance_km);

    res.json(sorted);
  });
});

module.exports = router;