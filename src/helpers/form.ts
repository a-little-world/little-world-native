import {
  FieldValues,
  MultipleFieldErrors,
  UseFormRegister,
} from 'react-hook-form';
import { TFunction } from 'react-i18next';

export const ROOT_SERVER_ERROR = 'root.serverError';
const TRY_AGAIN_ERROR = 'validation.generic_try_again';
const FILE_TOO_LARGE_ERROR = 'validation.file_too_large';

interface FormErrorParams {
  e: {
    cause: string;
    message?: string;
    status?: number;
  };
  formFields: Record<string, any>;
  setError: (
    name: string,
    error: { type: string; message?: string; types?: MultipleFieldErrors },
    options?: { shouldFocus: boolean },
  ) => void;
}

export const onFormError = ({ e, formFields, setError }: FormErrorParams) => {
  const cause = Object.keys(formFields).includes(e.cause)
    ? e.cause
    : ROOT_SERVER_ERROR;

  if (e.message) {
    setError(
      cause,
      { type: 'custom', message: e.message },
      { shouldFocus: true },
    );
  } else {
    setError(cause, {
      type: 'custom',
      message: e?.status === 413 ? FILE_TOO_LARGE_ERROR : TRY_AGAIN_ERROR,
    });
  }
};

interface RegisterInputParams {
  register: UseFormRegister<FieldValues>;
  name: string;
  options?: any;
}

export const registerInput = ({
  register,
  name,
  options,
}: RegisterInputParams) => {
  const { ref, ...rest } = register(name, options);

  return {
    ...rest,
    inputRef: ref,
  };
};

interface FormatMultiSelectionOptionsParams {
  data: Array<{ tag: string }>;
  t: TFunction;
}

export const formatMultiSelectionOptions = ({
  data,
  t,
}: FormatMultiSelectionOptionsParams) =>
  data?.map(item => ({ ...item, tag: t(item.tag) }));
