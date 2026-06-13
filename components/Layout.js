import Head from 'next/head';
import styled from 'styled-components';
import Header from './Header';
import Footer from './Footer';

// flowen's outer wrapper: max-width 1100px, centered, padding 10vh top / 15vh bottom
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1100px;
  margin: 0 auto;
  padding: 10vh 0 15vh;
  transform-origin: top;
`;

export default function Layout({ children, title, description }) {
  return (
    <Wrapper className="wrapper">
      <Head>
        <title>{title || 'The web is boring af, lets 🌶️ it up | Rou Hun Fan'}</title>
        <meta name="viewport" content="width=device-width" />
        <meta
          name="description"
          content={
            description ||
            'Freelance frontend UI developer and designer, Rou Hun Fan, working remotely for international clients'
          }
        />
      </Head>
      <Header />
      <main>{children}</main>
      <Footer />
    </Wrapper>
  );
}
