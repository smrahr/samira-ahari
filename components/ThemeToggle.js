import { useEffect, useState } from 'react';
import styled from 'styled-components';

const STORAGE_KEY = 'theme';

const Button = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--fg);
  cursor: pointer;
  transition: transform var(--d-normal) var(--ease-bounce),
    color var(--d-slow) var(--ease-out);

  &:hover {
    transform: rotate(45deg) scale(1.1);
  }

  outline: none;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    filter: drop-shadow(0 0 6px var(--yellow));
  }

  svg {
    width: 32px;
    height: 32px;
  }
`;

export default function ThemeToggle() {
  const [gold, setGold] = useState(false);

  useEffect(() => {
    setGold(document.documentElement.dataset.theme === 'gold');
  }, []);

  const toggle = () => {
    const next = !gold;
    setGold(next);
    if (next) document.documentElement.dataset.theme = 'gold';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'gold' : 'dark');
    } catch (e) {}
  };

  return (
    <Button
      type="button"
      onClick={toggle}
      aria-pressed={gold}
      aria-label={gold ? 'Switch to dark background' : 'Switch to gold background'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {gold ? (
          <g stroke="none">
            <defs>
              <radialGradient id="moon-surface" cx="38%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#fbf8ee" />
                <stop offset="65%" stopColor="#e3ddcc" />
                <stop offset="100%" stopColor="#a9a290" />
              </radialGradient>
              <clipPath id="moon-disc">
                <circle cx="12" cy="12" r="9.5" />
              </clipPath>
            </defs>
            <circle cx="12" cy="12" r="9.5" fill="url(#moon-surface)" />
            <g clipPath="url(#moon-disc)" fill="#8f8877">
              {/* maria (dark plains) */}
              <path d="M6.5 8.2c1.3-1.6 3.7-1.9 5-.6 1 1-.1 2.3-1.6 2.6-1.2.3-1.6 1.5-2.8 1.3-1.3-.3-1.6-2-.6-3.3z" opacity=".55" />
              <path d="M12.8 10.8c1.5-.9 3.9-.4 4.6 1.2.6 1.4-.6 2.6-2.1 2.4-1.1-.1-1.6.8-2.7.4-1.2-.5-1-3.1.2-4z" opacity=".5" />
              <path d="M8.2 13.6c.9-.5 2.2-.2 2.5.8.3.9-.5 1.9-1.6 1.9-1.1 0-1.9-1.9-.9-2.7z" opacity=".45" />
              {/* craters */}
              <circle cx="15.8" cy="7.2" r="1.1" opacity=".55" />
              <circle cx="11.3" cy="17.4" r="1.3" opacity=".5" />
              <circle cx="6.4" cy="12.6" r=".6" opacity=".6" />
              <circle cx="17.6" cy="15.8" r=".7" opacity=".55" />
            </g>
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="#000" strokeOpacity=".15" strokeWidth=".6" />
          </g>
        ) : (
          <g stroke="none">
            <defs>
              <radialGradient id="sun-core" cx="40%" cy="38%" r="70%">
                <stop offset="0%" stopColor="#fffbe0" />
                <stop offset="45%" stopColor="#ffd84a" />
                <stop offset="100%" stopColor="#f59e0b" />
              </radialGradient>
              <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
                <stop offset="40%" stopColor="#ffcf3f" stopOpacity=".55" />
                <stop offset="100%" stopColor="#ffcf3f" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sun-ray" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffe27a" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="11.5" fill="url(#sun-glow)" />
            {/* tapered rays: 8 long + 8 short */}
            {Array.from({ length: 16 }, (_, i) => (
              <path
                key={i}
                d={i % 2 ? 'M12 1.6 13 5.4H11z' : 'M12 .3l1.3 5.1h-2.6z'}
                fill="url(#sun-ray)"
                transform={`rotate(${i * 22.5} 12 12)`}
              />
            ))}
            <circle cx="12" cy="12" r="6" fill="url(#sun-core)" />
          </g>
        )}
      </svg>
    </Button>
  );
}
