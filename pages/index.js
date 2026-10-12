import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import Layout from "../components/Layout";
import Row from "../components/Row";
import Reveal, { T } from "../components/Reveal";
import ProjectCarousel from "../components/ProjectCarousel";

const Sheet = styled.h1`
  margin: 0;

  /* Row 1: tabs column + carousel */
  .row-projects {
    align-items: stretch;
    flex-wrap: nowrap;
  }
  .tabs {
    flex: 0 0 auto;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-self: stretch;
  }
  .stage-wrap {
    position: relative;
    flex: 0 1 100%;
    min-height: 100%;
    margin-left: 2rem;
  }
  .stage-link {
    overflow: hidden;
    display: block;
    width: 100%;
    height: 100%;
    text-decoration: none;
  }
  .projects-label {
    position: absolute;
    bottom: -20px;
    left: -10px;
    width: 100%;
    white-space: nowrap;
    font-size: 5vw;
    font-family: var(--font-alt);
    font-weight: 400;
    font-feature-settings: "aalt" on;
    z-index: 100;
    mix-blend-mode: difference;
    transform: rotate(-10deg);
    transform-origin: left bottom;
    pointer-events: none;
  }
  :root[data-theme="gold"] & .projects-label {
    mix-blend-mode: normal;
  }

  /* Row 3: me photo + creative column */
  .row-me {
    align-items: stretch;
    justify-content: space-between;
    flex-wrap: nowrap;
  }
  .me-link {
    overflow: hidden;
    position: relative;
    display: block;
    margin: 0 20px 0 0;
    width: 100%;
    text-decoration: none;
  }
  .me-inner {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
  }
  .me-inner img {
    object-fit: cover;
    object-position: center -20px;
    pointer-events: none;
  }
  .creative {
    font-family: var(--font-alt);
    font-weight: 400;
    font-feature-settings: "aalt" on;
    align-self: stretch;
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    justify-content: center;
  }
`;

export default function Home() {
  return (
    <Layout>
      <Sheet>
        <Row className="row-projects">
          <div className="tabs">
            <Reveal direction="top" delay={T.uiDev}>
              UI dev
            </Reveal>
            <Reveal direction="left" delay={T.design}>
              Design
            </Reveal>
            <Reveal direction="bottom" delay={T.motion}>
              PANEL
            </Reveal>
          </div>
          <div className="stage-wrap">
            <Link href="/projects" className="stage-link" aria-label="Projects">
              <ProjectCarousel />
            </Link>
            <span className="projects-label">Projects</span>
          </div>
        </Row>

        <Row>
          <Reveal direction="top" delay={T.ampersand} altFont>
            &amp;
          </Reveal>
          <Reveal direction="top" delay={T.frontend}>
            Frontend
          </Reveal>
        </Row>

        <Row className="row-me">
          <Link
            href="/me?shortAnimation=1"
            className="me-link"
            aria-label="About me"
          >
            <span className="me-inner">
              <Image
                src="/assets/img/me.png"
                alt="me"
                fill
                sizes="328px"
                priority
              />
            </span>
          </Link>
          <div className="creative">
            <Reveal direction="top" delay={T.creative}>
              5+ years
            </Reveal>
            <Reveal direction="bottom" delay={T.creative}>
              of helping
            </Reveal>
            <Reveal direction="bottom" delay={T.creative}>
              biz grow
            </Reveal>
          </div>
        </Row>

        <Row>
          <Reveal direction="right" delay={T.available}>
            Available:
          </Reveal>
          {" "}
          <Reveal direction="left" delay={T.availableAnswer} altFont>
            Yes LFG
          </Reveal>
        </Row>
      </Sheet>
    </Layout>
  );
}
