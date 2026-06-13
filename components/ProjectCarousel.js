import { useEffect, useState } from 'react';
import Image from 'next/image';
import styled from 'styled-components';

// c-ftKyr: position relative, full size; active slide raised; red mix-blend overlay (c-fKVoJH)
const Stage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .image-container {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity var(--d-normal) var(--ease-in-out);
  }
  .image-container.active {
    opacity: 1;
    z-index: 100;
  }
  .image-container img {
    object-fit: cover;
  }
`;

const RedOverlay = styled.div`
  z-index: 1000;
  position: absolute;
  inset: 0;
  background: red;
  mix-blend-mode: difference;
  pointer-events: none;
`;

export const PROJECTS = [
  { src: '/assets/img/projects/nova-lab-admin.svg', label: 'Nova Lab Admin Panel' },
  { src: '/assets/img/projects/deka-parcel-tracking.svg', label: 'Deka Parcel Tracking' },
  { src: '/assets/img/projects/deka-pricing.svg', label: 'Deka Pricing Panel' },
  { src: '/assets/img/projects/netpeaksell.svg', label: 'Netpeaksell' },
  { src: '/assets/img/projects/lipack-sales.svg', label: 'Lipack Sales' },
  { src: '/assets/img/projects/3click-travel.svg', label: '3click Travel' },
  { src: '/assets/img/projects/3click-support.svg', label: '3click Support' },
];

export default function ProjectCarousel({ interval = 1400 }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % PROJECTS.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return (
    <Stage>
      {PROJECTS.map((p, i) => (
        <div key={p.src} className={`image-container ${i === active ? 'active' : ''}`}>
          <Image src={p.src} alt={p.label} fill sizes="100vw" priority={i === 0} />
        </div>
      ))}
      <RedOverlay />
    </Stage>
  );
}
