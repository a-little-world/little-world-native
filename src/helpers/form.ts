import {
  FieldValues,
  MultipleFieldErrors,
  UseFormRegister,
} from 'react-hook-form';
// TODO: fix this for native!
//import { TFunction } from 'react-i18next';
type TFunction = (key: string) => string;

const ROOT_SERVER_ERROR = 'root.serverError';
const TRY_AGAIN_ERROR = 'validation.generic_try_again';

interface FormErrorParams {
  e: {
    cause: string;
    message?: string;
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
      message: e.message || TRY_AGAIN_ERROR,
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
