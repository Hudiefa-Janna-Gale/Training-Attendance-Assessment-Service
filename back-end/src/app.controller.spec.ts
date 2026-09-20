import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('describes the service and where to find docs and health', () => {
      expect(appController.getInfo()).toEqual({
        service: 'Training, Attendance & Assessment Service',
        group: 'SD-Group 6',
        docs: '/docs',
        health: '/health',
      });
    });
  });
});
