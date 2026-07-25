// src/lib/anti-link.js
const LINK_REGEX = /(?:https?:\/\/|www\.)[^\s]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|id|io|co|me|ly|info|biz|app|dev|online|site|web|shop|store|tech|ai|xyz|top|club|link|live|news|blog|space|fun|digital|vip|pro|social|media|chat|play|cloud|film|stream|watch|crypto|travel|food|health|sport|gg|tk|ml|ga|cf|gq|cc|tv|us|uk|eu|ru|cn|jp|kr|br|in|de|fr|it|es|au|ca|mx|za|ng|ke|ph|vn|tw|sg|my|th|pk|bd|lk|np|mm|kh|la|edu|gov|mil|int|museum|aero|coop|jobs|mobi|tel|asia|cat|post|xxx|porn|sex|adult|cam|date|dating|singles|love|wedding|casino|bet|poker|slot|game|games|gaming|lotto|win|money|cash|loan|credit|invest|trading|forex|bitcoin|btc|eth|nft|token|swap|defi|wallet|pay|bank|finance|insurance|lawyer|legal|law|tax|consulting|agency|marketing|seo|hosting|domain|server|vpn|proxy|hack|crack|cheat|mod|apk|download|free|premium|hack|exploit|phishing|scam|fraud|fake|spam|virus|malware|trojan|worm|ransomware|keylog|ddos|botnet|carding|dump|fullz|cvv|bin|socks|rdp|ssh|ftp|smtp|cpanel|webshell|rat|stealer|grabber|inject|sqli|xss|rce|lfi|rfi)[^\s]*/gi;
const WA_LINK_REGEX = /(?:https?:\/\/)?(?:chat\.whatsapp\.com|wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|business\.whatsapp\.com|faq\.whatsapp\.com|whatsapp\.com)\/[^\s]+/gi;
const TG_LINK_REGEX = /(?:https?:\/\/)?(?:t\.me|telegram\.me|telegram\.org|telegram\.dog)\/[^\s]+/gi;
const DC_LINK_REGEX = /(?:https?:\/\/)?(?:discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[^\s]+/gi;
const IG_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/[^\s]+/gi;
const TT_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)\/[^\s]+/gi;
const YT_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be|m\.youtube\.com|music\.youtube\.com)\/[^\s]+/gi;
const FB_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com|fb\.me|m\.facebook\.com|web\.facebook\.com)\/[^\s]+/gi;
const TW_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com|t\.co|mobile\.twitter\.com)\/[^\s]+/gi;
const SC_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:snapchat\.com|snap\.com)\/[^\s]+/gi;
const LI_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|lnkd\.in)\/[^\s]+/gi;
const SP_LINK_REGEX = /(?:https?:\/\/)?(?:open\.spotify\.com|spotify\.com|spoti\.fi)\/[^\s]+/gi;
const SHORTENER_REGEX = /(?:https?:\/\/)?(?:bit\.ly|goo\.gl|tinyurl\.com|t\.co|is\.gd|v\.gd|rb\.gy|cutt\.ly|shorturl\.at|tiny\.cc|short\.io|s\.id|clck\.ru|link\.to|ow\.ly|bl\.ink|buff\.ly|snip\.ly|soo\.gd|url\.bio|linktr\.ee|bio\.link|lnk\.bio|lnk\.to|dub\.sh|rebrand\.ly|smarturl\.it|hyperurl\.co|qr\.ae|adf\.ly|bc\.vc|ouo\.io|za\.gl|exe\.io|shrink\.me|shrtfly\.com|gplinks\.co|droplink\.co|linkvertise\.com|link1s\.com|shrinkme\.io|shrinke\.me|shorte\.st|ceesty\.com|clk\.sh|gestyy\.com|link\.tl|cut\.ly|plu\.sh|clicksfly\.com|try2link\.com|shrinkforearn\.in)\/[^\s]+/gi;
const PHISHING_REGEX = /(?:https?:\/\/)?(?:[a-zA-Z0-9\-]+\.)*(?:whatsapp\-[a-zA-Z0-9]+|wh[a4]ts[a4]pp|w[a4]\.me|whats[a4]p|login\-[a-zA-Z0-9]+|secure\-[a-zA-Z0-9]+|account\-[a-zA-Z0-9]+|verify\-[a-zA-Z0-9]+|update\-[a-zA-Z0-9]+|confirm\-[a-zA-Z0-9]+|recover\-[a-zA-Z0-9]+|signin\-[a-zA-Z0-9]+|signup\-[a-zA-Z0-9]+)\.(?:com|net|org|xyz|tk|ml|ga|cf|gq|top|site|online|info|club|link|live|space|fun|vip|buzz|click|surf|monster|rest|cfd|sbs|quest)[^\s]*/gi;
const IP_LINK_REGEX = /(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?(?:\/[^\s]*)?/gi;
const BASE64_LINK_REGEX = /(?:aHR0cHM6Ly|aHR0cDovL)[A-Za-z0-9+/=]+/g;
const OBFUSCATED_LINK_REGEX = /(?:[a-zA-Z0-9]+\s*\[\s*\.\s*\]\s*[a-zA-Z0-9]+|[a-zA-Z0-9]+\s*\(\s*\.\s*\)\s*[a-zA-Z0-9]+|[a-zA-Z0-9]+\s*\{\s*\.\s*\}\s*[a-zA-Z0-9]+|[a-zA-Z0-9]+\s*dot\s*[a-zA-Z0-9]+\s*(?:slash|\/)\s*[^\s]+)/gi;

function hasLink(txt) {
    if (!txt) return false;
    LINK_REGEX.lastIndex = 0;
    WA_LINK_REGEX.lastIndex = 0;
    TG_LINK_REGEX.lastIndex = 0;
    DC_LINK_REGEX.lastIndex = 0;
    IG_LINK_REGEX.lastIndex = 0;
    TT_LINK_REGEX.lastIndex = 0;
    YT_LINK_REGEX.lastIndex = 0;
    FB_LINK_REGEX.lastIndex = 0;
    TW_LINK_REGEX.lastIndex = 0;
    SC_LINK_REGEX.lastIndex = 0;
    LI_LINK_REGEX.lastIndex = 0;
    SP_LINK_REGEX.lastIndex = 0;
    SHORTENER_REGEX.lastIndex = 0;
    PHISHING_REGEX.lastIndex = 0;
    IP_LINK_REGEX.lastIndex = 0;
    BASE64_LINK_REGEX.lastIndex = 0;
    OBFUSCATED_LINK_REGEX.lastIndex = 0;

    if (/https?:\/\/|www\./i.test(txt) || LINK_REGEX.test(txt)) return true;

    LINK_REGEX.lastIndex = 0;
    if (WA_LINK_REGEX.test(txt)) return true;
    if (TG_LINK_REGEX.test(txt)) return true;
    if (DC_LINK_REGEX.test(txt)) return true;
    if (IG_LINK_REGEX.test(txt)) return true;
    if (TT_LINK_REGEX.test(txt)) return true;
    if (YT_LINK_REGEX.test(txt)) return true;
    if (FB_LINK_REGEX.test(txt)) return true;
    if (TW_LINK_REGEX.test(txt)) return true;
    if (SC_LINK_REGEX.test(txt)) return true;
    if (LI_LINK_REGEX.test(txt)) return true;
    if (SP_LINK_REGEX.test(txt)) return true;
    if (SHORTENER_REGEX.test(txt)) return true;
    if (PHISHING_REGEX.test(txt)) return true;
    if (IP_LINK_REGEX.test(txt)) return true;
    if (BASE64_LINK_REGEX.test(txt)) return true;
    if (OBFUSCATED_LINK_REGEX.test(txt)) return true;

    if (/[\u202e\u200f\u200e\u200b\u200c\u200d]/.test(txt)) {
        const _cleaned = txt.replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\u2060-\u2064\u206a-\u206f\ufeff\u00ad\u180e\u034f\u061c]/g, '');
        LINK_REGEX.lastIndex = 0;
        SHORTENER_REGEX.lastIndex = 0;
        PHISHING_REGEX.lastIndex = 0;
        IP_LINK_REGEX.lastIndex = 0;
        if (LINK_REGEX.test(_cleaned)) return true;
        LINK_REGEX.lastIndex = 0;
        if (SHORTENER_REGEX.test(_cleaned)) return true;
        SHORTENER_REGEX.lastIndex = 0;
        if (PHISHING_REGEX.test(_cleaned)) return true;
        PHISHING_REGEX.lastIndex = 0;
        if (IP_LINK_REGEX.test(_cleaned)) return true;
        IP_LINK_REGEX.lastIndex = 0;
    }

    const _deobf = txt.replace(/\[\s*\.\s*\]/g, '.').replace(/\(\s*\.\s*\)/g, '.').replace(/\{\s*\.\s*\}/g, '.').replace(/\s+dot\s+/gi, '.').replace(/\s+slash\s+/gi, '/').replace(/\s+colon\s+/gi, ':');
    if (_deobf !== txt) {
        LINK_REGEX.lastIndex = 0;
        if (LINK_REGEX.test(_deobf)) return true;
        LINK_REGEX.lastIndex = 0;
        if (/https?:\/\/|www\./i.test(_deobf)) return true;
    }

    if (BASE64_LINK_REGEX.test(txt)) {
        try {
            const _b64matches = txt.match(/(?:aHR0cHM6Ly|aHR0cDovL)[A-Za-z0-9+/=]+/g);
            if (_b64matches) {
                for (const _b64m of _b64matches) {
                    const _decoded = Buffer.from(_b64m, 'base64').toString('utf8');
                    if (/https?:\/\//i.test(_decoded)) return true;
                }
            }
        } catch {}
    }

    const _leetDeobf = txt.replace(/1/g, 'l').replace(/0/g, 'o').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/\$/g, 's').replace(/@/g, 'a');
    if (_leetDeobf !== txt) {
        LINK_REGEX.lastIndex = 0;
        if (LINK_REGEX.test(_leetDeobf)) return true;
        LINK_REGEX.lastIndex = 0;
    }

    const _spacedLink = txt.replace(/(\w)\s+(?=\w)/g, '$1');
    if (_spacedLink !== txt && _spacedLink.length > 5) {
        LINK_REGEX.lastIndex = 0;
        if (LINK_REGEX.test(_spacedLink)) return true;
        LINK_REGEX.lastIndex = 0;
        if (/https?:\/\/|www\./i.test(_spacedLink)) return true;
    }

    if (/[a-zA-Z0-9]+\s*\.\s*(?:com|net|org|id|io|co|me|xyz|top|site|online|link|live|tk|ml|ga|cf|gq)\b/i.test(txt)) return true;

    return false;
}

