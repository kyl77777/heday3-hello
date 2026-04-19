const REQUIRED_MESSAGES = {
  name: '성함을 입력해 주세요.',
  phone: '연락처를 입력해 주세요.',
  course: '관심 과정을 선택해 주세요.',
};

const PHONE_FORMAT_MESSAGE = '연락처 형식을 확인해 주세요. (예: 010-1234-5678)';
const SUCCESS_MESSAGE = '상담 신청이 완료되었습니다. 확인 후 빠르게 연락드리겠습니다.';
const SUBMIT_ERROR_MESSAGE = '상담 신청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';

function normalizeFormValue(value) {
  return String(value ?? '').trim();
}

function isValidPhone(phone) {
  return /^(01[016789]|02|0[3-9][0-9])[-\s]?\d{3,4}[-\s]?\d{4}$/.test(phone);
}

export function validateContactForm(values) {
  const payload = {
    name: normalizeFormValue(values?.name),
    phone: normalizeFormValue(values?.phone),
    course: normalizeFormValue(values?.course),
  };

  const errors = {};

  Object.entries(REQUIRED_MESSAGES).forEach(([key, message]) => {
    if (!payload[key]) {
      errors[key] = message;
    }
  });

  if (!errors.phone && !isValidPhone(payload.phone)) {
    errors.phone = PHONE_FORMAT_MESSAGE;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: payload,
  };
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

  return {
    name: '',
    phone: '',
    course: '',
    message: '',
  };
}

function showBanner(banner, message, isHidden) {
  if (!banner) {
    return;
  }
  banner.hidden = isHidden;
  if (!isHidden) {
    banner.textContent = message;
  }
}

function getErrorMessage(errors) {
  const firstError = Object.values(errors)[0];
  return firstError || SUBMIT_ERROR_MESSAGE;
}

export function setupContactForm(options = {}) {
  const form = options.form || (typeof document !== 'undefined' ? document.querySelector('[data-contact-form]') : null);
  if (!form || typeof form.addEventListener !== 'function') {
    return null;
  }

  const successBanner =
    options.successBanner || (typeof document !== 'undefined' ? document.querySelector('#contact-success-banner') : null);
  const errorBanner =
    options.errorBanner || (typeof document !== 'undefined' ? document.querySelector('#contact-error-banner') : null);
  const fetchImpl = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const rawValues = collectValues(form);
    const validation = validateContactForm(rawValues);

    if (!validation.isValid) {
      showBanner(successBanner, '', true);
      showBanner(errorBanner, getErrorMessage(validation.errors), false);
      return;
    }

    if (!fetchImpl) {
      showBanner(successBanner, '', true);
      showBanner(errorBanner, SUBMIT_ERROR_MESSAGE, false);
      return;
    }

    try {
      const requestBody = form?.fields
        ? JSON.stringify({ ...validation.values, message: normalizeFormValue(rawValues.message) })
        : new FormData(form);

      const response = await fetchImpl(form.action, {
        method: form.method || 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error('submit-failed');
      }

      showBanner(errorBanner, '', true);
      showBanner(successBanner, SUCCESS_MESSAGE, false);
      if (typeof form.reset === 'function') {
        form.reset();
      }
    } catch (_error) {
      showBanner(successBanner, '', true);
      showBanner(errorBanner, SUBMIT_ERROR_MESSAGE, false);
    }
  });

  return { form, successBanner, errorBanner };
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setupContactForm();
  });
}
