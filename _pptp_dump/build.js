// Generates _pptp_dump/content.json and projects/pptp-soft-pneumatics.html
// from the Notion markdown sources in _pptp_dump/src/*.md
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'src');
const TERMS = 'C:\\Users\\ron\\.cursor\\projects\\c-Users-ron-Desktop-projects-personal-portfolio\\terminals';
const S3 = 'https://prod-files-secure.s3.us-west-2.amazonaws.com/a15b85eb-0e4b-4e6b-a756-5c54953216c2/';
const PARENT = 'https://app.notion.com/p/36d7962f62078050a2bde5ef1542479d';

const YT = {
  'solenoid-progress': null,
};

// ---------------------------------------------------------------- remote URL map (unsigned)
const remote = {};
try {
  fs.readdirSync(TERMS).filter(f => /^5710/.test(f)).forEach(f => {
    const txt = fs.readFileSync(path.join(TERMS, f), 'utf8');
    const cmd = (txt.match(/^command: (.*)$/m) || [])[1] || '';
    const re = /\$s='([^']+)'|\\nD (?:\$s|'([^']+)') '([^']+)' '([^']+)' '[0-9a-f]+'/g;
    let slug = null, m;
    while ((m = re.exec(cmd))) {
      if (m[1]) { slug = m[1]; continue; }
      const sl = m[2] || slug;
      remote[sl + '/' + m[3]] = S3 + m[4];
    }
  });
} catch (e) { /* optional */ }

// ---------------------------------------------------------------- helpers
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(raw) {
  let s = esc(raw);
  const hold = [];
  const keep = h => { hold.push(h); return '\u0000' + (hold.length - 1) + '\u0000'; };
  s = s.replace(/`([^`]+)`/g, (_, c) => keep('<code>' + c + '</code>'));
  s = s.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (_, t, u) => {
    const ext = /^https?:/.test(u);
    return keep('<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>');
  });
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => hold[+i]);
  // links may hold emphasis markers inside text; resolve once more
  s = s.replace(/<a ([^>]*)>(.*?)<\/a>/g, (_, a, t) =>
    '<a ' + a + '>' + t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') + '</a>');
  return s;
}
const plain = raw => raw
  .replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, '$1')
  .replace(/[*`]/g, '');

function probe(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
      'stream=width,height:stream_tags=rotate:stream_side_data=rotation', '-of', 'json', file], { encoding: 'utf8' });
    const j = JSON.parse(out);
    const st = (j.streams || [])[0] || {};
    let w = st.width, h = st.height;
    let rot = 0;
    if (st.tags && st.tags.rotate) rot = parseInt(st.tags.rotate, 10);
    (st.side_data_list || []).forEach(d => { if (d.rotation != null) rot = parseInt(d.rotation, 10); });
    if (Math.abs(rot) === 90 || Math.abs(rot) === 270) { const t = w; w = h; h = t; }
    return { w, h };
  } catch (e) { return { w: 4, h: 3 }; }
}

// ---------------------------------------------------------------- parse sources
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.md')).sort();
const pages = files.map((f, i) => {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  m[1].split('\n').forEach(l => { const k = l.indexOf(':'); meta[l.slice(0, k).trim()] = l.slice(k + 1).trim(); });
  return { file: f, n: i + 1, slug: meta.slug, title: meta.title, date: meta.date, heading: meta.heading, url: meta.url, body: m[2].trim() + '\n' };
});

