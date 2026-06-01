/* GEN AI — Actions & Intent Detection */

const SERVER = "http://localhost:7777";

export async function srv(endpoint, body) {
    try {
        const r = await fetch(`${SERVER}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        return await r.json();
    } catch (e) { return { success: false, error: e.message }; }
}

export async function srvGet(endpoint) {
    try { const r = await fetch(`${SERVER}${endpoint}`); return await r.json(); } catch { return null; }
}

export async function checkServer() {
    try { const r = await fetch(`${SERVER}/api/health`, { signal: AbortSignal.timeout(2000) }); const d = await r.json(); return d.status === 'online'; } catch { return false; }
}

function ac(icon, text) { return `<div class="action-card"><span class="action-icon">${icon}</span><span class="action-text">${text}</span></div>`; }
function needServer() { return `I'm afraid my local systems are offline, sir. Run \`npm start\` in the GEN folder and I'll be fully operational.`; }

// JOKES purged as per request

export async function detectAction(msg, serverOnline) {
    const m = msg.toLowerCase().trim();

    // Time
    if (m.match(/what.*(time|clock)/)) {
        const t = new Date().toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
        const h = new Date().getHours();
        const quip = h < 6 ? "Burning the midnight oil, I see." : h < 9 ? "Rise and shine." : h < 12 ? "Morning is still young." : h < 17 ? "Afternoon, sir." : h < 21 ? "Evening approaches." : "It's getting rather late, sir.";
        return `🕐 The time is **${t}**. ${quip}`;
    }
    // Date
    if (m.match(/what.*(date|today|day)/)) {
        return `📅 Today is **${new Date().toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric',year:'numeric'})}**. At your service.`;
    }
    // World Monitor Intelligence (News Redirect)
    if (m.match(/^(?:show|get|open|what's|any)\s+(?:the\s+)?news|headlines|world\s+monitor/i)) {
        return { 
            splitUrl: 'http://localhost:5173', 
            text: `Initiating the **World Monitor** intelligence feed, sir. I'm pulling live geopolitical and market data for your review now.` 
        };
    }

    // Greet (stripped of canned text)
    if (m.match(/^(hi|hello|hey|howdy|sup|yo|good\s*(morning|evening|afternoon|night)|greetings)/)) {
        return null; // Let the AI handle all greetings dynamically
    }
    // Capabilities
    if (m.includes('what can you do') || m.includes('capabilities') || m.includes('help me') || (m.includes('features') && m.length < 30)) {
        return `### ◆ GEN — At Your Service, Sir\n\nHere's what I'm capable of — though I assure you, the list grows:\n\n**🗣️ Voice** — Speak freely, I'm listening\n**💻 System** — Open/close apps, lock, shutdown, restart, volume\n**🔍 Intel** — Google, YouTube, Wikipedia research\n**🌐 Web** — Any website, social media, streaming, Google suite\n**🎬 Bookings** — Movies, flights, trains, hotels, cabs, food\n**📸 Media** — Screenshots, screen recording, voice recording, webcam\n**📝 Notes** — Save important thoughts\n**👤 Contacts** — Your personal directory\n**📅 Schedule** — Daily planner\n**📱 QR Codes** — Generate instantly\n**💬 Messaging** — WhatsApp, Gmail\n**🌐 Network** — IP address, speed diagnostics\n**📰 News** — Latest headlines\n**🎵 Music** — Local or YouTube\n**🗺️ Navigation** — Directions via Google Maps\n**🌤️ Weather** — Real-time forecasts\n\n> Simply ask, sir. I'll handle the rest.`;
    }
    // Joke logic removed
    if (m.includes('joke') || m.includes('funny')) {
        return null; // Let the AI generate a joke if it wants to
    }
    // Thanks
    if (m.match(/thank|thanks|thx/)) return ["It's my pleasure, sir. That's what I'm here for. 🤝", "Always at your service. Anything else on the agenda?", "You're most welcome. I live to serve. 🙌", "The gratitude is appreciated, though entirely unnecessary. Happy to help."][Math.floor(Math.random()*4)];
    // Math
    const mathM = m.match(/(?:calculate|what is|solve|compute)\s+([\d\+\-\*\/\.\s\(\)%]+)/);
    if (mathM) { try { return `**Result:** \`${mathM[1].trim()}\` = **${Function(`"use strict";return(${mathM[1].trim()})`)()}**`; } catch {} }

    // === REQUIRES SERVER ===
    if (!serverOnline) {
        // Check if it's a server command
        if (m.match(/open |launch |close |search |play |screenshot|record|note|qr|whatsapp|email|news|speed|ip addr|system info|battery|schedule|lock|shut|restart|volume|mute|wikipedia|wiki|who is/)) {
            return needServer();
        }
        return null;
    }

    // Open website URL
    const urlMatch = m.match(/(?:open|go to|visit|launch|navigate|browse)\s+(?:the\s+)?(?:website\s+)?(?:of\s+)?((?:https?:\/\/)?(?:www\.)?[\w.-]+\.\w{2,}(?:\/\S*)?)/i);
    if (urlMatch) { const r = await srv('/api/open-url', {url:urlMatch[1]}); return r.success ? ac('🌐',`${urlMatch[1]} — loaded and ready`) + `\nRight away, sir. The page is up.` : r.error; }

    // Open known site/app
    const siteMatch = m.match(/(?:open|go to|launch)\s+(?:the\s+)?(google|youtube|facebook|instagram|twitter|x|reddit|github|linkedin|whatsapp|amazon|netflix|prime video|hotstar|spotify|flipkart|myntra|canva|figma|zoom|gmail|google drive|google docs|google maps|google meet|google photos|google sheets|google slides|pinterest|tiktok|telegram|snapchat|quora|medium|stackoverflow|chrome|firefox|edge|brave|notepad|calculator|calc|paint|terminal|cmd|powershell|explorer|file explorer|task manager|settings|vscode|vs code|word|excel|powerpoint|outlook|teams|discord|steam|camera|vlc|obs|skype|notion)\b/i);
    if (siteMatch) { const r = await srv('/api/open-app', {appName:siteMatch[1]}); return r.success ? ac('📱',`${siteMatch[1]} — at your service`) + `\nDone. Anything else, sir?` : `I'm afraid I couldn't locate "${siteMatch[1]}", sir. ${r.error||r.message}`; }

    // Known websites (open in real browser)
    const webMap = {
        'bookmyshow':'https://bookmyshow.com','book my show':'https://bookmyshow.com',
        'swiggy':'https://swiggy.com','zomato':'https://zomato.com',
        'makemytrip':'https://makemytrip.com','make my trip':'https://makemytrip.com',
        'uber':'https://uber.com','ola':'https://ola.com',
        'irctc':'https://irctc.co.in','paytm':'https://paytm.com',
        'phonepe':'https://phonepe.com','gpay':'https://pay.google.com',
        'zerodha':'https://zerodha.com','groww':'https://groww.in',
        'linkedin':'https://linkedin.com','indeed':'https://indeed.com',
        'chatgpt':'https://chat.openai.com','gemini':'https://gemini.google.com',
    };
    for (const [name, url] of Object.entries(webMap)) {
        if (m.includes(name) && m.match(/open|go to|launch|visit|start/)) {
            return { text: ac('🌐', `${name} — opening now`) + `\nRight away, sir.`, openUrl: url };
        }
    }

    // GitHub Monitoring / Checking
    if (m.includes('github') && (m.includes('check') || m.includes('activity') || m.includes('repositories'))) {
        const userMatch = m.match(/github\s+(?:for\s+)?(?:user\s+)?(\w+)/i);
        const target = userMatch ? userMatch[1] : "trending";
        const url = target === "trending" ? "https://github.com/trending" : `https://github.com/${target}`;
        return { splitUrl: url, text: `I'm surveying GitHub for **${target}** activity, sir. Just a moment while I pull the data feed.` };
    }

    // Reply to message
    if (m.match(/^(?:reply|answer)\s+(?:to\s+)?(?:the\s+)?(?:message|msg)/i)) {
        const replyMatch = m.match(/(?:reply|answer)\s+(?:to\s+)?(?:the\s+)?(?:message|msg)\s+(?:saying|with|that)\s+(.+)/i);
        const content = replyMatch ? replyMatch[1] : "";
        if (content) {
            await srv('/api/type', { text: content });
            await srv('/api/type', { key: '{ENTER}' });
            return ac('💬', 'Replied') + `\nI've sent that reply for you, sir.`;
        }
        return "What would you like me to say in the reply, sir?";
    }

    // Call handling
    if (m.match(/(?:answer|pick up)\s+(?:the\s+)?call/i)) {
        await srv('/api/type', { key: '%p' });
        return ac('📞', 'Answering') + `\nAttempting to answer the call now, sir.`;
    }
    if (m.match(/(?:reject|decline|hang up)\s+(?:the\s+)?call/i)) {
        await srv('/api/type', { key: '%h' });
        return ac('🚫', 'Rejected') + `\nCall declined as requested.`;
    }

    // WhatsApp / Selenium Automation Init
    if (m.includes('messaging service') || m.includes('whatsapp service') || m.includes('selenium') || m.includes('automate whatsapp')) {
        const r = await srvGet('/api/wa-init');
        if (r?.success) {
            return ac('🤖', 'Automation Service Active') + `\nI've launched the **Selenium-powered messaging bridge**, sir. You can login to WhatsApp Web in the new window, and I'll begin monitoring autonomously.`;
        }
        return `I'm afraid the automation bridge failed to initialize, sir. Error: ${r?.error || 'Unknown'}`;
    }

    // Open App + Type Combo (e.g. "open notepad and type hello")
    const comboMatch = m.match(/(?:open|launch)\s+(.+?)\s+and\s+(?:type|write|say)\s+(.+)$/i);
    if (comboMatch) {
        const app = comboMatch[1].trim(); const txt = comboMatch[2].trim();
        await srv('/api/open-app', {appName: app});
        // Give the app time to load and focus before typing
        setTimeout(() => srv('/api/type', {text: txt}), 1500);
        return ac('⌨️', `${app} — Automation`) + `\nI have opened ${app} and populated the text for you, sir.`;
    }

    // Generic open app
    const appMatch = m.match(/(?:open|launch|start|run)\s+(?:a\s+|the\s+)?(notepad|calculator|cmd|powershell|paint|chrome|word|excel|browser|[^ ]+)$/i);
    if (appMatch && appMatch[1].length < 25 && !m.includes('?')) {
        const r = await srv('/api/open-app', {appName:appMatch[1].trim()});
        if (r.success) return ac('📱',`${appMatch[1]} — ready`) + `\nAt your command, sir.`;
        return `I couldn't locate an app called "${appMatch[1]}", sir.`;
    }

    // Close app
    const closeMatch = m.match(/(?:close|kill|stop|exit|quit)\s+(.+)/);
    if (closeMatch) { const r = await srv('/api/close-app', {appName:closeMatch[1].trim()}); return r.success ? ac('❌',`${closeMatch[1]} — terminated`) + `\nConsider it done, sir.` : `I'm having trouble closing "${closeMatch[1]}", sir.`; }

    // Type / Automate Keystrokes
    const typeMt = m.match(/^(?:type|write|paste|dictate)\s+(.+)$/i);
    // Let LLM handle "write a poem", but grab "write hello"
    if (typeMt && !m.match(/code|script|story|poem|essay|email to|letter/i)) {
        const textToType = typeMt[1];
        const r = await srv('/api/type', { text: textToType });
        if (r.success) return ac('⌨️', `Typed text`) + `\nI have typed that in for you, sir.`;
        return `Failed to type: ${r.error}`;
    }

    // Advanced Chat Automation (WhatsApp / Instagram / Telegram)
    const chatMatch = m.match(/^(?:send|type|shoot)\s+(?:a\s+)?(?:message|dm|text)\s+(?:on\s+|to\s+)?(whatsapp|instagram|telegram|insta|ig)(?:\s+to\s+(.+?))?(?:\s+(?:saying|with|that)\s+(.+))?$/i);
    if (chatMatch) {
        const platform = chatMatch[1].toLowerCase();
        let name = chatMatch[2];
        let msg = chatMatch[3];
        
        let url = '';
        if (platform.includes('whatsapp')) url = 'https://web.whatsapp.com/';
        else if (platform.includes('insta') || platform === 'ig') url = 'https://www.instagram.com/direct/inbox/';
        else if (platform.includes('telegram')) url = 'https://web.telegram.org/a/';

        await srv('/api/open-url', { url });
        
        if (msg) {
            // Wait for frontend to heavily load, then blind-fire the keystrokes!
            setTimeout(() => srv('/api/type', { text: msg }), 4500);
            return ac('💬', `Automating ${platform}`) + `\nOpening ${platform}, sir. I will auto-type your message in exactly 4 seconds. Please click on the target chat box!`;
        } else {
            return ac('💬', `Opening ${platform}`) + `\nI've opened the chat interface for you, sir. Say "GEN, type [message]" when you're ready.`;
        }
    }

    // Press Special Keys
    const keyMt = m.match(/^(?:press|hit|click)\s+(enter|space|escape|esc|backspace|delete|tab)$/i);
    if (keyMt) {
        const keyMap = { 'enter':'{ENTER}', 'space':' ', 'escape':'{ESC}', 'esc':'{ESC}', 'backspace':'{BACKSPACE}', 'delete':'{DEL}', 'tab':'{TAB}' };
        if (keyMap[keyMt[1].toLowerCase()]) { await srv('/api/type', { key: keyMap[keyMt[1].toLowerCase()] }); return ac('⌨️', `Pressed ${keyMt[1]}`); }
    }

    // Select All / Clear
    if (m.match(/^(?:select all|delete all|clear text|clear field|clear all)$/i)) {
        const isDelete = m.includes('delete') || m.includes('clear');
        await srv('/api/type', { key: isDelete ? '^a{BACKSPACE}' : '^a' });
        return ac('⌨️', isDelete ? 'Cleared text' : 'Selected all');
    }

    // World Monitor
    if (m.match(/world monitor|global monitor|system monitor/i)) {
        return { text: ac('🌍', 'World Monitor Online') + `\nI have initialized the Global Tracking matrix in the secondary panel, sir.`, splitUrl: 'http://localhost:7777/world-monitor.html' };
    }

    // Mouse Control (Move/Click)
    if (m.match(/^(?:move mouse|move cursor)\s+to\s+(\d+)[,\s]+(\d+)$/i)) {
        const mm = m.match(/^(?:move mouse|move cursor)\s+to\s+(\d+)[,\s]+(\d+)$/i);
        await srv('/api/mouse', { action: 'move', x: mm[1], y: mm[2] });
        return ac('🖱️', `Moved mouse to ${mm[1]}, ${mm[2]}`);
    }
    if (m.match(/^(?:click|left click|press mouse|click here)$/i)) {
        await srv('/api/mouse', { action: 'click' });
        return ac('🖱️', `Clicked mouse`);
    }

    // Google search (Silent/Inline)
    if (m.match(/^(?:search|google)\s+(?:for\s+)?(.+)/i) && (m.includes('search')||m.includes('google'))) {
        const q = m.match(/^(?:search|google)\s+(?:for\s+)?(.+)/i)[1].replace(/on google/gi,'').trim();
        if (q.length > 2) {
            const r = await srv('/api/search', {query:q});
            if (r.success && r.results && r.results.length > 0) {
                let out = ac('🔍', `Searching: ${q}`) + `\nI searched Google for "${q}". Here are the top results:\n\n`;
                r.results.forEach((res, i) => {
                    out += `### [${res.title}](${res.link})\n> ${res.snippet}\n\n`;
                });
                return out;
            }
            return `I couldn't find any results for "${q}", sir.`;
        }
    }

    // Google Search (Redirect to Browser)
    if (m.match(/(?:(?:open|show)(?:\s+a)?\s+search(?:\s+for)?|search.*in browser)\s+(.+)/i)) {
        const q = m.match(/(?:(?:open|show)(?:\s+a)?\s+search(?:\s+for)?|search.*in browser)\s+(.+)/i)[1].trim();
        if (q.length > 2) {
            await srv('/api/open-url', { url: `https://www.google.com/search?q=${encodeURIComponent(q)}` });
            return ac('🌐', `Google Search Redirect`) + `\nI've opened a browser window searching for "${q}", sir.`;
        }
    }

    // YouTube
    if ((m.includes('youtube')||m.includes('play ')) && m.match(/(?:play|search|find|watch)\s+(.+)/i)) {
        const q = m.match(/(?:play|search|find|watch)\s+(.+)/i)[1].replace(/on youtube|on yt/gi,'').trim();
        if (q.length>2) { const r=await srv('/api/youtube',{query:q}); return r.success?ac('▶️',`Now playing: ${q}`) + `\nI've queued that up on YouTube for you, sir.`:r.error; }
    }

    // Wikipedia
    if ((m.includes('who is')||m.includes('wikipedia')||m.includes('wiki')||m.includes('tell me about')) && m.match(/(?:who is|what is|tell me about|wikipedia|wiki|about)\s+(.+)/i)) {
        const q = m.match(/(?:who is|what is|tell me about|wikipedia|wiki|about)\s+(.+)/i)[1].replace(/on wikipedia/gi,'').trim();
        if (q.length>2) { const r=await srv('/api/wikipedia',{query:q}); return r.success?`### 📖 ${r.title}\n\n${r.extract}${r.url?`\n\n[Read the full article](${r.url})`:''}
\n*Courtesy of Wikipedia, sir.*` : `I'm afraid Wikipedia has nothing on "${q}", sir. Shall I try Google?`; }
    }

    // How to
    if (m.match(/how (?:to|do|can)\s+(.+)/i)) {
        const q=m.match(/how (?:to|do|can)\s+(.+)/i)[1];
        const r=await srv('/api/search',{query:`how to ${q}`});
        return r.success?ac('📋',`Searching: How to ${q}`):r.error;
    }

    // Screenshot
    if (m.includes('screenshot')||m.includes('screen shot')||m.includes('screen capture')) {
        const nm=m.match(/(?:named?|called?|as|filename)\s+["']?(.+?)["']?\s*$/i);
        const r=await srv('/api/screenshot',{filename:nm?nm[1]:null});
        return r.success?ac('📸','Screenshot captured')+`\nDone. Saved to \`${r.path}\`. Your screen has been preserved, sir.`:r.error;
    }

    // Notes
    if (m.match(/(?:take a note|save note|note down|remember this|write down)\s*:?\s*(.+)/i)) {
        const c=m.match(/(?:take a note|save note|note down|remember this|write down)\s*:?\s*(.+)/i)[1];
        const r=await srv('/api/note-save',{content:c}); return r.success?ac('📝',r.message):r.error;
    }

    // QR Code
    if (m.match(/(?:generate|create|make)\s+(?:a\s+)?qr\s*code\s+(?:for\s+)?(.+)/i)) {
        const t=m.match(/qr\s*code\s+(?:for\s+)?(.+)/i)[1];
        const r=await srv('/api/qrcode',{text:t});
        return r.success?ac('📱','QR Code generated!')+`\n\n<img src="${r.qrCode}" style="max-width:200px;border-radius:12px">`:r.error;
    }

    // IP
    if (m.includes('ip address')||m.includes('my ip')||m.match(/what.+ip/)) {
        const r=await srvGet('/api/ip');
        if(r?.success){let o='### 🌐 IP\n';for(const[k,v] of Object.entries(r.ips))o+=`- **${k}:** \`${v}\`\n`;return o;}
    }

    // Speed test
    if (m.includes('internet speed')||m.includes('speed test')) {
        const r=await srvGet('/api/speed-test');
        return r?.success?`### ⚡ Speed\n- **Download:** ${r.downloadSpeed}\n- **Size:** ${r.size}\n- **Time:** ${r.duration}`:'Speed test failed.';
    }

    // News
    if (m.includes('news')||m.includes('headlines')) {
        const r=await srvGet('/api/news');
        if(r?.success&&r.news.length){let o='### 📰 News\n\n';r.news.slice(0,8).forEach((n,i)=>o+=`${i+1}. **${n.title}**\n`);return o;}
    }

    // System info
    if (m.includes('system info')||m.includes('pc info')||m.includes('specs')||m.includes('system status')||m.includes('system condition')) {
        const r=await srvGet('/api/system');
        if(r)return `### 💻 System\n| | |\n|-|-|\n|**Host**|${r.hostname}|\n|**User**|${r.username}|\n|**CPU**|${r.cpuModel}|\n|**Cores**|${r.cpuCores}|\n|**RAM**|${r.totalMemory} (${r.freeMemory} free)|\n|**OS**|${r.platform} ${r.arch}|\n|**Uptime**|${r.uptime}|`;
    }

    // Battery
    if (m.includes('battery')) { const r=await srvGet('/api/battery'); if(r?.available)return `🔋 **${r.level}%** ${r.charging?'⚡ Charging':'🔌 Not charging'}`; return 'Battery info unavailable.'; }

    // Contacts
    if (m.match(/add contact\s+(.+?)\s+(\+?[\d\s-]+)/i)) { const mt=m.match(/add contact\s+(.+?)\s+(\+?[\d\s-]+)/i); const r=await srv('/api/contacts/add',{name:mt[1],phone:mt[2]}); return r.success?ac('👤',r.message):r.error; }
    if (m.match(/(?:find|search)\s+contact\s+(.+)/i)) { const q=m.match(/contact\s+(.+)/i)[1]; const r=await srv('/api/contacts/search',{query:q}); return r.success&&r.results.length?r.results.map(c=>`👤 **${c.name}**: ${c.phone}`).join('\n'):`No contacts for "${q}".`; }

    // WhatsApp
    if (m.includes('whatsapp')&&m.match(/(\+?[\d\s-]{8,})/)) { const ph=m.match(/(\+?[\d\s-]{8,})/)[1]; const r=await srv('/api/whatsapp',{phone:ph}); return r.success?ac('💬',`WhatsApp: ${ph}`):r.error; }

    // Schedule
    if (m.match(/(?:add to|set)\s+schedule\s+(?:for\s+)?(\w+)\s*:?\s*(.+)/i)) { const mt=m.match(/schedule\s+(?:for\s+)?(\w+)\s*:?\s*(.+)/i); const r=await srv('/api/schedule/add',{day:mt[1],event:mt[2]}); return r.success?ac('📅',r.message):r.error; }
    if (m.match(/(?:show|my)\s+schedule/i)) { const r=await srvGet('/api/schedule'); if(r?.schedule&&Object.keys(r.schedule).length){let o='### 📅 Schedule\n';for(const[d,e]of Object.entries(r.schedule))o+=`**${d}:** ${e.map(x=>x.event).join(', ')}\n`;return o;} return 'No schedule yet.'; }

    // Media Controls
    const mediaMatch = m.match(/^(?:play|pause|resume|next track|previous track|skip track|stop music|pause music|play music)/i);
    if (mediaMatch) {
        let action = '';
        if (m.includes('pause') || m.includes('resume') || m.includes('stop')) action = 'play-pause';
        else if (m.includes('next') || m.includes('skip')) action = 'next-track';
        else if (m.includes('previous') || m.includes('back')) action = 'prev-track';
        else if (m.includes('play')) action = 'play-pause'; // toggle

        if (action) {
            await srv('/api/media-action', {action});
            return ac('🎵', 'Media Control') + `\nAction executed, sir.`;
        }
    }

    // Computer Vision Hook -- handled in app.js LLM call
    if (m.match(/(?:look|see|what is on|read).*screen/i) || m.match(/what.*(?:see|looking at)/i) || m.match(/describe.*screen/i)) {
        return { vision: true };
    }

    // Music
    if (m.match(/play (?:local )?music|play (?:a )?song/i)&&!m.includes('youtube')) { const r=await srv('/api/play-local-music',{}); return r.success?ac('🎵',`Playing: ${r.nowPlaying}`):r.error; }

    // Wi-Fi Checker & Password
    if (m.match(/wifi/i) || m.match(/wi-fi/i) || m.match(/internet connection/i)) {
        const r = await srvGet('/api/wifi');
        if (r && !r.error) {
            let out = `### 📶 Wi-Fi Status\n- **Network:** \`${r.ssid}\`\n- **Signal:** ${r.signal}\n`;
            if (m.includes('password') || m.includes('key')) {
                out += `- **Password:** \`${r.pwd}\`\n`;
                return ac('📶', 'Wi-Fi Password Extracted') + `\nThe password for ${r.ssid} is: ${r.pwd}`;
            }
            return out;
        }
        return `Wi-Fi diagnostics failed or you are offline.`;
    }

    // Windows Clipboard Reader
    if (m.match(/(?:read|check|what is on|what's on)\s+(?:my\s+|the\s+)?clipboard/i)) {
        const r = await srvGet('/api/clipboard');
        if (r && r.text) {
            return ac('📋', 'Clipboard Read') + `\nYour clipboard contains: "${r.text.substring(0, 500)}${r.text.length > 500 ? '...' : ''}"`;
        }
        return `Your clipboard is presently empty, sir.`;
    }

    // System actions
    if (m.includes('lock')&&(m.includes('screen')||m.includes('computer'))) { const r=await srv('/api/system-action',{action:'lock'}); return r.success?ac('🔒','Locked'):r.error; }
    if (m.includes('shutdown')||(m.includes('shut')&&m.includes('down'))) { const r=await srv('/api/system-action',{action:'shutdown'}); return r.success?ac('⏻','Shutting down in 60s')+'\nSay "cancel shutdown" to stop.':r.error; }
    if (m.includes('cancel')&&m.includes('shutdown')) { const r=await srv('/api/system-action',{action:'cancel-shutdown'}); return r.success?ac('✅','Cancelled'):r.error; }
    if (m.includes('restart')||m.includes('reboot')) { const r=await srv('/api/system-action',{action:'restart'}); return r.success?ac('🔄','Restarting in 60s'):r.error; }
    if (m.includes('volume up')||m.includes('increase volume')) { await srv('/api/media-action',{action:'volume-up'}); return ac('🔊','Volume up'); }
    if (m.includes('volume down')||m.includes('lower volume')) { await srv('/api/media-action',{action:'volume-down'}); return ac('🔉','Volume down'); }
    if (m.includes('mute')||m.includes('unmute')) { await srv('/api/media-action',{action:'volume-mute'}); return ac('🔇','Toggled mute'); }

    // === BOOKING & SERVICES ===
    // Secure sites → openUrl (real browser, Cloudflare-safe)
    // Simple sites → splitUrl (iframe in GEN)

    // Movie tickets
    if (m.match(/(?:book|show|find|get|available|list|what).*(?:movie|film|cinema|ticket)|(?:movie|film|cinema).*(?:in\s+\w|ticket|book|show|available|tomorrow|today)/i)) {
        const cityMatch = m.match(/(?:in|at|near|around|for)\s+(.+?)(?:\s+tomorrow|\s+today|\s+this week|\s*$)/i);
        const city = cityMatch ? cityMatch[1].trim().replace(/\s+/g, '-').toLowerCase() : '';
        const url = city
            ? `https://in.bookmyshow.com/explore/movies-${city}`
            : 'https://in.bookmyshow.com/explore/movies';
        return { text: ac('🎬', `Movies${city ? ' in ' + city.replace(/-/g,' ') : ''}`) + `\nOpening **BookMyShow**${city ? ` for **${city.replace(/-/g,' ')}**` : ''} in your browser.\n\nBrowse movies, pick showtime, select seats & book! 🍿`, openUrl: url };
    }

    // Flight booking
    if (m.match(/(?:book|find|show|get|search).*(?:flight|plane|air)|(?:flight|plane).*(?:book|to\s)|fly\s+(?:to|from)/i)) {
        const dest = (m.match(/(?:to|from)\s+(\w+)/i)||['',''])[1];
        const url = dest ? `https://www.makemytrip.com/flights/?dest=${dest}` : 'https://www.makemytrip.com/flights/';
        return { text: ac('✈️', 'MakeMyTrip Flights') + `\nOpening **MakeMyTrip** for flights${dest ? ` to **${dest}**` : ''}.`, openUrl: url };
    }

    // Train booking
    if (m.match(/(?:book|find|show|get|search).*(?:train|rail)|(?:train).*(?:book|ticket|to\s)|irctc/i)) {
        return { text: ac('🚆', 'IRCTC') + `\nOpening **IRCTC** for train booking.`, openUrl: 'https://www.irctc.co.in' };
    }

    // Hotel booking
    if (m.match(/(?:book|find|show|get|search).*(?:hotel|room|stay|resort|hostel)|(?:hotel).*(?:book|in\s)/i)) {
        const city = (m.match(/(?:in|at|near)\s+(\w+)/i)||['',''])[1];
        const url = city ? `https://www.makemytrip.com/hotels/hotel-listing?city=${city}` : 'https://www.makemytrip.com/hotels/';
        return { text: ac('🏨', 'MakeMyTrip Hotels') + `\nOpening **MakeMyTrip Hotels**${city ? ` in **${city}**` : ''}.`, openUrl: url };
    }

    // Cab / ride
    if (m.match(/(?:book|call|get|need).*(?:cab|taxi|ride|uber|ola)|(?:cab|taxi|uber|ola)/i)) {
        return { text: ac('🚕', 'Uber') + `\nOpening **Uber** for ride booking.`, openUrl: 'https://www.uber.com' };
    }

    // Food delivery
    if (m.match(/(?:order|get|deliver).*(?:food|pizza|burger|biryani|dinner|lunch|breakfast)|(?:food|dinner).*(?:order|deliver)|swiggy|zomato|hungry/i)) {
        const isZomato = m.includes('zomato');
        const url = isZomato ? 'https://www.zomato.com' : 'https://www.swiggy.com';
        const name = isZomato ? 'Zomato' : 'Swiggy';
        return { text: ac('🍕', name) + `\nOpening **${name}** for food delivery!`, openUrl: url };
    }

    // Shopping
    if (m.match(/(?:buy|shop|order|purchase)\s+(.+)/i) && !m.includes('ticket')) {
        const item = m.match(/(?:buy|shop|order|purchase)\s+(.+)/i)[1].trim();
        const url = `https://www.amazon.in/s?k=${encodeURIComponent(item)}`;
        return { text: ac('🛒', `Shopping: ${item}`) + `\nOpening **Amazon** for "${item}".`, openUrl: url };
    }

    // Weather (Google — works in iframe)
    if (m.match(/weather|temperature|forecast|how.*(?:hot|cold|rain)/i)) {
        const city = (m.match(/(?:in|at|for)\s+(\w+)/i)||['',''])[1] || 'my location';
        return { text: ac('🌤️', `Weather: ${city}`) + `\nShowing weather for **${city}**.`, splitUrl: `https://www.google.com/search?q=weather+${encodeURIComponent(city)}` };
    }

    // Translate (Google — works in iframe)
    if (m.match(/translate\s+(.+?)(?:\s+to\s+(\w+))?$/i)) {
        const match = m.match(/translate\s+(.+?)(?:\s+to\s+(\w+))?$/i);
        const text = match[1].replace(/to \w+$/,'').trim();
        const lang = match[2] || 'hi';
        const url = `https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(text)}`;
        return { text: ac('🌐', 'Google Translate') + `\nTranslating "${text}" to **${lang}**`, splitUrl: url };
    }

    // Directions / Maps (Google — works in iframe)
    if (m.match(/(?:directions?|navigate|route)\s+(?:to\s+)?(.+)/i) || m.match(/how to (?:get|go|reach)\s+(?:to\s+)?(.+)/i)) {
        const dest = (m.match(/(?:to\s+)(.+)/i) || ['',''])[1].trim();
        if (dest.length > 2) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
            return { text: ac('🗺️', `Directions to ${dest}`) + `\nOpening **Google Maps** to "${dest}".`, splitUrl: url };
        }
    }

    // === SMART FALLBACK: Natural phrases → Google Search ===
    if (m.match(/(?:open|show|find|get)\s+(?:a\s+)?(?:website\s+)?(?:for\s+|about\s+|on\s+)?(.{4,})/i)) {
        const q = m.match(/(?:open|show|find|get)\s+(?:a\s+)?(?:website\s+)?(?:for\s+|about\s+|on\s+)?(.+)/i)[1].trim();
        if (q.length > 3) {
            const r = await srv('/api/search', {query: q});
            return r.success ? ac('🔍', `Searching: ${q}`) + `\nI searched Google for **"${q}"**.` : r.error;
        }
    }

    return null;
}
