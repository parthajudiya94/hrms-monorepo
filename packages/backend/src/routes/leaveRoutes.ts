import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getLeaveTypes,
  getLeaveBalance,
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveReport
} from '../controllers/leaveController';

const router = express.Router();

router.use(authenticate);

// Leave types and balance
router.get('/types', getLeaveTypes);
router.get('/balance', getLeaveBalance);

// Leave applications
router.post('/apply', applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/all', getAllLeaves);

// Leave actions
router.post('/:id/approve', approveLeave);
router.post('/:id/reject', rejectLeave);
router.post('/:id/cancel', cancelLeave);

// Reports
router.get('/report', getLeaveReport);

export default router;

