import 'next-auth';

/**
 * Extend the default NextAuth Session and User interfaces
 * to include custom properties (id and role) used in our app
 */
declare module 'next-auth' {
  // Adds `id` and `role` to user object within session
  interface Session {
    user: {
      id: string;
      email: string;
      role: string; // User role (e.g. carer, family, management)
      name?: string;
    };
  }
  // Adds `id` and `role` to User object returned by NextAuth
  interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
  }
}
// Allows storing `id` and `role` in JWT token for session callbacks
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