function hasWALink(txt) {
    if (!txt) return false;
    WA_LINK_REGEX.lastIndex = 0;
    if (WA_LINK_REGEX.test(txt)) return true;
    WA_LINK_REGEX.lastIndex = 0;
    const _cleaned = txt.replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\u2060-\u2064\ufeff\u00ad\u180e\u034f\u061c]/g, '');
    if (_cleaned !== txt) {
        WA_LINK_REGEX.lastIndex = 0;
        if (WA_LINK_REGEX.test(_cleaned)) return true;
        WA_LINK_REGEX.lastIndex = 0;
    }
    const _deobf = txt.replace(/\[\s*\.\s*\]/g, '.').replace(/\(\s*\.\s*\)/g, '.').replace(/\{\s*\.\s*\}/g, '.').replace(/\s+dot\s+/gi, '.').replace(/\s+slash\s+/gi, '/');
    if (_deobf !== txt) {
        WA_LINK_REGEX.lastIndex = 0;
        if (WA_LINK_REGEX.test(_deobf)) return true;
        WA_LINK_REGEX.lastIndex = 0;
    }
    if (/(?:chat\s*\.\s*whatsapp\s*\.\s*com|wa\s*\.\s*me|whatsapp\s*\.\s*com)\s*\/\s*[^\s]+/i.test(txt)) return true;
    PHISHING_REGEX.lastIndex = 0;
    if (PHISHING_REGEX.test(txt)) return true;
    PHISHING_REGEX.lastIndex = 0;
    return false;
}

