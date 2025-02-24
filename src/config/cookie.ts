export const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: Number(process.env.COOKIE_MAX_AGE) || 86400000, // 24 hours
    path: '/'
  };
  