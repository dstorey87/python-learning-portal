import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { CodeExecution, CodeExecutionResult, TestResult, APIResponse, AppError } from '../types';

const router = Router();
const PYTHON_TIMEOUT = 3000; // Reduced to 3 seconds for much faster feedback
const MAX_OUTPUT_SIZE = 512 * 1024; // Reduced to 512KB for better performance

// POST /api/execution/run - Execute Python code
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { code, exerciseId, runTests = false }: CodeExecution = req.body;

    if (!code || typeof code !== 'string') {
      throw new AppError('Code is required and must be a string', 400);
    }

    // Only log code length for monitoring, not full content for performance
    if (process.env.NODE_ENV === 'development') {
      console.log('� Executing Python code:', code.length, 'characters');
    }

    if (code.length > 50000) { // 50KB limit
      throw new AppError('Code too large', 413);
    }

    const result = await executeCode(code, exerciseId, runTests);
    
    const response: APIResponse<CodeExecutionResult> = {
      success: true,
      data: result
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Code execution failed', 500);
  }
});

async function executeCode(
  userCode: string, 
  exerciseId?: string, 
  runTests: boolean = false
): Promise<CodeExecutionResult> {
  const startTime = Date.now();
  
  try {
    // Create temporary directory
    const tempDir = path.join(__dirname, '../../temp', uuidv4());
    await fs.mkdir(tempDir, { recursive: true });

    // For learning mode, strip interactive parts to prevent input() blocking
    let processedCode = userCode;
    if (!runTests) {
      // Remove or comment out the if __name__ == "__main__": block to prevent input() blocking
      processedCode = processedCode.replace(
        /if\s+__name__\s*==\s*['""]__main__['""]:\s*\n((?:\s{4,}.*\n?)*)/gm,
        '# Interactive section removed for web execution\n# $&'
      );
      
      // Also handle cases where there's no proper indentation
      processedCode = processedCode.replace(
        /if\s+__name__\s*==\s*['""]__main__['""]:\s*(.*)/g,
        '# Interactive section removed for web execution\n# if __name__ == "__main__": $1'
      );
    }

    // Write processed code to file - use starter.py for tests to match import expectations
    const userCodeFile = path.join(tempDir, runTests ? 'starter.py' : 'user_code.py');
    await fs.writeFile(userCodeFile, processedCode);

    let result: CodeExecutionResult;

    if (runTests && exerciseId) {
      result = await runCodeWithTests(userCode, exerciseId, tempDir);
    } else {
      result = await runCodeOnly(userCodeFile);
    }

    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });

    result.executionTime = Date.now() - startTime;
    return result;

  } catch (error) {
    throw new AppError(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

async function runCodeOnly(codeFile: string): Promise<CodeExecutionResult> {
  return new Promise((resolve) => {
    let output = '';
    let errors = '';
    const startTime = Date.now();

    // Optimized Python execution - use direct python command without shell overhead
    // On Windows, py.exe is the most reliable launcher
    const isWindows = process.platform === 'win32';
    const pythonCommand = isWindows ? 'py' : 'python3';

    if (process.env.NODE_ENV === 'development') {
      console.log(`🐍 Executing Python: ${pythonCommand} ${codeFile}`);
    }

    const pythonProcess = spawn(pythonCommand, ['-u', codeFile], {
      cwd: path.dirname(codeFile),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: PYTHON_TIMEOUT,
      // Remove shell=true for better performance and security
      shell: false,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1', // Ensure real-time output
        PYTHONIOENCODING: 'utf-8', // Handle Unicode correctly
        PYTHONDONTWRITEBYTECODE: '1' // Skip .pyc files for faster startup
      }
    });

    // Immediately close stdin to prevent input() blocking
    if (pythonProcess.stdin) {
      pythonProcess.stdin.end();
    }

    // Efficient output handling - minimize string operations
    const outputChunks: string[] = [];
    const errorChunks: string[] = [];
    let outputSize = 0;

    pythonProcess.stdout?.on('data', (data) => {
      const chunk = data.toString('utf-8');
      outputSize += chunk.length;
      
      if (outputSize > MAX_OUTPUT_SIZE) {
        pythonProcess.kill('SIGTERM');
        const executionTime = Date.now() - startTime;
        resolve({
          success: false,
          output: outputChunks.join('').substring(0, MAX_OUTPUT_SIZE) + '\n... (output truncated)',
          errors: 'Output too large (>1MB). Consider reducing print statements.',
          executionTime
        });
        return;
      }
      
      outputChunks.push(chunk);
    });

    pythonProcess.stderr?.on('data', (data) => {
      errorChunks.push(data.toString('utf-8'));
    });

    pythonProcess.on('close', (code) => {
      const executionTime = Date.now() - startTime;
      output = outputChunks.join('').trim();
      errors = errorChunks.join('').trim();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`� Execution completed in ${executionTime}ms (exit code: ${code})`);
      }
      
      resolve({
        success: code === 0,
        output: output,
        errors: errors || undefined,
        executionTime
      });
    });

    pythonProcess.on('error', (error) => {
      const executionTime = Date.now() - startTime;
      
      if (error.message.includes('ENOENT')) {
        resolve({
          success: false,
          output: '',
          errors: `Python not found. Please install Python and ensure it's in your PATH.\n` +
                 `Windows users: Install from python.org\n` +
                 `Linux/Mac users: Use your system package manager`,
          executionTime
        });
      } else {
        resolve({
          success: false,
          output: '',
          errors: `Execution error: ${error.message}`,
          executionTime
        });
      }
    });

    // Handle timeout gracefully
    setTimeout(() => {
      if (!pythonProcess.killed) {
        pythonProcess.kill('SIGTERM');
        resolve({
          success: false,
          output: outputChunks.join('').trim(),
          errors: `⏱️ Code execution timed out after ${PYTHON_TIMEOUT/1000}s.\n` +
                 `This usually means:\n` +
                 `• Your code has an infinite loop\n` +
                 `• You're using input() which waits for user input\n` +
                 `• The code is taking too long to execute`,
          executionTime: PYTHON_TIMEOUT
        });
      }
    }, PYTHON_TIMEOUT);
  });
}

