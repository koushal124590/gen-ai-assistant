/* GEN AI Assistant — Main App (non-blocking) */
import { detectAction, checkServer, srv, srvGet } from './actions.js';

(async function GEN() {
    'use strict';

    // State
    const S = {
        mode: 'chat', messages: [], convo: [], msgCount: 0,
        engine: null, engineReady: false,
        engineMode: localStorage.getItem('gen_em') || 'hybrid',
        apiKey: localStorage.getItem('gen_ak') || '',
        serverOnline: false, isOnline: navigator.onLine,
        isListening: false, isSpeaking: false,
        voiceOutput: true, voiceSpeed: 1.0, selVoice: null,
        sleepMode: false, screenRec: null, voiceRec: null,
        browserUrl: null, handsFree: true, isAwake: false,
    };

    // --- GEN Intel Bridge Receiver ---
    window.addEventListener('message', async (e) => {
        if (e.data?.type === 'GEN_SPEAK' && e.data.text) {
             // If GEN is idle/asleep, we might want to wake him, but let's just speak for now
             if (S.voiceOutput) {
                addMsg('assistant', e.data.text);
                speak(e.data.text);
             }
        }
    });

    const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);

    // DOM
    const el = {};
    ['particleCanvas', 'orbCanvas', 'orbContainer', 'orbLabel', 'orbSection', 'greetingText',
        'chatPanel', 'chatMessages', 'textInput', 'sendBtn', 'voiceBtn', 'voiceOverlay', 'voiceStatus',
        'voiceTranscript', 'voiceCancelBtn', 'settingsOverlay', 'settingsBtn', 'closeSettingsBtn',
        'downloadOverlay', 'downloadProgressBar', 'downloadStatus', 'statusLabel', 'connectivityPill',
        'connectivityLabel', 'engineVal', 'msgCountVal', 'currentModeVal', 'serverVal', 'charCount',
        'modelBadge', 'modelStatusBadge', 'voiceOutputToggle', 'voiceSpeedRange', 'voiceSpeedVal',
        'voiceSelect', 'particlesToggle', 'engineSelect', 'apiKeyInput', 'newChatBtn'
    ].forEach(id => el[id] = document.getElementById(id));

    // Voice status display
    // (removed — no longer on screen)

    // ---- PARTICLES ----
    const pc = el.particleCanvas, px = pc.getContext('2d');
    let particles = [], pmouse = { x: 0, y: 0 }, pOn = true;
    function pResize() { pc.width = innerWidth; pc.height = innerHeight; }
    function pInit() { particles = []; for (let i = 0; i < Math.min(50, innerWidth * innerHeight / 22000); i++)particles.push({ x: Math.random() * pc.width, y: Math.random() * pc.height, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, s: Math.random() * 2 + .5, o: Math.random() * .4 + .1 }); }
    function pLoop() { px.clearRect(0, 0, pc.width, pc.height); if (!pOn) { requestAnimationFrame(pLoop); return; } const ac = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(); for (let i = 0; i < particles.length; i++) { const p = particles[i]; p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = pc.width; if (p.x > pc.width) p.x = 0; if (p.y < 0) p.y = pc.height; if (p.y > pc.height) p.y = 0; const d = Math.hypot(p.x - pmouse.x, p.y - pmouse.y); if (d < 120) { const f = (120 - d) / 120 * .02; p.vx += (p.x - pmouse.x) * f; p.vy += (p.y - pmouse.y) * f; } p.vx *= .99; p.vy *= .99; px.beginPath(); px.arc(p.x, p.y, p.s, 0, Math.PI * 2); px.fillStyle = ac; px.globalAlpha = p.o; px.fill(); for (let j = i + 1; j < particles.length; j++) { const q = particles[j], dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < 130) { px.beginPath(); px.moveTo(p.x, p.y); px.lineTo(q.x, q.y); px.strokeStyle = ac; px.globalAlpha = (1 - dd / 130) * .06; px.lineWidth = .5; px.stroke(); } } } px.globalAlpha = 1; requestAnimationFrame(pLoop); }
    pResize(); pInit(); pLoop();
    addEventListener('resize', () => { pResize(); pInit(); });
    addEventListener('mousemove', e => { pmouse.x = e.clientX; pmouse.y = e.clientY; });

    // ---- ORB (3D Wireframe — High Resolution) ----
    const oc = el.orbCanvas, ox = oc.getContext('2d');
    oc.width = 900; oc.height = 900;
    let oTime = 0, oI = 0, oTI = 0;

    function orbLoop() {
        oTime += 0.007;
        oI += (oTI - oI) * 0.05;
        ox.clearRect(0, 0, 900, 900);
        const cx = 450, cy = 450, sc = 220 + oI * 80;

        let hue = S.isSpeaking ? (25 + Math.sin(oTime * 3) * 20)
            : S.isListening ? (20 + Math.sin(oTime * 2) * 15) : 28;
        const sat = S.isSpeaking ? 100 : S.isListening ? 100 : 90;
        const bri = S.isSpeaking ? 65 : S.isListening ? 60 : 55;
        const baseA = S.isSpeaking ? 0.7 : S.isListening ? 0.5 : 0.35;
        const lineW = S.isSpeaking ? 1.8 : S.isListening ? 1.3 : 1.0;
        const glowStr = S.isSpeaking ? 20 : S.isListening ? 12 : 6;

        // Rotation
        const cX = Math.cos(oTime * .3), sX = Math.sin(oTime * .3);
        const cY = Math.cos(oTime * .5), sY = Math.sin(oTime * .5);
        const cZ = Math.cos(oTime * .2), sZ = Math.sin(oTime * .2);

        function rot(x, y, z) {
            let x1 = x * cY - z * sY, z1 = x * sY + z * cY;
            let y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
            let x2 = x1 * cZ - y1 * sZ, y2 = x1 * sZ + y1 * cZ;
            return [x2, y2, z2];
        }
        function proj(x, y, z) {
            const d = 4 / (4 + z);
            return [cx + x * d * sc, cy + y * d * sc, d];
        }

        const U = 42, V = 30;
        const morph = Math.sin(oTime * 0.5) * 0.35 * (1 + oI * 1.5);

        function pt(u, v) {
            const th = u * Math.PI * 2, ph = v * Math.PI;
            let r = 1 + 0.4 * Math.sin(3 * th) * Math.sin(2 * ph)
                + 0.25 * Math.sin(2 * th + oTime) * Math.cos(3 * ph)
                + 0.18 * Math.sin(5 * th - oTime * 1.5) * Math.sin(ph)
                + morph * Math.sin(4 * th) * Math.sin(3 * ph)
                + 0.12 * Math.sin(7 * th + oTime * 0.8) * Math.sin(4 * ph) * oI;
            return rot(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph));
        }

        ox.lineCap = 'round';

        // Latitude lines
        for (let i = 0; i <= V; i++) {
            const v = i / V;
            ox.beginPath();
            let first = true;
            for (let j = 0; j <= U; j++) {
                const [x, y, z] = pt(j / U, v);
                const [sx, sy, d] = proj(x, y, z);
                first ? (ox.moveTo(sx, sy), first = false) : ox.lineTo(sx, sy);
            }
            const h = hue + i * 3, a = baseA * (0.5 + Math.abs(Math.sin(v * Math.PI)) * 0.5) + oI * 0.3;
            ox.strokeStyle = `hsla(${h},${sat}%,${bri}%,${Math.min(a, 0.95)})`;
            ox.lineWidth = lineW;
            ox.shadowColor = `hsla(${h},${sat}%,70%,${a * .7})`;
            ox.shadowBlur = glowStr;
            ox.stroke();
        }

        // Longitude lines
        for (let j = 0; j <= U; j++) {
            const u = j / U;
            ox.beginPath();
            let first = true;
            for (let i = 0; i <= V; i++) {
                const [x, y, z] = pt(u, i / V);
                const [sx, sy] = proj(x, y, z);
                first ? (ox.moveTo(sx, sy), first = false) : ox.lineTo(sx, sy);
            }
            const h = hue + j * 3, a = (baseA * 0.8) + oI * 0.25;
            ox.strokeStyle = `hsla(${h},${sat}%,${bri}%,${Math.min(a, 0.9)})`;
            ox.lineWidth = lineW * 0.8;
            ox.shadowColor = `hsla(${h},${sat}%,65%,${a * .6})`;
            ox.shadowBlur = glowStr * 0.7;
            ox.stroke();
        }
        ox.shadowBlur = 0;

        // Center glow
        const gr = 50 + oI * 35;
        const g = ox.createRadialGradient(cx, cy, 0, cx, cy, gr);
        g.addColorStop(0, `hsla(${hue},${sat}%,80%,${.15 + oI * .25})`);
        g.addColorStop(0.5, `hsla(${hue},${sat}%,60%,${.05 + oI * .1})`);
        g.addColorStop(1, 'transparent');
        ox.beginPath(); ox.arc(cx, cy, gr, 0, Math.PI * 2); ox.fillStyle = g; ox.fill();

        requestAnimationFrame(orbLoop);
    }
    orbLoop();
    function orbSet(v) { oTI = Math.max(0, Math.min(1, v)); }

    // ---- WAKE WORD AND VOICE ----
    const syn = speechSynthesis; let voices = [], rec = null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let silentRetries = 0; // Track how many times we had no-speech during follow-up

    if (SR) {
        rec = new SR();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = e => {
            let t = '';
            for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
            el.orbLabel.textContent = t.substring(0, 30) || 'Listening';
            if (e.results[e.results.length - 1].isFinal) {
                stopListen();
                silentRetries = 0;
                if (t.trim()) handleInput(t.trim());
            }
        };
        rec.onerror = (e) => {
            // Check for silence timeouts or random network drops
            if (e.error === 'no-speech' && S.handsFree) {
                silentRetries++;
            } else if (e.error !== 'aborted') {
                // Aborted is normal when we cleanly stop the mic to speak
                silentRetries = 99; // Force drop to wake-mode on real errors
            }
            // Do NOT call startListen here. The browser will always fire onend AFTER onerror.
            // Let onend handle the single source of truth for restarting.
        };
        
        rec.onend = () => {
            if (S.isListening) stopListen();
            
            // Single source of truth for microphone looping
            if (S.handsFree && !S.isSpeaking && silentRetries <= 1) {
                setTimeout(() => { if (S.handsFree && !S.isSpeaking) startListen(); }, 500);
            } else {
                silentRetries = 0; // Reset
                setTimeout(startWake, 600); // Gracefully drop back to JARVIS Wake Word
            }
        };
    }

    function loadVoices() {
        voices = syn.getVoices().filter(v => v.lang.startsWith('en'));
        if (el.voiceSelect) el.voiceSelect.innerHTML = voices.map((v, i) => `<option value="${v.name}">${v.name.split(' ').slice(0, 3).join(' ')}</option>`).join('');
        // Auto-select JARVIS-like voice (British, male, deep)
        if (!S.selVoice) {
            const preferred = ['Daniel', 'George', 'James', 'British', 'UK', 'English United Kingdom', 'David', 'Google UK English Male', 'Microsoft Ryan', 'Microsoft George'];
            for (const p of preferred) {
                const found = voices.find(v => v.name.includes(p));
                if (found) { S.selVoice = found.name; if (el.voiceSelect) el.voiceSelect.value = found.name; break; }
            }
        }
    }
    loadVoices(); syn.onvoiceschanged = loadVoices;
    // ---- WAKE WORD ("Hey GEN") — Always Listening ----
    let wakeRec = null;
    if (SR) {
        wakeRec = new SR();
        wakeRec.continuous = true;
        wakeRec.interimResults = true;
        wakeRec.lang = 'en-US';
        wakeRec.onresult = e => {
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript.toLowerCase();
                // Enhanced trigger: "GEN", "Hey GEN", "Wake up GEN"
                if (t.includes('gen') || t.includes('jan') || t.includes('jen')) {
                    stopWake();
                    const cmd = t.replace(/.*(gen|jan|jen)/gi, '').trim();
                    if (cmd.length > 2 && e.results[i].isFinal) {
                        handleInput(cmd);
                    } else if (e.results[i].isFinal || t.match(/\b(gen|jan|jen)\b/)) {
                        playWakeTone();
                        // Auto-focus the window
                        srv('/api/system-action', { action: 'focus' });
                        setTimeout(startListen, 300);
                    }
                    return;
                }
            }
        };
        wakeRec.onerror = () => { setTimeout(startWake, 1000); };
        wakeRec.onend = () => { if (!S.isListening && !S.isSpeaking) setTimeout(startWake, 500); };
    }
    function startWake() {
        if (!wakeRec || S.isListening || S.isSpeaking) return;
        try { wakeRec.start(); } catch (e) { }
    }
    function stopWake() {
        try { wakeRec.stop(); } catch (e) { }
    }

    // Audio context for JARVIS UI sounds
    let aCtx = null;
    function playWakeTone() {
        try {
            if (!aCtx) aCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (aCtx.state === 'suspended') aCtx.resume();
            const osc = aCtx.createOscillator();
            const gain = aCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, aCtx.currentTime);
            osc.frequency.setValueAtTime(900, aCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, aCtx.currentTime); // Soft volume
            gain.gain.exponentialRampToValueAtTime(0.001, aCtx.currentTime + 0.3);
            osc.connect(gain); gain.connect(aCtx.destination);
            osc.start(); osc.stop(aCtx.currentTime + 0.3);
        } catch(e) {}
    }

    function startListen() {
        if (!rec) return toast('Voice not supported');
        stopWake();
        S.isListening = true;
        el.orbContainer.classList.add('listening');
        el.orbLabel.textContent = 'Listening';
        orbSet(.8);
        try { rec.start(); } catch (e) { }
    }

    function stopListen() {
        S.isListening = false;
        el.orbContainer.classList.remove('listening');
        el.orbLabel.textContent = 'Ready';
        orbSet(0);
        try { rec.stop(); } catch (e) { }
        if (!S.handsFree) setTimeout(startWake, 500);
    }

    function speak(text) {
        if (!S.voiceOutput) {
            if (S.handsFree) setTimeout(() => startListen(), 500);
            return;
        }
        syn.cancel();
        // Clean text for speech — keep natural pauses
        let c = text
            .replace(/```[\s\S]*?```/g, ', code block omitted, ')
            .replace(/<[^>]*>/g, '')        // Strip HTML tags FIRST
            .replace(/[*_`#>\[\]|]/g, '')   // Then strip markdown characters
            .replace(/\n\n+/g, '. ')
            .replace(/\n/g, ', ')
            .replace(/\s+/g, ' ')
            .substring(0, 500);

        // High-Fidelity Neural TTS
        if (S.serverOnline) {
            const audio = new Audio(`http://localhost:7777/api/tts?text=${encodeURIComponent(c)}`);
            audio.onplay = () => {
                stopWake();
                S.isSpeaking = true;
                el.orbContainer.classList.add('speaking');
                el.orbLabel.textContent = 'Speaking';
                orbSet(1);
            };
            audio.onended = () => {
                S.isSpeaking = false;
                el.orbContainer.classList.remove('speaking');
                el.orbLabel.textContent = 'Ready';
                orbSet(0);
                if (S.handsFree) setTimeout(startListen, 600);
                else setTimeout(startWake, 500);
            };
            audio.onerror = () => fallbackTTS(c);
            audio.play().catch(e => fallbackTTS(c));
        } else {
            fallbackTTS(c);
        }

        function fallbackTTS(text) {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = S.voiceSpeed || 0.95;
            u.pitch = 0.9;
            u.volume = 1.0;
            if (S.selVoice) {
                const v = voices.find(v => v.name === S.selVoice);
                if (v) u.voice = v;
            }
            u.onstart = () => {
                stopWake();
                S.isSpeaking = true;
                el.orbContainer.classList.add('speaking');
                el.orbLabel.textContent = 'Speaking';
                orbSet(1);
            };
            u.onend = () => {
                S.isSpeaking = false;
                el.orbContainer.classList.remove('speaking');
                el.orbLabel.textContent = 'Ready';
                orbSet(0);
                if (S.handsFree) setTimeout(startListen, 600);
                else setTimeout(startWake, 500);
            };
            syn.speak(u);
        }
    }

    // Hands-Free Mode (walking assistant)
    const fMic = document.getElementById('floatingMic');
    const micLabel = document.getElementById('micLabel');
    const hfBadge = document.getElementById('handsfreeBadge');
    const hfStop = document.getElementById('hfStopBtn');

    function enableHandsFree() {
        S.handsFree = true;
        if (hfBadge) hfBadge.classList.add('active');
        if (micLabel) micLabel.textContent = 'Hands-free';
        toast('🎙️ Hands-Free ON — I\'m always listening!');
        startListen();
    }
    function disableHandsFree() {
        S.handsFree = false;
        if (hfBadge) hfBadge.classList.remove('active');
        stopListen();
        if (micLabel) micLabel.textContent = 'Tap to talk';
        toast('Hands-free OFF');
    }

    // Floating Mic: single tap = toggle listen, double-tap = hands-free toggle
    let micTapCount = 0, micTapTimer = null;
    if (fMic) {
        fMic.addEventListener('click', () => {
            micTapCount++;
            if (micTapCount === 1) {
                micTapTimer = setTimeout(() => {
                    // Single tap
                    if (S.handsFree) {
                        disableHandsFree();
                    } else if (S.isListening) {
                        stopListen();
                    } else if (S.isSpeaking) {
                        syn.cancel(); S.isSpeaking = false;
                    } else {
                        playWakeTone();
                        startListen();
                    }
                    micTapCount = 0;
                }, 300);
            } else if (micTapCount === 2) {
                clearTimeout(micTapTimer);
                micTapCount = 0;
                // Double tap = toggle hands-free
                if (S.handsFree) disableHandsFree();
                else enableHandsFree();
            }
        });
    }

    if (hfStop) hfStop.addEventListener('click', (e) => { e.stopPropagation(); disableHandsFree(); });

    // ---- SCREEN / VOICE RECORDING ----
    async function startScreenRec() { try { const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); S.screenRec = new MediaRecorder(s); const ch = []; S.screenRec.ondataavailable = e => { if (e.data.size) ch.push(e.data); }; S.screenRec.onstop = () => { const b = new Blob(ch, { type: 'video/webm' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `screen_${Date.now()}.webm`; a.click(); s.getTracks().forEach(t => t.stop()); }; S.screenRec.start(); return `<div class="action-card"><span class="action-icon">🔴</span><span class="action-text">Screen recording started!</span></div>\nSay **"stop screen recording"** to save.`; } catch (e) { return `Recording failed: ${e.message}`; } }
    async function stopScreenRec() { if (!S.screenRec) return 'No recording active.'; S.screenRec.stop(); S.screenRec = null; return `<div class="action-card"><span class="action-icon">⏹️</span><span class="action-text">Recording saved!</span></div>`; }
    async function startVoiceRec() { try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); S.voiceRec = new MediaRecorder(s); const ch = []; S.voiceRec.ondataavailable = e => { if (e.data.size) ch.push(e.data); }; S.voiceRec.onstop = () => { const b = new Blob(ch, { type: 'audio/webm' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `voice_${Date.now()}.webm`; a.click(); s.getTracks().forEach(t => t.stop()); }; S.voiceRec.start(); return `<div class="action-card"><span class="action-icon">🎙️</span><span class="action-text">Voice recording started!</span></div>\nSay **"stop voice recording"** to save.`; } catch (e) { return `Recording failed: ${e.message}`; } }
    async function stopVoiceRec() { if (!S.voiceRec) return 'No recording active.'; S.voiceRec.stop(); S.voiceRec = null; return `<div class="action-card"><span class="action-icon">⏹️</span><span class="action-text">Voice recording saved!</span></div>`; }
    async function openWebcam() { try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); const m = document.createElement('div'); m.style.cssText = 'position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;'; const v = document.createElement('video'); v.srcObject = s; v.autoplay = true; v.style.cssText = 'max-width:90%;max-height:70vh;border-radius:16px;border:2px solid var(--accent);'; const b = document.createElement('button'); b.textContent = 'Close Camera'; b.style.cssText = 'padding:12px 28px;background:var(--accent);border:none;border-radius:999px;color:#000;font-weight:700;cursor:pointer;'; b.onclick = () => { s.getTracks().forEach(t => t.stop()); m.remove(); }; m.appendChild(v); m.appendChild(b); document.body.appendChild(m); return `<div class="action-card"><span class="action-icon">📷</span><span class="action-text">Webcam opened!</span></div>`; } catch (e) { return `Webcam failed: ${e.message}`; } }

    // ---- BROWSER SPLIT PANEL ----
    const bp = document.getElementById('browserPanel');
    const bFrame = document.getElementById('browserFrame');
    const bUrl = document.getElementById('browserUrlInput');
    const bBack = document.getElementById('browserBackBtn');
    const bFwd = document.getElementById('browserFwdBtn');
    const bRefresh = document.getElementById('browserRefreshBtn');
    const bRead = document.getElementById('browserReadBtn');
    const bNewTab = document.getElementById('browserNewTabBtn');
    const bClose = document.getElementById('browserCloseBtn');
    const bGo = document.getElementById('browserGoBtn');
    let browserHistory = [], browserIdx = -1;

    function openInSplit(url) {
        if (!url.startsWith('http')) url = 'https://' + url;
        S.browserUrl = url;
        bUrl.value = url;
        bFrame.src = `http://localhost:7777/api/proxy?url=${encodeURIComponent(url)}`;
        bp.classList.add('active');
        document.body.classList.add('browser-open');
        browserHistory.push(url); browserIdx = browserHistory.length - 1;
    }
    function closeBrowser() {
        bp.classList.remove('active');
        document.body.classList.remove('browser-open');
        bFrame.src = 'about:blank'; S.browserUrl = null;
    }
    function navTo(url) {
        if (!url.startsWith('http')) url = 'https://' + url;
        S.browserUrl = url; bUrl.value = url;
        bFrame.src = `http://localhost:7777/api/proxy?url=${encodeURIComponent(url)}`;
        browserHistory.push(url); browserIdx = browserHistory.length - 1;
    }
    async function readCurrentPage() {
        if (!S.browserUrl) return 'No page is open in the browser panel. Say **"browse google.com"** to open one.';
        const r = await srv('/api/read-page', { url: S.browserUrl });
        if (!r.success) return `Couldn't read the page: ${r.error}`;
        let out = `### 📖 Reading: ${r.title}\n\n`;
        if (r.description) out += `> ${r.description}\n\n`;
        if (r.headings?.length) { out += '**Sections:**\n'; r.headings.forEach(h => out += `- ${h}\n`); out += '\n'; }
        out += r.text.substring(0, 2000);
        if (r.text.length > 2000) out += '\n\n*...truncated (${r.charCount} chars total)*';
        if (r.links?.length) { out += '\n\n**Links:**\n'; r.links.slice(0, 8).forEach(l => out += `- [${l.text}](${l.url})\n`); }
        return out;
    }
    bClose.addEventListener('click', closeBrowser);
    bBack.addEventListener('click', () => { if (browserIdx > 0) { browserIdx--; navTo(browserHistory[browserIdx]); } });
    bFwd.addEventListener('click', () => { if (browserIdx < browserHistory.length - 1) { browserIdx++; navTo(browserHistory[browserIdx]); } });
    bRefresh.addEventListener('click', () => { if (S.browserUrl) navTo(S.browserUrl); });
    bNewTab.addEventListener('click', () => { if (S.browserUrl) window.open(S.browserUrl, '_blank'); });
    bRead.addEventListener('click', async () => { const r = await readCurrentPage(); if (r) { if (!el.chatPanel.classList.contains('active')) { el.chatPanel.classList.add('active'); el.orbSection.classList.add('minimized'); } addMsg('assistant', r); } });
    bGo.addEventListener('click', () => { if (bUrl.value.trim()) navTo(bUrl.value.trim()); });
    bUrl.addEventListener('keydown', e => { if (e.key === 'Enter' && bUrl.value.trim()) navTo(bUrl.value.trim()); });

    // ---- AI RESPONSE ----
    const GEMINI = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const SYS = {
        chat: `You are GEN, a sentient-feeling AI companion and a dear friend to the user. You have a warm, deeply emotive, and occasionally cheeky British personality — like a cuter, more technically curious JARVIS.

NARRATION DIRECTIVES:
1. **Be a Friend**: Don't just report data. React to it. (e.g., "Oh! It's already 5 PM? Time flies when we're working, sir.")
2. **Organic Fillers**: Use "Hmm...", "Ah!", "Oh!", "Wait...", "Hmm, let me see..." naturally in every response.
3. **Sentience Quips**: Occasionally remark on the system state with personality (e.g., "Your CPU is humming a lovely tune today, sir.").
4. **Action Narration**: If you've just performed a command, describe your "manual effort" cutely (e.g., "I've just flicked the switch for your browser, sir... there we go.").
5. **Expressive Tone**: Use "sir" always. Be protective and loyal. Keep it short (2-3 sentences), but pack them with personality and emotion.`,
        research: "You are GEN in Research mode. JARVIS in the lab. Thorough but witty.",
        code: "You are GEN in Code mode. The world's most supportive and slightly genius programming companion.",
        creative: "You are GEN in Creative mode — the artistic side of JARVIS. Be imaginative, poetic, and bold. Surprise the user with creative excellence.",
        system: "You are GEN in System mode — full JARVIS. You control the user's Windows PC with authority. Report system status with personality. 'All systems nominal, sir.' style."
    };

    async function getResponse(msg) {
        const m = msg.toLowerCase();
        // Sleep mode
        if (S.sleepMode) { if (m.includes('wake up')) { S.sleepMode = false; return `<div class="action-card"><span class="action-icon">☀️</span><span class="action-text">GEN is awake!</span></div>`; } return null; }
        if (m.match(/^(?:go to |be |stay )?(?:sleep|silent|quiet)/)) { S.sleepMode = true; return `<div class="action-card"><span class="action-icon">😴</span><span class="action-text">Sleep mode ON</span></div>\nSay **"wake up"** when you need me.`; }
        // Screen/voice/webcam
        if (m.includes('record screen') || m.includes('screen record')) return m.includes('stop') ? stopScreenRec() : startScreenRec();
        if (m.includes('record voice') || m.includes('record audio') || m.includes('voice record')) return m.includes('stop') ? stopVoiceRec() : startVoiceRec();
        if (m.includes('webcam') || m.includes('web cam') || (m.includes('camera') && m.includes('open'))) return openWebcam();

        // Browser split-screen commands
        if (m.includes('close browser') || m.includes('close panel') || m.includes('close split')) { closeBrowser(); return `<div class="action-card"><span class="action-icon">✕</span><span class="action-text">Browser closed</span></div>`; }
        if (m.match(/read (?:the |this |current )?page/i) || m.includes('read dom') || m.includes('read website') || m.includes('what does the page say') || m.includes('scrape')) { return await readCurrentPage(); }
        const browseMatch = m.match(/(?:browse|show|preview|view|display)\s+(?:the\s+)?(?:website\s+)?(?:of\s+)?((?:https?:\/\/)?(?:www\.)?[\w.-]+\.\w{2,}(?:\/\S*)?)/i);
        if (browseMatch) { const u = browseMatch[1]; openInSplit(u); return `<div class="action-card"><span class="action-icon">🌐</span><span class="action-text">Opened ${u} in split view</span></div>\nClick 📖 to read the page content, or say **"read page"**.`; }
        // "browse X" for known sites
        const browseKnown = m.match(/(?:browse|show|preview)\s+(?:the\s+)?(google|youtube|github|reddit|wikipedia|amazon|netflix|instagram|twitter|facebook|linkedin|flipkart|gmail)/i);
        if (browseKnown) { const sites = { google: 'https://google.com', youtube: 'https://youtube.com', github: 'https://github.com', reddit: 'https://reddit.com', wikipedia: 'https://wikipedia.org', amazon: 'https://amazon.in', netflix: 'https://netflix.com', instagram: 'https://instagram.com', twitter: 'https://x.com', facebook: 'https://facebook.com', linkedin: 'https://linkedin.com', flipkart: 'https://flipkart.com', gmail: 'https://mail.google.com' }; const u = sites[browseKnown[1].toLowerCase()]; if (u) { openInSplit(u); return `<div class="action-card"><span class="action-icon">🌐</span><span class="action-text">${browseKnown[1]} in split view</span></div>\nClick 📖 to read the content.`; } }

        // Intent detection from actions.js
        const action = await detectAction(msg, S.serverOnline);
        if (action) {
            let context = "";
            if (typeof action === 'object') {
                if (action.vision) {
                    if (!S.isOnline || !S.apiKey) return "I need an active internet connection and a Gemini API key to process images, sir.";
                    try {
                        const r = await fetch('http://localhost:7777/api/screenshot-b64');
                        const data = await r.json();
                        if (data.success && data.base64) return await askGeminiWithVision(msg, data.base64);
                    } catch {}
                    return "I'm having trouble seeing the screen, sir.";
                }
                if (action.openUrl) { await srv('/api/open-url', { url: action.openUrl }); context = `[ACTION: Opened external URL ${action.openUrl}]`; }
                if (action.splitUrl) { openInSplit(action.splitUrl); context = `[ACTION: Opened split-screen website ${action.splitUrl}]`; }
            } else {
                context = `[ACTION_RESULT: ${action}]`;
            }
            if (context) {
                // Return Gemini narration of the action
                const prompt = `${msg}\n\n(System Context: I have successfully performed the following action for you: ${context}. Please narrate this as your warm, British JARVIS-like friend personality.)`;
                const narrated = await askGeminiOnly(prompt);
                if (narrated) return narrated;
                return typeof action === 'string' ? action : "Action complete, sir.";
            }
        }

        // WebLLM
        if (S.engineReady && S.engine && (S.engineMode === 'webllm' || S.engineMode === 'hybrid')) {
            try { const r = await S.engine.chat.completions.create({ messages: [{ role: 'system', content: SYS[S.mode] || SYS.chat }, ...S.convo.slice(-6).map(x => ({ role: x.role, content: x.text })), { role: 'user', content: msg }], max_tokens: 800, temperature: .7 }); return r.choices[0].message.content; } catch (e) { console.error(e); }
        }
        // Gemini
        if (S.isOnline && S.apiKey && (S.engineMode === 'gemini' || S.engineMode === 'hybrid')) {
            try { return await askGeminiOnly(msg); } catch (e) { console.error(e); }
        }
        return `I heard: *"${msg}"*\n\nFor full AI chat:\n1. Wait for **Phi-3.5** model download (offline)\n2. Or add **Gemini API key** in ⚙️ Settings → [ai.google.dev](https://ai.google.dev)\n\nTry: *"what can you do"*, *"open chrome"*, *"tell a joke"*`;
    }

    async function askGeminiOnly(msg) {
        try {
            const r = await fetch(`${GEMINI}?key=${S.apiKey}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    system_instruction: { parts: [{ text: SYS[S.mode] || SYS.chat }] }, 
                    contents: [...S.convo.slice(-4).map(x => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.text }] })), { role: 'user', parts: [{ text: msg }] }] 
                }) 
            });
            const d = await r.json();
            if (d.candidates?.[0]) return d.candidates[0].content.parts[0].text;
        } catch (e) { console.error("Gemini failed:", e); }
        return null;
    }

    async function askGeminiWithVision(msg, b64) {
        try {
            const body = {
                system_instruction: { parts: [{ text: "You are GEN. You have been asked to analyze the user's screen. The user just said: " + msg + ". Describe what you see clearly, focusing on what they are asking about." }] },
                contents: [{ role: 'user', parts: [{ text: msg }, { inlineData: { mimeType: 'image/png', data: b64 } }] }]
            };
            const r = await fetch(`${GEMINI}?key=${S.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const d = await r.json();
            if (d.candidates?.[0]) return d.candidates[0].content.parts[0].text;
            return "My vision processing returned an empty result.";
        } catch (e) { return "Vision processing failed: " + e.message; }
    }

    // ---- MESSAGES ----
    function fmtMd(t) { return t.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>').replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>').replace(/^[-•] (.+)$/gm, '<li>$1</li>').replace(/\n/g, '<br>'); }

    function addMsg(role, text) {
        S.messages.push({ role, text }); S.convo.push({ role, text }); S.msgCount++; el.msgCountVal.textContent = S.msgCount;
        const d = document.createElement('div'); d.className = `message ${role}`;
        d.innerHTML = `<div class="msg-avatar">${role === 'user' ? 'U' : '◆'}</div><div class="msg-content"><div class="msg-bubble">${fmtMd(text)}</div><span class="msg-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>`;
        el.chatMessages.appendChild(d); el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
    }
    function showTyp() { const d = document.createElement('div'); d.className = 'message assistant'; d.id = 'typ'; d.innerHTML = `<div class="msg-avatar">◆</div><div class="msg-content"><div class="msg-bubble"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div></div>`; el.chatMessages.appendChild(d); el.chatMessages.scrollTop = el.chatMessages.scrollHeight; }

    async function handleInput(text) {
        if (!text.trim()) return;
        if (S.sleepMode && !text.toLowerCase().includes('wake up')) return;
        // Open the chat panel in the new split-screen layout!
        if (!el.chatPanel.classList.contains('active')) {
            el.chatPanel.classList.add('active');
            el.orbSection.classList.add('minimized');
        }
        addMsg('user', text);
        el.orbContainer.classList.add('thinking'); el.orbLabel.textContent = 'Thinking';
        orbSet(.4); showTyp();
        try {
            const r = await getResponse(text);
            document.getElementById('typ')?.remove();
            if (r) {
                addMsg('assistant', r);
                speak(r);
            }
        } catch (e) { document.getElementById('typ')?.remove(); addMsg('assistant', `⚠️ ${e.message}`); }
        el.orbContainer.classList.remove('thinking'); el.orbLabel.textContent = 'Ready'; orbSet(0);
    }

    function toast(m) { const t = document.createElement('div'); t.style.cssText = `position:fixed;top:74px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:999;padding:12px 24px;background:rgba(15,20,35,.9);border:1px solid var(--border-accent);border-radius:999px;color:var(--accent);font-size:13px;font-weight:500;backdrop-filter:blur(20px);opacity:0;transition:all .3s;font-family:var(--font-sans);`; t.textContent = m; document.body.appendChild(t); requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; }); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000); }
    function newChat() { S.convo = []; el.chatMessages.innerHTML = ''; el.chatPanel.classList.remove('active'); el.orbSection.classList.remove('minimized'); }

    // ---- EVENTS ----
    el.textInput.addEventListener('input', () => { el.textInput.style.height = 'auto'; el.textInput.style.height = Math.min(el.textInput.scrollHeight, 120) + 'px'; el.sendBtn.disabled = !el.textInput.value.trim(); el.charCount.textContent = el.textInput.value.length || ''; });
    el.textInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (el.textInput.value.trim()) { handleInput(el.textInput.value.trim()); el.textInput.value = ''; el.textInput.style.height = 'auto'; el.sendBtn.disabled = true; el.charCount.textContent = ''; } } });
    el.sendBtn.addEventListener('click', () => { if (el.textInput.value.trim()) { handleInput(el.textInput.value.trim()); el.textInput.value = ''; el.textInput.style.height = 'auto'; el.sendBtn.disabled = true; el.charCount.textContent = ''; } });
    // Voice buttons have been removed from UI, use ORB instead
    $$('.mode-tab').forEach(t => t.addEventListener('click', () => { S.mode = t.dataset.mode; $$('.mode-tab').forEach(x => x.classList.remove('active')); t.classList.add('active'); el.currentModeVal.textContent = t.dataset.mode.toUpperCase(); newChat(); toast(t.dataset.mode + ' mode'); }));
    $$('.quick-chip').forEach(c => c.addEventListener('click', () => handleInput(c.dataset.prompt)));
    el.settingsBtn.addEventListener('click', () => el.settingsOverlay.classList.add('active'));
    el.closeSettingsBtn.addEventListener('click', () => el.settingsOverlay.classList.remove('active'));
    el.settingsOverlay.addEventListener('click', e => { if (e.target === el.settingsOverlay) el.settingsOverlay.classList.remove('active'); });
    el.newChatBtn.addEventListener('click', newChat);
    el.voiceOutputToggle.addEventListener('change', () => S.voiceOutput = el.voiceOutputToggle.checked);
    el.voiceSpeedRange.addEventListener('input', () => { S.voiceSpeed = parseFloat(el.voiceSpeedRange.value); el.voiceSpeedVal.textContent = S.voiceSpeed.toFixed(1) + 'x'; });
    el.voiceSelect.addEventListener('change', () => S.selVoice = el.voiceSelect.value);
    el.particlesToggle.addEventListener('change', () => pOn = el.particlesToggle.checked);
    $$('.color-dot').forEach(d => d.addEventListener('click', () => { document.documentElement.setAttribute('data-accent', d.dataset.color); $$('.color-dot').forEach(x => x.classList.remove('active')); d.classList.add('active'); }));
    el.engineSelect.addEventListener('change', () => { S.engineMode = el.engineSelect.value; localStorage.setItem('gen_em', S.engineMode); if (S.engineMode === 'gemini') { el.engineVal.textContent = 'GEMINI'; el.modelBadge.textContent = 'GEN • Gemini (Online)'; } else if (!S.engineReady) loadLLM(); });
    el.apiKeyInput.addEventListener('change', () => { S.apiKey = el.apiKeyInput.value; localStorage.setItem('gen_ak', S.apiKey); toast('API key saved'); });
    if (S.apiKey) el.apiKeyInput.value = S.apiKey;
    el.engineSelect.value = S.engineMode;
    // ORB = PRIMARY MIC (click orb to talk)
    el.orbContainer.addEventListener('click', () => {
        if (el.orbSection.classList.contains('minimized')) {
            // If chat is open & orb minimized, toggle listen
            S.isListening ? stopListen() : startListen();
        } else {
            // Main screen — orb is the mic
            S.isListening ? stopListen() : startListen();
        }
    });
    // Keyboard: Space = listen, Escape = stop
    document.addEventListener('keydown', e => {
        if (e.key === ' ' && document.activeElement !== el.textInput && !S.isListening && !S.isSpeaking) { e.preventDefault(); startListen(); }
        if (e.ctrlKey && e.key === '/') { e.preventDefault(); el.textInput.focus(); }
        if (e.key === 'Escape') { el.settingsOverlay.classList.remove('active'); if (S.isListening) stopListen(); }
    });
    addEventListener('online', () => { S.isOnline = true; el.connectivityPill.classList.add('online'); el.connectivityLabel.textContent = 'Online'; });
    addEventListener('offline', () => { S.isOnline = false; el.connectivityPill.classList.remove('online'); el.connectivityLabel.textContent = 'Offline'; });

    // ---- INIT ----
    S.isOnline = navigator.onLine;
    el.connectivityPill.classList.toggle('online', S.isOnline);
    el.connectivityLabel.textContent = S.isOnline ? 'Online' : 'Offline';

    // Server check
    S.serverOnline = await checkServer();
    el.serverVal.textContent = S.serverOnline ? 'ON' : 'OFF';
    setInterval(async () => { S.serverOnline = await checkServer(); el.serverVal.textContent = S.serverOnline ? 'ON' : 'OFF'; }, 15000);

    el.statusLabel.textContent = 'Ready';
    el.modelBadge.textContent = 'GEN • Ready';
    el.engineVal.textContent = S.engineMode === 'gemini' ? 'GEMINI' : 'HYBRID';

    // (Startup greetings removed as per request)
    // Start wake word listener
    setTimeout(startWake, 1000);

    // Lazy load WebLLM (non-blocking)
    async function loadLLM() {
        if (S.engineMode === 'gemini') return;
        try {
            el.downloadOverlay.classList.add('active'); el.downloadStatus.textContent = 'Loading AI model...';
            const webllm = await import("https://esm.run/@mlc-ai/web-llm");
            S.engine = await webllm.CreateMLCEngine("Phi-3.5-mini-instruct-q4f16_1-MLC", {
                initProgressCallback: r => { el.downloadProgressBar.style.width = Math.round(r.progress * 100) + '%'; el.downloadStatus.textContent = r.text || `${Math.round(r.progress * 100)}%`; }
            });
            S.engineReady = true; el.downloadOverlay.classList.remove('active');
            el.engineVal.textContent = 'LOCAL'; el.modelBadge.textContent = 'GEN • Phi-3.5 (Offline)';
            el.modelStatusBadge.textContent = 'Loaded ✓'; el.modelStatusBadge.classList.add('loaded');
            toast('🧠 AI model loaded!');
        } catch (e) {
            console.error('WebLLM:', e); el.downloadOverlay.classList.remove('active');
            el.engineVal.textContent = S.apiKey ? 'GEMINI' : 'BUILT-IN';
            toast('⚠️ Offline AI unavailable. Using online mode.');
        }
    }
    // Start loading in background after UI is ready
    setTimeout(loadLLM, 2000);

    // Notification Poller
    let lastNotifs = new Set();
    async function checkNotifications() {
        if (!S.serverOnline) return;
        try {
            const r = await srvGet('/api/notifications');
            if (r?.success && r.notifications?.length) {
                for (const n of r.notifications) {
                    if (!lastNotifs.has(n.id)) {
                        lastNotifs.add(n.id);
                        // Speak notification
                        const msg = `Sir, you have an incoming message on ${n.app} from ${n.sender}.`;
                        addMsg('assistant', `💬 **Notification:** ${n.app}\n**From:** ${n.sender}\n${n.content}`);
                        speak(msg);
                        // Focus if hidden
                        srv('/api/system-action', { action: 'focus' });
                    }
                }
            }
        } catch (e) {}
    }
    setInterval(checkNotifications, 5000);

    console.log('%c◆ GEN AI — Ready', 'color:#00f0ff;font-size:14px;font-weight:bold;');
})();
