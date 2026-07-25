const SANS = {
  a:'𝖺',b:'𝖻',c:'𝖼',d:'𝖽',e:'𝖾',f:'𝖿',g:'𝗀',h:'𝗁',i:'𝗂',j:'𝗃',k:'𝗄',l:'𝗅',m:'𝗆',
  n:'𝗇',o:'𝗈',p:'𝗉',q:'𝗊',r:'𝗋',s:'𝗌',t:'𝗍',u:'𝗎',v:'𝗏',w:'𝗐',x:'𝗑',y:'𝗒',z:'𝗓',
  A:'𝖠',B:'𝖡',C:'𝖢',D:'𝖣',E:'𝖤',F:'𝖥',G:'𝖦',H:'𝖧',I:'𝖨',J:'𝖩',K:'𝖪',L:'𝖫',M:'𝖬',
  N:'𝖭',O:'𝖮',P:'𝖯',Q:'𝖰',R:'𝖱',S:'𝖲',T:'𝖳',U:'𝖴',V:'𝖵',W:'𝖶',X:'𝖷',Y:'𝖸',Z:'𝖹',
}
const BOLD = {
  a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
  n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
  A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
  N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
}
const ITALIC = {
  a:'𝘢',b:'𝘣',c:'𝘤',d:'𝘥',e:'𝘦',f:'𝘧',g:'𝘨',h:'𝘩',i:'𝘪',j:'𝘫',k:'𝘬',l:'𝘭',m:'𝘮',
  n:'𝘯',o:'𝘰',p:'𝘱',q:'𝘲',r:'𝘳',s:'𝘴',t:'𝘵',u:'𝘶',v:'𝘷',w:'𝘸',x:'𝘹',y:'𝘺',z:'𝘻',
  A:'𝘈',B:'𝘉',C:'𝘊',D:'𝘋',E:'𝘌',F:'𝘍',G:'𝘎',H:'𝘏',I:'𝘐',J:'𝘑',K:'𝘒',L:'𝘓',M:'𝘔',
  N:'𝘕',O:'𝘖',P:'𝘗',Q:'𝘘',R:'𝘙',S:'𝘚',T:'𝘛',U:'𝘜',V:'𝘝',W:'𝘞',X:'𝘟',Y:'𝘠',Z:'𝘡',
}

const sf = t => String(t).split('').map(c => SANS[c] ?? c).join('')
const bf = t => String(t).split('').map(c => BOLD[c] ?? c).join('')
const itf = t => String(t).split('').map(c => ITALIC[c] ?? c).join('')

const KR = [
  '사랑','마음','공주','빛','별','꽃','달','하늘','바다','숲',
  '봄','여름','가을','겨울','햇살','노을','소망','기쁨','평화','환희',
  '천사','요정','인형','진주','다이아','루비','사파이어','에메랄드',
  '나비','무지개','바람','이슬','새벽','노래','꿈','희망','설레임','포옹',
  '하트','별빛','은하수','크리스마스','눈꽃','벚꽃','수국','해바라기',
  '소녀','소년','우정','사계절','파도','구름','비','눈물','미소','온기',
]

const ARTS = [
  ` ⁠ ⁠   ֪ ⁠  ⡞⠉⠓⢦⣀⣀⣀⡴⠊⠉⢦ \n  ⁠   ⁠  ⡇  ⁠ ⁠  ⢈⣽⣿⠉⣿⣏  ⁠   ⣸ ֪ \n ⁠  ⁠     ⠹⠤⢴⠞⢹⠿⡍⠳⡦⠴⠏ ⁺ִ\n ⁠  ⁠   ⁠   ⁠  ⁠  ֪ ⣃⡀⡏ ⁠   ⢷⢀⣹ ⁠  ֪\n ⁠  ⁠  ⁠    ⁠ ⁠    ⁠  ⁠ ⠛⠁  ⁠  ⠘⠋`,
  `⡔⢤⡀      ⣠⡤⢠ \n⠓⣶⣿⠶⢾⡿⠶⠊ \n   ⢸⡏    ⢻⡆\n  ⠈⢿  ׄ ⸼ 귀여운\nㅤㅤ ㅤㅤ╰┈`,
  `· 𖹠‌‎ׄ ֵ ⤾\n ⡴⢤⠒⡤⢦ \n ⢠⠃⣠⠋ ⠘⡄\n ⠸⡄⡇ ⢀⠇\n. ⢀⣀⣙⠺⠶⠖⣋⣀⡀\n ⠈⠉⠛⢽ ⡯⠛⠉⠁\n ⠈⠤⠁`,
  `　‌‌  ‌, ´´; __ , ´´;\n　‌ ;　𓂂 · ˔ · 𓂂 ‌ ‌ ;\n　‌ ´　っ♡ c ‌ ‌ ‌\``,
  ` ⋆˚🌙˖°  ⋆˚✦˖°  ⋆˚🌙˖°\n ᥫ᭡ ✦ ᥫ᭡ ✦ ᥫ᭡\n  ˖ ✦ ˖ ✦ ˖ ✦ ˖`,
  `꒰ ˶• ༝ •˶꒱\n  ⊹ ꒷꒦꒷ ⊹ ꒷꒦꒷ ⊹\n ٬٬ ₒ ₒ ٬٬`,
]

