const REQUIRED_MESSAGES = {
  name: '성함을 입력해 주세요.',
  phone: '연락처를 입력해 주세요.',
  course: '관심 과정을 선택해 주세요.',
};

const PHONE_FORMAT_MESSAGE = '연락처 형식을 확인해 주세요. (예: 010-1234-5678)';
const SUCCESS_MESSAGE = '상담 신청이 완료되었습니다. 확인 후 빠르게 연락드리겠습니다.';
const VALIDATION_ERROR_MESSAGE = '입력 내용을 확인해 주세요.';
const SUBMIT_ERROR_MESSAGE = '상담 신청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';

function normalizeFormValue(value) {
  return String(value ?? '').trim();
}

function isValidPhone(phone) {
  return /^(01[016789]|02|0[3-9][0-9])[-\s]?\d{3,4}[-\s]?\d{4}$/.test(phone);
}

export function validateContactForm(values = {}) {
  const normalized = {
    name: normalizeFormValue(values.name),
    phone: normalizeFormValue(values.phone),
    course: normalizeFormValue(values.course),
  };

  const errors = {};

  Object.entries(REQUIRED_MESSAGES).forEach(([key, message]) => {
    if (!normalized[key]) {
      errors[key] = message;
    }
  });

  if (!errors.phone && !isValidPhone(normalized.phone)) {
    errors.phone = PHONE_FORMAT_MESSAGE;
  }

  return errors;
}

function collectValues(form) {
  if (form?.fields) {
    return {
      name: form.fields.name,
      phone: form.fields.phone,
      course: form.fields.course,
      message: form.fields.message,
    };
  }

  if (typeof FormData !== 'undefined' && form) {
    const formData = new FormData(form);
    return {
      name: formData.get('name'),
      phone: formData.get('phone'),
      course: formData.get('course'),
      message: formData.get('message'),
    };
  }

  return { name: '', phone: '', course: '', message: '' };
}

function getErrorNode(form, fieldName) {
  if (typeof form?.querySelector === 'function') {
    return form.querySelector(`[data-error="${fieldName}"]`);
  }

  if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
    return document.querySelector(`[data-error="${fieldName}"]`);
  }

  return null;
}

function clearFieldErrors(form) {
  Object.keys(REQUIRED_MESSAGES).forEach((fieldName) => {
    const node = getErrorNode(form, fieldName);
    if (node) {
      node.textContent = '';
    }
  });
}

function setFieldErrors(form, errors) {
  clearFieldErrors(form);

  Object.entries(errors).forEach(([fieldName, message]) => {
    const node = getErrorNode(form, fieldName);
    if (node) {
      node.textContent = message;
    }
  });
}

function showSubmitBanner(submitBanner, message) {
  if (!submitBanner) {
    return;
  }

  submitBanner.hidden = false;
  submitBanner.textContent = message;
}

function createRequestBody(form, rawValues) {
  if (form?.fields) {
    return JSON.stringify({
      name: normalizeFormValue(rawValues.name),
      phone: normalizeFormValue(rawValues.phone),
      course: normalizeFormValue(rawValues.course),
      message: normalizeFormValue(rawValues.message),
    });
  }

  return new FormData(form);
}

export function setupContactForm(options = {}) {
  const form = options.form || (typeof document !== 'undefined' ? document.querySelector('[data-contact-form]') : null);
  if (!form || typeof form.addEventListener !== 'function') {
    return null;
  }

  const submitBanner =
    options.submitBanner || (typeof document !== 'undefined' ? document.querySelector('[data-submit-banner]') : null);
  const fetchImpl = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const rawValues = collectValues(form);
    const errors = validateContactForm(rawValues);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(form, errors);
      showSubmitBanner(submitBanner, VALIDATION_ERROR_MESSAGE);
      return;
    }

    clearFieldErrors(form);

    if (!fetchImpl) {
      showSubmitBanner(submitBanner, SUBMIT_ERROR_MESSAGE);
      return;
    }

    try {
      const response = await fetchImpl(form.action, {
        method: form.method || 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: createRequestBody(form, rawValues),
      });

      if (!response.ok) {
        throw new Error('submit-failed');
      }

      showSubmitBanner(submitBanner, SUCCESS_MESSAGE);
      if (typeof form.reset === 'function') {
        form.reset();
      }
    } catch (_error) {
      showSubmitBanner(submitBanner, SUBMIT_ERROR_MESSAGE);
    }
  });

  return { form, submitBanner };
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setupContactForm();
  });
}