function hasTGLink(txt) {
    if (!txt) return false;
    TG_LINK_REGEX.lastIndex = 0;
    if (TG_LINK_REGEX.test(txt)) return true;
    TG_LINK_REGEX.lastIndex = 0;
    const _cleaned = txt.replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\u2060-\u2064\ufeff\u00ad]/g, '');
    if (_cleaned !== txt) {
        TG_LINK_REGEX.lastIndex = 0;
        if (TG_LINK_REGEX.test(_cleaned)) return true;
        TG_LINK_REGEX.lastIndex = 0;
    }
    return false;
}

function hasDCLink(txt) {
    if (!txt) return false;
    DC_LINK_REGEX.lastIndex = 0;
    if (DC_LINK_REGEX.test(txt)) return true;
    DC_LINK_REGEX.lastIndex = 0;
    const _cleaned = txt.replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\u2060-\u2064\ufeff\u00ad]/g, '');
    if (_cleaned !== txt) {
        DC_LINK_REGEX.lastIndex = 0;
        if (DC_LINK_REGEX.test(_cleaned)) return true;
        DC_LINK_REGEX.lastIndex = 0;
    }
    return false;
}

function hasShortLink(txt) {
    if (!txt) return false;
    SHORTENER_REGEX.lastIndex = 0;
    if (SHORTENER_REGEX.test(txt)) return true;
    SHORTENER_REGEX.lastIndex = 0;
    const _cleaned = txt.replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\u2060-\u2064\ufeff\u00ad]/g, '');
    if (_cleaned !== txt) {
        SHORTENER_REGEX.lastIndex = 0;
        if (SHORTENER_REGEX.test(_cleaned)) return true;
        SHORTENER_REGEX.lastIndex = 0;
    }
    const _deobf = txt.replace(/\[\s*\.\s*\]/g, '.').replace(/\(\s*\.\s*\)/g, '.').replace(/\s+dot\s+/gi, '.');
    if (_deobf !== txt) {
        SHORTENER_REGEX.lastIndex = 0;
        if (SHORTENER_REGEX.test(_deobf)) return true;
        SHORTENER_REGEX.lastIndex = 0;
    }
    return false;
}

