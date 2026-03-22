import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Loader2,
  Play,
  Radio,
  Tv2,
  VideoIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const DID_API_KEY =
  "Basic Y2hpbm5pcGVsbGlzdWRoZWVyQGdtYWlsLmNvbQ:cQ1uQBeq3NszTNNg0A-LP";
const PRESENTER_IMAGE = "https://i.ibb.co/60S780t/gBW1RJx.jpg";
const POLL_INTERVAL = 3000;

type GenerationState = "idle" | "creating" | "polling" | "done" | "error";

export default function App() {
  const [newsText, setNewsText] = useState("");
  const [state, setState] = useState<GenerationState>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollTalk = async (talkId: string) => {
    setState("polling");
    setProgressMsg(
      "Generating your AI news video… This may take 30-60 seconds.",
    );

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`https://api.d-id.com/talks/${talkId}`, {
          headers: { Authorization: DID_API_KEY },
        });
        if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
        const data = await res.json();

        if (data.status === "done" && data.result_url) {
          stopPolling();
          setVideoUrl(data.result_url);
          setState("done");
          setProgressMsg("");
          toast.success("AI News Video is ready!");
          setTimeout(
            () => videoRef.current?.scrollIntoView({ behavior: "smooth" }),
            200,
          );
        } else if (data.status === "error") {
          stopPolling();
          setState("error");
          setErrorMsg(
            "D-ID reported an error generating the video. Please try again.",
          );
        }
      } catch (err) {
        stopPolling();
        setState("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Unknown error while polling.",
        );
      }
    }, POLL_INTERVAL);
  };

  const handleGenerate = async () => {
    if (!newsText.trim()) {
      toast.error("Please paste Telugu news text before generating.");
      return;
    }

    setVideoUrl(null);
    setErrorMsg(null);
    setState("creating");
    setProgressMsg("Submitting text to D-ID API…");

    try {
      const res = await fetch("https://api.d-id.com/talks", {
        method: "POST",
        headers: {
          Authorization: DID_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: {
            type: "text",
            input: newsText.trim(),
            provider: {
              type: "microsoft",
              voice_id: "te-IN-ShrutiNeural",
            },
          },
          source_url: PRESENTER_IMAGE,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.description || `API error: ${res.status}`);
      }

      const data = await res.json();
      if (!data.id) throw new Error("No talk ID returned from D-ID API.");
      await pollTalk(data.id);
    } catch (err) {
      setState("error");
      const msg =
        err instanceof Error ? err.message : "Failed to create video.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const isLoading = state === "creating" || state === "polling";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-news">
        <div className="container max-w-4xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between py-2 border-b border-primary-foreground/20 text-xs font-sans tracking-wide">
            <div className="flex items-center gap-2 opacity-80">
              <Radio className="w-3 h-3" />
              <span>LIVE BROADCAST</span>
            </div>
            <span className="opacity-70">
              {new Date().toLocaleDateString("te-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Brand */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex items-center justify-center w-14 h-14 rounded bg-primary-foreground/10 border-2 border-primary-foreground/30">
              <Tv2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight leading-none">
                S News
              </h1>
              <p className="text-primary-foreground/70 text-sm font-sans tracking-widest uppercase mt-0.5">
                AI News Studio
              </p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-1.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide">
                ON AIR
              </span>
            </div>
          </div>
        </div>

        {/* Breaking news ticker */}
        <div className="bg-accent text-accent-foreground py-1.5 overflow-hidden">
          <div className="container max-w-4xl mx-auto flex items-center gap-3">
            <span className="flex-shrink-0 bg-primary-foreground text-primary text-xs font-bold px-2 py-0.5 rounded">
              BREAKING
            </span>
            <span className="text-sm font-sans tracking-wide truncate opacity-90">
              AI తో తెలుగు వార్తలు ఇప్పుడు వీడియో రూపంలో • Paste your Telugu news text
              below and generate a talking avatar video
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {/* Studio card */}
          <div className="bg-card border border-border rounded-lg shadow-news overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <VideoIcon className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  AI News Video Studio
                </h2>
                <p className="text-muted-foreground text-sm">
                  Convert Telugu news text into a professional talking avatar
                  video
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Textarea */}
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-foreground block"
                  htmlFor="news-input"
                  data-ocid="news.label"
                >
                  తెలుగు వార్తా పాఠ్యం{" "}
                  <span className="text-muted-foreground font-normal">
                    (Telugu News Text)
                  </span>
                </label>
                <Textarea
                  id="news-input"
                  data-ocid="news.textarea"
                  placeholder="ఇక్కడ తెలుగు వార్తా వచనాన్ని అతికించండి…\n\nPaste your Telugu news text here. The AI avatar will read it aloud using Microsoft Azure Telugu (Shruti Neural) voice."
                  className="min-h-[220px] resize-y text-base leading-relaxed font-sans placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/40"
                  value={newsText}
                  onChange={(e) => setNewsText(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  {newsText.length} characters
                </p>
              </div>

              {/* Generate button */}
              <Button
                data-ocid="news.primary_button"
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-accent font-semibold text-base tracking-wide h-12 transition-all"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Video…
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Generate AI News Video
                  </>
                )}
              </Button>

              {/* Progress state */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    data-ocid="news.loading_state"
                    key="loading"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-md bg-muted border border-border p-4 flex items-start gap-3">
                      <div className="flex gap-0.5 mt-1">
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className="w-1 h-4 bg-primary rounded-full animate-pulse-bar"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Processing your news…
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {progressMsg}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error state */}
              <AnimatePresence>
                {state === "error" && errorMsg && (
                  <motion.div
                    data-ocid="news.error_state"
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">
                          Video generation failed
                        </p>
                        <p className="text-xs text-destructive/80 mt-0.5">
                          {errorMsg}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Video player */}
          <AnimatePresence>
            {state === "done" && videoUrl && (
              <motion.div
                key="video"
                data-ocid="news.panel"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mt-8"
                ref={videoRef as any}
              >
                <div className="bg-card border border-border rounded-lg shadow-news overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-bold text-foreground font-display">
                        Your AI News Video
                      </span>
                    </span>
                    <span
                      data-ocid="news.success_state"
                      className="ml-auto text-xs text-muted-foreground bg-green-50 border border-green-200 rounded px-2 py-0.5"
                    >
                      Ready
                    </span>
                  </div>
                  <div className="p-4 bg-black">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      autoPlay
                      className="w-full max-h-[480px] rounded"
                      data-ocid="news.canvas_target"
                    >
                      <track kind="captions" />
                    </video>
                  </div>
                  <div className="px-6 py-3 border-t border-border">
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid="news.link"
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Open video in new tab ↗
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 py-6">
        <div className="container max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="font-display font-bold text-foreground">S News</span>
          <span>
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
