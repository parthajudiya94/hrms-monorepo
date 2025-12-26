import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPermissions,
  createPermission,
  getRolePermissions,
  updateRolePermissions
} from '../controllers/permissionController';

const router = express.Router();

router.use(authenticate);
router.get('/', getPermissions);
router.post('/', createPermission);
router.get('/role/:roleId', getRolePermissions);
router.put('/role/:roleId', updateRolePermissions);

export default router;

