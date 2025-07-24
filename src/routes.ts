export const BASE_ROUTE = '/';
export const APP_ROUTE = 'app';
export const COMMUNITY_EVENTS_ROUTE = 'events';
export const OUR_WORLD_ROUTE = 'our-world';
export const SUPPORT_US_ROUTE = 'our-world/support';
export const DONATE_ROUTE = 'our-world/donate';
export const CALL_ROUTE = 'call';
export const CALL_SETUP_ROUTE = 'call-setup/:userId?/';
export const CHAT_ROUTE = 'chat/:chatId/';
export const MESSAGES_ROUTE = 'chat';
export const NOTIFICATIONS_ROUTE = 'notifications';
export const USER_PROFILE_ROUTE = 'profile/:userId?/';
export const PROFILE_ROUTE = 'profile';
export const RESOURCES_ROUTE = 'resources';
export const PARTNERS_ROUTE = 'resources/partners';
export const TRAININGS_ROUTE = 'resources/trainings';
export const BEGINNERS_ROUTE = 'resources/beginners';
export const MY_STORY_ROUTE = 'resources/story';
export const HELP_ROUTE = 'help';
export const SETTINGS_ROUTE = 'settings';
export const LOGIN_ROUTE = 'login';
export const SIGN_UP_ROUTE = 'sign-up';
export const CHANGE_EMAIL_ROUTE = 'change-email';
export const VERIFY_EMAIL_ROUTE = 'verify-email';
export const FORGOT_PASSWORD_ROUTE = 'forgot-password';
export const RESET_PASSWORD_ROUTE = 'reset-password/:userId/:token';
export const EDIT_FORM_ROUTE = 'edit';
export const USER_FORM_ROUTE = 'user-form';
export const WP_HOME_ROUTE = 'https://home.little-world.com';
export const TERMS_ROUTE = 'nutzungsbedingungen';
export const PRIVACY_ROUTE = 'datenschutz';
export const EMAIL_PREFERENCES_ROUTE = 'email-preferences/:emailSettingsHash';
export const TEST_COMPONENT_ROUTE = 'test';

export const getHomeRoute = (locale: string, slug: string) =>
  `${WP_HOME_ROUTE}/${locale}/${slug}`;
export const getAppRoute = (slug?: string) => `/${APP_ROUTE}/${slug ?? ''}`;
export const getAppSubpageRoute = (parent: string, slug: string) =>
  getAppRoute(`${parent}/${slug}`);
export const getUserFormRoute = (slug: string) => `/${USER_FORM_ROUTE}/${slug}`;

export const isActiveRoute = (locationPath: string, path: string) =>
  locationPath === path || path !== getAppRoute('')
    ? locationPath?.includes(path)
    : false;

export const ROUTES = [
  { path: BASE_ROUTE, name: 'Home', useWeb: true },
  { path: COMMUNITY_EVENTS_ROUTE, name: 'Community Events', useWeb: true },
  { path: OUR_WORLD_ROUTE, name: 'Our World', useWeb: true },
  { path: SUPPORT_US_ROUTE, name: 'Support Us', useWeb: true },
  { path: DONATE_ROUTE, name: 'Donate', useWeb: true },
  { path: 'call-setup/[id]', name: 'Call Setup', useWeb: true },
  { path: 'chat/[chatId]', name: 'Chat', useWeb: true },
  { path: MESSAGES_ROUTE, name: 'Messages', useWeb: true },
  { path: NOTIFICATIONS_ROUTE, name: 'Notifications', useWeb: true },
  { path: 'profile/[userId]', name: 'User Profile', useWeb: true },
  { path: PROFILE_ROUTE, name: 'Profile', useWeb: true },
  { path: RESOURCES_ROUTE, name: 'Resources', useWeb: true },
  { path: PARTNERS_ROUTE, name: 'Partners', useWeb: true },
  { path: TRAININGS_ROUTE, name: 'Trainings', useWeb: true },
  { path: BEGINNERS_ROUTE, name: 'Beginners', useWeb: true },
  { path: MY_STORY_ROUTE, name: 'My Story', useWeb: true },
  { path: HELP_ROUTE, name: 'Help', useWeb: true },
  { path: SETTINGS_ROUTE, name: 'Settings', useWeb: true },
  { path: LOGIN_ROUTE, name: 'Login', useWeb: true },
  { path: SIGN_UP_ROUTE, name: 'Sign Up', useWeb: true },
  { path: CHANGE_EMAIL_ROUTE, name: 'Change Email', useWeb: true },
  { path: VERIFY_EMAIL_ROUTE, name: 'Verify Email', useWeb: true },
  { path: FORGOT_PASSWORD_ROUTE, name: 'Forgot Password', useWeb: true },
  { path: 'reset-password/[userId]/[token]', name: 'Reset Password', useWeb: true },
  { path: EDIT_FORM_ROUTE, name: 'Edit Form', useWeb: true },
  { path: USER_FORM_ROUTE, name: 'User Form', useWeb: true },
  { path: TERMS_ROUTE, name: 'Terms', useWeb: true },
  { path: PRIVACY_ROUTE, name: 'Privacy', useWeb: true },
  { path: 'email-preferences/[emailSettingsHash]', name: 'Email Preferences', useWeb: true },
  { path: TEST_COMPONENT_ROUTE, name: 'Test Component', useWeb: true },
  { path: 'faqs', name: 'Faqs', useWeb: true },
  { path: 'call/[id]', name: 'Call', useWeb: true },
];
