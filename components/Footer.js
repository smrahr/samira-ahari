import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import Row from "./Row";
import Reveal, { T } from "./Reveal";

const Bar = styled.footer`
  h1 {
    margin: 0;
  }
  .strike {
    font-family: var(--font-alt);
    font-weight: 400;
    font-feature-settings: "aalt" on;
    text-decoration: line-through;
  }
`;

const Contact = styled(Row)`
  font-family: var(--font-alt);
  font-weight: 400;
  font-feature-settings: "aalt" on;
  gap: 0.4em;

  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;

export default function Footer() {
  const router = useRouter();
  const isHome = router.pathname === "/";

  return (
    <Bar>
      <h1>
        <Reveal direction="top" delay={T.dob}>
          {/* <span className="strike">0000</span>&apos;831229 */}
          00989369600448
        </Reveal>
      </h1>
      <Contact>
        <Reveal direction="top" delay={T.contact}>
          Contact
        </Reveal>
        <Reveal direction="top" delay={T.arrow}>
          ➟
        </Reveal>
        <Reveal direction="left" delay={T.tg}>
          <a
            href="https://www.linkedin.com/in/samira-ahari-04149b201?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
            target="_blank"
            rel="noopener noreferrer"
          >
            LI
          </a>
        </Reveal>
        {/* <Reveal direction="left" delay={T.tw}>
          <a href="https://x.com/flowen_af" target="_blank" rel="noopener noreferrer">X</a>
        </Reveal> */}
      </Contact>
      {!isHome && (
        <Reveal direction="bottom" delay={T.returnIdx} altFont>
          <Link href="/">Return to index</Link>
        </Reveal>
      )}
    </Bar>
  );
}