const DIVIDERS = [
  '    ׄ   ִ   ׄ  ┈─๋──ׄ──۪─┈  ִ ׄ  ⸼',
  '  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ׂ  ۪  ִֶָ ׁ  ּ',
  ' ·  ────── ♡♡♡ ────── · ',
  ' ┄ 𝆬─۪┈ ━━━ ┄𝆬─۪┈ ━━━ ┄ 𝆬─۪┈',
  '·⊹ ·· ┄ · ✦ · ┄ ·· ⊹·',
  '  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ۪ ᳀  ִֶָ ִ  ۫   ᮫    ׂ  ۪  ִֶָ ׁ  ּ',
  ' ꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦',
  ' ┄ ⊹ ┄ ✦ ┄ ⊹ ┄ ✦ ┄ ⊹ ┄',
  ' ˚ ༘♡ ⋆｡˚ ━━━━━ ⋆｡˚♡ ༘˚',
  ' ✧･ﾟ: *✧･ﾟ:* 　·　 *:･ﾟ✧*:･ﾟ✧',
  ' 🎀 ⸜(｡˃ ᵕ ˂ )⸝⋆* 🎀',
  ' .✫*゚・.。.*・✫*゚・.。.*・✫',
  ' ❀ 〜 十 〜 ❀ 〜 十 〜 ❀ 〜 十 〜 ❀',
  ' 𖥻 ─── 𐙚 ─── 𖥻 ─── 𐙚 ─── 𖥻',
  ' ♡̸̷̷̷̷̷̷ ๋࣭ ⭑๑ ɡʟᴏᴡ ๑⭑ ࣭ ๋ ♡̸̷̷̷̷̷̷',
]

const FLOWERS  = ['🌷','🌸','🪷','🌺','🌼','🍀','🌿','🪻','🌙','⭐','✨','💫','🩷','🩵','💙','🪐']
const ACCENTS  = ['𓄼','𓈒','𖹭','𐙚','✿⃘','ε⃘з','𑣿','𓂃','𖥻','𓆸','꩜','⊹','᳐','⋆˚','❀⃘','᭡']
const EMOJIS_2 = ['🎀','💿','🧺','🫧','🎐','🪬','🔮','🍡','🌊','🌸','🎋','🎑','🪩','🦋','🐚','🍵','🧸','🍭','🧁']

const rnd  = arr => arr[Math.floor(Math.random() * arr.length)]
const fl   = ()  => rnd(FLOWERS)
const ac   = ()  => rnd(ACCENTS)
const em   = ()  => rnd(EMOJIS_2)
const kr   = (n = 3) => Array.from({ length: n }, () => KR[Math.floor(Math.random() * KR.length)]).join(' ')
const div  = ()  => rnd(DIVIDERS)

function nowTime() {
  return new Date().toLocaleTimeString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' })
}
function nowDate() {
  return new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric', timeZone: 'Asia/Jakarta' })
}

export function toAestheticFont(str) {
  return String(str).split('').map(c => BOLD[c] ?? c).join('')
}

// ─── TEMPLATES 1-6 (ASLI, TIDAK DIUBAH) ───

function template1(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), d = div(), a = ac()
  return ` ⁠ ⁠   ֪ ⁠  ⡞⠉⠓⢦⣀⣀⣀⡴⠊⠉⢦ 
  ⁠   ⁠  ⡇  ⁠ ⁠  ⢈⣽⣿⠉⣿⣏  ⁠   ⣸ ֪ 
 ⁠  ⁠     ⠹⠤⢴⠞⢹⠿⡍⠳⡦⠴⠏ ⁺ִ 𝖼⃘𐑋‎ ${sf('see the')} *${sf('list')}* ${sf('bubby')}
 ⁠  ⁠   ⁠   ⁠  ⁠  ֪ ⣃⡀⡏ ⁠   ⢷⢀⣹ ⁠  ֪  ⁠  *내 사정 내 사랑* 🎀 ₊˚⊹ 
 ⁠  ⁠  ⁠    ⁠ ⁠    ⁠  ⁠ ⠛⠁  ⁠  ⠘⠋
˒˓ 𝝑᭪݁ ${sf('hayiie welcome')}─${sf(botName.toLowerCase())}'${sf('s')} ʚɪ ׄ ٙ ࣪˖ ${a}.${f}
━┽ ꤥ ⸼ ${sf("adorable's beautiful")} *${sf('list')}* ׂ 𓈒 ⸙ 

 ⁠  ⁠ 𐔌 ࣪˖ ⸙ ${sf('user')} ⦂ @${pushName}
 ⁠  ⁠ 𐔌 ࣪˖ ⸙ ${sf('time')} ⦂ ${nowTime()}
 ⁠  ⁠ 𐔌 ࣪˖ ⸙ ${sf('date')} ⦂ ${nowDate()}

 ${d}

 ${content}

 ${d}

 ⁠  ⋮  callback ʚɪ ׄ ٙ ࣪˖ ${a}${f} *${sf("cuttie's note")}* !! 𖥻 ᳀ ִֶָ
 ⁠  ִֶָ 𐀔 ${sf('ktik')} ${prefix}<command> ${sf('untuk menggunakan')}
 ⁠  ִֶָ 𐀔 ${sf('prefix')} ⦂ ${prefix}  |  ${sf('owner')} ⦂ ${ownerName}
 ⁠  ִֶָ 𐀔 ${sf('bot')} ⦂ ${botName} v${botVersion}

 ⁠   ૮₍ ˃ ⤙ ˂ ₎ა  ${kr(3)} ♡`
}

