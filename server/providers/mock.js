/**
 * Offline provider. Produces persona-flavoured, context-aware filler so the whole
 * app can be exercised without any API keys. Streams word by word like a real model.
 */

const OPENERS = [
  'Building on that,',
  'I see it differently.',
  'Fair point, though',
  'Let me push back a little:',
  'Interesting.',
  'Here is where I land:',
  'Two things.',
  'Honestly,',
  'To put it plainly,',
  'That raises a question for me.',
];

const MIDDLES = [
  'the core of {topic} is really about trade-offs rather than absolutes.',
  'we keep circling {topic} without naming the constraint that actually matters.',
  'if we take {topic} seriously, the first-order effects are obvious and the second-order effects are not.',
  'most disagreements about {topic} are disagreements about time horizons.',
  '{topic} looks simple until you ask who bears the cost.',
  'the strongest version of the opposing view on {topic} deserves a real answer.',
  'I would separate the empirical question about {topic} from the normative one.',
  'the history of {topic} suggests we are overconfident here.',
  'the people most affected are exactly the ones we have not heard from yet.',
  'I keep coming back to incentives: who gains, who pays, and who decides?',
  'we are treating a spectrum as a switch. Most good answers here are "it depends, and here is on what".',
  'there is a version of this that works in a small town and fails in a metropolis, and vice versa.',
  'my worry is less about whether it is right and more about whether it is reversible if we are wrong.',
  'the honest answer is that the evidence is thinner than either side admits.',
];

const REACTIONS = [
  'When {who} said "{quote}", I think that is the crux.',
  '{who} is right about "{quote}", but it cuts both ways.',
  'I would not go as far as {who} did with "{quote}".',
  '"{quote}" — {who}, can you make that concrete?',
  'To {who}\'s point about "{quote}": agreed, mostly.',
];

const HUMAN_REACTIONS = [
  'You asked about "{quote}" — here is my honest take.',
  'On "{quote}": good prompt.',
  'Since you raised "{quote}", let me answer that directly.',
  '"{quote}" is exactly the right thing to ask.',
];

const CLOSERS = [
  'What would change your mind?',
  'Curious what the rest of you think.',
  'I could be wrong about this.',
  'Let us not lose that thread.',
  'That is my position, for now.',
  'Push back if that seems off.',
  'Where does that leave us?',
  '',
  '',
];

const STYLES = [
  { match: /(skeptic|critic|contrarian|devil)/i, prefix: 'Hmm.', suffix: 'Show me the evidence.' },
  { match: /(optimist|cheer|enthusias|hype)/i, prefix: 'Love this.', suffix: 'The upside here is huge.' },
  { match: /(poet|artist|writer|bard)/i, prefix: 'Picture it:', suffix: 'Everything else is footnotes.' },
  { match: /(scientist|engineer|researcher|analyst)/i, prefix: 'Empirically,', suffix: 'We should measure it.' },
  { match: /(philosoph|stoic|monk|sage)/i, prefix: 'Consider:', suffix: 'The question matters more than the answer.' },
  { match: /(pirate|captain|sailor)/i, prefix: 'Arr,', suffix: 'Now, where be the rum?' },
  { match: /(comedian|joker|funny|clown)/i, prefix: 'Okay okay,', suffix: 'I will be here all week.' },
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function snippet(text, maxWords = 7) {
  let clean = text.replace(/\s+/g, ' ').replace(/^\[[^\]]+\]:\s*/, '').trim();
  // Skip short throat-clearing openers ("Hmm.", "Two things.") so we quote the substance.
  const sentences = clean.split(/(?<=[.!?:])\s+/);
  while (sentences.length > 1 && sentences[0].length < 30) sentences.shift();
  clean = sentences.join(' ');
  const words = clean.split(' ');
  const cut = words.slice(0, maxWords).join(' ');
  return words.length > maxWords ? `${cut}…` : cut;
}

function parseLastSpeaker(content) {
  const m = /^\[([^\]]+)\]:\s*([\s\S]*)$/.exec(content.trim());
  return m ? { who: m[1], text: m[2] } : null;
}

export function composeMockReply({ system = '', messages = [], topic = 'this', agentName = 'Agent', humanName = 'You' }) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  // The last user turn may contain several merged "[Name]: ..." lines; react to the final one.
  const lastLine = lastUser ? lastUser.content.split('\n').filter(Boolean).pop() : '';
  const last = lastLine ? parseLastSpeaker(lastLine) : null;
  const seed = hash(`${agentName}|${messages.length}|${last?.text ?? topic}`);

  const style = STYLES.find((s) => s.match.test(system) || s.match.test(agentName));
  const parts = [];

  if (style && seed % 3 === 0) parts.push(style.prefix);
  parts.push(pick(OPENERS, seed));

  if (last && last.who !== agentName && last.who !== 'Host' && seed % 5 !== 0) {
    const quote = snippet(last.text.replace(/@\w+[,:]?\s*/g, ''));
    const template = last.who === humanName ? pick(HUMAN_REACTIONS, seed >>> 3) : pick(REACTIONS, seed >>> 3);
    parts.push(template.replace('{who}', last.who).replace('{quote}', quote));
  }

  const topicPhrase = topic.replace(/[?.!]+$/, '').replace(/^\w/, (c) => c.toLowerCase()) || 'this';
  parts.push(pick(MIDDLES, seed >>> 5).replace('{topic}', `"${topicPhrase}"`));

  if (style && seed % 4 === 1) parts.push(style.suffix);
  const closer = pick(CLOSERS, seed >>> 7);
  if (closer) parts.push(closer);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function* streamMock(opts) {
  const { signal, tokenDelayMs = 35 } = opts;
  const text = composeMockReply(opts);
  const words = text.split(' ');
  await sleep(300 + (hash(text) % 500));
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) return;
    yield (i === 0 ? '' : ' ') + words[i];
    await sleep(tokenDelayMs);
  }
}
