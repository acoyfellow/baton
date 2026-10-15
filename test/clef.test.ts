import { describe, expect, test } from 'bun:test';
import { Effect } from 'effect';
import { ask, type ClefRequest, checkRequest, type Transport } from '../src/clef.ts';

const req: ClefRequest = {
  model: 'clef',
  state: { task: 'archive Dana' },
  images: ['data:image/jpeg;base64,AAAA'],
  questions: {
    target: { type: 'choice', instructions: 'which?', criteria: { e1: 'button "Archive"', e2: 'button "Delete"' } },
    ok: { type: 'noul', instructions: 'ok?' },
  },
};
const reply =
  (json: unknown, status = 200): Transport =>
  async () => ({ status, json, text: JSON.stringify(json) });
const good = {
  result: {
    answers: { target: { type: 'choice', choice: 'e1', probabilities: { e1: 0.9, e2: 0.1 }, confidence: 0.8 }, ok: { type: 'noul', noul: 0.7 } },
    usage: { input_tokens: 1000 },
  },
};
const run = (t: Transport, r = req) => Effect.runPromise(Effect.result(ask(t, r)));

describe('checkRequest', () => {
  test('accepts a valid request', () => expect(checkRequest(req)).toBeUndefined());
  test('rejects 5 images', () => expect(checkRequest({ ...req, images: Array(5).fill('data:image/png;base64,AA') })).toContain('4 images'));
  test('rejects remote image URLs', () => expect(checkRequest({ ...req, images: ['https://x/y.png'] })).toContain('data URLs'));
  test('rejects 256 options', () => {
    const criteria = Object.fromEntries(Array.from({ length: 256 }, (_, i) => [`o${i}`, 'x']));
    expect(checkRequest({ ...req, questions: { q: { type: 'choice', instructions: 'x', criteria } } })).toContain('255');
  });
});

describe('ask', () => {
  test('parses a gateway answer and prices it', async () => {
    const r = await run(reply(good));
    expect(r._tag).toBe('Success');
    if (r._tag === 'Success') {
      expect(r.success.answers.target).toMatchObject({ type: 'choice', choice: 'e1' });
      expect(r.success.answers.ok).toEqual({ type: 'noul', p: 0.7 });
      expect(r.success.costUsd).toBeCloseTo(0.00024, 8);
    }
  });
  test('refuses an option that was never offered', async () => {
    const bad = structuredClone(good);
    bad.result.answers.target.choice = 'e9';
    const r = await run(reply(bad));
    expect(r._tag === 'Failure' && r.failure._tag).toBe('ClefAnswerError');
  });
  test('refuses probabilities that do not sum to 1', async () => {
    const bad = structuredClone(good);
    bad.result.answers.target.probabilities = { e1: 0.9, e2: 0.9 };
    const r = await run(reply(bad));
    expect(r._tag === 'Failure' && r.failure._tag).toBe('ClefAnswerError');
  });
  test('refuses a missing answer', async () => {
    const bad = structuredClone(good) as any;
    delete bad.result.answers.ok;
    const r = await run(reply(bad));
    expect(r._tag === 'Failure' && r.failure._tag).toBe('ClefAnswerError');
  });
  test('does not call the network for a bad request', async () => {
    let called = false;
    const r = await run(
      async () => {
        called = true;
        return { status: 200, json: good, text: '' };
      },
      { ...req, questions: {} },
    );
    expect(called).toBe(false);
    expect(r._tag === 'Failure' && r.failure._tag).toBe('ClefInputError');
  });
  test('retries a 429 then succeeds', async () => {
    let n = 0;
    const r = await run(async () => (++n < 2 ? { status: 429, json: null, text: 'slow down' } : { status: 200, json: good, text: '' }));
    expect(n).toBe(2);
    expect(r._tag).toBe('Success');
  });
  test('does not retry a 401', async () => {
    let n = 0;
    const r = await run(async () => {
      n++;
      return { status: 401, json: null, text: 'no' };
    });
    expect(n).toBe(1);
    expect(r._tag === 'Failure' && r.failure._tag).toBe('ClefHttpError');
  });
});
