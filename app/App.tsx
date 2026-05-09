"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, X, Zap, ChevronRight, Lock } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type View = 0 | 1 | 2 | 3 | 4;
type InterviewStatus = "idle" | "ai_speaking" | "listening" | "processing";

interface ScoreData {
  overallScore: number;
  fillerWordCount: number;
  critique: string;
  breakdown: { subject: string; score: number }[];
  heatmap: { label: string; value: number }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CALIBRATION_LINES = [
  "Initializing neural stack...",
  "Securing WebSocket channel...",
  "Loading behavioral profile...",
  "Injecting HR persona...",
  "Calibrating voice activity detection...",
  "System armed. Standby.",
];

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

// ─── View 0 – Auth Gate ───────────────────────────────────────────────────────
function AuthView({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState("");
  return (
    <motion.div
      key="auth"
      {...fade}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-dvh px-6 gap-8"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center">
          <span className="text-[#09090B] font-mono font-bold text-xl">V</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Vani.ai</h1>
        <p className="text-[#71717A] text-sm text-center max-w-xs">
          The AI interviewer that doesn&apos;t lie to you.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={onAuth}
          className="h-12 w-full rounded-xl bg-white text-[#09090B] font-medium text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#27272A]" />
          <span className="text-[#52525B] text-xs">or</span>
          <div className="flex-1 h-px bg-[#27272A]" />
        </div>

        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-xl bg-[#111113] border border-[#27272A] px-4 text-sm text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#52525B] transition-colors"
        />
        <button
          onClick={onAuth}
          disabled={!email.includes("@")}
          className="h-12 w-full rounded-xl bg-[#18181B] border border-[#27272A] text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          Continue with Email
        </button>
      </div>

      <p className="text-[#3F3F46] text-xs text-center">
        No recruiters. No bullshit. Just truth.
      </p>
    </motion.div>
  );
}

// ─── View 1 – Mission Intake ──────────────────────────────────────────────────
function IntakeView({
  onComplete,
}: {
  onComplete: (company: string, role: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const handleStep0 = () => {
    if (company.trim()) setStep(1);
  };

  return (
    <motion.div
      key="intake"
      {...fade}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-dvh px-6"
    >
      <div className="w-full max-w-sm">
        <div className="flex gap-1.5 mb-10">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                i <= step ? "bg-white" : "bg-[#27272A]"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div key="s0" {...fade} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
              <div>
                <p className="text-[#71717A] text-xs font-mono uppercase tracking-widest mb-2">Step 01 / 02</p>
                <h2 className="text-2xl font-semibold">Target Company</h2>
                <p className="text-[#71717A] text-sm mt-1">Where are you interviewing?</p>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Google, Zepto, Meesho"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStep0()}
                className="h-12 w-full rounded-xl bg-[#111113] border border-[#27272A] px-4 text-sm text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#52525B] transition-colors"
              />
              <button
                onClick={handleStep0}
                disabled={!company.trim()}
                className="h-12 w-full rounded-xl bg-white text-[#09090B] text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                Next <ChevronRight size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div key="s1" {...fade} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
              <div>
                <p className="text-[#71717A] text-xs font-mono uppercase tracking-widest mb-2">Step 02 / 02</p>
                <h2 className="text-2xl font-semibold">Target Role</h2>
                <p className="text-[#71717A] text-sm mt-1">What position are you going for?</p>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Senior Product Manager"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && role.trim() && onComplete(company, role)}
                className="h-12 w-full rounded-xl bg-[#111113] border border-[#27272A] px-4 text-sm text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#52525B] transition-colors"
              />
              <button
                onClick={() => role.trim() && onComplete(company, role)}
                disabled={!role.trim()}
                className="h-12 w-full rounded-xl bg-white text-[#09090B] text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                Start Interview <Zap size={15} />
              </button>
              <button onClick={() => setStep(0)} className="text-[#52525B] text-sm text-center">
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── View 2 – Calibration ─────────────────────────────────────────────────────
function CalibrationView({ onReady }: { onReady: (stream: MediaStream) => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [micGranted, setMicGranted] = useState(false);
  const [micError, setMicError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((i) => Math.min(i + 1, CALIBRATION_LINES.length - 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
      setTimeout(() => onReady(stream), 800);
    } catch {
      setMicError("Microphone access denied. Please allow it in your browser settings.");
    }
  };

  return (
    <motion.div
      key="calibration"
      {...fade}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-dvh px-6 gap-8"
    >
      <div className="w-full max-w-sm">
        <div className="bg-[#111113] border border-[#27272A] rounded-2xl p-5 font-mono text-xs space-y-1.5 min-h-[180px]">
          <p className="text-[#52525B] mb-3">$ vani --init --secure</p>
          {CALIBRATION_LINES.slice(0, lineIndex + 1).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={i === lineIndex ? "text-[#FAFAFA]" : "text-[#52525B]"}
            >
              {i === lineIndex ? <span className="text-[#22C55E]">▸</span> : "✓"} {line}
            </motion.p>
          ))}
          {lineIndex === CALIBRATION_LINES.length - 1 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="inline-block w-2 h-3 bg-[#FAFAFA] ml-1"
            />
          )}
        </div>

        {!micGranted && lineIndex >= 3 && (
          <motion.div {...fade} transition={{ duration: 0.3 }} className="mt-6 flex flex-col gap-3">
            <p className="text-[#71717A] text-sm text-center">
              Microphone access required to continue.
            </p>
            {micError && (
              <p className="text-[#EF4444] text-xs text-center">{micError}</p>
            )}
            <button
              onClick={requestMic}
              className="h-12 w-full rounded-xl bg-white text-[#09090B] text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Mic size={16} /> Allow Microphone
            </button>
          </motion.div>
        )}

        {micGranted && (
          <motion.p
            {...fade}
            className="mt-6 text-[#22C55E] text-sm font-mono text-center"
          >
            ✓ Microphone granted. Entering room...
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Radar Visualizer ─────────────────────────────────────────────────────────
function AudioVisualizer({ status, analyser }: { status: InterviewStatus; analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const baseR = Math.min(W, H) * 0.28;

      ctx.clearRect(0, 0, W, H);

      const rings = 4;
      for (let r = 1; r <= rings; r++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (baseR * r) / rings, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.04 * r})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const bars = 64;
      const active = status === "ai_speaking" || status === "listening";

      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const val = active ? dataArray[Math.floor((i / bars) * bufferLength)] / 255 : 0.02;
        const len = baseR * 0.15 + baseR * 0.7 * val;

        const x1 = cx + Math.cos(angle) * baseR;
        const y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * (baseR + len);
        const y2 = cy + Math.sin(angle) * (baseR + len);

        const alpha = 0.3 + val * 0.7;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle =
          status === "ai_speaking"
            ? `rgba(250,250,250,${alpha})`
            : `rgba(34,197,94,${alpha})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [analyser, status]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="w-full h-full"
    />
  );
}

// ─── View 3 – Live Interview Room ─────────────────────────────────────────────
function LiveRoomView({
  company,
  role,
  stream,
  onEnd,
}: {
  company: string;
  role: string;
  stream: MediaStream;
  onEnd: (messages: Message[]) => void;
}) {
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [wpm, setWpm] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [researchDone, setResearchDone] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const wpmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);
  const contextRef = useRef<{ questions: string[] } | null>(null);

  // Bootstrap analyser on the mic stream
  useEffect(() => {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const node = audioCtx.createAnalyser();
    node.fftSize = 256;
    source.connect(node);
    setAnalyser(node);
    return () => { audioCtx.close(); };
  }, [stream]);

  // Pre-fetch research
  useEffect(() => {
    fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, role }),
    })
      .then((r) => r.json())
      .then((d) => {
        contextRef.current = d;
        setResearchDone(true);
      })
      .catch(() => setResearchDone(true));
  }, [company, role]);

  const stopAI = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (isListeningRef.current || isMuted) return;
    isListeningRef.current = true;
    setStatus("listening");
    audioChunksRef.current = [];

    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      isListeningRef.current = false;
      if (audioChunksRef.current.length === 0) return;

      setStatus("processing");
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "speech.webm");
      formData.append("company", company);
      formData.append("role", role);
      formData.append("context", JSON.stringify(contextRef.current));
      formData.append("history", JSON.stringify(messages));

      try {
        const res = await fetch("/api/chat", { method: "POST", body: formData });
        if (!res.ok) throw new Error("chat failed");

        const transcript = res.headers.get("X-Transcript") ?? "";
        const wordCount = transcript.split(/\s+/).filter(Boolean).length;
        const durationSec = blob.size / 16000;
        setWpm(Math.round((wordCount / Math.max(durationSec, 1)) * 60));

        if (wpmTimerRef.current) clearTimeout(wpmTimerRef.current);
        wpmTimerRef.current = setTimeout(() => setWpm(0), 4000);

        const userMsg: Message = { role: "user", content: transcript, timestamp: Date.now() };
        setMessages((m) => [...m, userMsg]);

        // Stream TTS audio
        setStatus("ai_speaking");
        const audioBlob = await res.blob();
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          setStatus("idle");
          setTimeout(startListening, 600);
        };
        audio.play();

        const aiText = res.headers.get("X-AI-Response") ?? "";
        if (aiText) {
          setMessages((m) => [...m, { role: "assistant", content: aiText, timestamp: Date.now() }]);
        }
      } catch {
        setStatus("idle");
        setTimeout(startListening, 800);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();

    // Auto-stop after 30s silence detection (simple timeout)
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }, 30000);
  }, [company, role, isMuted, messages, stream]);

  // Kick off first question once research is ready
  useEffect(() => {
    if (!researchDone) return;
    const kickoff = () => { (async () => {
      setStatus("ai_speaking");
      const formData = new FormData();
      formData.append("company", company);
      formData.append("role", role);
      formData.append("context", JSON.stringify(contextRef.current));
      formData.append("history", JSON.stringify([]));
      formData.append("kickoff", "true");
      try {
        const res = await fetch("/api/chat", { method: "POST", body: formData });
        const audioBlob = await res.blob();
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          setStatus("idle");
          setTimeout(startListening, 400);
        };
        audio.play();
        const aiText = res.headers.get("X-AI-Response") ?? "";
        if (aiText) setMessages([{ role: "assistant", content: aiText, timestamp: Date.now() }]);
      } catch {
        setStatus("idle");
        setTimeout(startListening, 800);
      }
    })(); };
    kickoff();
  }, [researchDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBargein = () => {
    stopAI();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setTimeout(startListening, 200);
  };

  const handleEnd = () => {
    stopAI();
    stream.getTracks().forEach((t) => t.stop());
    onEnd(messages);
  };

  const statusLabel =
    status === "ai_speaking"
      ? "AI Speaking"
      : status === "listening"
      ? "Listening..."
      : status === "processing"
      ? "Processing..."
      : researchDone
      ? "Ready"
      : "Loading context...";

  const statusColor =
    status === "ai_speaking"
      ? "bg-white text-[#09090B]"
      : status === "listening"
      ? "bg-[#22C55E] text-[#09090B]"
      : "bg-[#27272A] text-[#FAFAFA]";

  return (
    <motion.div
      key="live"
      {...fade}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col items-center justify-center min-h-dvh bg-[#09090B] select-none"
    >
      {/* Status pill */}
      <div className="absolute top-safe-top top-6 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          layout
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-colors duration-300 ${statusColor}`}
        >
          {statusLabel}
        </motion.div>
      </div>

      {/* WPM gauge */}
      <div className="absolute top-6 right-4 z-20">
        <span className="font-mono text-xs text-[#52525B]">
          {wpm > 0 ? (
            <motion.span
              key={wpm}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#FAFAFA]"
            >
              {wpm} <span className="text-[#52525B]">wpm</span>
            </motion.span>
          ) : (
            "— wpm"
          )}
        </span>
      </div>

      {/* Radar visualizer — max 40vh, no text inside */}
      <div
        className="w-full max-w-[min(100vw,400px)] aspect-square max-h-[40vh]"
        onClick={status === "ai_speaking" ? handleBargein : undefined}
      >
        <AudioVisualizer status={status} analyser={analyser} />
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 flex items-center gap-6">
        <button
          onClick={() => {
            setIsMuted((m) => {
              if (!m && mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
              }
              return !m;
            });
          }}
          className="w-12 h-12 rounded-full bg-[#111113] border border-[#27272A] flex items-center justify-center active:scale-90 transition-transform"
        >
          {isMuted ? <MicOff size={18} className="text-[#EF4444]" /> : <Mic size={18} />}
        </button>

        <button
          onClick={handleEnd}
          className="h-12 px-6 rounded-full bg-[#EF4444] text-white text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform"
        >
          <X size={15} /> End Interview
        </button>
      </div>

      {/* Tap-to-interrupt hint */}
      {status === "ai_speaking" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-28 text-[#3F3F46] text-xs font-mono"
        >
          tap visualizer to interrupt
        </motion.p>
      )}
    </motion.div>
  );
}

// ─── View 4 – Paywall Dashboard ───────────────────────────────────────────────
function PaywallView({
  messages,
  company,
  role,
}: {
  messages: Message[];
  company: string;
  role: string;
}) {
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const transcript = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, company, role }),
    })
      .then((r) => r.json())
      .then((d) => { setScore(d); setLoading(false); })
      .catch(() => {
        setScore({
          overallScore: 42,
          fillerWordCount: 17,
          critique: "Multiple critical delivery gaps detected. Unlock for full analysis.",
          breakdown: [
            { subject: "Communication", score: 45 },
            { subject: "Confidence", score: 38 },
            { subject: "Structure", score: 52 },
            { subject: "Relevance", score: 61 },
            { subject: "Vocabulary", score: 33 },
          ],
          heatmap: [
            { label: "Opener", value: 2 },
            { label: "Mid-1", value: 5 },
            { label: "Mid-2", value: 8 },
            { label: "Closer", value: 3 },
          ],
        });
        setLoading(false);
      });
  }, [messages, company, role]);

  const handlePayment = async () => {
    setPaying(true);
    try {
      const orderRes = await fetch("/api/razorpay", { method: "POST" });
      const { orderId, amount } = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount,
        currency: "INR",
        name: "Vani.ai",
        description: "5 Interview Credits",
        order_id: orderId,
        prefill: {},
        theme: { color: "#FAFAFA" },
        handler: () => {
          window.location.reload();
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      alert("Payment initiation failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const scoreColor =
    !score ? "#71717A"
    : score.overallScore < 40 ? "#EF4444"
    : score.overallScore < 70 ? "#F59E0B"
    : "#22C55E";

  return (
    <motion.div
      key="paywall"
      {...fade}
      transition={{ duration: 0.5 }}
      className="min-h-dvh bg-[#09090B] flex flex-col items-center px-4 pt-12 pb-32"
    >
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {/* Score */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="text-center mb-8"
      >
        <p className="text-[#52525B] text-xs font-mono uppercase tracking-widest mb-2">Overall Score</p>
        {loading ? (
          <div className="w-32 h-20 bg-[#111113] rounded-2xl animate-pulse mx-auto" />
        ) : (
          <p
            className="font-mono text-8xl font-bold leading-none"
            style={{
              color: scoreColor,
              textShadow: `0 0 40px ${scoreColor}55`,
            }}
          >
            {score?.overallScore}
            <span className="text-3xl text-[#27272A]">/100</span>
          </p>
        )}
        <p className="text-[#52525B] font-mono text-sm mt-3">
          Filler words: <span className="text-[#EF4444]">{score?.fillerWordCount ?? "—"}</span>
        </p>
      </motion.div>

      {/* Charts — blurred */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden">
        <div className="pointer-events-none">
          <div className="bg-[#111113] border border-[#27272A] rounded-2xl p-4 mb-3">
            <p className="text-[#52525B] text-xs font-mono mb-3">COMPETENCY RADAR</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={score?.breakdown ?? []}>
                <PolarGrid stroke="#27272A" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#52525B", fontSize: 10 }} />
                <Radar dataKey="score" stroke="#FAFAFA" fill="#FAFAFA" fillOpacity={0.1} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#111113] border border-[#27272A] rounded-2xl p-4">
            <p className="text-[#52525B] text-xs font-mono mb-3">ENGAGEMENT HEATMAP</p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={score?.heatmap ?? []}>
                <XAxis dataKey="label" tick={{ fill: "#52525B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {(score?.heatmap ?? []).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.value > 6 ? "#EF4444" : entry.value > 4 ? "#F59E0B" : "#27272A"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-md bg-[#09090B]/60 rounded-2xl" />

        {/* Paywall card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <div className="w-full bg-[#111113] border border-[#27272A] rounded-2xl p-5 text-center shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center mx-auto mb-3">
              <Lock size={18} className="text-[#EF4444]" />
            </div>
            <h3 className="font-semibold text-base mb-1">Critical leaks detected.</h3>
            <p className="text-[#71717A] text-xs mb-4">
              Unlock your brutal breakdown &amp; 5 interview credits.
            </p>
            <button
              onClick={handlePayment}
              disabled={paying}
              className="h-12 w-full rounded-xl bg-white text-[#09090B] font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {paying ? "Opening checkout..." : "Unlock for ₹49"}
            </button>
            <p className="text-[#3F3F46] text-[10px] mt-3 font-mono">
              One-time · Secure · UPI / Cards / Wallets
            </p>
          </div>
        </div>
      </div>

      {/* Critique preview */}
      {score?.critique && (
        <div className="mt-4 w-full max-w-sm bg-[#111113] border border-[#27272A] rounded-2xl p-4">
          <p className="text-[#52525B] text-xs font-mono mb-2">AI CRITIQUE — PREVIEW</p>
          <p className="text-[#71717A] text-sm leading-relaxed line-clamp-3">{score.critique}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Root State Machine ───────────────────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<View>(0);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <main className="relative">
      <AnimatePresence mode="wait">
        {view === 0 && (
          <AuthView key="auth" onAuth={() => setView(1)} />
        )}
        {view === 1 && (
          <IntakeView
            key="intake"
            onComplete={(c, r) => {
              setCompany(c);
              setRole(r);
              setView(2);
            }}
          />
        )}
        {view === 2 && (
          <CalibrationView
            key="calibration"
            onReady={(stream) => {
              setMicStream(stream);
              setView(3);
            }}
          />
        )}
        {view === 3 && micStream && (
          <LiveRoomView
            key="live"
            company={company}
            role={role}
            stream={micStream}
            onEnd={(msgs) => {
              setMessages(msgs);
              setView(4);
            }}
          />
        )}
        {view === 4 && (
          <PaywallView
            key="paywall"
            messages={messages}
            company={company}
            role={role}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
