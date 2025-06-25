import fs from 'fs';
import path from 'path';

// File-based logger that completely bypasses Vitest's output handling
export class TestLogger {
    private logFilePath: string;

    constructor(testName: string = 'debug') {
        // Create logs directory if it doesn't exist
        const logsDir = path.join(process.cwd(), 'test-logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Create a unique log file for this test run
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        this.logFilePath = path.join(logsDir, `${testName}-${timestamp}.log`);

        // Clear any existing log file
        fs.writeFileSync(this.logFilePath, '', 'utf8');

        this.log(`Test started: ${testName} at ${new Date().toISOString()}`);
    }

    log(message: string): void {
        // Append message to log file with timestamp
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;

        // Write directly to file synchronously - bypasses all buffering
        fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
    }

    // Log with execution position for easier debugging
    logWithPosition(message: string, position: string): void {
        this.log(`${position}: ${message}`);
    }
}
