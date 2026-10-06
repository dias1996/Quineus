import React, { useState } from 'react';

interface CandidateAvatarProps {
  src?: string;
  alt: string;
  initials: string;
  className?: string;
  variant?: 'circle' | 'passport';
  colorClass?: string;
}

export const CandidateAvatar: React.FC<CandidateAvatarProps> = ({
  src,
  alt,
  initials,
  className = 'w-9 h-9',
  variant = 'circle',
  colorClass = 'bg-secondary-fixed text-on-secondary-fixed',
}) => {
  const [hasError, setHasError] = useState(false);

  const cleanSrc =
    src &&
    !src.includes('AB6AXuAMZfZIEs70MklTnzRmlISB3X30dUJNcOtFbIUpizpnHFetejjsvszTfFs') &&
    !src.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk')
      ? src
      : '';

  React.useEffect(() => {
    setHasError(false);
  }, [cleanSrc]);

  if (!cleanSrc || hasError) {
    if (variant === 'passport') {
      return (
        <div
          className={`${className} bg-surface-container-high flex flex-col items-center justify-center text-primary select-none`}
          title={alt}
        >
          <span className="material-symbols-outlined text-[42px] text-secondary mb-1">
            account_box
          </span>
          <span className="font-headline-sm text-label-lg font-bold text-on-surface">
            {initials}
          </span>
          <span className="font-label-sm text-[10px] text-secondary uppercase">
            3x4 ITPGQ
          </span>
        </div>
      );
    }

    return (
      <div
        className={`${className} rounded-full ${colorClass} font-bold font-label-sm text-label-sm flex items-center justify-center shrink-0 select-none`}
        title={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${className} ${
        variant === 'circle' ? 'rounded-full' : 'rounded-lg'
      } bg-surface-container overflow-hidden shrink-0 shadow-sm flex items-center justify-center`}
    >
      <img
        src={cleanSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
