// Permanent super administrators. They are the only people who can grant or
// revoke super-admin access, and they can never be demoted or removed.
// The database and the admin function enforce this too; this list only drives the UI.
export const PLATFORM_OWNERS = ['vincentnogue2@gmail.com', 'vincentnogue@yahoo.com'];

export const isPlatformOwner = (email) =>
  PLATFORM_OWNERS.includes(String(email || '').trim().toLowerCase());
