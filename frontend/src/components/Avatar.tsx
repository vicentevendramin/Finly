import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useAvatar } from '../hooks/useProfile';

interface AvatarProps {
  size?: number;
  className?: string;
}

/** The current user's avatar image, falling back to an initial on a coloured disc. */
const Avatar: React.FC<AvatarProps> = ({ size = 40, className = '' }) => {
  const user = useAuthStore((state) => state.user);
  const hasAvatar = Boolean(user?.avatarUpdatedAt);
  const { data: url } = useAvatar(hasAvatar, user?.avatarUpdatedAt);

  const initial = (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase();
  const dimension = { width: size, height: size };

  if (hasAvatar && url) {
    return (
      <img
        src={url}
        alt=""
        style={dimension}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      style={dimension}
      className={`rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {initial}
    </span>
  );
};

export default Avatar;
