export const USER_FIELDS = {
  image: "image",
  avatar: "avatar_config",
  imageType: "image_type",
};

export const USER_TYPES = {
  volunteer: "volunteer",
  learner: "learner",
};

export const LANGUAGES = {
  de: "de",
  en: "en",
};

export const SEARCHING_STATES = {
  searching: "searching",
  idle: "idle",
};

// labelling of the data fields stored in the backend
// must stay aligned with api schema otherwise requests will fail
export const API_FIELDS = {
  email: "email",
  password: "password",
  password1: "password",
  password2: "confirmPassword",
  first_name: "firstName",
  second_name: "lastName",
  birth_year: "birthYear",
  image: "image",
  newsletter_subscribed: "mailingList",
  token: "token",
  reason: "reason", // reportMatch
  other_user_hash: "otherUserHash", // reportMatch
  confirm: "acceptDeny", // partiallyConfirmMatch
  unconfirmed_match_hash: "matchId", // partiallyConfirmMatch
};

export const BACKEND_URL = "http://localhost:8000";
