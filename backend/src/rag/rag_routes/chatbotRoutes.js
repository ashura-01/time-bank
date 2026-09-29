import express from 'express';
import { askChatbot } from '../rag_controllers/chatbotController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.post('/ask', authenticate, askChatbot);

export default router;
