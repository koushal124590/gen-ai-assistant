/* ============================================================
   GEN AI ASSISTANT — Local Server (50+ Features)
   Controls system, opens apps/websites, QR codes, notes,
   screenshots, Wikipedia, news, Gmail, WhatsApp, YouTube,
   volume, power, webcam, recording, IP, speed, location, etc.
   ============================================================ */

const express = require('express');
const cors = require('cors');
const { exec, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 7777;
const NOTES_DIR = path.join(__dirname, 'notes');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const RECORDINGS_DIR = path.join(__dirname, 'recordings');
const CONTACTS_FILE = path.join(__dirname, 'contacts.json');
const PYTHON = 'python'; // or 'python3' depending on environment

function runPy(action, params = {}) {
    return new Promise((resolve, reject) => {
        const cmd = JSON.stringify({ action, params });
        exec(`${PYTHON} gen_automation.py '${cmd.replace(/'/g, "'\\''")}'`, (err, stdout) => {
            if (err) return reject(err);
            try { resolve(JSON.parse(stdout)); } catch (e) { resolve({ success: false, error: 'Invalid JSON from Python' }); }
        });
    });
}

// Ensure directories exist
[NOTES_DIR, SCREENSHOTS_DIR, RECORDINGS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// ==================== SYSTEM INFO ====================
app.get('/api/system', (req, res) => {
    const cpus = os.cpus();
    res.json({
        platform: os.platform(),
        hostname: os.hostname(),
        username: os.userInfo().username,
        cpuModel: cpus[0]?.model || 'Unknown',
        cpuCores: cpus.length,
        totalMemory: (os.totalmem() / 1073741824).toFixed(1) + ' GB',
        freeMemory: (os.freemem() / 1073741824).toFixed(1) + ' GB',
        usedMemory: ((os.totalmem() - os.freemem()) / 1073741824).toFixed(1) + ' GB',
        memoryUsage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(0) + '%',
        uptime: formatUptime(os.uptime()),
        arch: os.arch(),
        homeDir: os.homedir(),
        tempDir: os.tmpdir(),
        networkInterfaces: Object.keys(os.networkInterfaces()),
    });
});

function formatUptime(s) {
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
}

// ==================== OPEN WEBSITE ====================
app.post('/api/open-url', (req, res) => {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    exec(`start "" "${url}"`, (err) => {
        res.json({ success: !err, message: err ? err.message : `Opened ${url}` });
    });
});

// ==================== OPEN APPLICATION ====================
const APP_MAP = {
    'notepad': 'notepad', 'calculator': 'calc', 'calc': 'calc', 'paint': 'mspaint',
    'cmd': 'cmd', 'command prompt': 'cmd', 'terminal': 'wt', 'powershell': 'powershell',
    'explorer': 'explorer', 'file explorer': 'explorer', 'files': 'explorer',
    'task manager': 'taskmgr', 'settings': 'start ms-settings:', 'control panel': 'control',
    'snipping tool': 'snippingtool', 'snip': 'snippingtool',
    'word': 'start winword', 'excel': 'start excel', 'powerpoint': 'start powerpnt',
    'outlook': 'start outlook', 'onenote': 'start onenote',
    'teams': 'start msteams:', 'spotify': 'start spotify:', 'discord': 'start discord:',
    'steam': 'start steam:', 'epic games': 'start com.epicgames.launcher:',
    'chrome': 'start chrome', 'google chrome': 'start chrome', 'firefox': 'start firefox',
    'edge': 'start msedge', 'brave': 'start brave', 'opera': 'start opera',
    'vscode': 'code', 'vs code': 'code', 'visual studio code': 'code', 'visual studio': 'start devenv',
    'whatsapp': 'start whatsapp:', 'telegram': 'start tg:',
    'camera': 'start microsoft.windows.camera:', 'clock': 'start ms-clock:',
    'alarms': 'start ms-clock:', 'maps': 'start bingmaps:', 'weather': 'start bingweather:',
    'store': 'start ms-windows-store:', 'microsoft store': 'start ms-windows-store:',
    'xbox': 'start xbox:', 'photos': 'start ms-photos:',
    'music': 'start mswindowsmusic:', 'groove music': 'start mswindowsmusic:',
    'movies': 'start mswindowsvideo:', 'video': 'start mswindowsvideo:',
    'mail': 'start outlookmail:', 'calendar': 'start outlookcal:',
    'skype': 'start skype:', 'zoom': 'start zoommtg:',
    'vlc': 'start vlc', 'obs': 'start obs64',
    'photoshop': 'start photoshop', 'illustrator': 'start illustrator',
    'blender': 'start blender', 'audacity': 'start audacity',
    'git bash': 'start git-bash', 'postman': 'start postman',
    'android studio': 'start studio64',
    'clipchamp': 'start ms-clipchamp:',
};

// Social Media
const SOCIAL_MAP = {
    'facebook': 'https://www.facebook.com', 'instagram': 'https://www.instagram.com',
    'twitter': 'https://twitter.com', 'x': 'https://x.com',
    'linkedin': 'https://www.linkedin.com', 'reddit': 'https://www.reddit.com',
    'pinterest': 'https://www.pinterest.com', 'tumblr': 'https://www.tumblr.com',
    'snapchat': 'https://www.snapchat.com', 'tiktok': 'https://www.tiktok.com',
    'github': 'https://github.com', 'gitlab': 'https://gitlab.com',
    'stackoverflow': 'https://stackoverflow.com',
    'quora': 'https://www.quora.com', 'medium': 'https://medium.com',
};

// OTT Platforms
const OTT_MAP = {
    'netflix': 'https://www.netflix.com', 'prime video': 'https://www.primevideo.com',
    'amazon prime': 'https://www.primevideo.com', 'hotstar': 'https://www.hotstar.com',
    'disney+': 'https://www.hotstar.com', 'disney plus': 'https://www.hotstar.com',
    'hulu': 'https://www.hulu.com', 'hbo': 'https://www.max.com',
    'sony liv': 'https://www.sonyliv.com', 'zee5': 'https://www.zee5.com',
    'jio cinema': 'https://www.jiocinema.com', 'voot': 'https://www.voot.com',
    'crunchyroll': 'https://www.crunchyroll.com', 'apple tv': 'https://tv.apple.com',
    'youtube premium': 'https://www.youtube.com/premium',
};

// Google Apps
const GOOGLE_MAP = {
    'gmail': 'https://mail.google.com', 'google mail': 'https://mail.google.com',
    'google drive': 'https://drive.google.com', 'drive': 'https://drive.google.com',
    'google docs': 'https://docs.google.com', 'google sheets': 'https://sheets.google.com',
    'google slides': 'https://slides.google.com', 'google forms': 'https://forms.google.com',
    'google photos': 'https://photos.google.com', 'google calendar': 'https://calendar.google.com',
    'google maps': 'https://maps.google.com', 'google meet': 'https://meet.google.com',
    'google classroom': 'https://classroom.google.com',
    'google keep': 'https://keep.google.com', 'google translate': 'https://translate.google.com',
    'google earth': 'https://earth.google.com', 'youtube': 'https://www.youtube.com',
    'youtube music': 'https://music.youtube.com', 'youtube studio': 'https://studio.youtube.com',
};

// Shopping
const SHOPPING_MAP = {
    'amazon': 'https://www.amazon.in', 'flipkart': 'https://www.flipkart.com',
    'myntra': 'https://www.myntra.com', 'ajio': 'https://www.ajio.com',
    'meesho': 'https://www.meesho.com', 'snapdeal': 'https://www.snapdeal.com',
    'ebay': 'https://www.ebay.com', 'aliexpress': 'https://www.aliexpress.com',
    'nykaa': 'https://www.nykaa.com', 'tata cliq': 'https://www.tatacliq.com',
};

// Presentation Tools
const PRESENT_MAP = {
    'canva': 'https://www.canva.com', 'google slides': 'https://slides.google.com',
    'prezi': 'https://prezi.com', 'figma': 'https://www.figma.com',
    'miro': 'https://miro.com', 'notion': 'https://www.notion.so',
};

// Meeting Tools
const MEETING_MAP = {
    'zoom': 'https://zoom.us', 'google meet': 'https://meet.google.com',
    'teams': 'https://teams.microsoft.com', 'microsoft teams': 'https://teams.microsoft.com',
    'webex': 'https://www.webex.com', 'skype': 'https://www.skype.com',
};

app.post('/api/open-app', (req, res) => {
    const { appName } = req.body;
    if (!appName) return res.status(400).json({ error: 'App name required' });
    const key = appName.toLowerCase().trim();

    // 1. Prioritize Local Apps mapped explicitly
    const command = APP_MAP[key];
    if (command) {
        exec(command, (err) => {
            res.json({ success: !err, message: err ? err.message : `Opened ${appName}` });
        });
        return;
    }

    // 2. Check Website Fallbacks and open in default browser
    const allWebMaps = { ...SOCIAL_MAP, ...OTT_MAP, ...GOOGLE_MAP, ...SHOPPING_MAP, ...PRESENT_MAP, ...MEETING_MAP };
    if (allWebMaps[key]) {
        exec(`start "" "${allWebMaps[key]}"`, (err) => {
            res.json({ success: !err, message: `Opened ${key}` });
        });
        return;
    }

    // Try direct launch
    exec(`start "" "${appName}"`, (err) => {
        res.json({
            success: !err,
            message: err ? `Could not find "${appName}"` : `Opened ${appName}`,
            available: Object.keys(APP_MAP),
        });
    });
});

// ==================== CLOSE APPLICATION ====================
app.post('/api/close-app', (req, res) => {
    const { appName } = req.body;
    if (!appName) return res.status(400).json({ error: 'App name required' });
    const processName = appName.toLowerCase().trim();
    exec(`taskkill /IM "${processName}.exe" /F`, (err) => {
        res.json({ success: !err, message: err ? `Could not close ${appName}` : `Closed ${appName}` });
    });
});

// ==================== GOOGLE SEARCH (SILENT) ====================
app.post('/api/search', async (req, res) => {
    try {
        const googleIt = require('google-it');
        const results = await googleIt({ query: req.body.query, limit: 5, 'no-display': true });
        res.json({ success: true, results });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ==================== MOUSE CONTROL ====================
app.post('/api/mouse', (req, res) => {
    const { action, x, y } = req.body;
    let script = `Add-Type -AssemblyName System.Windows.Forms;`;
    
    if (action === 'move') {
        script += `[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y});`;
    } else if (action === 'click') {
        script += `
            $signature = '[DllImport("user32.dll",CharSet=CharSet.Auto, CallingConvention=CallingConvention.StdCall)] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);'
            $mouse = Add-Type -MemberDefinition $signature -Name "Mouse" -Namespace "Win32" -PassThru
            $mouse::mouse_event(0x02, 0, 0, 0, 0); Start-Sleep -Milliseconds 50; $mouse::mouse_event(0x04, 0, 0, 0, 0);
        `;
    }
    
    exec(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`, (err) => {
        res.json({ success: !err, error: err ? err.message : null });
    });
});

// ==================== YOUTUBE ====================
app.post('/api/youtube', (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    exec(`start "" "https://www.youtube.com/results?search_query=${encodeURIComponent(query)}"`, (err) => {
        res.json({ success: !err, message: `YouTube: "${query}"` });
    });
});

app.post('/api/youtube-play', (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    // Open YouTube Music search
    exec(`start "" "https://music.youtube.com/search?q=${encodeURIComponent(query)}"`, (err) => {
        res.json({ success: !err, message: `Playing "${query}" on YouTube Music` });
    });
});

// ==================== WIKIPEDIA ====================
app.post('/api/wikipedia', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    try {
        const wiki = require('wikipedia');
        const search = await wiki.search(query);
        if (search.results.length === 0) return res.json({ success: false, error: 'No results found' });
        const page = await wiki.page(search.results[0].title);
        const summary = await page.summary();
        res.json({
            success: true,
            title: summary.title,
            extract: summary.extract,
            thumbnail: summary.thumbnail?.source || null,
            url: summary.content_urls?.desktop?.page || null,
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== TAKE NOTES ====================
app.post('/api/note-save', (req, res) => {
    const { title, content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const filename = (title || `note_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_') + '.txt';
    const filepath = path.join(NOTES_DIR, filename);
    fs.writeFileSync(filepath, `${new Date().toLocaleString()}\n${'='.repeat(40)}\n\n${content}`);
    res.json({ success: true, message: `Note saved: ${filename}`, path: filepath });
});

app.get('/api/notes', (req, res) => {
    const files = fs.readdirSync(NOTES_DIR).filter(f => f.endsWith('.txt'));
    const notes = files.map(f => ({
        name: f,
        content: fs.readFileSync(path.join(NOTES_DIR, f), 'utf-8'),
        modified: fs.statSync(path.join(NOTES_DIR, f)).mtime,
    }));
    res.json({ notes });
});

// ==================== SCREENSHOT ====================
app.post('/api/screenshot', (req, res) => {
    const { filename } = req.body;
    const name = (filename || `screenshot_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);

    // Use PowerShell to take screenshot
    const psCommand = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
        $bitmap.Save('${filepath.replace(/\\/g, '\\\\')}')
        $graphics.Dispose()
        $bitmap.Dispose()
    `.replace(/\n/g, ' ');

    exec(`powershell -Command "${psCommand}"`, (err) => {
        res.json({ success: !err, message: err ? err.message : `Screenshot saved: ${name}.png`, path: filepath });
    });
});

// ==================== SAVE RECORDING (from browser) ====================
app.post('/api/save-recording', (req, res) => {
    const { data, filename, type } = req.body;
    if (!data) return res.status(400).json({ error: 'Data required' });
    const name = (filename || `recording_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = type === 'audio' ? '.webm' : '.webm';
    const filepath = path.join(RECORDINGS_DIR, name + ext);
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filepath, buffer);
    res.json({ success: true, message: `Recording saved: ${name}${ext}`, path: filepath });
});

// ==================== QR CODE ====================
app.post('/api/qrcode', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    try {
        const QRCode = require('qrcode');
        const dataUrl = await QRCode.toDataURL(text, { width: 300, margin: 2, color: { dark: '#00f0ff', light: '#06080d' } });
        res.json({ success: true, qrCode: dataUrl, text });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== IP ADDRESS ====================
app.get('/api/ip', (req, res) => {
    const interfaces = os.networkInterfaces();
    const ips = {};
    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
            if (addr.family === 'IPv4' && !addr.internal) {
                ips[name] = addr.address;
            }
        }
    }
    // Also get public IP
    httpGet('https://api.ipify.org?format=json').then(data => {
        try {
            const parsed = JSON.parse(data);
            ips.public = parsed.ip;
        } catch {}
        res.json({ success: true, ips });
    }).catch(() => {
        res.json({ success: true, ips, note: 'Could not fetch public IP (offline)' });
    });
});

// ==================== NEWS ====================
app.get('/api/news', (req, res) => {
    const category = req.query.category || 'general';
    const country = req.query.country || 'in';
    // Using Google News RSS as fallback (free, no API key needed)
    const url = `https://news.google.com/rss/search?q=${category}&hl=en-${country.toUpperCase()}&gl=${country.toUpperCase()}&ceid=${country.toUpperCase()}:en`;
    httpGet(url).then(data => {
        // Parse RSS XML simply
        const items = [];
        const regex = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>/g;
        let match;
        while ((match = regex.exec(data)) !== null && items.length < 10) {
            items.push({ title: match[1], link: match[2], date: match[3] });
        }
        // Fallback simpler regex
        if (items.length === 0) {
            const regex2 = /<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g;
            while ((match = regex2.exec(data)) !== null && items.length < 10) {
                if (!match[1].includes('Google News')) {
                    items.push({ title: match[1], link: match[2], date: '' });
                }
            }
        }
        res.json({ success: true, news: items });
    }).catch(e => {
        res.json({ success: false, error: 'Could not fetch news. Check internet connection.' });
    });
});

// ==================== CONTACTS (Telephone Dictionary) ====================
function loadContacts() {
    if (fs.existsSync(CONTACTS_FILE)) {
        return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8'));
    }
    return [];
}
function saveContacts(contacts) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

app.get('/api/contacts', (req, res) => {
    res.json({ contacts: loadContacts() });
});

app.post('/api/contacts/add', (req, res) => {
    const { name, phone, email } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
    const contacts = loadContacts();
    contacts.push({ name, phone, email: email || '', addedAt: new Date().toISOString() });
    saveContacts(contacts);
    res.json({ success: true, message: `Contact "${name}" added` });
});

app.post('/api/contacts/search', (req, res) => {
    const { query } = req.body;
    const contacts = loadContacts();
    const results = contacts.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
    );
    res.json({ success: true, results });
});

app.post('/api/contacts/delete', (req, res) => {
    const { name } = req.body;
    let contacts = loadContacts();
    contacts = contacts.filter(c => c.name.toLowerCase() !== name.toLowerCase());
    saveContacts(contacts);
    res.json({ success: true, message: `Contact "${name}" deleted` });
});

// ==================== SEND GMAIL ====================
app.post('/api/send-email', async (req, res) => {
    const { to, subject, body, gmailUser, gmailAppPassword } = req.body;
    if (!to || !body) return res.status(400).json({ error: 'Recipient and body required' });
    if (!gmailUser || !gmailAppPassword) {
        return res.json({ success: false, error: 'Gmail credentials needed. Set Gmail user and App Password in settings.' });
    }
    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: gmailUser, pass: gmailAppPassword },
        });
        await transporter.sendMail({ from: gmailUser, to, subject: subject || 'Message from GEN', text: body });
        res.json({ success: true, message: `Email sent to ${to}` });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== WHATSAPP ====================
app.post('/api/whatsapp', (req, res) => {
    const { phone, message } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    const url = message
        ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
        : `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
    exec(`start "" "${url}"`, (err) => {
        res.json({ success: !err, message: `Opening WhatsApp for ${phone}` });
    });
});

// ==================== SYSTEM COMMANDS ====================
app.post('/api/system-action', (req, res) => {
    const { action } = req.body;
    const actions = {
        'screenshot': 'snippingtool',
        'lock': 'rundll32.exe user32.dll,LockWorkStation',
        'shutdown': 'shutdown /s /t 60 /c "GEN: Shutting down in 60 seconds"',
        'restart': 'shutdown /r /t 60 /c "GEN: Restarting in 60 seconds"',
        'cancel-shutdown': 'shutdown /a',
        'sleep': 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
        'hibernate': 'shutdown /h',
        'logoff': 'shutdown /l',
        'volume-up': 'powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]175)"',
        'volume-down': 'powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]174)"',
        'volume-mute': 'powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"',
        'bluetooth-settings': 'start ms-settings:bluetooth',
        'display-settings': 'start ms-settings:display',
        'sound-settings': 'start ms-settings:sound',
        'wifi-settings': 'start ms-settings:network-wifi',
        'battery-settings': 'start ms-settings:batterysaver',
        'storage-settings': 'start ms-settings:storagesense',
        'apps-settings': 'start ms-settings:appsfeatures',
        'update-settings': 'start ms-settings:windowsupdate',
        'about-settings': 'start ms-settings:about',
        'night-light': 'start ms-settings:nightlight',
        'personalization': 'start ms-settings:personalization',
        'empty-recycle': 'powershell -c "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"',
        'focus': `powershell -NoProfile -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.AppActivate('GEN')"`,
    };
    if (!actions[action]) {
        return res.json({ success: false, error: 'Unknown action', available: Object.keys(actions) });
    }
    exec(actions[action], (err) => {
        res.json({ success: !err, message: `Executed: ${action}` });
    });
});

// ==================== BATTERY ====================
app.get('/api/battery', (req, res) => {
    exec('WMIC PATH Win32_Battery Get EstimatedChargeRemaining,BatteryStatus /FORMAT:CSV', (err, stdout) => {
        if (err) return res.json({ available: false });
        const lines = stdout.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) return res.json({ available: false });
        const parts = lines[1].split(',');
        res.json({ available: true, level: parseInt(parts[2]) || 0, charging: parseInt(parts[1]) === 2 });
    });
});

// ==================== INTERNET SPEED ====================
app.get('/api/speed-test', (req, res) => {
    // Simple speed test by downloading a known file
    const startTime = Date.now();
    const testUrl = 'https://speed.cloudflare.com/__down?bytes=1000000'; // 1MB
    httpGet(testUrl).then(data => {
        const duration = (Date.now() - startTime) / 1000;
        const sizeMB = data.length / 1048576;
        const speedMbps = ((sizeMB * 8) / duration).toFixed(2);
        res.json({ success: true, downloadSpeed: speedMbps + ' Mbps', duration: duration.toFixed(2) + 's', size: sizeMB.toFixed(2) + ' MB' });
    }).catch(e => {
        res.json({ success: false, error: 'Speed test failed. Check internet.' });
    });
});

// ==================== SCHEDULE ====================
const SCHEDULE_FILE = path.join(__dirname, 'schedule.json');

app.get('/api/schedule', (req, res) => {
    if (fs.existsSync(SCHEDULE_FILE)) {
        res.json({ schedule: JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8')) });
    } else {
        res.json({ schedule: {} });
    }
});

app.post('/api/schedule/add', (req, res) => {
    const { day, event } = req.body;
    if (!day || !event) return res.status(400).json({ error: 'Day and event required' });
    let schedule = {};
    if (fs.existsSync(SCHEDULE_FILE)) schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
    if (!schedule[day]) schedule[day] = [];
    schedule[day].push({ event, addedAt: new Date().toISOString() });
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
    res.json({ success: true, message: `Added "${event}" to ${day}` });
});

// ==================== PLAY LOCAL MUSIC ====================
app.post('/api/play-local-music', (req, res) => {
    const { directory } = req.body;
    const musicDir = directory || path.join(os.homedir(), 'Music');
    if (!fs.existsSync(musicDir)) return res.json({ success: false, error: `Directory not found: ${musicDir}` });
    const songs = fs.readdirSync(musicDir).filter(f => /\.(mp3|wav|flac|m4a|aac|ogg|wma)$/i.test(f));
    if (songs.length === 0) return res.json({ success: false, error: 'No music files found' });
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    const filepath = path.join(musicDir, randomSong);
    exec(`start "" "${filepath}"`, (err) => {
        res.json({ success: !err, message: `Playing: ${randomSong}`, songs: songs.slice(0, 20), nowPlaying: randomSong });
    });
});

// ==================== PROCESSES ====================
app.get('/api/processes', (req, res) => {
    exec('tasklist /FO CSV /NH', (err, stdout) => {
        if (err) return res.json({ processes: [] });
        const processes = stdout.trim().split('\n').slice(0, 25).map(line => {
            const parts = line.replace(/"/g, '').split(',');
            return { name: parts[0], pid: parts[1], memory: parts[4] };
        });
        res.json({ processes });
    });
});

// ==================== TTS (Text-to-Speech) ====================
const { EdgeTTS } = require('node-edge-tts');

app.get('/api/tts', async (req, res) => {
    const text = req.query.text;
    const voice = req.query.voice || 'en-GB-ThomasNeural'; // Crisp, emotive British voice
    if(!text) return res.status(400).send('Text required');

    const tempFileName = `tts_${Date.now()}_${Math.floor(Math.random()*1000)}.mp3`;
    const tempPath = path.join(__dirname, 'recordings', tempFileName);

    try {
        // Pure neural voice without artificial pitch wrapping (which caused the 'blurred' sound)
        const tts = new EdgeTTS({ voice }); 
        await tts.ttsPromise(text, tempPath);
        res.sendFile(tempPath);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==================== PROXY (for split-screen iframe) ====================
app.get('/api/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL required');
    try {
        const data = await httpGet(url);
        // Inject base tag so relative URLs work
        const baseUrl = new URL(url);
        const base = `<base href="${baseUrl.origin}/" target="_self">`;
        const modified = data
            .replace(/<head([^>]*)>/i, `<head$1>${base}`)
            .replace(/Content-Security-Policy/gi, 'X-Disabled-CSP');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(modified);
    } catch (e) {
        res.status(500).send(`<html><body style="background:#0a0e1a;color:#ccc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:#00f0ff">⚠️ Cannot load this page</h2><p>${e.message}</p><p style="color:#666">Some sites block embedding. Click ↗ to open in a new tab.</p></div></body></html>`);
    }
});

// ==================== READ PAGE DOM (web scraping) ====================
app.post('/api/read-page', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    try {
        const data = await httpGet(url);
        // Extract text content from HTML
        const title = (data.match(/<title[^>]*>(.*?)<\/title>/i) || ['', 'Untitled'])[1];
        // Remove scripts, styles, and HTML tags
        let text = data
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[\s\S]*?<\/header>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#\d+;/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        // Get links
        const links = [];
        const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
        let lm;
        while ((lm = linkRe.exec(data)) !== null && links.length < 20) {
            if (lm[2].trim() && lm[1].startsWith('http')) links.push({ text: lm[2].trim(), url: lm[1] });
        }
        // Get headings
        const headings = [];
        const hRe = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
        let hm;
        while ((hm = hRe.exec(data)) !== null && headings.length < 15) {
            const clean = hm[1].replace(/<[^>]+>/g, '').trim();
            if (clean) headings.push(clean);
        }
        // Get meta description
        const metaDesc = (data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) || ['', ''])[1];
        // Truncate text
        if (text.length > 5000) text = text.substring(0, 5000) + '...';
        res.json({ success: true, title, description: metaDesc, headings, text, links, url, charCount: text.length });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== SCREENSHOT FOR VISION ====================
app.get('/api/screenshot-b64', async (req, res) => {
    try {
        const screenshot = require('screenshot-desktop');
        const imgBuffer = await screenshot({ format: 'png' });
        res.json({ success: true, base64: imgBuffer.toString('base64') });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==================== MEDIA CONTROLS ====================
app.post('/api/media-action', (req, res) => {
    const { action } = req.body;
    let code = '';
    // Virtual-Key codes for media
    if (action === 'play-pause') code = '0xB3';
    else if (action === 'next-track') code = '0xB0';
    else if (action === 'prev-track') code = '0xB1';
    else if (action === 'volume-up') code = '0xAF';
    else if (action === 'volume-down') code = '0xAE';
    else if (action === 'volume-mute') code = '0xAD';

    if (!code) return res.status(400).json({ error: 'Invalid action' });

    const script = `
        Add-Type -AssemblyName System.Windows.Forms
        $code = ${code}
        $signature = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo);'
        $type = Add-Type -MemberDefinition $signature -Name "Keyboard" -Namespace "Win32" -PassThru
        $type::keybd_event($code, 0, 0, 0)
        $type::keybd_event($code, 0, 2, 0)
    `;

    exec(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`, (err) => {
        res.json({ success: !err, error: err ? err.message : null });
    });
});

// ==================== WIFI DIAGNOSTICS ====================
app.get('/api/wifi', (req, res) => {
    // Get current connected Wi-Fi profile and its plaintext password!
    const script = `
        $adapters = Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' -and $_.MediaType -eq '802.3' -or $_.Name -match 'Wi-Fi' }
        $currentWlan = netsh wlan show interfaces | Select-String -Pattern " SSID"
        if ($currentWlan) {
            $ssid = ($currentWlan.ToString().Split(":")[-1]).Trim()
            $passwordStr = (netsh wlan show profile name="$ssid" key=clear | Select-String "Key Content")
            $password = if ($passwordStr) { ($passwordStr.ToString().Split(":")[-1]).Trim() } else { "No password saved / Admin req" }
            $signal = (netsh wlan show interfaces | Select-String -Pattern " Signal").ToString().Split(":")[-1].Trim()
            Write-Output "{\\"ssid\\":\\"$ssid\\", \\"pwd\\":\\"$password\\", \\"signal\\":\\"$signal\\"}"
        } else {
            Write-Output "{\\"error\\": \\"Not connected to Wi-Fi\\"}"
        }
    `;
    
    exec(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`, (err, stdout) => {
        try { res.json(JSON.parse(stdout)); } catch (e) { res.json({ error: 'Failed to retrieve Wi-Fi info' }); }
    });
});

// ==================== CLIPBOARD ====================
app.get('/api/clipboard', (req, res) => {
    exec(`powershell -NoProfile -Command "Get-Clipboard"`, (err, stdout) => {
        res.json({ success: !err, text: stdout ? stdout.trim() : '' });
    });
});

// ==================== KEYBOARD AUTOMATION (Upgraded with PyAutoGUI) ====================
app.post('/api/type', async (req, res) => {
    let { text, key } = req.body;
    try {
        if (text) {
            const r = await runPy('type', { text });
            res.json(r);
        } else if (key) {
            // Map common keys if needed
            const r = await runPy('press', { key: key.replace(/[{}]/g, '').toLowerCase() });
            res.json(r);
        }
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== WHATSAPP AUTOMATION (Selenium) ====================
app.get('/api/wa-init', async (req, res) => {
    try {
        const r = await runPy('init_whatsapp');
        res.json(r);
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', server: 'GEN Local Server', version: '1.0.0', features: 50 });
});

// ==================== HELPER ====================
function httpGet(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        lib.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// ==================== GLOBAL NEWS RSS PROXY ====================
app.get('/api/news', async (req, res) => {
    try {
        const fetch = require('node-fetch'); // ensuring fetch is available
        const response = await fetch('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
        const xml = await response.text();
        
        const items = [];
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/gi;
        let match;
        while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
            items.push({
                title: match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&apos;/g, "'").replace(/&quot;/g, '"'),
                link: match[2],
                pubDate: match[3]
            });
        }
        res.json({ success: true, news: items });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ==================== REAL CYBER THREATS (URLHaus) ====================
app.get('/api/cyber', async (req, res) => {
    try {
        const fetch = require('node-fetch');
        const response = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/');
        const data = await response.json();
        
        const threats = [];
        if (data.urls) {
            for (let i = 0; i < 15; i++) {
                if (data.urls[i]) {
                    threats.push({
                        url: data.urls[i].url.substring(0, 50),
                        threat: data.urls[i].threat,
                        tags: data.urls[i].tags ? data.urls[i].tags.join(', ') : 'unknown'
                    });
                }
            }
        }
        res.json({ success: true, threats });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ==================== NEURAL TTS (JARVIS VOICE) ====================
const edgeTTS = require('node-edge-tts');

app.get('/api/tts', async (req, res) => {
    const { text, voice } = req.query;
    if (!text) return res.status(400).send('Text required');
    
    try {
        // Dynamic Prosody: adjust pitch/rate based on emotional signals
        let pitch = '-5Hz';
        let rate = '+5%';
        if (text.includes('!')) { pitch = '+2Hz'; rate = '+10%'; } // Excited
        else if (text.includes('...')) { pitch = '-8Hz'; rate = '-10%'; } // Thinking/Pensive
        else if (text.length > 150) { rate = '+15%'; } // Speed up for long reports

        const tts = new edgeTTS({
            voice: voice || 'en-GB-RyanNeural',
            lang: 'en-GB',
            pitch,
            rate,
            volume: '+0%'
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Transfer-Encoding', 'chunked');

        const stream = tts.toStream(text);
        stream.pipe(res);
        
        stream.on('error', (err) => {
            console.error('TTS Stream Error:', err);
            if (!res.headersSent) res.status(500).send('Edge TTS Failed');
        });
    } catch (err) {
        console.error('Edge TTS Error:', err);
        if (!res.headersSent) res.status(500).send(err.message);
    }
});

// ==================== NOTIFICATIONS ====================
let lastNotifId = '';
app.get('/api/notifications', (req, res) => {
    // Get recent toast notifications from Windows
    const script = `
        Add-Type -AssemblyName System.Windows.Forms
        $n = Get-ChildItem -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\PushNotifications\\AppDB" -ErrorAction SilentlyContinue
        # Note: True notification interception on Windows requires UWP/WinRT APIs. 
        # Fallback: We look for specific app windows or use a simpler PowerShell hook if available.
        # For full "sender & message" reading, we query the Notification Center if possible.
        Add-Type -TypeDefinition "
            using System;
            using System.Runtime.InteropServices;
            public class User32 {
                [DllImport(\\"user32.dll\\")]
                public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
                public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
                [DllImport(\\"user32.dll\\", SetLastError = true, CharSet = CharSet.Auto)]
                public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
            }
        "
        # We look for common messaging app titles
        $titles = New-Object System.Collections.Generic.List[string]
        [User32]::EnumWindows({
            param($curr_hWnd, $lParam)
            $sb = New-Object System.Text.StringBuilder 256
            [User32]::GetWindowText($curr_hWnd, $sb, $sb.Capacity) | Out-Null
            if ($sb.ToString()) { $titles.Add($sb.ToString()) }
            return $true
        }, [IntPtr]::Zero) | Out-Null
        
        $msgApps = $titles | Where-Object { $_ -match 'WhatsApp|Telegram|Messenger|Discord' }
        $json = @()
        foreach ($app in $msgApps) {
            # Parse title: "WhatsApp - Message from John" or similar
            if ($app -match '(.+?) - (.+)') {
                $json += [PSCustomObject]@{ app = $app; sender = $matches[2]; content = "Incoming message detected from $app"; id = $app }
            } else {
                $json += [PSCustomObject]@{ app = $app; sender = "Unknown"; content = "Pending activity"; id = $app }
            }
        }
        $json | ConvertTo-Json
    `;
    
    exec(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`, (err, stdout) => {
        try {
            const list = JSON.parse(stdout);
            res.json({ success: true, notifications: Array.isArray(list) ? list : (list ? [list] : []) });
        } catch (e) {
            res.json({ success: true, notifications: [] });
        }
    });
});

// ==================== START ====================
app.listen(PORT, () => {
    console.log('');
    console.log('  ┌──────────────────────────────────────────────┐');
    console.log('  │                                              │');
    console.log('  │   ◆  GEN AI Assistant — Server Online        │');
    console.log('  │                                              │');
    console.log(`  │   URL:      http://localhost:${PORT}              │`);
    console.log('  │   Features: 50+ commands                     │');
    console.log('  │   Status:   Ready                            │');
    console.log('  │                                              │');
    console.log('  │   Press Ctrl+C to stop                       │');
    console.log('  │                                              │');
    console.log('  └──────────────────────────────────────────────┘');
    console.log('');
});
