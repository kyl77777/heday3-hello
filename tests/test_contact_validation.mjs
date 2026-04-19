import test from 'node:test';
import assert from 'node:assert/strict';

import { setupContactForm, validateContactForm } from '../assets/js/contact.mjs';

function createMockEnvironment(fields = {}) {
  const fieldErrors = {
    name: { textContent: '' },
    phone: { textContent: '' },
    course: { textContent: '' },
  };

  const submitBannerClasses = new Set(['form-banner']);
  const submitBanner = {
    hidden: true,
    textContent: '',
    dataset: {},
    classList: {
      add(...classNames) {
        classNames.forEach((className) => submitBannerClasses.add(className));
      },
      remove(...classNames) {
        classNames.forEach((className) => submitBannerClasses.delete(className));
      },
      contains(className) {
        return submitBannerClasses.has(className);
      },
    },
  };

  const form = {
    action: 'https://formspree.io/f/mwkgaqeo',
    method: 'POST',
    fields,
    submitHandler: null,
    resetCalled: false,
    addEventListener(eventName, handler) {
      if (eventName === 'submit') {
        this.submitHandler = handler;
      }
    },
    reset() {
      this.resetCalled = true;
      this.fields = {};
    },
  };

  const mockDocument = {
    querySelector(selector) {
      if (selector === '[data-contact-form]') {
        return form;
      }

      if (selector === '[data-submit-banner]') {
        return submitBanner;
      }

      if (selector === '[data-error="name"]') {
        return fieldErrors.name;
      }

      if (selector === '[data-error="phone"]') {
        return fieldErrors.phone;
      }

      if (selector === '[data-error="course"]') {
        return fieldErrors.course;
      }

      return null;
    },
    addEventListener() {},
  };

  return { form, submitBanner, fieldErrors, mockDocument };
}

test('validateContactForm returns only errors object for required fields', () => {
  const errors = validateContactForm({ name: '', phone: '', course: '' });

  assert.deepEqual(errors, {
    name: '성함을 입력해 주세요.',
    phone: '연락처를 입력해 주세요.',
    course: '관심 과정을 선택해 주세요.',
  });
});

test('validateContactForm rejects invalid phone format', () => {
  const errors = validateContactForm({
    name: '홍길동',
    phone: '010-12-9999',
    course: 'ai-code-basic',
  });

  assert.deepEqual(errors, {
    phone: '연락처 형식을 확인해 주세요. (예: 010-1234-5678)',
  });
});

test('validateContactForm passes with valid required values', () => {
  const errors = validateContactForm({
    name: '홍길동',
    phone: '01012345678',
    course: 'workflow-automation',
  });

  assert.deepEqual(errors, {});
});

test('setupContactForm sets field-level errors and skips submission on validation error', async () => {
  const { form, submitBanner, fieldErrors, mockDocument } = createMockEnvironment({
    name: '',
    phone: '',
    course: '',
  });

  let fetchCalled = false;
  const originalDocument = globalThis.document;
  globalThis.document = mockDocument;

  try {
    setupContactForm({
      fetchImpl: async () => {
        fetchCalled = true;
        return { ok: true };
      },
    });

    await form.submitHandler({
      preventDefault() {},
    });
  } finally {
    globalThis.document = originalDocument;
  }

  assert.equal(fetchCalled, false);
  assert.equal(submitBanner.hidden, false);
  assert.equal(submitBanner.dataset.state, 'validation');
  assert.equal(submitBanner.classList.contains('form-banner-validation'), true);
  assert.equal(submitBanner.classList.contains('form-banner-success'), false);
  assert.equal(submitBanner.classList.contains('form-banner-error'), false);
  assert.match(submitBanner.textContent, /입력 내용을 확인/);
  assert.equal(fieldErrors.name.textContent, '성함을 입력해 주세요.');
  assert.equal(fieldErrors.phone.textContent, '연락처를 입력해 주세요.');
  assert.equal(fieldErrors.course.textContent, '관심 과정을 선택해 주세요.');
});

test('setupContactForm posts to form.action and shows success in data-submit-banner', async () => {
  const { form, submitBanner, fieldErrors, mockDocument } = createMockEnvironment({
    name: '홍길동',
    phone: '010-1234-5678',
    course: 'ai-code-basic',
    message: '상담 부탁드립니다.',
  });

  let fetchArgs;
  const originalDocument = globalThis.document;
  globalThis.document = mockDocument;

  try {
    setupContactForm({
      fetchImpl: async (...args) => {
        fetchArgs = args;
        return { ok: true };
      },
    });

    await form.submitHandler({
      preventDefault() {},
    });
  } finally {
    globalThis.document = originalDocument;
  }

  assert.equal(fetchArgs[0], 'https://formspree.io/f/mwkgaqeo');
  assert.equal(fetchArgs[1].method, 'POST');
  assert.equal(submitBanner.hidden, false);
  assert.equal(submitBanner.dataset.state, 'success');
  assert.equal(submitBanner.classList.contains('form-banner-success'), true);
  assert.equal(submitBanner.classList.contains('form-banner-validation'), false);
  assert.equal(submitBanner.classList.contains('form-banner-error'), false);
  assert.match(submitBanner.textContent, /완료/);
  assert.equal(fieldErrors.name.textContent, '');
  assert.equal(fieldErrors.phone.textContent, '');
  assert.equal(fieldErrors.course.textContent, '');
});

test('setupContactForm shows submit error in data-submit-banner when submission fails', async () => {
  const { form, submitBanner, mockDocument } = createMockEnvironment({
    name: '홍길동',
    phone: '010-1234-5678',
    course: 'private-coaching',
  });

  const originalDocument = globalThis.document;
  globalThis.document = mockDocument;

  try {
    setupContactForm({
      fetchImpl: async () => ({ ok: false }),
    });

    await form.submitHandler({
      preventDefault() {},
    });
  } finally {
    globalThis.document = originalDocument;
  }

  assert.equal(submitBanner.hidden, false);
  assert.equal(submitBanner.dataset.state, 'error');
  assert.equal(submitBanner.classList.contains('form-banner-error'), true);
  assert.equal(submitBanner.classList.contains('form-banner-validation'), false);
  assert.equal(submitBanner.classList.contains('form-banner-success'), false);
  assert.match(submitBanner.textContent, /문제가 발생/);
});
