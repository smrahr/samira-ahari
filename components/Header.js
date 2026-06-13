import Link from "next/link";
import styled from "styled-components";
import Row from "./Row";
import Reveal, { T } from "./Reveal";

const Bar = styled.header`
  h1 {
    width: 100%;
    justify-content: space-between;
    margin: 0;
  }
  a {
    text-decoration: none;
  }
`;

export default function Header() {
  return (
    <Bar>
      <Row as="h1">
        <Reveal direction="top" delay={T.rou}>
          <Link href="/">SAMI</Link>
        </Reveal>
        <Reveal direction="top" delay={T.hun}>
          <Link href="/">RA</Link>
        </Reveal>
        <Reveal direction="top" delay={T.fan}>
          <Link href="/">AHA</Link>
        </Reveal>
        <Reveal direction="top" delay={T.fan}>
          <Link href="/">RI</Link>
        </Reveal>
      </Row>
    </Bar>
  );
}
