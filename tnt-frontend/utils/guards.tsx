import { useAuthStore } from '../store/authStore';
import { router } from 'expo-router';

/**
 * Route guards and access control utilities for the TNT app.
 * Provides reusable functions for protecting routes and controlling navigation based on authentication state.
 */

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const { isAuthenticated } = useAuthStore.getState();
  return isAuthenticated;
}

/**
 * Check if user has specific role
 */
export function hasRole(requiredRole: string): boolean {
  const { role } = useAuthStore.getState();
  return role === requiredRole;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(requiredRoles: string[]): boolean {
  const { role } = useAuthStore.getState();
  return requiredRoles.includes(role || '');
}

/**
 * Guard for authenticated routes
 * Redirects to auth if not authenticated
 */
export function requireAuth(): boolean {
  if (!isAuthenticated()) {
    router.replace('/(auth)');
    return false;
  }
  return true;
}

/**
 * Guard for unauthenticated routes (auth screens)
 * Redirects to main app if already authenticated
 */
export function requireUnauth(): boolean {
  if (isAuthenticated()) {
    router.replace('/(tabs)');
    return false;
  }
  return true;
}

/**
 * Guard for role-based access
 */
export function requireRole(requiredRole: string): boolean {
  if (!requireAuth()) return false;

  if (!hasRole(requiredRole)) {
    // Could redirect to unauthorized screen or show error
    console.warn(`Access denied: required role ${requiredRole}, user has role ${useAuthStore.getState().role}`);
    router.replace('/(tabs)'); // Fallback to home
    return false;
  }

  return true;
}

/**
 * Guard for multiple roles
 */
export function requireAnyRole(requiredRoles: string[]): boolean {
  if (!requireAuth()) return false;

  if (!hasAnyRole(requiredRoles)) {
    console.warn(`Access denied: required roles ${requiredRoles.join(', ')}, user has role ${useAuthStore.getState().role}`);
    router.replace('/(tabs)');
    return false;
  }

  return true;
}

/**
 * Higher-order component for route protection
 * Usage: const ProtectedComponent = withAuthGuard(MyComponent, { requireAuth: true, role: 'admin' });
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    role?: string;
    roles?: string[];
    fallback?: React.ComponentType;
  } = {}
) {
  return function ProtectedComponent(props: P) {
    const { requireAuth: needsAuth = true, role, roles, fallback: Fallback } = options;

    // Check authentication
    if (needsAuth && !isAuthenticated()) {
      if (Fallback) {
        return <Fallback />;
      }
      router.replace('/(auth)');
      return null;
    }

    // Check role requirements
    if (role && !hasRole(role)) {
      if (Fallback) {
        return <Fallback />;
      }
      router.replace('/(tabs)');
      return null;
    }

    if (roles && !hasAnyRole(roles)) {
      if (Fallback) {
        return <Fallback />;
      }
      router.replace('/(tabs)');
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Navigation guard for programmatic navigation
 * Use before calling router.push/replace
 */
export function canNavigate(targetRoute: string): boolean {
  // Define route access rules
  const publicRoutes = ['/(auth)', '/(auth)/index', '/(auth)/otp'];
  const protectedRoutes = [
    '/(tabs)',
    '/(tabs)/index',
    '/(tabs)/food',
    '/(tabs)/stationery',
    '/(tabs)/orders',
    '/(tabs)/profile',
  ];

  const isPublicRoute = publicRoutes.some(route => targetRoute.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => targetRoute.startsWith(route));

  if (isProtectedRoute && !isAuthenticated()) {
    return false;
  }

  if (isPublicRoute && isAuthenticated()) {
    return false;
  }

  return true;
}

/**
 * Safe navigation with guards
 */
export function safeNavigate(targetRoute: string, options?: any): boolean {
  if (!canNavigate(targetRoute)) {
    console.warn(`Navigation blocked: ${targetRoute}`);
    return false;
  }

  router.push(targetRoute as any, options);
  return true;
}

/**
 * Get redirect route based on auth state
 */
export function getRedirectRoute(): string {
  if (isAuthenticated()) {
    return '/(tabs)';
  } else {
    return '/(auth)';
  }
}

/**
 * Initialize route guards (call in app startup)
 */
export function initializeGuards() {
  // Subscribe to auth state changes for automatic redirects
  const unsubscribe = useAuthStore.subscribe((state, prevState) => {
    // Handle logout scenario
    if (prevState.isAuthenticated && !state.isAuthenticated) {
      // User was logged out, redirect to auth
      router.replace('/(auth)');
    }

    // Handle login scenario
    if (!prevState.isAuthenticated && state.isAuthenticated) {
      // User logged in, redirect to main app
      router.replace('/(tabs)');
    }
  });

  return unsubscribe;
}
