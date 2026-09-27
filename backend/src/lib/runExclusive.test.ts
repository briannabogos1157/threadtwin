import assert from 'assert';
import { describe, it } from 'node:test';
import { createExclusiveRunner } from './runExclusive';

describe('createExclusiveRunner', () => {
  it('does not start the next operation until the previous one finishes', async () => {
    const run = createExclusiveRunner();
    const order: string[] = [];

    const first = run(async () => {
      order.push('start-1');
      await new Promise((resolve) => setTimeout(resolve, 30));
      order.push('end-1');
      return 1;
    });
    const second = run(async () => {
      order.push('start-2');
      order.push('end-2');
      return 2;
    });

    const [a, b] = await Promise.all([first, second]);
    assert.deepEqual(order, ['start-1', 'end-1', 'start-2', 'end-2']);
    assert.equal(a, 1);
    assert.equal(b, 2);
  });

  it('continues the queue after a failure', async () => {
    const run = createExclusiveRunner();
    const order: string[] = [];

    const first = run(async () => {
      order.push('fail');
      throw new Error('extract failed');
    });
    const second = run(async () => {
      order.push('next');
      return 'ok';
    });

    await assert.rejects(first, /extract failed/);
    assert.equal(await second, 'ok');
    assert.deepEqual(order, ['fail', 'next']);
  });
});
