import { API_FIELDS, USER_FIELDS, BACKEND_URL } from '@/src/constants/';
import { formatApiError } from './helpers';
import { Cookies } from '@/src/constants/CookieMock';

export const completeForm = async () => {
  const res = await fetch('/api/profile/completed/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
      'X-UseTagsOnly': 'true',
    },
  });

  const updatedUser = await res?.json();
  return updatedUser;
};

export const mutateUserData = async (formData, onSuccess, onFailure) => {
  try {
    const { image } = formData;
    let data;
    // need to handle image file differently for api request
    if (image) {
      data = new FormData();
      // eslint-disable-next-line
      for (const key in formData) {
        if (key !== USER_FIELDS.avatar) data.append(key, formData[key]);
      }
    } else {
      data = JSON.stringify(formData);
    }

    const response = await fetch('/api/profile/', {
      method: 'POST',
      headers: {
        ...(image ? {} : { 'Content-Type': 'application/json' }),
        'X-CSRFToken': Cookies.get('csrftoken'),
        'X-UseTagsOnly': 'true',
      },
      body: data,
    });

    if (response.ok) {
      const responseBody = await response?.json();
      onSuccess(responseBody);
    } else {
      if (response.status === 413)
        throw new Error('validation.image_upload_required', {
          cause: API_FIELDS.image,
        });
      const responseBody = await response?.json();
      const error = formatApiError(responseBody, response);
      throw error;
    }
  } catch (error) {
    onFailure(error);
  }
};

export const submitHelpForm = async (formData, onSuccess, onFailure) => {
  try {
    const response = await fetch('/api/help_message/', {
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'X-UseTagsOnly': true,
      },
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const responseBody = await response.json();
      onSuccess(responseBody);
    } else {
      if (response.status === 413)
        throw new Error('validation.image_upload_required');
      const responseBody = await response?.json();
      const error = formatApiError(responseBody, response);
      throw error;
    }
  } catch (error) {
    onFailure(error);
  }
};

export const fetchFormData = async ({ handleError }) => {
  try {
    const response = await fetch('/api/profile/?options=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
        'X-UseTagsOnly': 'true',
      },
    });

    const responseBody = await response?.json();
    if (response.ok) return responseBody;
    throw formatApiError(responseBody, response);
  } catch (error) {
    throw handleError?.(error);
  }
};

export const fetchUserMatch = async ({ userId }) => {
  const response = await fetch(`${BACKEND_URL}/api/profile/${userId}/match`, {
    method: 'GET',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'Content-Type': 'application/json',
    },
  });

  const responseBody = await response?.json();
  if (response.ok) return responseBody;
  throw formatApiError(responseBody, response);
};

export const postUserProfileUpdate = (
  updateData,
  onFailure,
  onSuccess,
  formTag,
) => {
  fetch(`${BACKEND_URL}/api/profile/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-UseTagsOnly': true, // This automaticly requests error tags instead of direct translations!
    },
    body: JSON.stringify(updateData),
  }).then(response => {
    const { status, statusText } = response;
    if (![200, 400].includes(status)) {
      console.error('server error', status, statusText);
    } else {
      response.json().then(report => {
        if (response.status === 200) {
          return onSuccess();
        }
        const errorTags = report[formTag];
        return onFailure(errorTags);
      });
    }
  });
};

export const login = async ({ email, password }) => {
  const response = await fetch(`${BACKEND_URL}/api/user/login/`, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'X-UseTagsOnly': 'True',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const responseBody = await response?.json();
  if (response.ok) return responseBody;
  throw formatApiError(responseBody, response);
};

export const signUp = async ({
  email,
  birthYear,
  password,
  confirmPassword,
  firstName,
  lastName,
  mailingList,
  company = null,
}) => {
  const response = await fetch(`${BACKEND_URL}/api/register/`, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'X-UseTagsOnly': 'True',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      email,
      password1: password,
      password2: confirmPassword,
      first_name: firstName,
      second_name: lastName,
      birth_year: birthYear,
      newsletter_subscribed: mailingList,
      company,
    }),
  });

  if (response.ok) return response?.json();
  const responseBody = await response?.json();
  throw formatApiError(responseBody, response);
};

export const requestPasswordReset = async ({ email }) => {
  const response = await fetch(`${BACKEND_URL}/api/user/resetpw/`, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'X-UseTagsOnly': 'True',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      email,
    }),
  });

  const responseBody = await response?.json();

  if (response.ok) return responseBody;
  throw formatApiError(responseBody, response);
};

export const resetPassword = async ({ password, token }) => {
  const response = await fetch(`${BACKEND_URL}/api/user/resetpw/confirm/`, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'X-UseTagsOnly': 'True',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      password,
      token,
    }),
  });

  const responseBody = await response?.json();
  if (response.ok) return responseBody;
  throw formatApiError(responseBody, response);
};

export const verifyEmail = async ({ verificationCode }) => {
  const response = await fetch(
    `${BACKEND_URL}/api/user/verify/email/${verificationCode}`,
    {
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'X-UseTagsOnly': 'True',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  const responseBody = await response?.json();
  if (response.ok) return responseBody;
  throw formatApiError(responseBody, response);
};

export const resendVerificationEmail = async () => {
  const response = await fetch(`${BACKEND_URL}/api/user/verify/email_resend/`, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'X-UseTagsOnly': 'True',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const responseBody = await response?.json();
  if (response.ok) return responseBody;
  throw formatApiError(responseBody, response);
};

export const setNewEmail = async ({ email }) => {
  const response = await fetch(`${BACKEND_URL}/api/user/change_email/`, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'X-UseTagsOnly': 'True',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      email,
    }),
  });

  const responseBody = await response?.json();
  if (response.ok) return responseBody;
  throw formatApiError(responseBody, response);
};

export const setNewPassword = async data => {
  const response = await fetch(`${BACKEND_URL}/api/user/changepw/`, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken'),
      'X-UseTagsOnly': 'True',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(data),
  });

  const responseBody = await response?.json();
  if (response.ok) return responseBody;
  throw formatApiError(responseBody, response);
};
