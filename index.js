// App entry point.
//
// The FCM background message handler and the notifee background event handler
// must both be registered before the router entry evaluates: a data-only FCM
// message delivered to a backgrounded or killed app is handed to those handlers
// and nowhere else, and that message is the only thing that rings the phone for
// an incoming call. CommonJS requires are used deliberately so that neither the
// import sorter nor ES module hoisting can reorder these two lines.
require('./src/utils/registerBackgroundHandlers');

require('expo-router/entry');
