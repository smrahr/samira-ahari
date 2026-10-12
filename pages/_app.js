import { useEffect } from 'react';
import GlobalStyle from '../lib/GlobalStyle';
import ThemeToggle from '../components/ThemeToggle';
import MarginChat from '../components/MarginChat';

const NAME = 'SAMIRA AHARI';
const FRAMES = Array.from({ length: NAME.length }, (_, i) => NAME.slice(0, i + 1));

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const originalTitle = document.title;
    let idx = 0;
    let interval;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        interval = setInterval(() => {
          idx = (idx + 1) % FRAMES.length;
          document.title = FRAMES[idx];
        }, 150);
      } else {
        clearInterval(interval);
        document.title = originalTitle;
        idx = 0;
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <GlobalStyle />
      <ThemeToggle />
      <MarginChat />
      <Component {...pageProps} />
    </>
  );
}
