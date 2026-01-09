import express from 'express';

const router = express.Router();

// TODO: Implement match routes in Phase 6
// Stub for now to prevent import errors

router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    data: { matches: [] },
    message: 'Match routes not yet implemented'
  });
});

export default router;
