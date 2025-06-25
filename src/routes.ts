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
  { path: BASE_ROUTE, name: 'Home' },
  { path: LOGIN_ROUTE, name: 'Login' },
  { path: CALL_SETUP_ROUTE, name: 'Call Setup' },
];
