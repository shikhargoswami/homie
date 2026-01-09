import express from 'express';

const router = express.Router();

// TODO: Implement user profile routes
// Stub for now to prevent import errors

router.get('/:id', (req, res) => {
  res.json({ 
    success: true, 
    data: { user: null },
    message: 'User routes not yet implemented'
  });
});

export default router;
