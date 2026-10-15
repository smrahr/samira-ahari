import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const GREETING = "psst… I'm Samira's little helper. Ask me anything about her work — write on the right →";
const WIDE = '(min-width: 1500px)';
const MAX_HISTORY = 20;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
`;

const blink = keyframes`
  0%, 100% { opacity: .2; }
  50%      { opacity: 1; }
`;

// Narrow screens: sits in flow above the page, so new notes push the site down.
// Wide screens: full-viewport overlay; only the two side gutters (outside the 1100px page) hold content
const Root = styled.aside`
  --gutter: calc((100vw - 1100px) / 2);
  --bot-ink: var(--fg);
  --visitor-ink: var(--pink);

  :root[data-theme='gold'] & {
    --visitor-ink: #8a1538;
  }

  display: flex;
  flex-direction: column;
  max-width: 1100px;
  margin: 0 auto;
  padding: 84px 0 0;
  font-family: 'Nothing You Could Do', 'Playpen Sans Arabic', cursive;
  font-weight: 300;
  text-transform: none;
  line-height: 1.4;
  animation: ${fadeIn} var(--d-slower) var(--ease-out) 2.5s both;

  @media ${WIDE} {
    position: fixed;
    inset: 0;
    z-index: 900;
    max-width: none;
    padding: 14vh 0 22vh;
    pointer-events: none;
  }
`;

const Log = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media ${WIDE} {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    display: grid;
    grid-template-columns: var(--gutter) 1fr var(--gutter);
    grid-template-rows: minmax(0, 1fr);
    mask-image: linear-gradient(to bottom, transparent, #000 30%);
  }
`;

// Wide screens: each gutter stacks its own notes, so a long reply on one side doesn't space out the other
const Side = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 18px;
  min-height: 0;
  grid-column: ${(p) => (p.$from === 'bot' ? 1 : 3)};
