import express from 'express';

const router = express.Router();

// TODO: Implement property routes in Phase 6
// Stub for now to prevent import errors

router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    data: { properties: [] },
    message: 'Property routes not yet implemented'
  });
});

export default router;
