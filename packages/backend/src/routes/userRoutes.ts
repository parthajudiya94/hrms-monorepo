import express from 'express';
import { authenticate } from '../middleware/auth';
import { createUser, getUsers, getRoles } from '../controllers/userController';

const router = express.Router();

router.use(authenticate);
router.post('/', createUser);
router.get('/', getUsers);
router.get('/roles', getRoles);

export default router;