function hasPhishingLink(txt) {
    if (!txt) return false;
    PHISHING_REGEX.lastIndex = 0;
    if (PHISHING_REGEX.test(txt)) return true;
    PHISHING_REGEX.lastIndex = 0;
    IP_LINK_REGEX.lastIndex = 0;
    if (IP_LINK_REGEX.test(txt)) return true;
    IP_LINK_REGEX.lastIndex = 0;
    const _cleaned = txt.replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\u2060-\u2064\ufeff\u00ad\u180e\u034f\u061c]/g, '');
    if (_cleaned !== txt) {
        PHISHING_REGEX.lastIndex = 0;
        if (PHISHING_REGEX.test(_cleaned)) return true;
        PHISHING_REGEX.lastIndex = 0;
        IP_LINK_REGEX.lastIndex = 0;
        if (IP_LINK_REGEX.test(_cleaned)) return true;
        IP_LINK_REGEX.lastIndex = 0;
    }
    if (BASE64_LINK_REGEX.test(txt)) {
        try {
            const _b64matches = txt.match(/(?:aHR0cHM6Ly|aHR0cDovL)[A-Za-z0-9+/=]+/g);
            if (_b64matches) {
                for (const _b64m of _b64matches) {
                    const _decoded = Buffer.from(_b64m, 'base64').toString('utf8');
                    PHISHING_REGEX.lastIndex = 0;
                    if (PHISHING_REGEX.test(_decoded)) return true;
                    PHISHING_REGEX.lastIndex = 0;
                }
            }
        } catch {}
    }
    return false;
}

