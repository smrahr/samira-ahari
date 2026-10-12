import Image from 'next/image';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { PROJECTS } from '../components/ProjectCarousel';

const List = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2.5vh 0;
`;

// Fixed rotated "archive" wordmark, bottom-right, Ephidona, mix-blend difference
const ArchiveLabel = styled.div`
  z-index: 200;
  position: fixed;
  right: 50px;
  bottom: 40px;
  display: block;
  white-space: nowrap;
  font-size: 7.5vw;
  font-family: var(--font-alt);
  font-weight: 400;
  font-feature-settings: "aalt" on;
  mix-blend-mode: difference;
  transform: rotate(10deg);
  pointer-events: none;
`;

const Row = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 5vh;
`;

const Frame = styled.div`
  position: relative;
  width: 100%;
  border: 3px solid var(--fg);
  cursor: pointer;
`;

const Inner = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;

  img {
    width: 100% !important;
    height: auto !important;
    object-fit: cover;
    aspect-ratio: 20 / 9;
    transition: transform var(--d-slow) var(--ease-out);
  }
  &:hover img {
    transform: scale(1.1);
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

// Layered project name: base + black/white offset duplicates (data-name) via mix-blend
const Name = styled.h2`
  z-index: 500;
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  margin: 0;
  font-size: 5vw;
  white-space: nowrap;
  mix-blend-mode: difference;
  pointer-events: none;

  &::before,
  &::after {
    content: attr(data-name);
    position: absolute;
    bottom: 3px;
    left: 3px;
    white-space: nowrap;
    mix-blend-mode: difference;
  }
  &::before {
    z-index: 500;
    background-color: black;
  }
  &::after {
    z-index: 500;
    background-color: white;
  }
`;

export default function Projects() {
  return (
    <Layout
    // title="Projects | Rou Hun Fan | Frontend Developer & Designer"
    >
      <List>
        {PROJECTS.map((p) => (
          <Row key={p.src}>
            <Frame
              as={p.url ? 'a' : 'div'}
              href={p.url}
              target={p.url ? '_blank' : undefined}
              rel={p.url ? 'noopener noreferrer' : undefined}
            >
              <Inner>
                <Image src={p.src} alt={p.label} width={2000} height={900} sizes="100vw" />
              </Inner>
              <RedOverlay />
              <Name data-name={p.label}>{p.label}</Name>
            </Frame>
          </Row>
        ))}
      </List>
      <ArchiveLabel>archive</ArchiveLabel>
    </Layout>
  );
}
