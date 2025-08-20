import { createConnection, Socket } from 'net';
import { Readable } from 'stream';
import { WorkerEnv } from '../config/env';

export interface ScanResult {
  isInfected: boolean;
  virusName?: string;
  scanTime: number;
}

export class ClamAVService {
  private host: string;
  private port: number;

  constructor(env: WorkerEnv) {
    this.host = env.CLAMAV_HOST;
    this.port = env.CLAMAV_PORT;
  }

  async scanStream(stream: Readable): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      const socket = createConnection(this.port, this.host);
      const startTime = Date.now();

      socket.on('connect', () => {
        // Send INSTREAM command
        socket.write('nINSTREAM\n');
        
        // Send file data in chunks
        stream.on('data', (chunk) => {
          const size = chunk.length;
          const sizeBuffer = Buffer.alloc(4);
          sizeBuffer.writeUInt32BE(size, 0);
          socket.write(sizeBuffer);
          socket.write(chunk);
        });

        stream.on('end', () => {
          // Send zero-sized chunk to indicate end
          const zeroBuffer = Buffer.alloc(4);
          zeroBuffer.writeUInt32BE(0, 0);
          socket.write(zeroBuffer);
        });

        stream.on('error', (error) => {
          socket.destroy();
          reject(error);
        });
      });

      let response = '';
      socket.on('data', (data) => {
        response += data.toString();
      });

      socket.on('end', () => {
        const scanTime = Date.now() - startTime;
        
        if (response.includes('stream: OK')) {
          resolve({
            isInfected: false,
            scanTime,
          });
        } else if (response.includes('stream: ')) {
          const match = response.match(/stream: (.+?) FOUND/);
          const virusName = match ? match[1] : 'Unknown';
          resolve({
            isInfected: true,
            virusName,
            scanTime,
          });
        } else {
          reject(new Error(`Unexpected ClamAV response: ${response}`));
        }
      });

      socket.on('error', (error) => {
        reject(new Error(`ClamAV connection failed: ${error.message}`));
      });

      // Set timeout
      setTimeout(() => {
        socket.destroy();
        reject(new Error('ClamAV scan timeout'));
      }, 30000); // 30 seconds timeout
    });
  }

  async scanBuffer(buffer: Buffer): Promise<ScanResult> {
    const stream = Readable.from(buffer);
    return this.scanStream(stream);
  }

  async ping(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = createConnection(this.port, this.host);
      
      socket.on('connect', () => {
        socket.write('nPING\n');
      });

      socket.on('data', (data) => {
        const response = data.toString();
        socket.destroy();
        resolve(response.includes('PONG'));
      });

      socket.on('error', () => {
        resolve(false);
      });

      setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 5000);
    });
  }
}