function template2(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), a = ac()
  return `· 𖹠‌‎ׄ ֵ ⤾ ${sf('hey!')} ─ ${sf('ey sweetie')}
𝅄 ۫۫ ${sf('beautiful ocean shines')} ⸦ ᳘🌊
 ⡴⢤⠒⡤⢦ 
 ⢠⠃⣠⠋ ⠘⡄${sf("beati¡full place")} 
 ⠸⡄⡇ ⢀⠇ ₍ ${sf('hall')}𖦹 ${sf('kawai¡')} ֹ₎ 
. ⢀⣀⣙⠺⠶⠖⣋⣀⡀┄𝆬─۪┈ ┄𝆬─۪┈ 𝅘𝅥𝅯
 ⠈⠉⠛⢽ ⡯⠛⠉⠁ ${a} ${sf('about')} ${botName}
 ⠈⠤⠁

 ${sf('user')} ⦂ @${pushName}  ·  ${sf('time')} ⦂ ${nowTime()}
 ${sf('date')} ⦂ ${nowDate()}  ·  ${sf('prefix')} ⦂ ${prefix}

 ${content}

· 𖹠‌‎ׄ ֵ ⤾ ${sf('noted')} ✿⃘  ${f}
 ┄ 𝆬─۪┈ ┄ 𝆬─۪┈
 ˓ ${sf('prefix')} ⦂ ${prefix}
 ˓ ${sf('owner')} ⦂ ${ownerName}
 ˓ ${sf('bot')} ⦂ ${botName} v${botVersion}
 ˓ ${sf('ktik')} ${prefix}<command> ${sf('untuk menggunakan')}
 ┄ 𝆬─۪┈ ┄ 𝆬─۪┈
 𖥻 ${kr(3)} ♡`
}

function template3(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const d = div(), f = fl(), a = ac()
  return `　‌‌  ‌, ´´; __ , ´´;
　‌ ;　𓂂 · ˔ · 𓂂 ‌ ‌ ;　‌꒰ ‌ ${sf('welcome to')}
　‌ ´　っ♡ c ‌ ‌ ‌\`       ${bf(botName)}       ꒱
 ${d}

 ᓚ${f}ᓓ ꣖ ${sf('user')} ⦂ @${pushName} ꣓
 ᓚ🕰️ᓓ ꣖ ${sf('time')} ⦂ ${nowTime()} · ${nowDate()} ꣓

 ${content}

 ${d}
⤿ ${sf('noted')} ${a}  ${f}
 ˓ 01. ${sf('prefix')} ⦂ ${prefix}
 ˓ 02. ${sf('owner')} ⦂ ${ownerName}
 ˓ 03. ${sf('bot')} ⦂ ${botName} v${botVersion}
 ˓ 04. ${sf('ktik')} ${prefix}<command> ${sf('untuk menggunakan')}
 ${d}
 ${kr(3)} ♡`
}

function template4(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), a = ac()
  return `*❋  ׅ  ݊  ─ ${bf(botName)} ʚଓ ּ ֶָ֢.*
  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ׂ  ۪  ִֶָ ׁ  ּ
─ 𐴲᭡ ${sf('user')} ፡ @${pushName}
─ 𐴲᭡ ${sf('time')} ፡ ${nowTime()}
─ 𐴲᭡ ${sf('date')} ፡ ${nowDate()}
  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ׂ  ۪  ִֶָ ׁ  ּ

 ${content}

  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ׂ  ۪  ִֶָ ׁ  ּ
⚠️ ${bf('Note')} !
- ${sf('prefix')} ⦂ ${prefix}  |  ${sf('owner')} ⦂ ${ownerName}
- ${sf('ktik')} ${prefix}<command> ${sf('untuk menggunakan')}
- ${sf('bot')} ⦂ ${botName} v${botVersion}
  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ׂ  ۪  ִֶָ ׁ  ּ
 ${kr(2)} ${f} ${a} ♡`
}

function template5(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), e = em(), a = ac(), d = div()
  return `⡔⢤⡀      ⣠⡤⢠ 
⠓⣶⣿⠶⢾⡿⠶⠊ 
   ⢸⡏    ⢻⡆ㅤ—┈ ${sf('hi bubby')} .. 🎀 ׄ ˖ 
  ⠈⢿  ׄ ⸼ 귀여운  ǂ  ${sf("please don't spam")} 𖹭.ᐟ
ㅤㅤ ㅤㅤ╰┈${itf('fitur bot')}  ${sf('sweety')} .. +44 ⸼

ㅤ   ╭┈ ${e} ׄ *${sf('profil info')}* ─ׁ┈ 𐙚 ┈ 
ㅤ⸼ ᥴ⃘ᦱ *${sf('user')}* ⦂ @${pushName}
ㅤ⸼ ᥴ⃘ᦱ *${sf('mode')}* ⦂ ${sf('active')}
ㅤ⸼ ᥴ⃘ᦱ *${sf('time')}* ⦂ ${nowTime()}
ㅤ⸼ ᥴ⃘ᦱ *${sf('date')}* ⦂ ${nowDate()}
  ㅤ ╰┈֪┈──ׁ──┈֪┈──ׁ──┈֪┈──╯

 ${d}

 ${content}

 ${d}
ㅤ‹ 𖹭 *${sf('sewa? ketik owner di grub.')}*
 ${a} ${kr(2)} ${f} ♡`
}

function template6(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), a = ac(), d = div()
  return ` ⋆˚🌙˖°  ⋆˚✦˖°  ⋆˚🌙˖°
 ᥫ᭡ ${bf(botName)} ᥫ᭡
 ˖ ✦ ˖ ✦ ˖ ✦ ˖

ㅤ🌸 ${sf('user')} ⦂ @${pushName}
ㅤ⏰ ${sf('time')} ⦂ ${nowTime()}
ㅤ📅 ${sf('date')} ⦂ ${nowDate()}

 ${d}

 ${content}

 ${d}
 ✦ ${sf('info')} ✦
 ⸼ ${sf('prefix')} ⦂ ${prefix}
 ⸼ ${sf('owner')} ⦂ ${ownerName}
 ⸼ ${sf('bot')} ⦂ ${botName} v${botVersion}
 ⋆˚${f}˖° ${kr(2)} ${a} ♡`
}

// ─── TEMPLATES 7-12 (BARU - KOMPAK) ───