function hasIPLink(txt) {
    if (!txt) return false;
    IP_LINK_REGEX.lastIndex = 0;
    if (IP_LINK_REGEX.test(txt)) return true;
    IP_LINK_REGEX.lastIndex = 0;
    const _cleaned = txt.replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\ufeff\u00ad]/g, '');
    if (_cleaned !== txt) {
        IP_LINK_REGEX.lastIndex = 0;
        if (IP_LINK_REGEX.test(_cleaned)) return true;
        IP_LINK_REGEX.lastIndex = 0;
    }
    return false;
}

function hasBase64Link(txt) {
    if (!txt) return false;
    BASE64_LINK_REGEX.lastIndex = 0;
    if (BASE64_LINK_REGEX.test(txt)) {
        try {
            const _b64matches = txt.match(/(?:aHR0cHM6Ly|aHR0cDovL)[A-Za-z0-9+/=]+/g);
            if (_b64matches) {
                for (const _b64m of _b64matches) {
                    const _decoded = Buffer.from(_b64m, 'base64').toString('utf8');
                    if (/https?:\/\//i.test(_decoded)) return true;
                }
            }
        } catch {}
    }
    return false;
}

function hasObfuscatedLink(txt) {
    if (!txt) return false;
    OBFUSCATED_LINK_REGEX.lastIndex = 0;
    if (OBFUSCATED_LINK_REGEX.test(txt)) return true;
    OBFUSCATED_LINK_REGEX.lastIndex = 0;
    if (/[a-zA-Z0-9]+\s*\.\s*(?:com|net|org|id|io|co|me|xyz|top|site|online|link|live|tk|ml|ga|cf|gq)\b/i.test(txt)) return true;
    const _deobf = txt.replace(/\[\s*\.\s*\]/g, '.').replace(/\(\s*\.\s*\)/g, '.').replace(/\{\s*\.\s*\}/g, '.').replace(/\s+dot\s+/gi, '.').replace(/\s+slash\s+/gi, '/').replace(/\s+colon\s+/gi, ':');
    if (_deobf !== txt) {
        LINK_REGEX.lastIndex = 0;
        if (LINK_REGEX.test(_deobf)) return true;
        LINK_REGEX.lastIndex = 0;
    }
    const _leetDeobf = txt.replace(/1/g, 'l').replace(/0/g, 'o').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/\$/g, 's').replace(/@/g, 'a');
    if (_leetDeobf !== txt) {
        LINK_REGEX.lastIndex = 0;
        if (LINK_REGEX.test(_leetDeobf)) return true;
        LINK_REGEX.lastIndex = 0;
    }
    const _spacedLink = txt.replace(/(\w)\s+(?=\w)/g, '$1');
    if (_spacedLink !== txt && _spacedLink.length > 5) {
        LINK_REGEX.lastIndex = 0;
        if (LINK_REGEX.test(_spacedLink)) return true;
        LINK_REGEX.lastIndex = 0;
    }
    return false;
}

