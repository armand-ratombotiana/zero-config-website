import express from 'express';
import {
  getEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from '../controllers/environmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/').get(getEnvironments).post(createEnvironment);

router.route('/:id').get(getEnvironment).put(updateEnvironment).delete(deleteEnvironment);

export default router;