function template7(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), a = ac(), d = div()
  return `  ᵎᵎ⠀ ࣪⠀ 𖦹⠀ ⠀⠀ ִֶָ ${bf(botName)} ᵎᵎ⠀ ${a}${f}

  ֺּ ֶָ ${sf('user')} ⦂ @${pushName}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()}  ֺּ ֶָ

 ${d}

 ${content}

 ${d}
  ⋮ㅤ˗ˏˋㅤ${f}ㅤˊˎ˗ㅤ⋮
  ˓ ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  ${sf('bot')} ⦂ v${botVersion}
  ${kr(2)} ${a} ♡`
}

function template8(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), e = em(), a = ac(), d = div()
  return `  (๑>◡<๑) ${e}  ${bf(botName)} ${e}
  ꕤ ${sf('user')} ⦂ @${pushName}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} ꕤ

 ${d}

 ${content}

 ${d}
  ılı.lıllılı.ıl.ll.ııl.lı
  ${sf('ktik')} ${prefix}<command}  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${f} ${a} ♡`
}

function template9(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), a = ac(), d = div()
  return `  ⋆.ೃն*:･ﾟ━ ❀ ${bf(botName)} ❀ ━⋅*  ${a}${f}

  ֺּ ֶָ ${sf('user')} ⦂ @${pushName}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()}  ֺּ ֶָ

 ${d}

 ${content}

 ${d}
  ${sf('ktik')} ${prefix}<command}  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(3)} ♡`
}

function template10(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), a = ac(), d = div()
  return `  ✧･ﾟ: *✧･ﾟ:* ${bf(botName)} *:･ﾟ✧*:･ﾟ✧  ${a}${f}

  ·  ${sf('user')} ⦂ @${pushName}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()}  ·

 ${d}

 ${content}

 ${d}
  ${sf('ktik')} ${prefix}<command}  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  .✫*゚・.。.*・✫*゚・.。.*・✫
  ${kr(2)} ${f} ${a} ♡`
}

function template11(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), a = ac(), d = div()
  return `  ❀ 〜 十 〜 ${bf(botName)} 〜 十 〜 ❀  ${a}${f}

  𖥻 ${sf('user')} ⦂ @${pushName}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} 𖥻

 ${d}

 ${content}

 ${d}
  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ❀ 〜 十 〜 ❀ 〜 十 〜 ❀
  ${kr(2)} ${f} ${a} ♡`
}

function template12(content, opts) {
  const { pushName='user', prefix='.', ownerName='Owner', botName='Bot', botVersion='1.0.0' } = opts
  const f = fl(), a = ac(), d = div()
  return `  ╭┈┈┈┈┈┈┈┈┈┈┈┈┈╮
  ┆  ${bf(botName)} ${a}${f}  ┆
  ╰┈┈┈┈┈┈┈┈┈┈┈┈┈╯

  ˓ ✦ ${sf('user')} ⦂ @${pushName}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} ✦

 ${d}

 ${content}

 ${d}
  ${sf('ktik')} ${prefix}<command}  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${f} ${a} ♡`
}

// ─── TEMPLATES ARRAY ───
const templates = [template1, template2, template3, template4, template5, template6, template7, template8, template9, template10, template11, template12]
let alternateCounter = 0

export function beautifulMessage(content, opts = {}) {
  const { theme = 'alternate' } = opts
  let tpl
  if      (theme === 'alternate') { tpl = templates[alternateCounter % templates.length]; alternateCounter++ }
  else if (theme === 'random')    { tpl = rnd(templates) }
  else if (theme === 'ribbon')    { tpl = templates[0] }
  else if (theme === 'ocean')     { tpl = templates[1] }
  else if (theme === 'minimal')   { tpl = templates[2] }
  else if (theme === 'pricelist') { tpl = templates[3] }
  else if (theme === 'bubble')    { tpl = templates[4] }
  else if (theme === 'star')      { tpl = templates[5] }
  else if (theme === 'dreamy')    { tpl = templates[6] }
  else if (theme === 'flower')    { tpl = templates[7] }
  else if (theme === 'sakura')    { tpl = templates[8] }
  else if (theme === 'sparkle')   { tpl = templates[9] }
  else if (theme === 'hanafuda')  { tpl = templates[10] }
  else if (theme === 'vintage')   { tpl = templates[11] }
  else                            { tpl = templates[0] }
  return tpl(content, opts)
}

