const fs = require('fs');
const L = fs.readFileSync('src/locales/translations.ts', 'utf8').split('\n');

const isJersey = (l) => /^      jerseyNumber: /.test(l);
const isPosition = (l) => /^      position: /.test(lQuaternary);

const out = [];
let removed = 0;
for (let i = 0; i < L.length; i++) {
  const isStrayPair =
    isJersey(L[i]) &&
    i + 1 < L.length &&
    isPosition(L[i + 1]) &&
    // stray = NOT preceded (within ~6 lines) by playerName/email/phone column trio direct
    !(i >= 3 && isJersey?false:false);
  // Simpler robust rule: this pair is the stray one iff there exists ANOTHER
  // jerseyNumber copy later in the file (the display set) — i.e. it's the FIRST copy.
  const firstCopy = isJersey(L[i]) && L.slice(i + 1).some(isJersey);
  if (firstCopy) {
    removed++;
    // also skip the following position line of this same pair
    if (i + 1 < L.length && isPosition(L[i + 1])) { removed++; i++; }
    continue;
  }
  out.push(L[i]);
}

fs.writeFileSync('src/locales/translations.ts', out.join('\n'));
console.log('removed jersey+position stray lines:', removed);
