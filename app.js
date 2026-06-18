document.addEventListener("DOMContentLoaded", () => {

    const startBtn    = document.getElementById("startBtn");
    const output      = document.getElementById("output");
    const mainTitle   = document.getElementById("mainTitle");
    const terminalApp = document.getElementById("terminalApp");
    const canvas      = document.getElementById("matrix");
    const mobileInput = document.getElementById("mobileInput");
    const scanline    = document.getElementById("scanline");

    if (!startBtn || !output || !mainTitle || !terminalApp || !canvas || !mobileInput) {
        console.error("DOM Error: One or more required elements are missing.");
        return;
    }

    const ctx = canvas.getContext("2d");

    // =========================================================================
    // KEYBOARD HEIGHT FIX — shrink terminal when on-screen keyboard appears
    // Uses visualViewport API (supported on all modern mobile browsers)
    // =========================================================================
    function updateAppHeight() {
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty("--app-height", `${vh}px`);
    }
    updateAppHeight();
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateAppHeight);
        window.visualViewport.addEventListener("scroll", updateAppHeight);
    }
    window.addEventListener("resize", updateAppHeight);

    // =========================================================================
    // MATRIX RAIN
    // =========================================================================
    const letters  = "01011001KERNEL_FAIL_OVERRIDE_SECURE_";
    const fontSize = 14;
    let columns, drops, matrixSpeed = 1, matrixBrightness = 0.2;

    function resizeCanvas() {
        canvas.height = window.innerHeight;
        canvas.width  = window.innerWidth;
        columns = Math.floor(canvas.width / fontSize);
        drops   = Array.from({ length: columns }, () => 1);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function drawMatrix() {
        ctx.fillStyle = `rgba(5, 10, 5, ${0.06 + 0.04 * matrixSpeed})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `rgba(0, 255, 65, ${matrixBrightness})`;
        ctx.font = fontSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i] += matrixSpeed;
        }
    }
    setInterval(drawMatrix, 35);

    function matrixSurge(duration = 600) {
        matrixSpeed = 3; matrixBrightness = 0.55;
        setTimeout(() => { matrixSpeed = 1; matrixBrightness = 0.2; }, duration);
    }
    function matrixSlowFade() {
        const step = () => {
            if (matrixBrightness > 0.02) {
                matrixBrightness -= 0.005;
                matrixSpeed = Math.max(0.1, matrixSpeed - 0.02);
                setTimeout(step, 80);
            }
        };
        step();
    }

    // =========================================================================
    // APP STATE
    // =========================================================================
    let appState         = "idle";
    let isProcessing     = false;
    let inputText        = "";
    let activePromptLine = null;
    let questionIndex    = 0;
    let score            = 0;
    let hintCount        = 0;
    let filesViewed      = { cinematic: false, goofy: false, intel: false };
    let wrongAttempts    = 0;

    // =========================================================================
    // CONTENT
    // =========================================================================
    const questions = [
        {
            q: "SYS_VAL // Identity Protocol -> I am the absence of light, and the secret hue we both love most.",
            a: "black",
            hints: [
                "Hint 1: It's a dark  hehehe",
                "Hint 2: It matches everything and looks incredibly elegant on you.",
                "Hint 3: It's the ultimate dark tone: B _ _ C K."
            ]
        },
        {
            q: "SYS_VAL // Acoustic Audio Signature -> We speak without voices, sharing a melody that hides in our history and lives in our headphones. What song am I?",
            a: "if the world was ending",
            hints: [
                "Hint 1: It's a song about staying together",
                "Hint 2: JP Saxe and Julia Michaels sing it.",
                "Hint 3: Lyrics go: 'you'd come over, right?'"
            ]
        },
        {
            q: "SYS_VAL // Registry Handshake -> Our favorite thing to talk about",
            a: "poop",
            hints: [
                "Hint 1: nope you should know this.",
                "Hint 2: fine.. toilet ",
                "Hint 3: human waste duhh"
            ]
        }
    ];

    const letterParagraphs = [
        "Princess,",
        "From miles apart to sitting right here in this mainframe, every moment spent talking to you outshines the distance between us.",
        "This project, our running jokes, the shared anthems — they are a testament to exactly what we are building together.",
        "Distance is just a temporary thing. You are my absolute favourite.",
        "I love you, all the way from my side of the world to yours. Forever. ❤️"
    ];

    // =========================================================================
    // AUDIO ENGINE
    // =========================================================================
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function resumeAudio() {
        if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function startDrone() {}
    function stopDrone() {}

    function playRadarPing() {
        resumeAudio();
        const now = audioCtx.currentTime;
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.5);
    }

    function playBassThud() {
        resumeAudio();
        const now = audioCtx.currentTime;
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.4);
    }

    function playDecryptTick() {
        resumeAudio();
        const now = audioCtx.currentTime;
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(200 + Math.random() * 600, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.05);
    }

    function playHeartbeat() {
        resumeAudio();
        const now = audioCtx.currentTime;
        [0, 0.28].forEach(offset => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(65, now + offset);
            osc.frequency.exponentialRampToValueAtTime(28, now + offset + 0.2);
            gain.gain.setValueAtTime(0.28, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + offset); osc.stop(now + offset + 0.28);
        });
    }

    function playStringSwell(volume = 0.055, duration = 4) {
        resumeAudio();
        const now = audioCtx.currentTime;
        const chordFreqs = [130.81, 155.56, 196.00, 261.63, 311.13];
        chordFreqs.forEach((f, i) => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const vib  = audioCtx.createOscillator();
            const vibG = audioCtx.createGain();
            vib.frequency.setValueAtTime(5, now);
            vibG.gain.setValueAtTime(1.5, now);
            vib.connect(vibG); vibG.connect(osc.frequency);
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume - i * 0.005, now + 0.8);
            gain.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.connect(gain); gain.connect(audioCtx.destination);
            vib.start(now); osc.start(now);
            vib.stop(now + duration); osc.stop(now + duration);
        });
    }

    function playConnectionChord() {
        resumeAudio();
        const now = audioCtx.currentTime;
        const arp = [261.63, 329.63, 392.00, 523.25];
        arp.forEach((f, i) => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, now + i * 0.08);
            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.07, now + i * 0.08 + 0.05);
            gain.gain.linearRampToValueAtTime(0.04, now + 1.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + i * 0.08); osc.stop(now + 4.1);
        });
    }

    function playStaticBurst(duration = 0.4) {
        resumeAudio();
        const now    = audioCtx.currentTime;
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
        const data   = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
        const source = audioCtx.createBufferSource();
        const gain   = audioCtx.createGain();
        source.buffer = buffer;
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        source.connect(gain); gain.connect(audioCtx.destination);
        source.start(now);
    }

    function playMarioVictory() {
        resumeAudio();
        const now = audioCtx.currentTime;
        const notes = [
            { f: 659, t: 0,    dur: 0.12 },
            { f: 659, t: 0.14, dur: 0.12 },
            { f: 659, t: 0.28, dur: 0.12 },
            { f: 523, t: 0.42, dur: 0.12 },
            { f: 659, t: 0.56, dur: 0.12 },
            { f: 784, t: 0.70, dur: 0.25 },
            { f: 392, t: 1.00, dur: 0.25 },
        ];
        notes.forEach(({ f, t, dur }) => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(f, now + t);
            gain.gain.setValueAtTime(0.09, now + t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + t); osc.stop(now + t + dur + 0.05);
        });
    }

    let ambientNodes = [];

    function startAmbientMusic() {
        resumeAudio();
        const now = audioCtx.currentTime;
        [55.00, 43.65, 48.99, 41.20].forEach((f, i) => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            const t = i * 7;
            osc.frequency.setValueAtTime(f, now + t);
            gain.gain.setValueAtTime(0, now + t);
            gain.gain.linearRampToValueAtTime(0.055, now + t + 2.5);
            gain.gain.linearRampToValueAtTime(0.035, now + t + 5.5);
            gain.gain.linearRampToValueAtTime(0, now + t + 7);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + t); osc.stop(now + t + 7.5);
            ambientNodes.push({ osc, gain });
        });
        const chords = [
            [220.00, 261.63, 329.63, 440.00],
            [174.61, 220.00, 261.63, 349.23],
            [261.63, 329.63, 392.00, 523.25],
            [196.00, 246.94, 293.66, 392.00],
        ];
        chords.forEach((freqs, ci) => {
            freqs.forEach((f, fi) => {
                const osc  = audioCtx.createOscillator();
                const lfo  = audioCtx.createOscillator();
                const lfoG = audioCtx.createGain();
                const gain = audioCtx.createGain();
                const t    = ci * 7;
                osc.type = "triangle";
                osc.frequency.setValueAtTime(f, now + t);
                lfo.frequency.setValueAtTime(0.12 + fi * 0.02, now + t);
                lfoG.gain.setValueAtTime(0.016, now + t);
                lfo.connect(lfoG); lfoG.connect(gain.gain);
                gain.gain.setValueAtTime(0, now + t);
                gain.gain.linearRampToValueAtTime(0.032 - fi * 0.004, now + t + 1.5);
                gain.gain.linearRampToValueAtTime(0.022, now + t + 5);
                gain.gain.linearRampToValueAtTime(0, now + t + 7);
                osc.connect(gain); gain.connect(audioCtx.destination);
                lfo.start(now + t); osc.start(now + t);
                lfo.stop(now + t + 7.5); osc.stop(now + t + 7.5);
                ambientNodes.push({ osc, gain, lfo });
            });
        });
        const melody = [
            { f: 440.00, t: 1.0,  dur: 2.8 },
            { f: 329.63, t: 4.2,  dur: 2.5 },
            { f: 293.66, t: 7.5,  dur: 3.0 },
            { f: 261.63, t: 11.2, dur: 2.8 },
            { f: 246.94, t: 14.5, dur: 3.2 },
            { f: 220.00, t: 18.2, dur: 4.0 },
            { f: 196.00, t: 22.8, dur: 3.5 },
            { f: 220.00, t: 26.8, dur: 6.0 },
        ];
        melody.forEach(({ f, t, dur }) => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const vib  = audioCtx.createOscillator();
            const vibG = audioCtx.createGain();
            vib.frequency.setValueAtTime(4.8, now + t);
            vibG.gain.setValueAtTime(2.2, now + t);
            vib.connect(vibG); vibG.connect(osc.frequency);
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, now + t);
            gain.gain.setValueAtTime(0, now + t);
            gain.gain.linearRampToValueAtTime(0.052, now + t + 0.7);
            gain.gain.linearRampToValueAtTime(0.035, now + t + dur * 0.65);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
            osc.connect(gain); gain.connect(audioCtx.destination);
            vib.start(now + t); osc.start(now + t);
            vib.stop(now + t + dur); osc.stop(now + t + dur + 0.1);
            ambientNodes.push({ osc, gain, vib });
        });
    }

    function startEndingMusic() {
        resumeAudio();
        const now = audioCtx.currentTime;
        const droneOsc  = audioCtx.createOscillator();
        const droneGain = audioCtx.createGain();
        droneOsc.type = "sine";
        droneOsc.frequency.setValueAtTime(65.41, now);
        droneGain.gain.setValueAtTime(0, now);
        droneGain.gain.linearRampToValueAtTime(0.06, now + 4);
        droneGain.gain.linearRampToValueAtTime(0.04, now + 20);
        droneGain.gain.linearRampToValueAtTime(0, now + 35);
        droneOsc.connect(droneGain); droneGain.connect(audioCtx.destination);
        droneOsc.start(now); droneOsc.stop(now + 36);
        ambientNodes.push({ osc: droneOsc, gain: droneGain });
        const sparseNotes = [
            { f: 523.25, t: 3.0,  dur: 5.0 },
            { f: 659.25, t: 9.5,  dur: 4.5 },
            { f: 587.33, t: 15.0, dur: 6.0 },
            { f: 523.25, t: 22.5, dur: 4.0 },
            { f: 392.00, t: 28.0, dur: 8.0 },
        ];
        sparseNotes.forEach(({ f, t, dur }) => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, now + t);
            gain.gain.setValueAtTime(0, now + t);
            gain.gain.linearRampToValueAtTime(0.038, now + t + 1.2);
            gain.gain.linearRampToValueAtTime(0.02,  now + t + dur * 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + t); osc.stop(now + t + dur + 0.2);
            ambientNodes.push({ osc, gain });
        });
        [[130.81, 196.00], [123.47, 185.00]].forEach(([f1, f2], ci) => {
            [f1, f2].forEach(f => {
                const osc  = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const t    = ci * 18;
                osc.type = "triangle";
                osc.frequency.setValueAtTime(f, now + t);
                gain.gain.setValueAtTime(0, now + t);
                gain.gain.linearRampToValueAtTime(0.025, now + t + 5);
                gain.gain.linearRampToValueAtTime(0.015, now + t + 14);
                gain.gain.linearRampToValueAtTime(0, now + t + 18);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(now + t); osc.stop(now + t + 19);
                ambientNodes.push({ osc, gain });
            });
        });
    }

    function stopAmbientMusic(fadeDuration = 2) {
        const now = audioCtx.currentTime;
        ambientNodes.forEach(({ osc, gain, lfo }) => {
            try {
                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);
                gain.gain.linearRampToValueAtTime(0, now + fadeDuration);
                setTimeout(() => {
                    try { osc.stop(); } catch(e) {}
                    try { if (lfo) lfo.stop(); } catch(e) {}
                }, (fadeDuration + 0.1) * 1000);
            } catch(e) {}
        });
        ambientNodes = [];
    }

    // -- LEVEL UP FLOURISH --
    function playLevelUp() {
        resumeAudio();
        const now = audioCtx.currentTime;
        [[880, 0], [1174.66, 0.1]].forEach(([f, t]) => {
            const osc  = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, now + t);
            gain.gain.setValueAtTime(0.07, now + t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.18);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + t); osc.stop(now + t + 0.2);
        });
    }

    // -- DATA STREAM TICK --
    function playDataTick() {
        resumeAudio();
        const now = audioCtx.currentTime;
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440 + Math.random() * 120, now);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.05);
    }

    let starCanvas = null, starCtx = null, starAnimId = null, stars = [];

    function startStarfield() {
        if (starCanvas) return;
        starCanvas = document.createElement("canvas");
        starCanvas.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;opacity:0;transition:opacity 3s ease;`;
        starCanvas.width = window.innerWidth; starCanvas.height = window.innerHeight;
        document.body.appendChild(starCanvas);
        starCtx = starCanvas.getContext("2d");
        stars = Array.from({ length: 180 }, () => ({
            x: Math.random() * starCanvas.width, y: Math.random() * starCanvas.height,
            r: Math.random() * 1.4 + 0.3, alpha: 0, maxA: Math.random() * 0.7 + 0.2,
            speed: Math.random() * 0.004 + 0.001, twinkle: Math.random() * Math.PI * 2,
        }));
        function drawStars() {
            starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
            stars.forEach(s => {
                s.twinkle += s.speed; s.alpha = Math.min(s.maxA, s.alpha + 0.003);
                const glow = s.alpha * (0.85 + 0.15 * Math.sin(s.twinkle));
                starCtx.beginPath(); starCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                starCtx.fillStyle = `rgba(255,255,255,${glow})`; starCtx.fill();
            });
            starAnimId = requestAnimationFrame(drawStars);
        }
        drawStars();
        setTimeout(() => { starCanvas.style.opacity = "1"; }, 50);
    }

    function stopStarfield() {
        if (!starCanvas) return;
        starCanvas.style.transition = "opacity 2s ease"; starCanvas.style.opacity = "0";
        setTimeout(() => {
            if (starAnimId) cancelAnimationFrame(starAnimId);
            if (starCanvas) starCanvas.remove();
            starCanvas = null; starCtx = null; starAnimId = null; stars = [];
        }, 2100);
    }

    async function signalReconnectCountdown() {
        clearScreen(); await delay(400);
        const countLabel = document.createElement("p");
        countLabel.style.cssText = `text-align:center;color:#444;font-size:0.75rem;letter-spacing:4px;margin-bottom:24px;opacity:0;transition:opacity 0.8s ease;`;
        countLabel.innerHTML = "RECONNECTING SIGNAL...";
        output.appendChild(countLabel); await delay(60); countLabel.style.opacity = "1"; await delay(800);
        for (let i = 3; i >= 1; i--) {
            const num = document.createElement("p");
            num.style.cssText = `text-align:center;font-size:3rem;font-weight:bold;color:#00ff41;opacity:0;text-shadow:0 0 20px rgba(0,255,65,0.8);transition:opacity 0.3s ease;margin:0;`;
            num.innerHTML = i; output.appendChild(num); output.scrollTop = output.scrollHeight;
            await delay(40); num.style.opacity = "1"; playRadarPing();
            await delay(500); num.style.opacity = "0"; await delay(500);
        }
        const flash = document.createElement("p");
        flash.style.cssText = `text-align:center;font-size:1rem;letter-spacing:6px;color:#ffffff;opacity:0;text-shadow:0 0 30px rgba(255,255,255,0.9);transition:opacity 0.2s ease;margin:0;`;
        flash.innerHTML = "SIGNAL RESTORED"; output.appendChild(flash);
        await delay(40); flash.style.opacity = "1"; playBassThud();
        await delay(600); flash.style.opacity = "0"; await delay(600); clearScreen();
    }

    function playSystemSound(type) {
        resumeAudio();
        const now = audioCtx.currentTime;
        const makeOsc = (wave) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = wave; o.connect(g); g.connect(audioCtx.destination); return { o, g };
        };
        if (type === "click") {
            const pitches = [790, 800, 810];
            const pitch = pitches[Math.floor(Math.random() * pitches.length)];
            const { o, g } = makeOsc("sine");
            o.frequency.setValueAtTime(pitch, now); g.gain.setValueAtTime(0.04, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.05); o.start(now); o.stop(now + 0.05);
        }
        else if (type === "scan") { playRadarPing(); }
        else if (type === "success") {
            const { o, g } = makeOsc("sine");
            o.frequency.setValueAtTime(523.25, now); o.frequency.setValueAtTime(659.25, now + 0.08);
            o.frequency.setValueAtTime(783.99, now + 0.16); g.gain.setValueAtTime(0.06, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.4); o.start(now); o.stop(now + 0.4);
        }
        else if (type === "error") {
            const { o, g } = makeOsc("sine");
            o.frequency.setValueAtTime(440, now); o.frequency.linearRampToValueAtTime(140, now + 0.1);
            g.gain.setValueAtTime(0.14, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            o.start(now); o.stop(now + 0.35);
        }
        else if (type === "access_granted") {
            playBassThud();
            setTimeout(() => {
                const { o, g } = makeOsc("triangle");
                o.frequency.setValueAtTime(587.33, now + 0.1); o.frequency.setValueAtTime(880.00, now + 0.22);
                o.frequency.setValueAtTime(1174.66, now + 0.34); g.gain.setValueAtTime(0.09, now + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.9); o.start(now + 0.1); o.stop(now + 1.0);
            }, 80);
        }
        else if (type === "alarm") {
            const { o: o1, g: alarmG } = makeOsc("sawtooth");
            const o2 = audioCtx.createOscillator(); o2.type = "sine"; o2.connect(alarmG);
            for (let i = 0; i < 6; i++) {
                const t = i * 0.4;
                o1.frequency.setValueAtTime(600, now + t); o1.frequency.linearRampToValueAtTime(300, now + t + 0.35);
                o2.frequency.setValueAtTime(580, now + t); o2.frequency.linearRampToValueAtTime(280, now + t + 0.35);
            }
            alarmG.gain.setValueAtTime(0.15, now); alarmG.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
            o1.start(now); o2.start(now); o1.stop(now + 2.5); o2.stop(now + 2.5);
        }
    }

    // =========================================================================
    // VISUAL HELPERS
    // =========================================================================
    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    function triggerScreenShake() {
        terminalApp.classList.add("error-shake");
        setTimeout(() => terminalApp.classList.remove("error-shake"), 400);
    }

    function triggerPowerSurge() {
        matrixSurge(700);
        if (scanline) {
            scanline.style.opacity = "0.55";
            setTimeout(() => { scanline.style.opacity = "1"; }, 280);
        }
    }

    async function darkWipe() {
        const wipe = document.createElement("div");
        wipe.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:99999;opacity:0;transition:opacity 0.25s ease;pointer-events:none;`;
        document.body.appendChild(wipe); await delay(20);
        wipe.style.opacity = "0.7"; await delay(250); wipe.style.opacity = "0"; await delay(300); wipe.remove();
    }

    function addLine(text, isError = false, fadeIn = false) {
        const p = document.createElement("p");
        p.innerHTML = text.replace(/  /g, "&nbsp;&nbsp;");
        if (isError) { p.style.color = "#ff3333"; p.style.textShadow = "0 0 5px #ff3333"; }
        if (fadeIn) { p.style.opacity = "0"; p.style.transition = "opacity 0.4s ease"; }
        output.appendChild(p);
        output.scrollTop = output.scrollHeight;
        if (fadeIn) setTimeout(() => { p.style.opacity = "1"; }, 30);
        return p;
    }

    function glitchText(text) {
        const p = document.createElement("p");
        p.innerHTML = text.replace(/  /g, "&nbsp;&nbsp;");
        p.classList.add("glitch");
        output.appendChild(p);
        output.scrollTop = output.scrollHeight;
    }

    function clearScreen() { output.innerHTML = ""; activePromptLine = null; }

    function createNewPrompt() {
        inputText = "";
        activePromptLine = document.createElement("p");
        activePromptLine.innerHTML = `> <span class="input-text"></span><span class="terminal-cursor">█</span>`;
        output.appendChild(activePromptLine);
        output.scrollTop = output.scrollHeight;
        // Small delay before focus so iOS doesn't fight us
        setTimeout(() => mobileInput.focus(), 50);
    }

    function updatePromptDisplay() {
        if (!activePromptLine) return;
        const span = activePromptLine.querySelector(".input-text");
        if (span) span.innerText = inputText;
    }

    function sealPrompt() {
        if (activePromptLine) {
            const c = activePromptLine.querySelector(".terminal-cursor");
            if (c) c.remove();
        }
    }

    async function typeLine(text, speed = 30, isError = false) {
        const p = document.createElement("p");
        if (isError) { p.style.color = "#ff3333"; p.style.textShadow = "0 0 5px #ff3333"; }
        output.appendChild(p);
        let typed = "";
        for (let i = 0; i < text.length; i++) {
            typed += text[i] === " " ? "&nbsp;" : text[i];
            if (text[i] !== " ") playSystemSound("click");
            p.innerHTML = typed;
            output.scrollTop = output.scrollHeight;
            await delay(speed);
        }
        return p;
    }

    async function loadingBar(prefix = "DECRYPTING") {
        const p = document.createElement("p");
        output.appendChild(p);
        for (let progress = 0; progress <= 100; progress += 5) {
            const filled = Math.floor(progress / 5);
            p.innerHTML = `${prefix} [&nbsp;${"█".repeat(filled)}${"-".repeat(20 - filled)}&nbsp;] ${progress}%`;
            output.scrollTop = output.scrollHeight;
            playDataTick();
            await delay(100);
        }
    }

    // =========================================================================
    // INPUT HANDLING — rebuilt to fix Android/Gboard backwards input
    // =========================================================================

    // Gboard/IME fix: block input events that fire MID-composition.
    // compositionstart = Gboard started autocorrect/word suggestion
    // compositionend   = Gboard finished; NOW the value is correct
    // Without this guard, each autocorrect fires multiple input events
    // with partial/reversed characters.
    let isComposing = false;

    mobileInput.addEventListener("compositionstart", () => {
        isComposing = true;
    });

    mobileInput.addEventListener("compositionend", () => {
        isComposing = false;
        inputText = mobileInput.value;
        updatePromptDisplay();
    });

    mobileInput.addEventListener("input", () => {
        if (isComposing) return; // ignore mid-IME events
        inputText = mobileInput.value;
        updatePromptDisplay();
    });

    mobileInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleEnter();
        }
    });

    // Desktop fallback — only fires when mobileInput is NOT the active element
    document.addEventListener("keydown", (e) => {
        if (document.activeElement === mobileInput) return;
        if (appState === "idle") return;
        if (e.key === "Enter") { e.preventDefault(); handleEnter(); return; }
        if (e.key === "Backspace") {
            e.preventDefault();
            inputText = inputText.slice(0, -1);
            mobileInput.value = inputText;
            lastInputValue = inputText;
            updatePromptDisplay();
            return;
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            playSystemSound("click");
            inputText += e.key;
            mobileInput.value = inputText;
            lastInputValue = inputText;
            updatePromptDisplay();
        }
    });

    function handleEnter() {
        if (isProcessing) return;
        const value = inputText.trim().toLowerCase();
        sealPrompt();
        mobileInput.value = "";
        inputText = "";
        isComposing = false;
        if (appState === "level1")         return handleLevel1(value);
        if (appState === "level2")         return handleLevel2(value);
        if (appState === "twist")          return handleTwist(value);
        if (appState === "level3")         return handleLevel3(value);
        if (appState === "tapToContinue")  return handleTapToContinue(value);
        if (appState === "secretKey")      return handleSecretKey(value);
        if (appState === "secretDownload") return handleSecretDownload(value);
    }

    // Re-focus on tap anywhere — scroll output into view too
    document.addEventListener("click", (e) => {
        if (e.target === startBtn) return;
        if (appState !== "idle") {
            setTimeout(() => {
                mobileInput.focus();
                output.scrollTop = output.scrollHeight;
            }, 50);
        }
    });

    // =========================================================================
    // BOOT
    // =========================================================================
    // ── KEYBOARD HEIGHT FIX ──────────────────────────────────────────────────
    // visualViewport shrinks when the on-screen keyboard opens.
    // We write --app-height so the terminal max-height follows it exactly.
    function updateAppHeight() {
        const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty("--app-height", h + "px");
    }
    updateAppHeight();
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateAppHeight);
    }
    window.addEventListener("resize", updateAppHeight);

    startBtn.addEventListener("click", async () => {
        resumeAudio();
        playSystemSound("click");
        mainTitle.classList.add("hidden");
        terminalApp.classList.add("fullscreen");
        startBtn.style.display = "none";
        setTimeout(() => mobileInput.focus(), 50);
        playRadarPing();
        await bootSequence();
        await startLevel1();
    });

    async function bootSequence() {
        clearScreen();
        await typeLine("PhoenixOS Mainframe Core Initialization...", 40);
        await delay(400);
        await typeLine("[ LOAD ]  Mapping volatile memory matrices...", 25);
        await delay(300);
        await typeLine("[ OK ]  Firewall bypass protocols loaded.", 30);
        await typeLine("[ OK ]  Quantum node communication sockets open.", 25);
        await delay(500);
        await typeLine("");
        await typeLine("WARNING: SECURE MEMORY LOCK DETECTED", 30, true);
        await delay(400);
        await typeLine("Target Node Block:  MIA.secure", 40);
        await delay(500);
        await typeLine("Running decryption bridge link...", 40);
        await delay(1200);
    }

    // =========================================================================
    // LEVEL 1
    // =========================================================================
    async function startLevel1() {
        clearScreen();
        await typeLine("TARGET HOSTNAME:  MIA.secure", 30);
        await typeLine("SECURITY ENCRYPTION PROFILE:  MAXIMUM", 30);
        await typeLine("");
        await typeLine("Input Primary Passkey Token:", 30);
        appState = "level1";
        createNewPrompt();
    }

    function handleLevel1(value) {
        if (value === "mia") {
            wrongAttempts = 0;
            isProcessing = true;
            playSystemSound("success");
            triggerPowerSurge();
            setTimeout(async () => {
                await darkWipe(); clearScreen();
                glitchText("PASSKEY VERIFIED. BYPASSING ARCHIVE SECURITY NETWORKS...");
                await delay(1800); isProcessing = false; startLevel2();
            }, 300);
        } else {
            wrongAttempts++;
            playSystemSound("error");
            triggerScreenShake();
            if (wrongAttempts >= 3) {
                isProcessing = true; appState = "idle";
                addLine("CRITICAL: DATA ACCESS DENIED. INTRUDER ALIGNMENT FAILURE.", true);
                addLine("⚠️  SECURITY BREACH THRESHOLD EXCEEDED. INITIATING LOCKOUT...", true);
                setTimeout(async () => {
                    for (let i = 5; i >= 1; i--) {
                        clearScreen(); playSystemSound("alarm");
                        const p = addLine("", true);
                        p.style.cssText = "color:#ff3333;text-align:center;font-size:1.6rem;font-weight:bold;text-shadow:0 0 14px #ff3333;";
                        p.innerHTML = `SYSTEM LOCKOUT IN ${i}`; await delay(1000);
                    }
                    clearScreen(); glitchText("REBOOTING SECURITY KERNEL...");
                    await delay(1500); location.reload();
                }, 600);
            } else {
                const remaining = 3 - wrongAttempts;
                addLine(`CRITICAL: DATA ACCESS DENIED. INTRUDER ALIGNMENT FAILURE.`, true);
                addLine(`WARNING: ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lockout.`, true);
                createNewPrompt();
            }
        }
    }

    // =========================================================================
    // LEVEL 2
    // =========================================================================
    function startLevel2() {
        clearScreen(); score = 0; questionIndex = 0; hintCount = 0;
        appState = "level2"; displayQuizInterface();
    }

    function generateProgressBar(index, total) {
        const filled = Math.floor((index / total) * 10);
        return `Memory Recovery Progress [${"█".repeat(filled)}${"-".repeat(10 - filled)}] ${Math.floor((index / total) * 100)}%`;
    }

    function displayQuizInterface() {
        clearScreen();
        addLine("[ COGNITIVE RECONSTRUCTION STAGE II ]");
        addLine(generateProgressBar(questionIndex, questions.length));
        addLine("💡 System Bypass Override command: 'hint'");
        addLine("");
        addLine(questions[questionIndex].q);
        createNewPrompt();
    }

    function handleLevel2(value) {
        if (value === "hint") {
            playSystemSound("scan");
            const q = questions[questionIndex];
            if (hintCount < q.hints.length) {
                addLine(`[ LINK COGNITION HINT ] -> ${q.hints[hintCount]}`); hintCount++;
            } else {
                triggerScreenShake();
                addLine("[ LINK FAULT ] -> Memory cell buffers completely dry. No hints left.", true);
            }
            createNewPrompt(); return;
        }
        isProcessing = true;
        if (value === questions[questionIndex].a) {
            score++; playSystemSound("success"); playLevelUp(); triggerPowerSurge();
            addLine("DATA CORRELATION CONFIRMED ✔");
        } else {
            playSystemSound("error"); triggerScreenShake();
            addLine("DATA SECTOR CORRUPTION DETECTED ✘", true);
        }
        questionIndex++; hintCount = 0;
        setTimeout(() => {
            isProcessing = false;
            if (questionIndex >= questions.length) endLevel2(); else displayQuizInterface();
        }, 1200);
    }

    // =========================================================================
    // END LEVEL 2
    // =========================================================================
    async function endLevel2() {
        appState = "idle"; clearScreen();
        if (score >= 2) {
            playRadarPing();
            await typeLine("VERIFYING MEMORY CORES...", 40);
            await loadingBar("RECONSTRUCTING ALLIED SECTORS");
            await delay(800); clearScreen();
            playSystemSound("alarm"); triggerScreenShake();
            glitchText("ERROR"); glitchText("ERROR"); glitchText("ERROR");
            addLine("MEMORY CORRUPTION DETECTED // SECTOR CRITICAL", true);
            await delay(2500); clearScreen();
            await typeLine("...", 80); await delay(1000);
            await typeLine("Reattempting recovery...", 50); await delay(800);
            await typeLine("Searching alternate archive paths...", 40); await delay(1200);
            playSystemSound("success"); triggerPowerSurge();
            addLine("Archive discovered successfully:");
            await typeLine(" -> MIA_HEART_BACKUP.secure", 30); await delay(1500);
            clearScreen(); playSystemSound("scan");
            addLine("MEMORY RECOVERY COMPLETE // SECURE ARCHIVE DETACHED");
            addLine("==================================================");
            await typeLine("Analyzing user footprint profile...", 40); await delay(1000);
            await typeLine("Question: Do you know how much I love you?", 45);
            appState = "twist"; createNewPrompt();
        } else {
            playSystemSound("error"); triggerScreenShake();
            addLine(`INTEGRITY COGNITION THRESHOLD DROPPED BELOW MINIMUM [${score}/${questions.length}].`, true);
            await typeLine("Initiating automated server blackout...", 45, true);
            setTimeout(() => location.reload(), 2000);
        }
    }

    function handleTwist(value) {
        isProcessing = true; playSystemSound("error"); triggerScreenShake();
        addLine("INCORRECT", true);
        setTimeout(async () => {
            addLine(""); playSystemSound("access_granted"); triggerPowerSurge();
            await typeLine("Correct answer:", 40);
            await typeLine("More than words can explain hehehe 😊", 55);
            await delay(2500); isProcessing = false; await darkWipe(); startLevel3();
        }, 1500);
    }

    // =========================================================================
    // LEVEL 3
    // =========================================================================
    async function startLevel3() {
        clearScreen(); playRadarPing(); await delay(400);
        await typeLine("[ LEVEL 3: ROOT DATABASE EXTENSION ]", 40);
        await typeLine("System status: Directory mapping complete. 3 decrypted assets found:", 30);
        await delay(200);
        addLine("&nbsp;&nbsp;📄 top_secret_intel.txt", false, true); await delay(150);
        addLine("&nbsp;&nbsp;🖼️  my_goofy_face.png", false, true); await delay(150);
        addLine("&nbsp;&nbsp;🎬 cinematic_sequence.exe", false, true); await delay(400);
        await typeLine(""); await typeLine("Command formula: 'open [filename]'", 40);
        appState = "level3"; createNewPrompt();
    }

    async function redrawLevel3Menu() {
        clearScreen();
        const files = [
            { name: "📄 top_secret_intel.txt", key: "intel" },
            { name: "🖼️  my_goofy_face.png",   key: "goofy" },
            { name: "🎬 cinematic_sequence.exe", key: "cinematic" },
        ];
        addLine("[ ROOT DATABASE — SELECT FILE ]"); addLine("");
        const unviewed = files.filter(f => !filesViewed[f.key]);
        const viewed   = files.filter(f =>  filesViewed[f.key]);
        if (unviewed.length) { addLine("Remaining:"); unviewed.forEach(f => addLine("&nbsp;&nbsp;" + f.name)); }
        if (viewed.length)   { addLine(""); addLine("Opened:"); viewed.forEach(f => addLine("&nbsp;&nbsp;" + f.name + " <span style='color:#555'>✔</span>")); }
        addLine(""); addLine("'open [filename]'");
        appState = "level3"; createNewPrompt();
    }

    async function handleLevel3(value) {
        if (value === "open top_secret_intel.txt") {
            isProcessing = true; playSystemSound("success"); addLine("");
            await typeLine("Locating user...", 45); await delay(500);
            addLine("<span style='color:#00ff41'>[📍] Pakistan</span>"); await delay(800);
            await typeLine("Locating target...", 45); await delay(400);
            await typeLine("Scanning nodes...", 35); await delay(300);
            await typeLine("Triangulating signal...", 35); await delay(600);
            triggerPowerSurge(); playSystemSound("access_granted");
            addLine("<span style='color:#00ff41; font-weight:bold'>✅ TARGET FOUND — [📍] South Africa</span>");
            await delay(800);
            await typeLine("Calculating baseline vector metrics...", 30); await delay(600);
            addLine("<span style='color:#f0a500'>Distance: ~8,400 km</span>"); await delay(1200);
            addLine("<span style='color:#00ff41; font-weight:bold'>Connection strength: ∞</span>");
            await delay(1500);
            addLine("--------------------------------------------------");
            addLine("<span style='color:#f0a500'>Name: Mia</span>");
            addLine("<span style='color:#00d4ff'>Status: Home</span>");
            addLine("--------------------------------------------------");
            filesViewed.intel = true;
            if (!checkAllFilesViewed()) { await delay(1200); await redrawLevel3Menu(); }
            isProcessing = false;
        }
        else if (value === "open my_goofy_face.png") {
            isProcessing = true; playRadarPing();
            addLine("[ CLASSIFIED ASSET ] Initiating decryption protocol...", false, true);
            await delay(600);
            await openClassifiedVault("my_goofy_face.png", async () => {
                filesViewed.goofy = true;
                if (!checkAllFilesViewed()) await redrawLevel3Menu();
                isProcessing = false;
            });
        }
        else if (value === "open cinematic_sequence.exe") {
            isProcessing = true; appState = "idle";
            playSystemSound("success"); triggerPowerSurge();
            await startCinematicSequence();
            filesViewed.cinematic = true; isProcessing = false;
            if (!checkAllFilesViewed()) await redrawLevel3Menu();
        }
        else {
            playSystemSound("error"); triggerScreenShake();
            addLine("UNRECOGNIZED ENCRYPTION OBJECT PATHWAY.", true);
            await delay(900); await redrawLevel3Menu();
        }
    }

    function checkAllFilesViewed() {
        if (!filesViewed.intel || !filesViewed.goofy || !filesViewed.cinematic) return false;
        setTimeout(async () => {
            appState = "idle"; clearScreen(); playMarioVictory(); matrixSurge(1400);
            await delay(300);
            addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", false, true); await delay(100);
            addLine("✅  ALL ASSETS DECRYPTED SUCCESSFULLY", false, true); await delay(100);
            addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", false, true);
            addLine(""); await delay(700);
            addLine("One final transmission remains in the archive...", false, true);
            await delay(1200); addLine("");
            const tapLine = document.createElement("p");
            tapLine.innerHTML = "[ TAP TO CONTINUE ]";
            tapLine.style.cssText = `text-align:center;letter-spacing:4px;font-weight:bold;font-size:1.1rem;cursor:pointer;margin-top:16px;color:#00ff41;animation:tapPulse 1.2s ease-in-out infinite;text-shadow:0 0 14px rgba(0,255,65,0.8);`;
            output.appendChild(tapLine); output.scrollTop = output.scrollHeight;
            tapLine.addEventListener("click", () => { if (appState === "tapToContinue") handleTapToContinue(""); });
            appState = "tapToContinue"; createNewPrompt();
        }, 800);
        return true;
    }

    function handleTapToContinue(value) {
        isProcessing = true; appState = "idle";
        setTimeout(async () => { isProcessing = false; await darkWipe(); await showStoryLetter(); }, 200);
    }

    // =========================================================================
    // STORY LETTER
    // =========================================================================
    async function showStoryLetter() {
        terminalApp.style.transition = "opacity 1.2s ease";
        canvas.style.transition      = "opacity 1.2s ease";
        terminalApp.style.opacity    = "0";
        canvas.style.opacity         = "0";
        await delay(1200);
        const letterScreen  = document.getElementById("loveLetterScreen");
        const letterContent = document.getElementById("letterContent");
        letterContent.innerHTML = "";
        letterScreen.style.display = "flex"; letterScreen.style.opacity = "1";
        startAmbientMusic();
        for (let i = 0; i < letterParagraphs.length; i++) {
            const p = document.createElement("p");
            p.style.cssText = `color:#ffffff;margin:0 0 15px 0;opacity:0;transform:translateY(10px);transition:opacity 0.6s ease,transform 0.6s ease;`;
            letterContent.appendChild(p); await delay(60);
            p.style.opacity = "1"; p.style.transform = "translateY(0)";
            let typed = "";
            for (let j = 0; j < letterParagraphs[i].length; j++) {
                const ch = letterParagraphs[i][j];
                typed += ch === " " ? "&nbsp;" : ch;
                if (ch !== " ") playSystemSound("click");
                p.innerHTML = typed; await delay(48);
            }
            await delay(900);
        }
        await delay(1500); playConnectionChord();
        const finalLine = document.createElement("p");
        finalLine.style.cssText = `color:#00ff41;text-align:center;font-weight:bold;margin-top:30px;font-size:1.2rem;text-shadow:0 0 14px rgba(0,255,65,0.9);opacity:0;transition:opacity 0.8s ease;`;
        letterContent.appendChild(finalLine); await delay(60); finalLine.style.opacity = "1";
        let typedFinal = "";
        for (let k = 0; k < "CONNECTION ESTABLISHED ❤️".length; k++) {
            const ch = "CONNECTION ESTABLISHED ❤️"[k];
            typedFinal += ch === " " ? "&nbsp;" : ch;
            if (ch !== " ") playSystemSound("click");
            finalLine.innerHTML = typedFinal; await delay(65);
        }
        await delay(2000);
        const hbInterval = setInterval(playHeartbeat, 950);
        const secretLine = document.createElement("p");
        secretLine.style.cssText = `color:#ff9900;text-align:center;font-size:1.1rem;font-weight:bold;letter-spacing:3px;text-shadow:0 0 16px rgba(255,153,0,0.85);margin-top:48px;opacity:0;transform:scale(0.92);transition:opacity 1s ease,transform 1s ease;animation:orangePulse 1.8s ease-in-out infinite;`;
        secretLine.innerHTML = "📜 &nbsp; A secret letter remains...";
        letterContent.appendChild(secretLine); await delay(60);
        secretLine.style.opacity = "1"; secretLine.style.transform = "scale(1)";
        await delay(5000); clearInterval(hbInterval);
        secretLine.style.opacity = "0"; secretLine.style.transform = "scale(0.92)"; await delay(900);
        stopAmbientMusic(2);
        letterScreen.style.transition = "opacity 1.2s ease"; letterScreen.style.opacity = "0";
        await delay(1200); letterScreen.style.display = "none";
        terminalApp.style.opacity = "1"; canvas.style.opacity = "1";
        await darkWipe(); await beginSecretKeyPrompt();
    }

    // =========================================================================
    // SECRET KEY PROMPT
    // =========================================================================
    async function beginSecretKeyPrompt() {
        clearScreen(); playRadarPing();
        await typeLine("[ CLASSIFIED ARCHIVE DETECTED ]", 40); await delay(600);
        await typeLine("A personal letter is sealed behind an encryption key.", 35); await delay(400);
        await typeLine("Enter the key to unlock it:", 40);
        appState = "secretKey"; createNewPrompt();
    }

    async function handleSecretKey(value) {
        if (value === "love") {
            isProcessing = true; playBassThud(); await delay(200);
            playSystemSound("access_granted"); triggerPowerSurge(); await darkWipe();
            addLine("KEY ACCEPTED — Archive unsealed. ❤️"); await delay(1200); clearScreen();
            await typeLine("Secret letter decrypted successfully.", 35); await delay(600);
            addLine(""); await typeLine("Would you like to download it?", 40);
            addLine(""); addLine("  Type  yes  to download"); addLine("  Type  no   to skip"); addLine("");
            isProcessing = false; appState = "secretDownload"; createNewPrompt();
        } else {
            playSystemSound("error"); triggerScreenShake();
            addLine("ACCESS DENIED — Incorrect encryption key.", true);
            addLine("Hint: The key is the simplest, truest word.", true);
            createNewPrompt();
        }
    }

    async function handleSecretDownload(value) {
        if (value === "yes") {
            isProcessing = true; playSystemSound("success"); triggerPowerSurge();
            addLine("Initiating secure transfer...");
            await loadingBar("DECRYPTING LETTER"); await delay(400);
            const link = document.createElement("a");
            link.href = "secret_letter_from_me.png"; link.download = "secret_letter_from_me.png";
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            await delay(800); addLine("✅ Download complete. Keep it safe. 💌");
            await delay(1500); isProcessing = false; await showEmotionalEnding();
        } else if (value === "no") {
            playSystemSound("click");
            addLine("Understood. It will wait for you whenever you're ready. 💌");
            await delay(1500); appState = "idle"; await showEmotionalEnding();
        } else {
            playSystemSound("error"); addLine("Please type  yes  or  no.", true); createNewPrompt();
        }
    }

    // =========================================================================
    // EMOTIONAL ENDING
    // =========================================================================
    async function showEmotionalEnding() {
        appState = "idle"; clearScreen();
        playStaticBurst(0.5); await delay(200);
        await typeLine("Transmitting final signal...", 35); await delay(600);
        const routeLines = [
            "[ ROUTING ]  Pakistan → Gulf → East Africa",
            "[ ROUTING ]  East Africa → Southern Africa",
            "[ ROUTING ]  Signal reaching South Africa...",
        ];
        for (const line of routeLines) {
            const p = addLine(""); let typed = "";
            for (const ch of line) { typed += ch === " " ? "&nbsp;" : ch; p.innerHTML = typed; await delay(22); }
            await delay(400);
        }
        await delay(600); playStaticBurst(0.3); glitchText("..."); await delay(800);
        matrixSlowFade(); clearScreen(); await delay(500); playStaticBurst(0.6); await delay(800);
        const lostLine = addLine("");
        lostLine.style.cssText = `text-align:center;color:#444;font-size:0.9rem;letter-spacing:4px;opacity:0;transition:opacity 1s ease;`;
        lostLine.innerHTML = "— SIGNAL LOST —"; await delay(60); lostLine.style.opacity = "1"; await delay(2200);
        terminalApp.style.transition = "opacity 1.5s ease"; terminalApp.style.opacity = "0"; await delay(1500);
        startStarfield(); await delay(2000);
        await signalReconnectCountdown(); await delay(500);
        terminalApp.style.opacity = "1"; await delay(400); clearScreen();
        terminalApp.style.transition  = "border-color 2.5s ease, box-shadow 2.5s ease";
        terminalApp.style.borderColor = "rgba(255,255,255,0.2)";
        terminalApp.style.boxShadow   = "0 0 50px rgba(255,255,255,0.06)";
        startEndingMusic(); await delay(600);
        const rawLines = [
            { text: "Hey.",                                                  color: "#ffffff", speed: 90,  pause: 1400 },
            { text: "No more code. No more hacking.",                        color: "#cccccc", speed: 52,  pause: 900  },
            { text: "Just me hehe.",                                         color: "#ffffff", speed: 70,  pause: 1400 },
            { text: "I built all of this for you.",                          color: "#cccccc", speed: 48,  pause: 900  },
            { text: "Because you deserve something that takes real effort.", color: "#aaaaaa", speed: 40,  pause: 1000 },
            { text: "The distance is real.",                                 color: "#ffffff", speed: 55,  pause: 1000 },
            { text: "But so is every single thing I feel for you.",         color: "#cccccc", speed: 42,  pause: 1200 },
            { text: "8,400 km.",                                             color: "#888888", speed: 60,  pause: 600  },
            { text: "That's nothing.",                                       color: "#ffffff", speed: 65,  pause: 1400 },
            { text: "I think about you every day.",                         color: "#cccccc", speed: 48,  pause: 1000 },
            { text: "Every single one.",                                     color: "#ffffff", speed: 60,  pause: 1600 },
            { text: "What we have is not a number.",                        color: "#cccccc", speed: 46,  pause: 1000 },
            { text: "It's not a distance.",                                  color: "#cccccc", speed: 46,  pause: 900  },
            { text: "It's real.",                                            color: "#ffffff", speed: 70,  pause: 1800 },
            { text: "I'll always find my way to you.",                      color: "#ffffff", speed: 52,  pause: 2000 },
        ];
        for (let idx = 0; idx < rawLines.length; idx++) {
            const { text, color, speed, pause } = rawLines[idx];
            const p = document.createElement("p");
            p.style.cssText = `color:${color};text-align:center;font-size:1rem;letter-spacing:1px;line-height:2;margin:6px 0;opacity:0;transform:translateY(8px);transition:opacity 0.8s ease,transform 0.8s ease;`;
            output.appendChild(p); await delay(60);
            p.style.opacity = "1"; p.style.transform = "translateY(0)";
            let typed = "";
            for (const ch of text) { typed += ch === " " ? "&nbsp;" : ch; p.innerHTML = typed; output.scrollTop = output.scrollHeight; await delay(speed); }
            if (idx === 5 || idx === 10 || idx === 14) playStringSwell(0.03, 4);
            await delay(pause);
        }
        playStringSwell(0.06, 6); await delay(2500);
        const dimOverlay = document.createElement("div");
        dimOverlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:black;z-index:9990;opacity:0;transition:opacity 3s ease;pointer-events:none;`;
        document.body.appendChild(dimOverlay); await delay(20); dimOverlay.style.opacity = "0.88"; await delay(3000);
        clearScreen(); stopStarfield(); stopAmbientMusic(3);
        const heartContainer = document.createElement("div");
        heartContainer.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9995;pointer-events:none;`;
        const heartEl = document.createElement("div");
        heartEl.style.cssText = `font-size:4.5rem;opacity:0;animation:heartPulse 1.8s ease-in-out infinite;transition:opacity 2s ease;filter:drop-shadow(0 0 30px rgba(255,80,80,0.7));`;
        heartEl.innerHTML = "❤️";
        heartContainer.appendChild(heartEl);
        const sigEl = document.createElement("div");
        sigEl.style.cssText = `color:#888;font-family:monospace;font-size:0.85rem;letter-spacing:3px;margin-top:24px;opacity:0;transition:opacity 2.5s ease;`;
        sigEl.innerHTML = "From Raphael";
        heartContainer.appendChild(sigEl);
        document.body.appendChild(heartContainer);
        await delay(80); heartEl.style.opacity = "1"; playStringSwell(0.08, 10);
        await delay(2000); sigEl.style.opacity = "1";
    }

    // =========================================================================
    // CLASSIFIED IMAGE DECRYPT
    // =========================================================================
    async function openClassifiedVault(imageSrc, onClose) {
        const overlay  = document.getElementById("mediaVaultOverlay");
        const img      = document.getElementById("vaultImage");
        const dlBtn    = document.getElementById("vaultDownloadBtn");
        const closeBtn = document.getElementById("vaultCloseBtn");
        overlay.style.display = "flex";
        const stage = document.createElement("div");
        stage.style.cssText = `display:flex;flex-direction:column;align-items:center;width:100%;max-width:500px;gap:14px;`;
        const label = document.createElement("p");
        label.style.cssText = "color:#00ff41;font-family:monospace;font-size:0.85rem;letter-spacing:2px;margin:0;";
        label.innerHTML = "[ CLASSIFIED — DECRYPTING IMAGE... ]";
        const cvs = document.createElement("canvas");
        cvs.width = 320; cvs.height = 220;
        cvs.style.cssText = `border:2px solid #00ff41;box-shadow:0 0 24px rgba(0,255,65,0.5);border-radius:4px;max-width:90vw;`;
        const bar = document.createElement("p");
        bar.style.cssText = "color:#00ff41;font-family:monospace;font-size:0.8rem;margin:0;";
        stage.appendChild(label); stage.appendChild(cvs); stage.appendChild(bar);
        const originalContent = overlay.querySelector("div");
        overlay.appendChild(stage); originalContent.style.display = "none";
        setTimeout(() => { overlay.style.opacity = "1"; }, 30);
        const c = cvs.getContext("2d");
        let frame = 0;
        const noiseInterval = setInterval(() => {
            playDecryptTick();
            const imageData = c.createImageData(cvs.width, cvs.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                const val = Math.random() > 0.5 ? Math.floor(Math.random() * 60) : 0;
                const green = Math.random() > 0.85 ? Math.floor(80 + Math.random() * 175) : val;
                imageData.data[i] = val * 0.3; imageData.data[i+1] = green;
                imageData.data[i+2] = val * 0.3; imageData.data[i+3] = 255;
            }
            c.putImageData(imageData, 0, 0);
            c.fillStyle = "rgba(0,0,0,0.25)";
            for (let y = 0; y < cvs.height; y += 4) c.fillRect(0, y, cvs.width, 2);
            const beamY = (frame * 6) % cvs.height;
            c.fillStyle = "rgba(0,255,65,0.12)"; c.fillRect(0, beamY, cvs.width, 18);
            const pct = Math.min(100, Math.floor((frame / 40) * 100));
            bar.innerHTML = `DECRYPTING [&nbsp;${"█".repeat(Math.floor(pct/5))}${"-".repeat(20-Math.floor(pct/5))}&nbsp;] ${pct}%`;
            frame++;
        }, 60);
        await delay(2400); clearInterval(noiseInterval);
        await new Promise(resolve => {
            const tempImg = new Image();
            tempImg.crossOrigin = "anonymous";
            tempImg.onload = () => {
                let strip = 0; const stripH = 8; const strips = Math.ceil(cvs.height / stripH);
                const revealInterval = setInterval(() => {
                    playDecryptTick();
                    if (strip >= strips) {
                        clearInterval(revealInterval);
                        bar.innerHTML = `✅ IMAGE DECRYPTED — CLASSIFIED ASSET UNLOCKED`;
                        bar.style.color = "#ffffff"; resolve(); return;
                    }
                    for (let s = 0; s < 2 && strip < strips; s++, strip++) {
                        const sy = strip * stripH;
                        const glitchX = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 6);
                        c.drawImage(tempImg, 0, sy, tempImg.width, stripH, glitchX, sy, cvs.width, stripH);
                    }
                }, 40);
            };
            tempImg.onerror = () => resolve();
            tempImg.src = imageSrc;
        });
        await delay(800);
        stage.remove(); originalContent.style.display = "flex";
        img.src = imageSrc; dlBtn.style.display = "none";
        closeBtn.onclick = () => {
            playSystemSound("click"); overlay.style.opacity = "0";
            setTimeout(() => { overlay.style.display = "none"; if (onClose) onClose(); }, 500);
        };
    }

    // =========================================================================
    // CINEMATIC SEQUENCE
    // =========================================================================
    async function startCinematicSequence() {
        return new Promise(async (resolve) => {
            clearScreen(); await typeLine("EXECUTING MEMORY RECONSTRUCTION...", 40); await delay(800);
            terminalApp.style.transition = "opacity 1s ease"; canvas.style.transition = "opacity 1s ease";
            terminalApp.style.opacity = "0"; canvas.style.opacity = "0"; await delay(1000);
            const videoContainer = document.getElementById("videoContainer");
            const frame = document.getElementById("cinematicFrame");
            const skipBtn = document.getElementById("videoPlayBtn");
            frame.src = "https://www.youtube.com/embed/UCAKjSPvRoE?autoplay=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=UCAKjSPvRoE";
            videoContainer.style.display = "block"; videoContainer.style.opacity = "1";
            let done = false;
            async function wrapUpCinematic() {
                if (done) return; done = true;
                videoContainer.style.transition = "opacity 1s ease"; videoContainer.style.opacity = "0";
                await delay(1000); videoContainer.style.display = "none"; frame.src = "";
                terminalApp.style.opacity = "1"; canvas.style.opacity = "1"; clearScreen(); resolve();
            }
            skipBtn.onclick = () => wrapUpCinematic();
            setTimeout(() => wrapUpCinematic(), 40000);
        });
    }

});
