/**
 * Python Code Execution Service
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface CodeExecutionResult {
    success: boolean;
    output: string;
    errors?: string;
    executionTime: number;
    testResult?: TestResult;
}

export interface TestResult {
    passed: boolean;
    output: string;
    errors?: string;
    executionTime: number;
    testCases: TestCase[];
}

export interface TestCase {
    name: string;
    passed: boolean;
    error?: string;
}

export class PythonExecutor {
    private readonly PYTHON_TIMEOUT = 5000; // 5 seconds
    private readonly MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB
    private readonly tempDir: string;

    constructor() {
        this.tempDir = path.join(__dirname, '../../temp');
    }

    /**
     * Execute Python code without tests
     */
    async executeCode(code: string, sanitize: boolean = true): Promise<CodeExecutionResult> {
        const startTime = Date.now();

        try {
            // Create temp directory
            await fs.mkdir(this.tempDir, { recursive: true });

            // Process code to prevent blocking operations
            let processedCode = code;
            if (sanitize) {
                processedCode = this.sanitizeCode(code);
            }

            // Write code to temp file
            const tempId = uuidv4();
            const codeFile = path.join(this.tempDir, `${tempId}.py`);
            await fs.writeFile(codeFile, processedCode);

            const result = await this.runPythonFile(codeFile);

            // Cleanup
            await fs.unlink(codeFile).catch(() => { }); // Ignore cleanup errors

            return {
                ...result,
                executionTime: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                output: '',
                errors: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Execute Python code with tests
     */
    async executeCodeWithTests(code: string, exerciseId: string): Promise<CodeExecutionResult> {
        const startTime = Date.now();

        try {
            // Create temp directory
            const tempId = uuidv4();
            const exerciseTempDir = path.join(this.tempDir, tempId);
            await fs.mkdir(exerciseTempDir, { recursive: true });

            // Get test code from database
            const coreServices = (global as any).coreServices;
            const db = coreServices.database;

            const exercise = await db.get(
                'SELECT test_code FROM exercises WHERE id = ?',
                [exerciseId]
            );

            if (!exercise) {
                throw new Error('Exercise not found');
            }

            // Write user code to starter.py (so tests can import it)
            const userCodeFile = path.join(exerciseTempDir, 'starter.py');
            await fs.writeFile(userCodeFile, code);

            // Create test runner
            const testCode = this.createTestRunner(exercise.test_code);
            const testFile = path.join(exerciseTempDir, 'test_runner.py');
            await fs.writeFile(testFile, testCode);

            const result = await this.runPythonFile(testFile);
            const testResult = this.parseTestOutput(result.output, result.errors);

            // Cleanup
            await fs.rm(exerciseTempDir, { recursive: true, force: true }).catch(() => { });

            return {
                success: result.success && testResult.passed,
                output: result.output,
                errors: result.errors,
                testResult,
                executionTime: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                output: '',
                errors: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                executionTime: Date.now() - startTime,
                testResult: {
                    passed: false,
                    output: '',
                    errors: error instanceof Error ? error.message : 'Unknown error',
                    executionTime: 0,
                    testCases: [{
                        name: 'Setup',
                        passed: false,
                        error: 'Failed to set up test environment'
                    }]
                }
            };
        }
    }

    /**
     * Sanitize code to prevent blocking operations
     */
    private sanitizeCode(code: string): string {
        // Remove or comment out input() calls and __main__ blocks that might block
        let sanitized = code;

        // Comment out if __name__ == "__main__": blocks
        sanitized = sanitized.replace(
            /if\s+__name__\s*==\s*['""]__main__['""]:\s*\n((?:\s{4,}.*\n?)*)/gm,
            '# Interactive section removed for web execution\n# $&'
        );

        // Handle single line __main__ blocks
        sanitized = sanitized.replace(
            /if\s+__name__\s*==\s*['""]__main__['""]:\s*(.*)/g,
            '# Interactive section removed for web execution\n# if __name__ == "__main__": $1'
        );

        return sanitized;
    }

    /**
     * Create test runner that imports user code
     */
    private createTestRunner(testCode: string): string {
        return `
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Import user code (saved as starter.py)
try:
    import starter
except ImportError as e:
    print(f"IMPORT_ERROR: Failed to import starter module: {e}")
    sys.exit(1)
except Exception as e:
    print(f"IMPORT_ERROR: Error in starter module: {e}")
    sys.exit(1)

# Test code
${testCode}
`;
    }

    /**
     * Run Python file and capture output
     */
    private async runPythonFile(filePath: string): Promise<Omit<CodeExecutionResult, 'executionTime'>> {
        return new Promise((resolve) => {
            const outputChunks: string[] = [];
            const errorChunks: string[] = [];
            let outputSize = 0;

            // Use appropriate Python command
            const isWindows = process.platform === 'win32';
            const pythonCommand = isWindows ? 'py' : 'python3';

            const pythonProcess = spawn(pythonCommand, ['-u', filePath], {
                cwd: path.dirname(filePath),
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: this.PYTHON_TIMEOUT,
                shell: false,
                env: {
                    ...process.env,
                    PYTHONUNBUFFERED: '1',
                    PYTHONIOENCODING: 'utf-8',
                    PYTHONDONTWRITEBYTECODE: '1'
                }
            });

            // Close stdin immediately to prevent blocking
            if (pythonProcess.stdin) {
                pythonProcess.stdin.end();
            }

            pythonProcess.stdout?.on('data', (data) => {
                const chunk = data.toString('utf-8');
                outputSize += chunk.length;

                if (outputSize > this.MAX_OUTPUT_SIZE) {
                    pythonProcess.kill('SIGTERM');
                    resolve({
                        success: false,
                        output: outputChunks.join('').substring(0, this.MAX_OUTPUT_SIZE) + '\n... (output truncated)',
                        errors: 'Output too large. Consider reducing print statements.'
                    });
                    return;
                }

                outputChunks.push(chunk);
            });

            pythonProcess.stderr?.on('data', (data) => {
                errorChunks.push(data.toString('utf-8'));
            });

            pythonProcess.on('close', (code) => {
                const output = outputChunks.join('').trim();
                const errors = errorChunks.join('').trim();

                resolve({
                    success: code === 0,
                    output,
                    errors: errors || undefined
                });
            });

            pythonProcess.on('error', (error) => {
                if (error.message.includes('ENOENT')) {
                    resolve({
                        success: false,
                        output: '',
                        errors: 'Python not found. Please install Python and ensure it\'s in your PATH.'
                    });
                } else {
                    resolve({
                        success: false,
                        output: '',
                        errors: `Execution error: ${error.message}`
                    });
                }
            });

            // Timeout handler
            setTimeout(() => {
                if (!pythonProcess.killed) {
                    pythonProcess.kill('SIGTERM');
                    resolve({
                        success: false,
                        output: outputChunks.join('').trim(),
                        errors: `Code execution timed out after ${this.PYTHON_TIMEOUT / 1000}s. Check for infinite loops or input() calls.`
                    });
                }
            }, this.PYTHON_TIMEOUT);
        });
    }

    /**
     * Parse test output to extract results
     */
    private parseTestOutput(output: string, errors?: string): TestResult {
        const testResult: TestResult = {
            passed: false,
            output,
            errors,
            executionTime: 0,
            testCases: []
        };

        // Check for import errors
        if (errors && errors.includes('IMPORT_ERROR')) {
            testResult.testCases.push({
                name: 'Import Test',
                passed: false,
                error: 'Failed to import your code. Check for syntax errors.'
            });
            return testResult;
        }

        // Parse different types of test outputs
        if (output.includes('OK') && !errors) {
            testResult.passed = true;
            testResult.testCases.push({
                name: 'All Tests',
                passed: true
            });
        } else if (errors) {
            // Parse common Python errors
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
                const cleanedErrors = errors.replace(/^\s*File ".*?", line \d+, in .*?\n/gm, '')
                    .replace(/^\s*$/gm, '')
                    .trim();
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
}