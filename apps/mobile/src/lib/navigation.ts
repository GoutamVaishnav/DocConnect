import { router, type Href } from 'expo-router';

// A route can be opened directly from a notification, a refresh, or a deep
// link. In those cases there may be no previous entry in the navigation stack.
// Always provide a useful destination instead of leaving the back button idle.
export function goBackOr(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
