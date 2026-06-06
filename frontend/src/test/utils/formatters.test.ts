import { describe, it, expect } from 'vitest';
import {
  formatLKR,
  toLKRFromCents,
  toCentsFromLKR,
  formatToLocalDate,
} from '../../utils/formatters';

describe('formatters', () => {
  describe('toLKRFromCents', () => {
    it('should correctly convert cents to LKR', () => {
      expect(toLKRFromCents(100)).toBe(1);
      expect(toLKRFromCents(150)).toBe(1.5);
      expect(toLKRFromCents(10000)).toBe(100);
    });

    it('should handle strings correctly', () => {
      expect(toLKRFromCents('200')).toBe(2);
    });

    it('should handle null/undefined/empty correctly', () => {
      expect(toLKRFromCents(null)).toBe(0);
      expect(toLKRFromCents(undefined)).toBe(0);
      expect(toLKRFromCents('')).toBe(0);
    });

    it('should handle invalid input', () => {
      expect(toLKRFromCents('abc')).toBe(0);
    });
  });

  describe('toCentsFromLKR', () => {
    it('should correctly convert LKR to cents', () => {
      expect(toCentsFromLKR(1)).toBe(100);
      expect(toCentsFromLKR(1.5)).toBe(150);
      expect(toCentsFromLKR(100.55)).toBe(10055);
    });
  });

  describe('formatLKR', () => {
    it('should format numbers as currency strings', () => {
      // The exact output might depend on Node's Intl implementation,
      // but it should contain LKR and the formatted number.
      const formatted = formatLKR(1000);
      // We do a loose check as exact characters can vary (e.g. non-breaking spaces)
      expect(formatted).toMatch(/LKR/);
      expect(formatted).toMatch(/1,000/);
    });
  });

  describe('formatToLocalDate', () => {
    it('should format a valid date string', () => {
      const formatted = formatToLocalDate('2023-01-15T00:00:00Z');
      expect(formatted).toBe('Jan 15, 2023'); // assuming 'en-LK' formats like this
    });

    it('should handle empty date strings', () => {
      expect(formatToLocalDate('')).toBe('N/A');
    });
  });
});
