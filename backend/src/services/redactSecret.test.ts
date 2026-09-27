import assert from 'assert';
import { describe, it } from 'node:test';
import { redactSecret } from './manus.service';

describe('redactSecret', () => {
  it('removes a secret that a client error echoed', () => {
    const secret = 'test-secret-value';
    const message = `Headers.append: "${secret}" is an invalid header value.`;
    assert.equal(
      redactSecret(message, secret),
      'Headers.append: "[redacted]" is an invalid header value.'
    );
  });

  it('leaves messages that do not contain the secret', () => {
    assert.equal(redactSecret('Manus task.create failed: 401', 'test-secret-value'), 'Manus task.create failed: 401');
    assert.equal(redactSecret('missing', undefined), 'missing');
  });
});
