import Head from 'next/head';
import styled, { keyframes } from 'styled-components';
import Header from './Header';
import Footer from './Footer';

const scaleIn = keyframes`
  from { transform: scale(0.35); }
  to   { transform: scale(1); }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1100px;
  margin: 0 auto;
  padding: 10vh 0 15vh;
  transform-origin: top center;
  animation: ${scaleIn} var(--d-slowestest) var(--ease-out) 2s both;
`;

export default function Layout({ children, title, description }) {
  return (
    <Wrapper className="wrapper">
      <Head>
        <title>{title || 'The web is boring af, lets 🌶️ it up | Samira Ahari'}</title>
        <meta name="viewport" content="width=device-width" />
        <meta
          name="description"
        // content={
        //   description ||
        //   'Freelance frontend UI developer and designer, Rou Hun Fan, working remotely for international clients'
        // }
        />
      </Head>
      <Header />
      <main>{children}</main>
      <Footer />
    </Wrapper>
  );
}