function linkType(txt) {
    if (!txt) return 'Unknown';
    WA_LINK_REGEX.lastIndex = 0;
    if (WA_LINK_REGEX.test(txt) || /(?:chat\s*\.\s*whatsapp|wa\s*\.\s*me|whatsapp\s*\.\s*com)/i.test(txt)) return 'WhatsApp Link';
    WA_LINK_REGEX.lastIndex = 0;
    TG_LINK_REGEX.lastIndex = 0;
    if (TG_LINK_REGEX.test(txt)) return 'Telegram Link';
    TG_LINK_REGEX.lastIndex = 0;
    DC_LINK_REGEX.lastIndex = 0;
    if (DC_LINK_REGEX.test(txt)) return 'Discord Link';
    DC_LINK_REGEX.lastIndex = 0;
    IG_LINK_REGEX.lastIndex = 0;
    if (IG_LINK_REGEX.test(txt)) return 'Instagram Link';
    IG_LINK_REGEX.lastIndex = 0;
    TT_LINK_REGEX.lastIndex = 0;
    if (TT_LINK_REGEX.test(txt)) return 'TikTok Link';
    TT_LINK_REGEX.lastIndex = 0;
    YT_LINK_REGEX.lastIndex = 0;
    if (YT_LINK_REGEX.test(txt)) return 'YouTube Link';
    YT_LINK_REGEX.lastIndex = 0;
    FB_LINK_REGEX.lastIndex = 0;
    if (FB_LINK_REGEX.test(txt)) return 'Facebook Link';
    FB_LINK_REGEX.lastIndex = 0;
    TW_LINK_REGEX.lastIndex = 0;
    if (TW_LINK_REGEX.test(txt)) return 'Twitter/X Link';
    TW_LINK_REGEX.lastIndex = 0;
    SC_LINK_REGEX.lastIndex = 0;
    if (SC_LINK_REGEX.test(txt)) return 'Snapchat Link';
    SC_LINK_REGEX.lastIndex = 0;
    LI_LINK_REGEX.lastIndex = 0;
    if (LI_LINK_REGEX.test(txt)) return 'LinkedIn Link';
    LI_LINK_REGEX.lastIndex = 0;
    SP_LINK_REGEX.lastIndex = 0;
    if (SP_LINK_REGEX.test(txt)) return 'Spotify Link';
    SP_LINK_REGEX.lastIndex = 0;
    PHISHING_REGEX.lastIndex = 0;
    if (PHISHING_REGEX.test(txt)) return 'Phishing/Suspicious Link';
    PHISHING_REGEX.lastIndex = 0;
    SHORTENER_REGEX.lastIndex = 0;
    if (SHORTENER_REGEX.test(txt)) return 'URL Shortener';
    SHORTENER_REGEX.lastIndex = 0;
    IP_LINK_REGEX.lastIndex = 0;
    if (IP_LINK_REGEX.test(txt)) return 'IP Address Link';
    IP_LINK_REGEX.lastIndex = 0;
    BASE64_LINK_REGEX.lastIndex = 0;
    if (BASE64_LINK_REGEX.test(txt)) return 'Base64 Encoded Link';
    BASE64_LINK_REGEX.lastIndex = 0;
    OBFUSCATED_LINK_REGEX.lastIndex = 0;
    if (OBFUSCATED_LINK_REGEX.test(txt)) return 'Obfuscated Link';
    OBFUSCATED_LINK_REGEX.lastIndex = 0;
    return 'General Link';
}

function isWLDomain(txt, wl) {
    if (!wl || !wl.length) return false;
    const lower = txt.toLowerCase();
    const _cleaned = lower.replace(/[\u200b\u200c\u200d\u200e\u200f\u202a-\u202e\u2060-\u2064\ufeff\u00ad\u180e\u034f\u061c]/g, '');
    return wl.some(d => lower.includes(d.toLowerCase()) || _cleaned.includes(d.toLowerCase()));
}

export { hasLink, hasWALink, hasTGLink, hasDCLink, hasShortLink, hasPhishingLink, hasIPLink, hasBase64Link, hasObfuscatedLink, linkType, isWLDomain };