import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  :root {
    --yellow: #f0f26a;
    --magenta: #e82f5c;
    --pink: #ffa8a8;
    --white: #fff;
    --dark: #161b1b;
    --grey: #b3aba4;

    --font-base: "AzeretMono Black", monospace, Arial, -apple-system, BlinkMacSystemFont;
    --font-alt: "Ephidona", monospace, Arial, -apple-system, BlinkMacSystemFont;

    --ease-in: cubic-bezier(.895, .03, .685, .22);
    --ease-out: cubic-bezier(.165, .84, .44, 1);
    --ease-in-out: cubic-bezier(.64, .04, .35, 1);
    --ease-bounce: cubic-bezier(.175, .885, .32, 1.275);

    --d-fast: .125s;
    --d-normal: .25s;
    --d-slow: .5s;
    --d-slower: 1.5s;
    --d-slowest: 2.25s;
    --d-slowestest: 5s;
  }

  @font-face {
    font-family: "AzeretMono Black";
    src: local("AzeretMono Black"), local("AzeretMono-Black"),
      url(/assets/fonts/AzeretMono-Black.woff2) format("woff2");
    font-weight: 900;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Ephidona";
    src: local("Ephidona"),
      url(/assets/fonts/Ephidona.woff2) format("woff2");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  * {
    box-sizing: border-box;
    margin: 0;
  }

  html,
  body,
  #__next {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    --font-size: 8.25vw;
    background-color: var(--dark);
    font-family: var(--font-base);
    font-size: min(var(--font-size), 140px);
    text-transform: uppercase;
    color: var(--white);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    padding-left: 20px;
    padding-right: 20px;
    line-height: 1.5;
    overflow-x: hidden;
  }

  a {
    color: var(--white);
    text-decoration: underline;
    text-underline-offset: .6rem;
    text-decoration-thickness: .2rem;
    transition: text-underline-offset var(--d-normal) var(--ease-out),
      text-decoration-thickness var(--d-normal) var(--ease-out);
  }

  a:hover {
    cursor: pointer;
    text-underline-offset: .5rem;
    text-decoration-thickness: .7rem;
  }

  body, p, h1, h2, h3, h4, h5, h6 {
    font-size: min(var(--font-size), 100px);
    margin: 1vh 0;
    line-height: 1.2;
    font-weight: 900;
  }

  .font-alt {
    font-family: var(--font-alt);
    font-weight: 400;
  }

  .font-line-through {
    text-decoration-line: line-through;
  }
`;

export default GlobalStyle;
