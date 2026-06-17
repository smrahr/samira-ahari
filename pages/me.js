import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styled from "styled-components";
import Layout from "../components/Layout";
import Reveal from "../components/Reveal";

// Full-width photo carousel, height = font-size * 3.25
const Stage = styled.div`
  position: relative;
  width: 100%;
  height: calc(var(--font-size) * 3.25);
  overflow: hidden;

  .image-container {
    position: absolute;
    inset: 0;
    opacity: 0;
  }
  .image-container.active {
    opacity: 1;
    z-index: 100;
  }
  .image-container img {
    object-fit: cover;
  }
`;

const Logo = styled.span`
  z-index: 100;
  position: absolute;
  top: 5vw;
  left: 27.5vw;
  font-family: var(--font-alt);
  font-weight: 400;
  font-feature-settings: "aalt" on;
  font-size: calc(var(--font-size) * 1.6);
  line-height: 1;
  mix-blend-mode: difference;
  pointer-events: none;
`;

const Names = styled.div`
  overflow: hidden;
  margin: 5vh 0;

  .row {
    display: flex;
    gap: 20px;
    align-items: baseline;
    flex-wrap: wrap;
    font-family: var(--font-alt);
    font-weight: 400;
    font-feature-settings: "aalt" on;
    font-size: 5vw;
  }
`;

const Block = styled.h1`
  margin: 0;

  .content {
    display: block;
    font-family: var(--font-alt);
    font-weight: 400;
    font-feature-settings: "aalt" on;
    font-size: 5vw;
    line-height: 1.15;
    margin-bottom: 5vh;
  }
  .content > span {
    display: inline;
  }
`;

const ME = [
  "/assets/img/me.png",
  ...[1, 2, 3, 4].map((n) => `/assets/img/me/me${n}.png`),
];

export default function Me() {
  const router = useRouter();
  const short = router.query.shortAnimation === '1';
  const d = (n) => (short ? 0 : n);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % ME.length);
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <Layout>
      <div style={{ position: "relative" }}>
        <Stage>
          {ME.map((src, i) => (
            <div
              key={src}
              className={`image-container ${i === active ? "active" : ""}`}
            >
              <Image
                src={src}
                alt={i === 0 ? "me" : `Me ${i}`}
                fill
                sizes="100vw"
                style={{ objectPosition: i === 0 ? "center -20px" : "center" }}
                priority={i === 0}
              />
            </div>
          ))}
        </Stage>
        <Logo>Samira</Logo>
      </div>

      <Names>
        {/* <div className="row">
          <Reveal direction="left" delay={0}>Rou Hun</Reveal>
          <Reveal direction="top" delay={0.1}>=</Reveal>
          <Reveal direction="bottom" delay={0.1}>Lowen</Reveal>
          <Reveal direction="top" delay={0.2}>=</Reveal>
          <Reveal direction="right" delay={0.2}>Flowen</Reveal>
        </div> */}
        Code that thinks
      </Names>

      <Block>
        <Reveal direction="top" delay={d(0.3)}>
          /NOW
        </Reveal>
        <span className="content">
          <Reveal direction="top" delay={d(0.45)} altFont>
            Open for contracts
          </Reveal>
        </span>
      </Block>

      <Block>
        <Reveal direction="top" delay={d(0.4)}>
          /BIO
        </Reveal>
        <span className="content">
          <Reveal direction="top" delay={d(0.6)} altFont>
            Frontend developer who builds interfaces that think. I love the
            details — performance, clean UI, and AI baked in from day one. Five
            years in, still shipping ahead of schedule.
          </Reveal>
        </span>
      </Block>

      <Block>
        <Reveal direction="top" delay={d(0.5)}>
          /FUTURE
        </Reveal>
        <span className="content">
          <Reveal direction="top" delay={d(0.7)} altFont>
            Make a ...?
          </Reveal>
        </span>
      </Block>
    </Layout>
  );
}