// ─── CAT BOX STYLES ───
const CAT_BOX_STYLES = [
  {
    header: (name, e) => `╭┈ ꒰‌ ${bf(name)} ꒱ ─ׁ┈ 𐙚 ┈`,
    item:   cmd        => `ㅤ ││ ׄ ᨧᨩ ${sf(cmd)}`,
    footer: ()         => `ㅤ ╰┈֪┈──ׁ──┈֪┈──ׁ──┈֪┈──╯`,
  },
  {
    header: (name, e) => `╭┅ ${e} 𝅄 ꞌꞋ${bf(name)}ꞌꞋ ˒˓`,
    item:   cmd        => `┃ ׄ 𑣿 ${sf(cmd)}`,
    footer: ()         => `╰╍ ··⊹ ·· ┄ · 🍄 · ┄ · ⊹┄ ·· 𑣿 ׁ⸼`,
  },
  {
    header: (name, e) => `*❋  ׅ  ─ ${bf(name)} ʚ.* ${e}`,
    item:   cmd        => `─ 𐴲᭡ ${sf(cmd)}`,
    footer: ()         => `  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ׂ  ۪  ִֶָ ׁ  ּ`,
  },
  {
    header: (name, e) => ` ᓚ${e}ᓓ ꣖ ${bf(name)} ꣓`,
    item:   cmd        => ` ⸼ ᥴ⃘ᦱ ${sf(cmd)}`,
    footer: ()         => `  ꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦`,
  },
  {
    header: (name, e) => `ㅤ𓂃Ꞌꞌ ${e} ${bf(name)} ǂ`,
    item:   cmd        => `ㅤ ׄ 𑣿 ${sf(cmd)}`,
    footer: ()         => `ㅤ ┄ ⊹ ┄ ✦ ┄ ⊹ ┄ ✦ ┄ ⊹ ┄`,
  },
  // ─── 7 KOMPAK ───
  {
    header: (name, e) => ` ꕤ━ ${bf(name)} ${e} ━ꕤ`,
    item:   cmd        => ` ꕤ ${sf(cmd)}`,
    footer: ()         => ` ꕤ━━━━━━━━━━ꕤ`,
  },
  {
    header: (name, e) => ` ❀ー ${bf(name)} ${e} ー❀`,
    item:   cmd        => ` ❀ ${sf(cmd)}`,
    footer: ()         => ` ー❀ー❀ー❀ー❀ー❀`,
  },
  {
    header: (name, e) => ` ˚₊· ${bf(name)} ·₊˚ ${e}`,
    item:   cmd        => `  · ˚ ${sf(cmd)} ˚ ·`,
    footer: ()         => ` ˚₊· ━━━ ·₊˚`,
  },
  {
    header: (name, e) => ` ✧ ${bf(name)} ✧ ${e}`,
    item:   cmd        => ` ✦ ${sf(cmd)}`,
    footer: ()         => ` ✧･ﾟ: *✧･ﾟ:*`,
  },
  {
    header: (name, e) => ` ♡̸ ${bf(name)} ${e} ♡̸`,
    item:   cmd        => `  ┊ ${sf(cmd)}`,
    footer: ()         => ` ━━━❀*̥˚━━━`,
  },
  {
    header: (name, e) => ` ㅤ╭─ ${e} ${bf(name)} ${e} ─╮`,
    item:   cmd        => `  ㅤ│ ${sf(cmd)}`,
    footer: ()         => `  ㅤ╰─────────╯`,
  },
  {
    header: (name, e) => `  ⊹₊ ${bf(name)} ₊⊹ ${e}`,
    item:   cmd        => `  ┊ ˚AUTHOR˚ ${sf(cmd)}`,
    footer: ()         => `  ⊹₊ · · ⊹₊ · · ⊹₊`,
  },
]

let catBoxCounter = 0

function renderCatBox(title, items) {
  const style = CAT_BOX_STYLES[catBoxCounter % CAT_BOX_STYLES.length]
  catBoxCounter++
  const e = em()
  const lines = [style.header(title, e)]
  for (const item of items) lines.push(style.item(item))
  lines.push(style.footer())
  return lines.join('\n')
}

// ─── BOX STYLES UNTUK buildMenuContent ───

const BOX_HEADERS = [
  (cat) => `╭┅ 🩰 𝅄 ꞌꞋ${bf(cat)}ꞌꞋ ˒˓`,
  (cat) => `╭┅ ${fl()} 𝅄 ꞌꞋ${sf(cat)} ꘓꘓ ˒˓`,
  (cat) => `*❋  ׅ  ─ ${bf(cat)} ʚ.*`,
  (cat) => ` ᓚ${fl()}ᓓ ꣖ ${sf(cat)} ꣓`,
  (cat) => `ㅤ𓂃Ꞌꞌ ${em()} ${bf(cat)} ǂ`,
  (cat) => `╭┈ ꒰‌ ${bf(cat)} ꒱ ─ׁ┈ 𐙚 ┈`,
  // ─── 10 KOMPAK ───
  (cat) => ` ꕤ━ ${bf(cat)} ${em()} ━ꕤ`,
  (cat) => ` ❀ー ${bf(cat)} ${ac()} ー❀`,
  (cat) => ` ˚₊· ${bf(cat)} ·₊˚ ${fl()}`,
  (cat) => ` ✧ ${bf(cat)} ✧ ${em()}`,
  (cat) => ` ♡̸ ${bf(cat)} ${ac()} ♡̸`,
  (cat) => ` ㅤ╭─ ${em()} ${bf(cat)} ${em()} ─╮`,
  (cat) => `  ⊹₊ ${bf(cat)} ${fl()} ₊⊹`,
  (cat) => `  ˓ ✦ ${bf(cat)} ✦ ˓`,
  (cat) => `  ┊  ${bf(cat)} ${em()}`,
  (cat) => `  ꩜ ${bf(cat)} ${fl()} ꩜`,
]

const BOX_ITEM_STYLES = [
  item => `┃ ׄ 𑣿 ${sf(item)}`,
  item => `─ 𐴲᭡ ${sf(item)}`,
  item => ` ˓ ✦ ${sf(item)}`,
  item => ` ֪ ۫ │${sf(item)}`,
  item => `ㅤ ││ ׄ ᨧᨩ ${sf(item)}`,
  item => ` ⸼ ᥴ⃘ᦱ ${sf(item)}`,
  // ─── 10 KOMPAK ───
  item => ` ꕤ ${sf(item)}`,
  item => ` ❀ ${sf(item)}`,
  item => ` · ˚ ${sf(item)} ˚ ·`,
  item => ` ✦ ${sf(item)}`,
  item => ` ┊ ${sf(item)}`,
  item => `  ㅤ│ ${sf(item)}`,
  item => `  ┊ ˚ ${sf(item)} ˚ ┊`,
  item => `  ˓ ${sf(item)} ˓`,
  item => `  ꩜ ${sf(item)}`,
  item => `  ㅤ⸜ ${sf(item)} ⸝`,
]

