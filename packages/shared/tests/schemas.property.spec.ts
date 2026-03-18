import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { 
  UpdateProfileSchema, 
  SubmitGallerySchema, 
  SearchQuerySchema 
} from '../src/schemas';
import { z } from 'zod';

/**
 * Property-based tests for @vpa/shared schemas. 
 * Testing Property 15 (HTTP 422 on invalid payload handling is abstracted in schemas) 
 * and Property 19 (round-trip Zod property).
 */
describe('Zod Schemas Property-Based Testing', () => {

  it('UpdateProfileSchema: Should satisfy the round-trip property for valid inputs', () => {
    // Definimos un generador de objetos válidos según UpdateProfileSchema
    const validProfileArb = fc.record({
      username: fc.string({ minLength: 3, maxLength: 20 }).map(v => v.replace(/\s/g, 'a')), // avoid empty strings looking valid
      bio: fc.string({ maxLength: 500 }),
      timezone: fc.constantFrom('America/New_York', 'Europe/Madrid', 'Asia/Tokyo'),
      privacyMode: fc.boolean(),
      title: fc.uuid()
    });

    fc.assert(
      fc.property(validProfileArb, (profile) => {
        // Round-trip property:
        // Serialize / Deserialize yields the exact same logical object
        const parsed = UpdateProfileSchema.parse(profile);
        const serialized = JSON.stringify(parsed);
        const deserialized = JSON.parse(serialized);
        const parsedAgain = UpdateProfileSchema.parse(deserialized);

        expect(parsedAgain).toEqual(parsed);
      })
    );
  });

  it('SubmitGallerySchema: Fails property (simulated HTTP 422) when score is negative', () => {
    const invalidGalleryArb = fc.record({
      sessionId: fc.uuid(),
      results: fc.array(fc.record({
        exerciseId: fc.uuid(),
        score: fc.double({ max: -0.01 }) // Negative scores explicitly
      }), { minLength: 1 })
    });

    fc.assert(
      fc.property(invalidGalleryArb, (payload) => {
        const result = SubmitGallerySchema.safeParse(payload);
        expect(result.success).toBe(false);
      })
    );
  });

  it('SearchQuerySchema: Should fail if query is less than 3 chars', () => {
    const invalidSearchArb = fc.record({
      q: fc.string({ maxLength: 2 }),
      page: fc.integer({ min: 1 }),
      limit: fc.integer({ min: 1, max: 50 })
    });

    fc.assert(
      fc.property(invalidSearchArb, (payload) => {
        const result = SearchQuerySchema.safeParse(payload);
        expect(result.success).toBe(false);
      })
    );
  });

});
