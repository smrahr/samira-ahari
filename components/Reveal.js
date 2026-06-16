import styled, { keyframes, css } from 'styled-components';

const fromTop = keyframes`from { transform: translateY(-100%); } to { transform: translate(0,0); }`;
const fromBottom = keyframes`from { transform: translateY(100%); } to { transform: translate(0,0); }`;
const fromLeft = keyframes`from { transform: translateX(-100%); } to { transform: translate(0,0); }`;
const fromRight = keyframes`from { transform: translateX(100%); } to { transform: translate(0,0); }`;

const anims = { top: fromTop, bottom: fromBottom, left: fromLeft, right: fromRight };

const Clip = styled.span`
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
  line-height: 1.2;
`;

const Inner = styled.span`
  display: inline-block;
  will-change: transform;
  animation: ${(p) => anims[p.$dir] || fromBottom} var(--d-slow) var(--ease-out) both;
  animation-delay: ${(p) => p.$delay}s;
  ${(p) =>
    p.$alt &&
    css`
      font-family: var(--font-alt);
      font-weight: 400;
      font-feature-settings: "aalt" on;
    `}
`;

export default function Reveal({ children, direction = 'bottom', delay = 0, altFont = false }) {
  return (
    <Clip>
      <Inner $dir={direction} $delay={delay} $alt={altFont}>
        {children}
      </Inner>
    </Clip>
  );
}

export const T = {
  sami: 0, ra: 0.1, aha: 0.2, ri: 0.3,
  uiDev: 0.2, design: 0.3, motion: 0.4,
  ampersand: 0.5, frontend: 0.6,
  imgProjects: 0.45, imgMe: 0.6,
  creative: 0.7, available: 0.9, availableAnswer: 1.0,
  dob: 1.25, contact: 1.5, arrow: 1.55, cv: 1.6, tg: 1.65, tw: 1.7,
  returnIdx: 0.3,
};