function parseBlocks(body) {
  const lines = body.split('\n');
  const blocks = [];
  let i = 0;
  const isMedia = l => /^(!\[|@video\[|@youtube\[)/.test(l);
  const isList = l => /^\s*([-*]|\d+\.)\s+/.test(l) && !/^\s*\*\*/.test(l.replace(/^\s*[-*]\s/, '**')) ;
  const listRe = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^```(\w*)/))) {
      const code = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      i++;
      blocks.push({ t: 'code', lang: m[1], code: code.join('\n') });
      continue;
    }
    if ((m = l.match(/^(#{1,4})\s+(.*)$/))) {
      blocks.push({ t: 'h', level: m[1].length, text: m[2] });
      i++; continue;
    }
    if (isMedia(l)) {
      const items = [];
      while (i < lines.length && isMedia(lines[i])) {
        const x = lines[i];
        let mm;
        if ((mm = x.match(/^!\[([^\]]*)\]\(([^)]+)\)/))) items.push({ type: 'image', caption: mm[1], src: mm[2] });
        else if ((mm = x.match(/^@video\[([^\]]*)\]\(([^)]+)\)/))) items.push({ type: 'video', caption: mm[1], src: mm[2] });
        else if ((mm = x.match(/^@youtube\[([^\]]*)\]\(([^)]+)\)/))) items.push({ type: 'youtube', caption: mm[1], src: mm[2] });
        i++;
      }
      blocks.push({ t: 'media', items });
      continue;
    }
    if (listRe.test(l) && !/^\*[^*\s]/.test(l.trim()) ) {
      const first = l.match(listRe);
      const ordered = /\d+\./.test(first[2]);
      const start = ordered ? parseInt(first[2], 10) : 1;
      const items = [];
      while (i < lines.length) {
        const x = lines[i];
        if (!x.trim()) {
          // blank: continue only if the next non-blank line is indented continuation
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && /^\s{2,}\S/.test(lines[j]) && items.length) { i = j; continue; }
          break;
        }
        const mm = x.match(listRe);
        if (mm && mm[1].length === 0) {
          if (/\d+\./.test(mm[2]) !== ordered) break;
          items.push({ text: mm[3], kids: [], extra: [] });
          i++;
        } else if (mm && mm[1].length >= 2 && items.length) {
          items[items.length - 1].kids.push(mm[3]);
          i++;
        } else if (/^\s{2,}\S/.test(x) && items.length) {
          items[items.length - 1].extra.push(x.trim());
          i++;
        } else break;
      }
      blocks.push({ t: 'list', ordered, start, items });
      continue;
    }
    // paragraph
    const para = [];
    while (i < lines.length && lines[i].trim() && !isMedia(lines[i]) && !/^```/.test(lines[i]) &&
      !/^#{1,4}\s/.test(lines[i]) && !(listRe.test(lines[i]) && !/^\*[^*\s]/.test(lines[i].trim()) && para.length)) {
      para.push(lines[i].trim()); i++;
    }
    blocks.push({ t: 'p', text: para.join(' ') });
  }
  // merge adjacent single-media blocks
  const out = [];
  blocks.forEach(b => {
    const prev = out[out.length - 1];
    if (b.t === 'media' && prev && prev.t === 'media' && prev.items.length === 1 && b.items.length === 1) {
      prev.items.push(b.items[0]);
    } else out.push(b);
  });
  return out;
}

// ---------------------------------------------------------------- media registry + render
let figN = 0;
const allMedia = [];
const lightboxCaption = {};

function mediaEntry(page, it) {
  if (it.type === 'youtube') {
    const id = (it.src.match(/(?:youtu\.be\/|v=)([\w-]{11})/) || [])[1];
    return { type: 'youtube', name: id, localPath: null, remoteUrl: it.src, embedUrl: 'https://www.youtube.com/embed/' + id, caption: it.caption || null, id };
  }
  const abs = path.join(ROOT, it.src);
  const name = path.basename(it.src);
  const exists = fs.existsSync(abs);
  const dim = exists ? probe(abs) : { w: 4, h: 3 };
  const e = {
    type: it.type, name, localPath: it.src, remoteUrl: remote[page.slug + '/' + name] || null,
    caption: it.caption || null, width: dim.w, height: dim.h, bytes: exists ? fs.statSync(abs).size : null, exists
  };
  if (it.type === 'video' && /\.mov$/i.test(name)) {
    const mp4 = it.src.replace(/\.mov$/i, '.web.mp4');
    const mabs = path.join(ROOT, mp4);
    if (!fs.existsSync(mabs)) {
      try { execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', abs, '-c', 'copy', '-movflags', '+faststart', mabs]); }
      catch (err) { /* fall back to original */ }
    }
    if (fs.existsSync(mabs)) e.webPath = mp4;
  }
  return e;
}

function renderMediaItem(page, e, count) {
  const cap = e.caption ? '<figcaption>' + inline(e.caption) + '</figcaption>' : '';
  if (e.type === 'youtube') {
    return '<figure class="pptp-fig pptp-yt">' +
      '<div class="pptp-frame pptp-frame-yt"><iframe src="https://www.youtube-nocookie.com/embed/' + e.id + '" title="' + esc(page.heading) + ' — video" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' +
      '<figcaption>' + (e.caption ? inline(e.caption) + ' · ' : '') + '<a href="' + esc(e.remoteUrl) + '" target="_blank" rel="noopener">Watch on YouTube ↗</a></figcaption></figure>';
  }
  const arn = (e.width / e.height).toFixed(4);
  const orient = e.width >= e.height ? 'land' : 'port';
  const rel = '../' + (e.webPath || e.localPath);
  if (e.type === 'video') {
    return '<figure class="pptp-fig pptp-vid pptp-' + orient + '" style="--arn:' + arn + '">' +
      '<div class="pptp-frame"><video class="pptp-autoplay" src="' + rel + '" muted loop playsinline autoplay preload="metadata" controls controlslist="nodownload" aria-label="' + esc(e.caption || page.heading + ' — video') + '"></video></div>' + cap + '</figure>';
  }
  figN++;
  const alt = e.caption || (page.heading + ' — image');
  const lb = e.caption ? page.heading + ' — ' + e.caption : page.heading;
  return '<figure class="pptp-fig pptp-img pptp-' + orient + '" style="--arn:' + arn + '">' +
    '<button type="button" class="pptp-expand" data-lightbox-open data-lightbox-group="pptp" data-src="' + rel + '" data-caption="' + esc(lb) + '" aria-label="Expand image">' +
    '<img src="' + rel + '" alt="' + esc(alt) + '" width="' + e.width + '" height="' + e.height + '" loading="lazy" decoding="async">' +
    '<span class="pptp-expand-hint" aria-hidden="true">Expand</span></button>' + cap + '</figure>';
}

function renderBlocks(page, blocks) {
  const html = [];
  const media = [];
  blocks.forEach(b => {
    if (b.t === 'h') {
      const tag = ['', 'h3', 'h4', 'h5', 'h6'][b.level];
      html.push('<' + tag + ' class="pptp-h pptp-h' + b.level + '">' + inline(b.text) + '</' + tag + '>');
    } else if (b.t === 'p') {
      html.push('<p>' + inline(b.text) + '</p>');
    } else if (b.t === 'code') {
      html.push('<pre class="pptp-code" tabindex="0"><code>' + esc(b.code) + '</code></pre>');
    } else if (b.t === 'list') {
      const tag = b.ordered ? 'ol' : 'ul';
      html.push('<' + tag + ' class="pptp-list"' + (b.ordered && b.start !== 1 ? ' start="' + b.start + '"' : '') + '>' +
        b.items.map(it =>
          '<li>' + inline(it.text) +
          (it.extra.length ? it.extra.map(x => '<p>' + inline(x) + '</p>').join('') : '') +
          (it.kids.length ? '<ul>' + it.kids.map(k => '<li>' + inline(k) + '</li>').join('') + '</ul>' : '') + '</li>').join('') +
        '</' + tag + '>');
    } else if (b.t === 'media') {
      const ents = b.items.map(it => { const e = mediaEntry(page, it); media.push(e); return e; });
      const n = ents.length;
      const hasYt = ents.some(e => e.type === 'youtube');
      html.push('<div class="pptp-media pptp-cols-' + (hasYt ? 1 : Math.min(n, 3)) + ' reveal">' +
        ents.map(e => renderMediaItem(page, e, n)).join('') + '</div>');
    }
  });
  return { html: html.join('\n'), media };
}

// ---------------------------------------------------------------- build page data
const RAIL = {
  'heat-seal-tpu': '26 May', 'heat-seal-update': '02 Jun', 'solenoid-wiring': '03 Jun', 'solenoid-progress': '04 Jun',
  'nine-valves': '05 Jun', 'neater-build': 'Neater build', '3d-printing-airtightness': 'Airtightness', 'hvlp-compressor': 'HVLP',
  'testing': 'Testing', 'wooden-frame': 'Frame', 'finalizing': 'Finalizing'
};

const outPages = pages.map(p => {
  const blocks = parseBlocks(p.body);
  const r = renderBlocks(p, blocks);
  p.html = r.html; p.media = r.media;
  return p;
});

// ---------------------------------------------------------------- content.json
const blank = [
  { n: 1, title: '22nd May', note: 'Blank page in Notion (no content).' },
  { n: 2, title: '25th May', note: 'Blank page in Notion (no content).' },
  { n: 14, title: 'Next Steps and Future Vision', note: 'Page exists in Notion but contains only an empty paragraph (no content).' }
];
const json = {
  source: PARENT,
  generated: new Date().toISOString(),
  project: 'PPTP Documentation — Soft Pneumatics',
  githubRepo: 'https://github.com/r-0n/Postgraduate-Practical-Training-Course-PPTP-',
  notes: [
    'remoteUrl is the unsigned Notion S3 object path (signed URLs expire after 300s); null where it was not recorded.',
    'The "Testing" page contains an empty <video /> placeholder in Notion; it was not rendered.',
    'The "Code for Controlling Valve:" heading in the Notion source has no code underneath it.',
    '.mov files also have a .web.mp4 remux (webPath) for browser playback.'
  ],
  blankPages: blank,
  pages: outPages.map(p => ({
    index: p.n + 2, title: p.title, date: p.date || null, heading: p.heading, slug: p.slug, url: p.url,
    markdown: p.body,
    text: p.body.split('\n').filter(l => !/^(!\[|@video\[|@youtube\[)/.test(l)).map(plain).join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    media: p.media.map(m => {
      const o = { type: m.type, name: m.name, localPath: m.localPath, remoteUrl: m.remoteUrl, caption: m.caption };
      if (m.embedUrl) o.embedUrl = m.embedUrl;
      if (m.webPath) o.webPath = m.webPath;
      if (m.width) { o.width = m.width; o.height = m.height; }
      return o;
    })
  }))
};
fs.writeFileSync(path.join(__dirname, 'content.json'), JSON.stringify(json, null, 2));

// ---------------------------------------------------------------- HTML
const total = { image: 0, video: 0, youtube: 0 };
outPages.forEach(p => p.media.forEach(m => total[m.type]++));

const sections = outPages.map((p, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const eyebrow = p.date ? p.date : 'Journal entry ' + num;
  return '<section class="pptp-chapter" id="' + p.slug + '" data-chapter>\n' +
    '  <div class="pptp-chapter-head reveal">\n' +
    '    <span class="pptp-chapter-index">' + num + '</span>\n' +
    '    <div><div class="pptp-eyebrow">' + esc(eyebrow) + '</div><h2>' + inline(p.heading) + '</h2></div>\n' +
    '  </div>\n' +
    '  <div class="pptp-prose">\n' + p.html + '\n  </div>\n' +
    '</section>';
}).join('\n\n');

const railItems = [['top', 'Hero'], ['overview', 'Overview']].concat(outPages.map(p => [p.slug, RAIL[p.slug]])).concat([['next-steps', 'Next steps']]);
const rail = railItems.map(([id, label]) =>
  '<li><a href="#' + id + '" data-rail="' + id + '"><span class="pptp-rail-dot"></span><span class="pptp-rail-label">' + esc(label) + '</span></a></li>').join('\n      ');

const steps = [
  ['heat-seal-tpu', 'DIY heat sealing', 'Searching for an easy way to heat seal TPU fabric led to taking apart a heat sealing device and reproducing its parts with a soldering iron, and the technique went on to work.'],
  ['solenoid-wiring', 'Solenoid control', 'A 3-way 2-position solenoid valve driven from an Arduino through a transistor, flyback diode and resistor, tested with a balloon and then wired up for all nine valves.'],
  ['neater-build', 'A neater relay build', 'The breadboard gave way to relay modules, a screw-terminal ground hub and a TalentCell battery powering the valves and the Arduino on separate rails.'],
  ['3d-printing-airtightness', 'Manifold & airtightness', 'A 3D-printed pneumatic manifold, then fittings and an aluminium manifold in the pursuit of an air-tight system.'],
  ['hvlp-compressor', 'HVLP compressor', 'A High Volume Low Pressure compressor replaced the first pump once pressure proved unsuitable for high-volume objects.'],
  ['testing', 'Testing', 'Normal-speed and sped-up recordings of the valves running the inflatables.'],
  ['wooden-frame', 'Wooden frame', 'The frame designed and simulated in Rhino 3D Grasshopper was built with the scene shop, with electronics and the manifold housed at its base.'],
  ['finalizing', 'Finalizing', 'Key-press control gave way to autonomous firmware, then formal tests of the finished installation.'],
  ['next-steps', 'Next steps', 'From programmed movement toward living architecture that senses and adapts to people.']
];
const arc = steps.map((s, i) =>
  '<li class="reveal"><a href="#' + s[0] + '"><span class="pptp-arc-n">' + String(i + 1).padStart(2, '0') + '</span><span class="pptp-arc-copy"><strong>' + esc(s[1]) + '</strong><span>' + esc(s[2]) + '</span></span></a></li>').join('\n          ');

const nextStepsSection = `<section class="pptp-chapter pptp-vision" id="next-steps" data-chapter>
  <div class="pptp-chapter-head reveal">
    <span class="pptp-chapter-index">09</span>
    <div><div class="pptp-eyebrow">Looking ahead</div><h2>Next Steps &amp; <span>Future Vision</span></h2></div>
  </div>
  <div class="pptp-prose">
    <h3 class="pptp-h pptp-h1 reveal">From Programmed Movement to Living Architecture</h3>
    <p class="pptp-lead reveal">Spending so much time developing Pneumitecture has left me increasingly obsessed with the idea of adaptive and responsive environments. What began as an exploration of softness, air, and architectural transformation has grown into a much larger question: What if the spaces we inhabit could become aware of us, respond to our presence, and gradually learn how to accommodate us?</p>
    <p class="reveal">Through the PPTP, I was able to bring Pneumitecture closer to that possibility. I developed a physical pneumatic system controlled through nine solenoid valves, allowing inflatable units to expand through sequential, random, and snake-like patterns. The system can now transition between these different modes without continuous manual input.</p>
    <p class="pptp-pull reveal">It moves on its own. But it doesn’t yet know why it moves.</p>
    <p class="reveal">That distinction has become central to how I imagine the project’s future. The existing system follows instructions I have written for it. Even its random movements operate within predefined rules. I want to move beyond these choreographies and explore a structure whose behavior emerges from its interactions with the surrounding environment.</p>

    <div class="pptp-media pptp-cols-1 reveal">
      <figure class="pptp-fig pptp-img pptp-land" style="--arn:1.8342">
        <button type="button" class="pptp-expand" data-lightbox-open data-lightbox-group="pptp-vision" data-src="../images/pptp/next-steps/breathing-dome.jpg" data-caption="Breathing Dome — concept sketch" aria-label="Expand image">
          <img src="../images/pptp/next-steps/breathing-dome.jpg" alt="Breathing Dome concept sketch with arrows indicating inflation and structural nodes" width="1024" height="558" loading="lazy" decoding="async">
          <span class="pptp-expand-hint" aria-hidden="true">Expand</span>
        </button>
        <figcaption>Breathing Dome — early concept for a structure that expands and settles through air</figcaption>
      </figure>
    </div>

    <h3 class="pptp-h pptp-h1 reveal">The Works That Continue to Shape My Thinking</h3>
    <p class="reveal">My interest in this direction has been influenced by several experiments that challenge the boundaries between architecture, technology, and living systems.</p>
    <p class="reveal"><a href="https://www.moma.org/collection/works/185728" target="_blank" rel="noopener">Haus-Rucker-Co</a> helped me understand the possibilities of air and softness as architectural materials. Their inflatable environments challenged the expectation that architecture must be rigid and permanent. They demonstrated how lightweight, temporary structures could transform the experience of inhabiting a space.</p>
    <p class="reveal"><a href="https://www.ayariad.com/slinkybot" target="_blank" rel="noopener">Aya Riad’s Slinky(bot)</a> introduced another possibility: architectural components that behave like companions. The idea of individual units communicating, reorganizing, and developing relationships with their occupants resonates deeply with what I hope Pneumitecture can become.</p>
    <p class="reveal">I am equally interested in <a href="https://behnazfarahi.com/alloplastic-architecture/" target="_blank" rel="noopener">Behnaz Farahi’s Alloplastic Architecture</a>, which explores how architectural structures can physically adapt to human movement. It suggests a more reciprocal relationship between people and their surroundings, where neither the occupant nor the environment remains entirely passive.</p>
    <p class="reveal"><a href="https://www.rob-ley.com/reef" target="_blank" rel="noopener">REEF</a>, by Rob Ley and Joshua G. Stein, demonstrated how responsive architectural surfaces could acquire qualities we normally associate with living organisms. Its subtle movements interest me particularly. A responsive environment does not need dramatic transformations to communicate presence.</p>
    <p class="reveal">The research behind Dissipative Architectures by the <a href="https://livingarchitecturesystems.com/" target="_blank" rel="noopener">Living Architecture Systems Group</a>, led by Philip Beesley, has helped me think more seriously about distributed sensing, interaction, and the possibility of architecture developing behaviors over time. <a href="https://livingarchitecturesystems.com/project/lumen/" target="_blank" rel="noopener">Lumen</a>, by Jenny Sabin Studio, offers another important perspective, showing how responsive materials, light, environmental conditions, and human presence can work together to create spaces that offer comfort rather than simply visual spectacle.</p>
    <p class="reveal">Together, these works have pushed me to think beyond architecture that moves, toward architecture that develops a relationship with its inhabitants.</p>

    <h3 class="pptp-h pptp-h1 reveal">What Comes Next</h3>
    <p class="reveal">My immediate goal is to introduce sensing and feedback into Pneumitecture.</p>
    <p class="reveal">I want to begin with relatively simple interactions. Proximity and motion sensors could allow the installation to detect where someone is standing, how they are moving, or whether they are approaching a particular region. Instead of executing a predetermined inflation sequence, the system could respond locally, activating nearby cells or gradually changing its shape as someone moves through the space.</p>
    <p class="reveal">The next challenge is making those responses more deliberate.</p>
    <p class="reveal">I envision combining environmental sensing with feedback from the inflatable units themselves. Pressure sensors, for example, could help the system monitor its physical state and adjust inflation accordingly. Rather than controlling each valve solely through fixed durations, I want the structure to regulate its movement based on what it senses and how its material responds.</p>
    <p class="reveal">Over time, I hope to explore interactions between individual cells. One cell’s response could influence its neighbors, producing coordinated transformations without requiring every movement to be explicitly choreographed.</p>
    <p class="reveal">Eventually, I want to investigate whether the system can develop a form of memory. Could it recognize recurring patterns of human activity? Could it gradually adjust its behavior based on previous encounters? Could it learn when to respond, when to remain still, and when a softer or slower movement might be more appropriate?</p>
    <p class="reveal">These questions move Pneumitecture beyond automation and toward adaptive behavior.</p>

    <div class="pptp-media pptp-cols-1 reveal">
      <figure class="pptp-fig pptp-img pptp-land" style="--arn:2.1695">
        <button type="button" class="pptp-expand" data-lightbox-open data-lightbox-group="pptp-vision" data-src="../images/pptp/next-steps/pavilion-section.jpg" data-caption="Pavilion section — inflation response study" aria-label="Expand image">
          <img src="../images/pptp/next-steps/pavilion-section.jpg" alt="Section sketch of a soft pavilion with red arrows showing cells expanding in response to a person inside" width="1024" height="472" loading="lazy" decoding="async">
          <span class="pptp-expand-hint" aria-hidden="true">Expand</span>
        </button>
        <figcaption>Section study — local cells responding as someone occupies the space</figcaption>
      </figure>
    </div>

    <h3 class="pptp-h pptp-h1 reveal">Imagining an Environment That Feels Alive</h3>
    <p class="reveal">One of the strongest images I carry into this research comes from the forests of Pandora in <em>Avatar</em>.</p>
    <p class="reveal">What fascinates me is not simply their appearance, but the suggestion of an interconnected environment in which individual organisms sense, communicate, and respond as parts of something larger. The forest feels alive because its components appear to participate in a shared system.</p>
    <p class="reveal">I imagine Pneumitecture developing something similar, at least as an architectural experiment.</p>
    <p class="reveal">A person entering the space might cause nearby inflatable cells to slowly expand, almost as though the structure were acknowledging their presence. As they move, the response could travel through neighboring cells. When the space becomes quiet, the system might settle into a slower rhythm.</p>
    <p class="pptp-pull reveal">Nothing aggressive. Nothing overwhelming.</p>
    <p class="reveal">I am particularly interested in the possibility of soft, almost sentient architecture that responds with care. An environment that can adjust to create comfort, provide a sense of calm, support different spatial needs, or offer a gentle form of companionship through its physical behavior.</p>
    <p class="reveal">I do not mean sentience in the literal sense of consciousness. What I want to investigate is how sensing, memory, adaptive control, and soft movement might give an architectural system a convincing sense of awareness, while allowing its responses to remain understandable and beneficial to the people around it.</p>
    <p class="reveal">There are still substantial technical questions to resolve, from developing more reliable inflatable materials and pneumatic connections to controlling pressure safely, coordinating multiple units, and evaluating how people interpret the system’s behavior.</p>
    <p class="reveal">But these are precisely the questions I want to pursue.</p>
    <p class="reveal">Pneumitecture has taught me how to make a structure breathe through programmed movement. Now I want to explore what it would mean for that structure to breathe in response to the world around it.</p>
    <p class="reveal">Ultimately, my ambition is to develop environments that do more than accommodate human activity. I want to investigate spaces that can participate in it, where the relationship between architecture and its occupants is continuously negotiated through movement, perception, and care.</p>

    <div class="pptp-media pptp-cols-1 reveal">
      <figure class="pptp-fig pptp-img pptp-land" style="--arn:2.1695">
        <button type="button" class="pptp-expand" data-lightbox-open data-lightbox-group="pptp-vision" data-src="../images/pptp/next-steps/plaza-gathering-pavilion.jpg" data-caption="Plaza Gathering Pavilion — future vision rendering" aria-label="Expand image">
          <img src="../images/pptp/next-steps/plaza-gathering-pavilion.jpg" alt="Plaza Gathering Pavilion concept rendering of a large cellular pneumatic pavilion in a public park" width="1024" height="472" loading="lazy" decoding="async">
          <span class="pptp-expand-hint" aria-hidden="true">Expand</span>
        </button>
        <figcaption>Plaza Gathering Pavilion — a public-scale vision of Pneumitecture as shared living architecture</figcaption>
      </figure>
    </div>

    <h3 class="pptp-h pptp-h1 reveal">Verified references</h3>
    <ul class="pptp-list pptp-refs reveal">
      <li><strong>Haus-Rucker-Co — Oasis no. 7</strong> — inflatable architecture and altered spatial experience. <a href="https://www.moma.org/collection/works/185728" target="_blank" rel="noopener">MoMA ↗</a></li>
      <li><strong>Aya Riad — Slinky(bot)</strong> — pneumatic units, collective organization, and human-responsive companionship. <a href="https://www.ayariad.com/slinkybot" target="_blank" rel="noopener">Aya Riad ↗</a></li>
      <li><strong>Behnaz Farahi — Alloplastic Architecture</strong> — reciprocal adaptation between human movement and architectural form. <a href="https://behnazfarahi.com/alloplastic-architecture/" target="_blank" rel="noopener">Behnaz Farahi ↗</a></li>
      <li><strong>Rob Ley and Joshua G. Stein — REEF</strong> — responsive surfaces and subtle, organism-like motion. <a href="https://www.rob-ley.com/reef" target="_blank" rel="noopener">Rob Ley Studio ↗</a></li>
      <li><strong>Living Architecture Systems Group — Dissipative Architectures</strong> — distributed sensing, kinetic mechanisms, and architecture capable of adaptation. <a href="https://livingarchitecturesystems.com/" target="_blank" rel="noopener">Living Architecture Systems Group ↗</a></li>
      <li><strong>Jenny Sabin Studio — Lumen</strong> — responsive materials, human proximity, light, and environmental comfort (featured on LASG; credited primarily to Jenny Sabin Studio). <a href="https://livingarchitecturesystems.com/project/lumen/" target="_blank" rel="noopener">Lumen ↗</a></li>
    </ul>
  </div>
</section>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#101010">
    <title>Pneumitecture || Aaron Wajah</title>
    <meta name="description" content="Pneumitecture — a continuation of the capstone soft-pneumatics research: heat-sealed TPU, solenoid control and an air-driven installation, documented May–Oct 2026.">
    <link rel="icon" type="image/png" href="../images/logo-no-background.png">
    <link rel="stylesheet" href="../css/index.css">
    <link rel="stylesheet" href="../css/projects.css">
    <link rel="stylesheet" href="../css/pptp.css">
</head>
<body class="case-study-page pptp-story" data-base="../">
    <div id="case-chrome-top"></div>

    <nav class="pptp-rail" aria-label="Journal chapters">
      <ul>
      ${rail}
      </ul>
    </nav>

    <main class="case-study pptp-main">
    <header class="pptp-hero" id="top" data-chapter>
        <div class="pptp-hero-bg" aria-hidden="true"><img src="../images/pptp/wooden-frame/assembled-23-39-05.jpg" alt=""></div>
        <div class="pptp-hero-inner">
            <div class="pptp-hero-copy">
                <div class="case-kicker">May–Oct 2026 · Research supervisor Aya Riad</div>
                <h1><span class="color">Pneumitecture</span></h1>
                <p class="pptp-hero-sub">Continuation of the Capstone</p>
                <p class="case-subtitle">A PPTP lab journal that continues the Capstone Pneumitecture research — from DIY TPU heat sealing and nine solenoid valves to a relay-based Arduino build, an HVLP compressor and a wooden frame.</p>
                <p class="pptp-hero-links">
                    <a class="hub-cta" href="https://canva.link/emonw8g4ickx88s" target="_blank" rel="noopener">Presentation slides ↗</a>
                    <a class="pptp-ghost" href="https://r-0n.github.io/Capstone-Pneumitecture/" target="_blank" rel="noopener">Capstone website ↗</a>
                    <a class="pptp-ghost" href="https://github.com/r-0n/Postgraduate-Practical-Training-Course-PPTP-" target="_blank" rel="noopener">GitHub ↗</a>
                    <a class="pptp-ghost" href="#overview">Read the journal ↓</a>
                </p>
            </div>
            <figure class="pptp-hero-card">
                <button type="button" class="pptp-expand" data-lightbox-open data-lightbox-group="pptp-hero" data-src="../images/pptp/finalizing/formal-23-40-33.jpg" data-caption="The finished installation" aria-label="Expand image">
                    <img src="../images/pptp/finalizing/formal-23-40-33.jpg" alt="The finished wooden-frame installation with inflatable elements on aluminium rods" width="960" height="1280">
                    <span class="pptp-expand-hint" aria-hidden="true">Expand</span>
                </button>
                <figcaption>The finished frame, from the final tests</figcaption>
            </figure>
        </div>
    </header>

    <div class="case-meta pptp-meta">
        <div><h6>Team</h6><p>Aaron Wajah</p></div>
        <div><h6>Research supervisor</h6><p>Aya Riad</p></div>
        <div><h6>Capstone</h6><p><a href="https://r-0n.github.io/Capstone-Pneumitecture/" target="_blank" rel="noopener">Live project site ↗</a></p></div>
        <div><h6>Fabrication</h6><p>Heat sealing TPU, aluminium rods, silicone, air pump, 3D print</p></div>
        <div><h6>Software</h6><p>Arduino</p></div>
    </div>

    <section class="pptp-chapter pptp-overview" id="overview" data-chapter>
        <div class="pptp-chapter-head reveal">
            <span class="pptp-chapter-index">00</span>
            <div><div class="pptp-eyebrow">Overview</div><h2>From a taken-apart sealer to a <span>breathing frame</span></h2></div>
        </div>
        <div class="pptp-prose">
            <p class="pptp-lead reveal">This journal continues <a href="https://r-0n.github.io/Capstone-Pneumitecture/" target="_blank" rel="noopener">Capstone Pneumitecture</a> into the PPTP lab — from the earliest experiments in heat sealing TPU fabric to a finished wooden frame that inflates on its own. Each entry below is reproduced from the lab documentation with its photos, diagrams, code and recordings: ${total.image} images, ${total.video} lab recordings and ${total.youtube} embedded YouTube videos across ${outPages.length} entries.</p>
            <ol class="pptp-arc">
          ${arc}
            </ol>
            <div class="pptp-stats reveal">
                <div><strong>9</strong><span>solenoid valves wired and driven from one Arduino</span></div>
                <div><strong>85%</strong><span>airtightness reached with the printed and aluminium manifold</span></div>
                <div><strong>40–45 psi</strong><span>the sweet spot found with the HVLP compressor</span></div>
                <div><strong>3</strong><span>autonomous firmware patterns in the final iteration</span></div>
            </div>
        </div>
    </section>

${sections}

${nextStepsSection}

    <p class="pptp-deck reveal">
        <a class="hub-cta" href="https://canva.link/emonw8g4ickx88s" target="_blank" rel="noopener">Presentation slides ↗</a>
    </p>

    <nav class="case-pager">
        <a class="next" href="visages-of-fanaticism.html"><small>Next</small>Visages of Fanaticism</a>
    </nav>
    </main>

    <div class="pptp-lightbox" id="pptp-lightbox" hidden role="dialog" aria-modal="true" aria-label="Image viewer">
        <button type="button" class="pptp-lb-close" data-lightbox-close aria-label="Close">×</button>
        <button type="button" class="pptp-lb-nav pptp-lb-prev" data-lightbox-prev aria-label="Previous image">‹</button>
        <figure>
            <img data-lightbox-img alt="">
            <figcaption data-lightbox-caption></figcaption>
        </figure>
        <button type="button" class="pptp-lb-nav pptp-lb-next" data-lightbox-next aria-label="Next image">›</button>
    </div>

    <div id="case-chrome-bottom"></div>
    <script src="../js/case-study.js" defer></script>
    <script src="../js/pptp.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'projects', 'pptp-soft-pneumatics.html'), html);

const missing = [];
outPages.forEach(p => p.media.forEach(m => { if (m.type !== 'youtube' && !m.exists) missing.push(m.localPath); }));
const noRemote = [];
outPages.forEach(p => p.media.forEach(m => { if (m.type !== 'youtube' && !m.remoteUrl) noRemote.push(m.localPath); }));
console.log(JSON.stringify({ total, missing, noRemote, pages: outPages.length }, null, 1));