async function runCodeWithTests(
  userCode: string, 
  exerciseId: string, 
  tempDir: string
): Promise<CodeExecutionResult> {
  try {
    // Get test code from database
    const { getDatabase } = await import('../database/init');
    const db = getDatabase();
    
    const exercise = await db.get(
      'SELECT test_code FROM exercises WHERE id = ?', 
      [exerciseId]
    );

    if (!exercise) {
      throw new AppError('Exercise not found', 404);
    }

    // Create a modified test file that imports user code
    const testCode = `
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Import user code (saved as starter.py)
try:
    import starter
except ImportError as e:
    print(f"IMPORT_ERROR: Failed to import starter module: {e}")
    exit(1)
except Exception as e:
    print(f"IMPORT_ERROR: Error in starter module: {e}")
    exit(1)

# Test code
${exercise.test_code}
`;

    const testFile = path.join(tempDir, 'test_runner.py');
    await fs.writeFile(testFile, testCode);

    const result = await runCodeOnly(testFile);
    
    // Parse test results
    const testResult = parseTestOutput(result.output, result.errors);
    
    return {
      success: result.success && testResult.passed,
      output: result.output,
      errors: result.errors,
      testResult,
      executionTime: 0
    };

  } catch (error) {
    throw new AppError(`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

function parseTestOutput(output: string, errors?: string): TestResult {
  const testResult: TestResult = {
    passed: false,
    output,
    errors,
    executionTime: 0,
    testCases: []
  };

  if (errors && errors.includes('IMPORT_ERROR')) {
    testResult.testCases.push({
      name: 'Import Test',
      passed: false,
      error: 'Failed to import your code. Check for syntax errors.'
    });
    return testResult;
  }

  // Enhanced test result parsing
  if (output.includes('OK') && !errors) {
    testResult.passed = true;
    testResult.testCases.push({
      name: 'All Tests',
      passed: true
    });
  } else if (errors) {
    // Better error parsing for common Python errors
    const cleanedErrors = errors.replace(/^\s*File ".*?", line \d+, in .*?\n/gm, '')
                                .replace(/^\s*$/gm, '')
                                .trim();
    
    if (errors.includes('AssertionError:')) {
      const lines = errors.split('\n');
      for (const line of lines) {
        if (line.includes('AssertionError:')) {
          testResult.testCases.push({
            name: 'Test Case',
            passed: false,
            error: line.replace('AssertionError: ', '').trim()
          });
        }
      }
    } else if (errors.includes('SyntaxError:')) {
      testResult.testCases.push({
        name: 'Syntax Check',
        passed: false,
        error: 'Syntax error in your code. Please check for typos, missing colons, or incorrect indentation.'
      });
    } else if (errors.includes('NameError:')) {
      testResult.testCases.push({
        name: 'Variable Check',
        passed: false,
        error: 'Variable or function name not found. Check your spelling and make sure you defined it.'
      });
    } else if (errors.includes('IndentationError:')) {
      testResult.testCases.push({
        name: 'Indentation Check',
        passed: false,
        error: 'Indentation error. Python requires consistent indentation (use 4 spaces).'
      });
    } else {
      testResult.testCases.push({
        name: 'Execution',
        passed: false,
        error: cleanedErrors || 'Unknown test failure'
      });
    }
  } else {
    testResult.testCases.push({
      name: 'Execution',
      passed: false,
      error: 'No output from tests. Check your function implementation.'
    });
  }

  return testResult;
}

export { router as executionRoutes };