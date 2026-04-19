import test from 'node:test';
import assert from 'node:assert/strict';

import { setupContactForm, validateContactForm } from '../assets/js/contact.mjs';

function createMockEnvironment(fields = {}) {
  const form = {
    fields,
    submitHandler: null,
    addEventListener(eventName, handler) {
      if (eventName === 'submit') {
        this.submitHandler = handler;
      }
    },
  };

  const successBanner = { hidden: true, textContent: '' };
  const errorBanner = { hidden: true, textContent: '' };

  return { form, successBanner, errorBanner };
}

test('validateContactForm returns errors for required fields', () => {
  const result = validateContactForm({ name: '', phone: '', course: '' });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.name, '성함을 입력해 주세요.');
  assert.equal(result.errors.phone, '연락처를 입력해 주세요.');
  assert.equal(result.errors.course, '관심 과정을 선택해 주세요.');
});

test('validateContactForm rejects invalid phone format', () => {
  const result = validateContactForm({
    name: '홍길동',
    phone: '010-12-9999',
    course: 'ai-code-basic',
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.phone, '연락처 형식을 확인해 주세요. (예: 010-1234-5678)');
});

test('validateContactForm passes with valid required values', () => {
  const result = validateContactForm({
    name: '홍길동',
    phone: '01012345678',
    course: 'workflow-automation',
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
});

test('setupContactForm shows error banner and skips submission on validation error', async () => {
  const { form, successBanner, errorBanner } = createMockEnvironment({
    name: '',
    phone: '',
    course: '',
  });

  let fetchCalled = false;

  setupContactForm({
    form,
    successBanner,
    errorBanner,
    fetchImpl: async () => {
      fetchCalled = true;
      return { ok: true };
    },
  });

  await form.submitHandler({
    preventDefault() {},
  });

  assert.equal(fetchCalled, false);
  assert.equal(successBanner.hidden, true);
  assert.equal(errorBanner.hidden, false);
  assert.match(errorBanner.textContent, /성함/);
});

test('setupContactForm shows success banner on successful submission', async () => {
  const { form, successBanner, errorBanner } = createMockEnvironment({
    name: '홍길동',
    phone: '010-1234-5678',
    course: 'ai-code-basic',
    message: '상담 부탁드립니다.',
  });

  setupContactForm({
    form,
    successBanner,
    errorBanner,
    fetchImpl: async () => ({ ok: true }),
  });

  await form.submitHandler({
    preventDefault() {},
  });

  assert.equal(successBanner.hidden, false);
  assert.equal(errorBanner.hidden, true);
  assert.match(successBanner.textContent, /완료/);
});

test('setupContactForm shows error banner when submission fails', async () => {
  const { form, successBanner, errorBanner } = createMockEnvironment({
    name: '홍길동',
    phone: '010-1234-5678',
    course: 'private-coaching',
  });

  setupContactForm({
    form,
    successBanner,
    errorBanner,
    fetchImpl: async () => ({ ok: false }),
  });

  await form.submitHandler({
    preventDefault() {},
  });

  assert.equal(successBanner.hidden, true);
  assert.equal(errorBanner.hidden, false);
  assert.match(errorBanner.textContent, /문제가 발생/);
});
