import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { CodeExecution, CodeExecutionResult, TestResult } from '@portal/types';

export class PythonExecutorService {
  private readonly PYTHON_TIMEOUT = 3000; // 3 seconds
  private readonly MAX_OUTPUT_SIZE = 512 * 1024; // 512KB
  private readonly tempDir: string;

  constructor(tempDirBase?: string) {
    this.tempDir = tempDirBase || path.join(__dirname, '../../temp');
  }

  async executeCode(request: CodeExecution): Promise<CodeExecutionResult> {
    const { code, exerciseId, runTests = false } = request;
    const startTime = Date.now();

    try {
      // Create temporary directory for this execution
      const execTempDir = path.join(this.tempDir, uuidv4());
      await fs.mkdir(execTempDir, { recursive: true });

      // For learning mode, strip interactive parts to prevent input() blocking
      let processedCode = code;
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
      const userCodeFile = path.join(execTempDir, runTests ? 'starter.py' : 'user_code.py');
      await fs.writeFile(userCodeFile, processedCode);

      let result: CodeExecutionResult;

      if (runTests && exerciseId) {
        result = await this.runCodeWithTests(code, exerciseId, execTempDir);
      } else {
        result = await this.runCodeOnly(userCodeFile);
      }

      // Cleanup
      await fs.rm(execTempDir, { recursive: true, force: true });

      result.executionTime = Date.now() - startTime;
      return result;

    } catch (error) {
      throw new Error(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runCodeOnly(codeFile: string): Promise<CodeExecutionResult> {
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
        timeout: this.PYTHON_TIMEOUT,
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

        if (outputSize > this.MAX_OUTPUT_SIZE) {
          pythonProcess.kill('SIGTERM');
          const executionTime = Date.now() - startTime;
          resolve({
            success: false,
            output: outputChunks.join('').substring(0, this.MAX_OUTPUT_SIZE) + '\n... (output truncated)',
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
          console.log(`✅ Execution completed in ${executionTime}ms (exit code: ${code})`);
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
            errors: `⏱️ Code execution timed out after ${this.PYTHON_TIMEOUT / 1000}s.\n` +
              `This usually means:\n` +
              `• Your code has an infinite loop\n` +
              `• You're using input() which waits for user input\n` +
              `• The code is taking too long to execute`,
            executionTime: this.PYTHON_TIMEOUT
          });
        }
      }, this.PYTHON_TIMEOUT);
    });
  }

  private async runCodeWithTests(
    userCode: string,
    exerciseId: string,
    tempDir: string
  ): Promise<CodeExecutionResult> {
    try {
      // For now, we'll need to get test code from the exercises package or via API
      // This is a simplified version - in production, this could call the main backend
      // or have direct access to the exercises package

      // Create a basic test runner structure
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

# Test execution would go here
# For now, just validate the import worked
print("TEST_PASS: Basic import successful")
`;

      const testFile = path.join(tempDir, 'test_runner.py');
      await fs.writeFile(testFile, testCode);

      const result = await this.runCodeOnly(testFile);

      // Parse test results
      const testResult = this.parseTestOutput(result.output, result.errors);

      return {
        success: result.success && testResult.passed,
        output: result.output,
        errors: result.errors,
        testResult,
        executionTime: 0
      };

    } catch (error) {
      throw new Error(`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseTestOutput(output: string, errors?: string): TestResult {
    const testCases: Array<{ name: string; passed: boolean; message?: string }> = [];

    if (output.includes('TEST_PASS')) {
      testCases.push({
        name: 'Import Test',
        passed: true,
        message: 'Module imported successfully'
      });
    } else {
      testCases.push({
        name: 'Import Test',
        passed: false,
        message: errors || 'Failed to import module'
      });
    }

    const passedTests = testCases.filter(tc => tc.passed).length;

    return {
      passed: passedTests === testCases.length,
      output: output,
      errors: errors,
      executionTime: 0,
      testCases
    };
  }
}