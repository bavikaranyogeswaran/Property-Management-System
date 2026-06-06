import { describe, it, expect, vi } from 'vitest';
import validate from '../../middleware/validate.js';
import Joi from 'joi';

describe('Validation Middleware', () => {
  it('should call next() if validation passes', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    const req = { body: { name: 'Test' } };
    const res = {};
    const next = vi.fn();

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // called without error
    expect(req.body).toEqual({ name: 'Test' });
  });

  it('should call next() with an AppError if validation fails', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    const req = { body: {} }; // missing name
    const res = {};
    const next = vi.fn();

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('"name" is required');
  });
});