const BOX_FOOTERS = [
  '╰╍ ··⊹ ·· ┄ · 🍄 · ┄ · ⊹┄ ·· 𑣿 ׁ⸼',
  'ㅤ ╰┈֪┈──ׁ──┈֪┈──ׁ──┈֪┈──╯',
  ' ·  ────── ♡♡♡ ────── · ',
  ' ┄ 𝆬─۪┈ ┄ 𝆬─۪┈ ┄ 𝆬─۪┈',
  '  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ׂ  ۪  ִֶָ ׁ  ּ',
  ' ꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦꒷꒦',
  // ─── 10 KOMPAK ───
  ' ꕤ━━━━━━━━━━ꕤ',
  ' ー❀ー❀ー❀ー❀',
  ' ˚₊· ━━━ ·₊˚',
  ' ✧･ﾟ: *✧･ﾟ:*',
  ' ━━━❀*̥˚━━━',
  '  ㅤ╰─────────╯',
  '  ⊹₊ · · ⊹₊ · · ⊹₊',
  '  ˓ ━━━━━ ˓',
  '  ━━━━━━━━━',
  '  ꩜────────꩜',
]

let boxCounter = 0

// ─── MAIN MENU RENDERERS (KOMPAK) ───

const mainMenuRenderers = [
  // Versi 0: Original (TIDAK DIUBAH)
  function renderMainMenuV0(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `ㅤ ││ ׄ ᨧᨩ ${sf(k)}`).join('\n')

    return `⡔⢤⡀      ⣠⡤⢠ 
⠓⣶⣿⠶⢾⡿⠶⠊ 
   ⢸⡏    ⢻⡆ㅤ—┈ ${sf('hi bubby')} .. 🎀 ׄ ˖ 
  ⠈⢿  ׄ ⸼ 귀여운  ǂ  ${sf("please don't spam")} 𖹭.ᐟ
ㅤㅤ ㅤㅤ╰┈${itf('fitur bot')}  ${sf('sweety')} .. +44 ⸼

ㅤ   ╭┈ Ꞌꞌ ${e} ׄ *${sf('profil info')}* ─ׁ┈ 𐙚 ┈ 
ㅤ⸼ ᥴ⃘ᦱ *${sf('user')}* ⦂ @${pushName}
ㅤ⸼ ᥴ⃘ᦱ *${sf('mode')}* ⦂ ${sf(mode)}
ㅤ⸼ ᥴ⃘ᦱ *${sf('time')}* ⦂ ${nowTime()}
ㅤ⸼ ᥴ⃘ᦱ *${sf('date')}* ⦂ ${nowDate()}
  ㅤ ╰┈֪┈──ׁ──┈֪┈──ׁ──┈֪┈──╯

 ${d}

ㅤ𓂃Ꞌꞌ ${em()} ${bf(botName)} ǂ  ${itf('fitur bot')}  .. 𖹭.ᐟ
ㅤ ׄ 𑣿 *${sf('list')}* — ${sf('melihat produk di grub')} ׅ ⡺
ㅤ ׄ 𑣿 *${sf('owner')}* — ${sf('melihat pemilik bot')} ׅ ⡺
ㅤ ׄ 𑣿 *${sf('menu')}* — ${sf('melihat simple menu')} ׅ ⡺
ㅤ ׄ 𑣿 *${sf('ping')}* — ${sf('cek status bot')} ׅ ⡺

 ${d}

╭┈ ꒰‌ ${bf('Command List')} ꒱ ─ׁ┈ 𐙚 ┈
 ${catLines}
ㅤ ╰┈֪┈──ׁ──┈֪┈──ׁ──┈֪┈──╯

ㅤ‹ 𖹭 *${sf('sewa? ketik owner di grub.')}*
 ${a} ${kr(2)} ${f} ♡`
  },

  // Versi 1: Dreamy (KOMPAK)
  function renderMainMenuV1(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  ꕤ ${sf(k)}`).join('\n')

    return `  ᵎᵎ⠀ ࣪⠀ 𖦹⠀ ⠀⠀ ִֶָ ${bf(botName)} ᵎᵎ⠀ ${a}${f}

  ֺּ ֶָ ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()}  ֺּ ֶָ

 ${d}

  ꕤ━ ${bf('Quick Menu')} ${e} ━ꕤ
  ꕤ *${sf('list')}* — ${sf('melihat produk di grub')}
  ꕤ *${sf('owner')}* — ${sf('melihat pemilik bot')}
  ꕤ *${sf('menu')}* — ${sf('melihat simple menu')}
  ꕤ *${sf('ping')}* — ${sf('cek status bot')}
  ꕤ━━━━━━━━━━ꕤ

 ${d}

  ꕤ━ ${bf('Categories')} ${a} ━ꕤ
 ${catLines}
  ꕤ━━━━━━━━━━ꕤ

 ${d}

  ⋮ㅤ˗ˏˋㅤ${f}ㅤˊˎ˗ㅤ⋮
  ˓ ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${a} ♡`
  },

  // Versi 2: Flower (KOMPAK)
  function renderMainMenuV2(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  ❀ ${sf(k)}`).join('\n')

    return `  (๑>◡<๑) ${e}  ${bf(botName)} ${e}
  ꕤ ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} ꕤ

 ${d}

  ❀ー ${bf('Quick Menu')} ${a} ー❀
  ❀ *${sf('list')}* — ${sf('melihat produk di grub')}
  ❀ *${sf('owner')}* — ${sf('melihat pemilik bot')}
  ❀ *${sf('menu')}* — ${sf('melihat simple menu')}
  ❀ *${sf('ping')}* — ${sf('cek status bot')}
  ー❀ー❀ー❀ー❀

 ${d}

  ❀ー ${bf('Categories')} ${f} ー❀
 ${catLines}
  ー❀ー❀ー❀ー❀

 ${d}

  ılı.lıllılı.ıl.ll.ııl.lı
  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${f} ${a} ♡`
  },

  // Versi 3: Sakura (KOMPAK)
  function renderMainMenuV3(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  · ˚ ${sf(k)} ˚ ·`).join('\n')

    return `  ⋆.ೃն*:･ﾟ━ ❀ ${bf(botName)} ❀ ━⋅*  ${a}${f}

  ֺּ ֶָ ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()}  ֺּ ֶָ

 ${d}

  ˚₊· ${bf('Quick Menu')} ·₊˚ ${a}
  · ˚ *${sf('list')}* — ${sf('melihat produk di grub')} ˚ ·
  · ˚ *${sf('owner')}* — ${sf('melihat pemilik bot')} ˚ ·
  · ˚ *${sf('menu')}* — ${sf('melihat simple menu')} ˚ ·
  · ˚ *${sf('ping')}* — ${sf('cek status bot')} ˚ ·
  ˚₊· ━━━ ·₊˚

 ${d}

  ˚₊· ${bf('Categories')} ·₊˚ ${f}
 ${catLines}
  ˚₊· ━━━ ·₊˚

 ${d}

  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(3)} ♡`
  },

  // Versi 4: Sparkle (KOMPAK)
  function renderMainMenuV4(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  ✦ ${sf(k)}`).join('\n')

    return `  ✧･ﾟ: *✧･ﾟ:* ${bf(botName)} *:･ﾟ✧*:･ﾟ✧  ${a}${f}

  ·  ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()}  ·

 ${d}

  ✧ ${bf('Quick Menu')} ✧ ${e}
  ✦ *${sf('list')}* — ${sf('melihat produk di grub')}
  ✦ *${sf('owner')}* — ${sf('melihat pemilik bot')}
  ✦ *${sf('menu')}* — ${sf('melihat simple menu')}
  ✦ *${sf('ping')}* — ${sf('cek status bot')}
  ✧･ﾟ: *✧･ﾟ:*

 ${d}

  ✧ ${bf('Categories')} ✧ ${f}
 ${catLines}
  ✧･ﾟ: *✧･ﾟ:*

 ${d}

  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  .✫*゚・.。.*・✫*゚・.。.*・✫
  ${kr(2)} ${f} ${a} ♡`
  },

  // Versi 5: Hanafuda (KOMPAK)
  function renderMainMenuV5(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  ┊ ${sf(k)}`).join('\n')

    return `  ❀ 〜 十 〜 ${bf(botName)} 〜 十 〜 ❀  ${a}${f}

  𖥻 ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} 𖥻

 ${d}

  ❀ 〜 十 〜 ${bf('Quick Menu')} 〜 十 〜 ❀ ${e}
  〜 十 *${sf('list')}* — ${sf('melihat produk di grub')} 十 〜
  〜 十 *${sf('owner')}* — ${sf('melihat pemilik bot')} 十 〜
  〜 十 *${sf('menu')}* — ${sf('melihat simple menu')} 十 〜
  〜 十 *${sf('ping')}* — ${sf('cek status bot')} 十 〜
  ❀ 〜 十 〜 ❀ 〜 十 〜 ❀

 ${d}

  ❀ 〜 十 〜 ${bf('Categories')} 〜 十 〜 ❀ ${f}
 ${catLines}
  ❀ 〜 十 〜 ❀ 〜 十 〜 ❀

 ${d}

  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${f} ${a} ♡`
  },

  // Versi 6: Heart (KOMPAK)
  function renderMainMenuV6(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  ┊ ˚ ${sf(k)} ˚ ┊`).join('\n')

    return `  ♡̸̷̷̷̷̷̷ ๋࣭ ⭑ ${bf(botName)} ⭑ ࣭ ๋ ♡̸̷̷̷̷̷̷  ${a}${f}

  ♡̸ ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} ♡̸

 ${d}

  ♡̸ ${bf('Quick Menu')} ${e} ♡̸
  ┊ *${sf('list')}* — ${sf('melihat produk di grub')}
  ┊ *${sf('owner')}* — ${sf('melihat pemilik bot')}
  ┊ *${sf('menu')}* — ${sf('melihat simple menu')}
  ┊ *${sf('ping')}* — ${sf('cek status bot')}
  ━━━❀*̥˚━━━

 ${d}

  ♡̸ ${bf('Categories')} ${f} ♡̸
 ${catLines}
  ━━━❀*̥˚━━━

 ${d}

  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${f} ${a} ♡`
  },

  // Versi 7: Mini Box (KOMPAK)
  function renderMainMenuV7(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  ㅤ│ ${sf(k)}`).join('\n')

    return `  ⊹₊· ͟͟͞͞➳❥ ${bf(botName)} ͟͟͞͞➳❥ ·⊹₊  ${a}${f}

  ⊹ ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} ⊹

 ${d}

  ㅤ╭─ ${e} ${bf('Quick Menu')} ${e} ─╮
  ㅤ│ *${sf('list')}* — ${sf('melihat produk di grub')}
  ㅤ│ *${sf('owner')}* — ${sf('melihat pemilik bot')}
  ㅤ│ *${sf('menu')}* — ${sf('melihat simple menu')}
  ㅤ│ *${sf('ping')}* — ${sf('cek status bot')}
  ㅤ╰─────────╯

 ${d}

  ㅤ╭─ ${f} ${bf('Categories')} ${f} ─╮
 ${catLines}
  ㅤ╰─────────╯

 ${d}

  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${f} ${a} ♡`
  },

  // Versi 8: Vintage (KOMPAK)
  function renderMainMenuV8(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  ˓ ${sf(k)} ˓`).join('\n')

    return `  ╭┈┈┈┈┈┈┈┈┈┈┈┈┈╮
  ┆  ${bf(botName)} ${a}${f}  ┆
  ╰┈┈┈┈┈┈┈┈┈┈┈┈┈╯

  ˓ ✦ ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} ✦

 ${d}

  ╭┈┈ ${bf('Quick Menu')} ${e} ┈┈╮
  ˓ ✦ *${sf('list')}* — ${sf('melihat produk di grub')}
  ˓ ✦ *${sf('owner')}* — ${sf('melihat pemilik bot')}
  ˓ ✦ *${sf('menu')}* — ${sf('melihat simple menu')}
  ˓ ✦ *${sf('ping')}* — ${sf('cek status bot')}
  ╰┈┈┈┈┈┈┈┈┈┈┈┈┈╯

 ${d}

  ╭┈┈ ${bf('Categories')} ${f} ┈┈╮
 ${catLines}
  ╰┈┈┈┈┈┈┈┈┈┈┈┈┈╯

 ${d}

  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${f} ${a} ♡`
  },

  // Versi 9: Soft (KOMPAK)
  function renderMainMenuV9(categoryKeys, opts) {
    const {
      pushName='user', prefix='.', ownerName='Owner',
      botName='Bot', botVersion='1.0.0', mode='public'
    } = opts

    const e = em(), f = fl(), a = ac(), d = div()
    const catLines = categoryKeys.map(k => `  ꩜ ${sf(k)}`).join('\n')

    return `  ꩜ ${bf(botName)} ${a}${f} ꩜

  ꩜ ${sf('user')} ⦂ @${pushName}  ·  ${sf('mode')} ⦂ ${sf(mode)}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()} ꩜

 ${d}

  ꩜ ${bf('Quick Menu')} ${e} ꩜
  ꩜ *${sf('list')}* — ${sf('melihat produk di grub')}
  ꩜ *${sf('owner')}* — ${sf('melihat pemilik bot')}
  ꩜ *${sf('menu')}* — ${sf('melihat simple menu')}
  ꩜ *${sf('ping')}* — ${sf('cek status bot')}
  ꩜────────꩜

 ${d}

  ꩜ ${bf('Categories')} ${f} ꩜
 ${catLines}
  ꩜────────꩜

 ${d}

  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}
  ${kr(2)} ${f} ${a} ♡`
  },
]