`;

const Note = styled.p`
  align-self: ${(p) => (p.$from === 'bot' ? 'flex-start' : 'flex-end')};
  max-width: 85%;
  font-family: inherit;
  font-size: 20px;
  font-weight: inherit;
  line-height: inherit;
  color: ${(p) => (p.$from === 'bot' ? 'var(--bot-ink)' : 'var(--visitor-ink)')};
  transform: rotate(${(p) => p.$tilt}deg);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  filter: url(#pen-ink);
  pointer-events: auto;
  user-select: text;

  .dots span {
    animation: ${blink} 1s infinite;
  }
  .dots span:nth-child(2) { animation-delay: .2s; }
  .dots span:nth-child(3) { animation-delay: .4s; }

  @media ${WIDE} {
    align-self: ${(p) => (p.$from === 'bot' ? 'flex-end' : 'flex-start')};
    max-width: calc(var(--gutter) - 56px);
    margin: 0 28px;
    font-size: 23px;
  }
`;

const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

const Form = styled.form`
  flex: 0 0 auto;
  position: relative;
  margin: 20px 0 0;
  pointer-events: auto;

  ${Log}:empty + & {
    margin-top: 0;
  }
  color: var(--visitor-ink);

  textarea {
    display: block;
    width: 100%;
    padding: 0 0 6px;
    border: 0;
    outline: none;
    resize: none;
    field-sizing: content;
    max-height: 5.75em;
    background: none;
    font: inherit;
    font-size: 20px;
    line-height: 1.4;
    color: inherit;
    caret-color: currentColor;
  }
  textarea::placeholder {
    color: inherit;
    opacity: .5;
  }
  svg {
    display: block;
    width: 100%;
    height: 10px;
    opacity: .7;
  }
  &:focus-within svg {
    opacity: 1;
  }

  @media ${WIDE} {
    align-self: flex-end;
    width: calc(var(--gutter) - 56px);
    margin: 24px 28px 0;

    textarea {
      font-size: 24px;
    }
  }
`;

const tilt = () => Math.round((Math.random() * 4 - 2) * 10) / 10;

// Reveals text a character at a time, like a pen writing it out
function Handwritten({ text, onDone }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length);
      onDone?.();
      return;
    }
    let i = 0;
    let timer;
    const step = () => {
      i += 1;
      setCount(i);
      if (i >= text.length) return onDone?.();
      const ch = text[i - 1];
      timer = setTimeout(step, /[.,!?…]/.test(ch) ? 180 : 22 + Math.random() * 30);
    };
    timer = setTimeout(step, 120);
    return () => clearTimeout(timer);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SrOnly>{text}</SrOnly>
      <span aria-hidden="true">{text.slice(0, count)}</span>
    </>
  );
}

export default function MarginChat() {
  const [notes, setNotes] = useState(() => [
    { id: 0, from: 'bot', text: GREETING, tilt: -1.5, greeting: true },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [wide, setWide] = useState(false);
  const nextId = useRef(1);
  // Set by the server on the first reply, so every note of this visit lands in one logged conversation
  const conversationId = useRef(null);

  // Narrow screens start with just the input; the greeting only belongs in the wide-screen margins
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    setWide(mq.matches);
    if (!mq.matches) setNotes((prev) => prev.filter((n) => !n.greeting));
    const onChange = (e) => setWide(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const add = (from, text) =>
    setNotes((prev) => [...prev, { id: nextId.current++, from, text, tilt: tilt() }]);

  const send = async (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    const history = [...notes.filter((n) => !n.greeting), { from: 'visitor', text }]
      .slice(-MAX_HISTORY)
      .map((n) => ({ role: n.from === 'bot' ? 'assistant' : 'user', content: n.text }));
    while (history.length && history[0].role !== 'user') history.shift();

    add('visitor', text);
    setDraft('');
    setBusy(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, conversationId: conversationId.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.conversationId) conversationId.current = data.conversationId;
      if (data.reply) add('bot', data.reply);
      else if (res.status === 429) add('bot', 'Too many notes at once — give me a sec and try again.');
      else add('bot', 'My pen ran out of ink… try again in a bit, or reach Samira on LinkedIn.');
    } catch {
      add('bot', 'My pen ran out of ink… try again in a bit, or reach Samira on LinkedIn.');
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) send(e);
  };

  const renderNotes = (list) =>
    list.map((n) => (
      <Note key={n.id} $from={n.from} $tilt={n.tilt} dir="auto">
        {n.from === 'bot' ? <Handwritten text={n.text} /> : n.text}
      </Note>
    ));

  const writing = (
    <Note $from="bot" $tilt={0} aria-label="Writing…">
      <span className="dots" aria-hidden="true">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </Note>
  );

  return (
    <Root aria-label="Chat with Samira's assistant">
      {/* Roughens glyph edges and thins the ink in patches, like a ballpoint pen */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="pen-ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.3" xChannelSelector="R" yChannelSelector="G" result="wobble" />
          <feTurbulence type="fractalNoise" baseFrequency="0.25" seed="9" result="patches" />
          <feColorMatrix in="patches" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.5 1.15" result="density" />
          <feComposite in="wobble" in2="density" operator="in" />
        </filter>
      </svg>
      <Log role="log" aria-live="polite">
        {wide ? (
          <>
            <Side $from="bot">
              {renderNotes(notes.filter((n) => n.from === 'bot'))}
              {busy && writing}
            </Side>
            <Side $from="visitor">{renderNotes(notes.filter((n) => n.from !== 'bot'))}</Side>
          </>
        ) : (
          <>
            {renderNotes(notes)}
            {busy && writing}
          </>
        )}
      </Log>

      <Form onSubmit={send}>
        <label>
          <SrOnly>Your message</SrOnly>
          <textarea
            rows={1}
            dir="auto"
            maxLength={600}
            placeholder="write here…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </label>
        <svg viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M2 6c18-3 30 2 48-1s28-3 46 0 30 2 48-1 30-2 54 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </Form>
    </Root>
  );
}
