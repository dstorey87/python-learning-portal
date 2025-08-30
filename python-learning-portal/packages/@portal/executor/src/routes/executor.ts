import { Router, Request, Response } from 'express';
import { PythonExecutorService } from '../services/PythonExecutorService';
import { CodeExecution, CodeExecutionResult, APIResponse } from '@portal/types';

const router = Router();
const executorService = new PythonExecutorService();

// POST /execute - Execute Python code
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const codeExecution: CodeExecution = req.body;

    // Validate request
    if (!codeExecution.code || typeof codeExecution.code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Code is required and must be a string'
      } as APIResponse<null>);
    }

    if (codeExecution.code.length > 50000) { // 50KB limit
      return res.status(413).json({
        success: false,
        error: 'Code too large'
      } as APIResponse<null>);
    }

    // Only log code length for monitoring, not full content for performance
    if (process.env.NODE_ENV === 'development') {
      console.log('🐍 Executing Python code:', codeExecution.code.length, 'characters');
    }

    const result = await executorService.executeCode(codeExecution);

    const response: APIResponse<CodeExecutionResult> = {
      success: true,
      data: result
    };

    res.json(response);
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code execution failed'
    } as APIResponse<null>);
  }
});

// GET /health - Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'python-executor',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export { router as executorRoutes };