export function renderMainMenu(categoryKeys, opts = {}) {
  const idx = Math.floor(Math.random() * mainMenuRenderers.length)
  return mainMenuRenderers[idx](categoryKeys, opts)
}

export function renderCategoryMenu(catName, commands, opts = {}) {
  const { prefix='.', ownerName='Owner', botName='Bot' } = opts
  const f = fl(), a = ac(), d = div()

  const box = renderCatBox(catName, commands)

  const styles = [
    () => `${box}\n\nㅤ‹ ${f} *${sf("cuttie's menu")}*\n ˓ ${sf('prefix')} ⦂ ${prefix}  |  ${sf('bot')} ⦂ ${botName}\n ${a} ${kr(2)} ♡`,
    () => `${d}\n${box}\n${d}\n\n ${sf('owner')} ⦂ ${ownerName}  ·  ${sf('prefix')} ⦂ ${prefix}\n ${a} ${kr(2)} ${f} ♡`,
    () => `꒰ ${f} ꒱ ${bf(catName)}\n${d}\n\n${box}\n\n${d}\n ˓ ${sf('ktik')} ${prefix}<command> ${sf('untuk menggunakan')}\n ${a} ${kr(2)} ♡`,
    // 6 KOMPAK
    () => `${box}\n\n  ⋮ㅤ˗ˏˋ ${a} ˊˎ˗ㅤ⋮\n  ˓ ${sf('ktik')} ${prefix}<command}  ·  ${sf('bot')} ⦂ ${botName}\n  ${kr(2)} ${f} ♡`,
    () => `${box}\n\n  ılı.lıllılı.ıl.ll.ııl.lı\n  ${sf('ktik')} ${prefix}<command}  ·  ${sf('bot')} ⦂ ${botName}\n  ${kr(2)} ${a} ${f} ♡`,
    () => `${box}\n\n  ${sf('ktik')} ${prefix}<command>  ·  ${sf('owner')} ⦂ ${ownerName}  ·  v${botVersion}\n  ${kr(2)} ${f} ${a} ♡`,
    () => `${box}\n\n  ✧･ﾟ: *✧･ﾟ:*\n  ${sf('ktik')} ${prefix}<command}  ·  ${sf('bot')} ⦂ ${botName}\n  ${kr(2)} ${f} ${a} ♡`,
    () => `${box}\n\n  ❀ 〜 十 〜 ❀\n  ${sf('ktik')} ${prefix}<command>  ·  ${sf('bot')} ⦂ ${botName}\n  ${kr(2)} ${f} ${a} ♡`,
    () => `${box}\n\n  ⊹₊· ➳❥ ·⊹₊\n  ${sf('ktik')} ${prefix}<command>  ·  ${sf('bot')} ⦂ ${botName}\n  ${kr(2)} ${f} ${a} ♡`,
  ]

  return rnd(styles)()
}

export function buildMenuContent(categories, order = ['main','user','group','owner','maker','store','tools']) {
  const catList = [
    ...order.filter(c => categories[c]),
    ...Object.keys(categories).filter(c => !order.includes(c)).sort(),
  ]
  let text = ''
  for (const cat of catList) {
    const plugins = categories[cat]
    if (!plugins?.length) continue
    const label  = cat.charAt(0).toUpperCase() + cat.slice(1)
    const hdrFn  = BOX_HEADERS[boxCounter % BOX_HEADERS.length]
    const itemFn = BOX_ITEM_STYLES[boxCounter % BOX_ITEM_STYLES.length]
    const ftr    = BOX_FOOTERS[boxCounter % BOX_FOOTERS.length]
    boxCounter++
    text += hdrFn(label) + '\n'
    for (const p of plugins) text += itemFn(p.name) + '\n'
    text += ftr + '\n\n'
  }
  return text.trimEnd()
}

export { sf, bf, itf, fl, ac, kr, div, rnd, nowTime, nowDate }

export default { beautifulMessage, buildMenuContent, toAestheticFont, renderMainMenu, renderCategoryMenu }