import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      service: 'Training, Attendance & Assessment Service',
      group: 'SD-Group 6',
      docs: '/docs',
      health: '/health',
    };
  }
}
