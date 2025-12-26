import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  clockIn,
  clockOut,
  breakIn,
  breakOut,
  getTodayStatus,
  getAttendance
} from '../controllers/timeTrackingController';

const router = express.Router();

router.use(authenticate);
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/break-in', breakIn);
router.post('/break-out', breakOut);
router.get('/today', getTodayStatus);
router.get('/attendance', getAttendance);

export default router;

