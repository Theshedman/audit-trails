// @eslint-ginore
import request from 'supertest';
import { jest } from '@jest/globals';
import { AuditTrail } from '../src/main.js';
import { Env } from '../src/utils/env.js';
import { AuditRepository } from '../src/audits/audit.repository.js';
import { type AuditQueryFilter, type AuditTrailProps, type Pagination } from '../src/types/index.js';

describe('Audit Trails', () => {
  let auditTrail: AuditTrail;
  let dbRecord: AuditTrailProps;
  let saveAuditTrail: jest.Mocked<typeof AuditRepository.prototype.save>;
  let getAllAuditTrail: jest.Mocked<typeof AuditRepository.prototype.getAll>;

  beforeEach(() => {
    auditTrail = new AuditTrail({
      host: 'localhost',
      user: 'postgres',
      database: 'postgres',
      password: 'ashedrack'
    });

    // @ts-expect-error
    saveAuditTrail = jest
      .spyOn(AuditRepository.prototype, 'save')
      .mockImplementation(async (data: AuditTrailProps): Promise<void> => {
        data.id = `${Math.floor(Math.random() * 1000000)}`;
        data.created_at = new Date();
        data.updated_at = new Date();

        dbRecord = data;
      });

    // @ts-expect-error
    getAllAuditTrail = jest
      .spyOn(AuditRepository.prototype, 'getAll')
      .mockImplementation(async (queryFilter?: AuditQueryFilter, pagination?: Pagination): Promise<AuditTrailProps[]> => {
        if (queryFilter && pagination) {
          // Left blank intentionally
        }

        if (!dbRecord) {
          dbRecord = {
            id: `${Math.floor(Math.random() * 1000000)}`,
            performed_by: '4175d9e8-2a10-4cbf-b300-b5381cd86221',
            performed_for: '057fe819-c27b-4e04-9608-0d912b64b020',
            resource: 'roles',
            resource_id: '6f3c862b-1f34-44fd-b502-93893f69750c',
            description: 'get roles',
            action: 'GET',
            role: 'user',
            endpoint: 'https://api.zigah.co/accounts/users/057fe819-c27b-4e04-9608-0d912b64b020/roles',
            status: 'successful',
            status_code: '200',
            created_at: new Date(),
            updated_at: new Date()
          };
        }

        return [dbRecord];
      });
  });

  describe('Options', () => {
    it('should have some default properties', () => {
      const options = auditTrail.getDefaultOptions();

      expect(options).toBeDefined();
      expect(options.port).toBe(5432);
      expect(options.schema_name).toBe('public');
      expect(options.table_name).toBe('audit_trails');
      expect(options.ssl).toBe(false);
    });

    it('should override any default property when its provided', () => {
      new AuditTrail({
        host: 'localhost',
        user: 'postgres',
        database: 'postgres',
        password: 'ashedrack',
        table_name: 'test_audits',
        schema_name: 'audit-trail'
      }).getServer();

      expect(Env.get('table_name')).toBe('test_audits');
      expect(Env.get('schema_name')).toBe('audit-trail');
    });

    it('should save the options as environment vairables', () => {
      new AuditTrail({
        user: 'test',
        database: 'test',
        host: 'localhost',
        password: 'ashedrack'
      }).getServer();

      expect(Env.get('host')).toBe('localhost');
      expect(Env.get('user')).toBe('test');
      expect(Env.get('database')).toBe('test');
      expect(Env.get('password')).toBe('ashedrack');
      expect(Env.get('port')).toBe(5432);
      expect(Env.get('schema_name')).toBe('public');
      expect(Env.get('table_name')).toBe('audit_trails');
    });
  });

  describe('Controller', () => {
    it('should make a GET request to return audit trails', async () => {
      const response = await request(auditTrail.getServer())
        .get('/audit-trails');

      expect(getAllAuditTrail).toHaveBeenCalled();
      expect(response.body.data).toBeDefined();
      expect(response.body.data[0].id).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Middleware', () => {
    it('should return a middleware', () => {
      const middleware = auditTrail.capture();

      expect(middleware).toBeDefined();
      expect(middleware).toBeInstanceOf(Function);
    });

    it('should intercept server http response', async () => {
      const response = await request(auditTrail.getServer())
        .post('/test')
        .send({ test: 'data' });

      expect(response.statusCode).toBe(201);
      expect(response.body.intercepted).toBeTruthy();
    });

    it('should not intercept the GET request to fetch audit trails', async () => {
      const response = await request(auditTrail.getServer())
        .get('/audit-trails');

      expect(response.body.intercepted).toBeFalsy();
    });

    it('should persist audit trail record to database', async () => {
      await request(auditTrail.getServer())
        .post('/test')
        .set('aud', '7a715934-a0a5-468c-bf15-07e78e3c028b')
        .set('role', 'user')
        .send({ audit: 'trail' });

      expect(saveAuditTrail).toHaveBeenCalled();

      expect(dbRecord.id).toBeDefined();
      expect(dbRecord.role).toBe('user');
      expect(dbRecord.resource).toBeDefined();
      expect(dbRecord.performed_by).toBe('7a715934-a0a5-468c-bf15-07e78e3c028b');
    });

    it('should have a response header called audit', async () => {
      const response = await request(auditTrail.getServer()).get('/test/data');

      expect(response.get('audit')).toBeDefined();
    });

    it('audit header should have properties: action, resource, status, resource_id, performed_for', async () => {
      const response = await request(auditTrail.getServer()).get('/test/data');
      const auditHeader = JSON.parse(response.get('audit'));

      expect(auditHeader.resource).toBe('test');
      expect(auditHeader.status).toBe('successful');
      expect(auditHeader.action).toBe('make a test request');
      expect(auditHeader.resource_id).toBe('32eebe9e-c1b4-4f65-9f95-4878b501a8a3');
      expect(auditHeader.performed_for).toBe('9c325c59-317b-43d8-b823-783c27bf49a0');
    });
  });
});
