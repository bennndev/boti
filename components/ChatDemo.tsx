"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Mascot } from "@/components/Mascot";
import { MASCOT_MODES, type MascotHandle, type MascotMode } from "@/lib/mascot";
import styles from "./ChatDemo.module.css";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const SLEEP_AFTER_MS = 30_000;
const THINKING_MS = 900;
const WORD_MS = 70;

const MODE_LABELS: Record<MascotMode, string> = {
  idle: "Idle",
  thinking: "Thinking",
  listening: "Listening",
  working: "Working",
  warning: "Warning",
  sleeping: "Sleeping",
};

const REPLY =
  "Claro, ya lo revisé. Si necesitas algo más, aquí estoy para ayudarte con calma.";

export function ChatDemo() {
  const mascot = useRef<MascotHandle>(null);
  const timers = useRef<number[]>([]);
  const nextId = useRef(1);

  const [mode, setMode] = useState<MascotMode>("idle");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [activity, setActivity] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hola, soy Botiquín. Prueba escribir “error”, “aviso” o “gracias”.",
    },
  ]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Any interaction wakes the mascot; long inactivity puts it to sleep.
  const touch = useCallback(() => {
    setActivity((n) => n + 1);
    setMode((m) => (m === "sleeping" ? "idle" : m));
  }, []);

  useEffect(() => {
    if (mode !== "idle" || busy) return;
    const id = window.setTimeout(() => setMode("sleeping"), SLEEP_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [mode, busy, activity]);

  const push = useCallback((role: Message["role"], text: string) => {
    setMessages((list) => [...list, { id: nextId.current++, role, text }]);
  }, []);

  const finish = useCallback(
    (reaction?: "success" | "error") => {
      setMode("idle");
      setBusy(false);
      if (reaction) mascot.current?.[reaction]();
    },
    [],
  );

  const stream = useCallback(
    (text: string, reaction?: "success") => {
      const words = text.split(" ");
      const id = nextId.current++;
      setMessages((list) => [...list, { id, role: "assistant", text: "" }]);
      words.forEach((_, i) => {
        later(() => {
          const partial = words.slice(0, i + 1).join(" ");
          setMessages((list) =>
            list.map((m) => (m.id === id ? { ...m, text: partial } : m)),
          );
          if (i === words.length - 1) finish(reaction);
        }, i * WORD_MS);
      });
    },
    [finish, later],
  );

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    touch();
    setInput("");
    setBusy(true);
    push("user", text);

    // Sending a message: thinking first, then working while the reply streams.
    setMode("thinking");
    const lower = text.toLowerCase();

    later(() => {
      if (lower.includes("error")) {
        push("assistant", "No pude completar eso. Puedes intentarlo de nuevo.");
        finish("error");
      } else if (lower.includes("aviso")) {
        setMode("warning");
        push("assistant", "Ojo: esto requiere tu revisión antes de continuar.");
        later(() => finish(), 3200);
      } else {
        setMode("working");
        stream(
          REPLY,
          lower.includes("gracias") || lower.includes("listo") ? "success" : undefined,
        );
      }
    }, THINKING_MS);
  };

  const pickMode = (next: MascotMode) => {
    clearTimers();
    setBusy(false);
    setMode(next);
  };

  return (
    <main className={styles.page}>
      <section className={styles.stage} aria-label="Mascota">
        <Mascot ref={mascot} mode={mode} size={260} />
        <p className={styles.state}>
          Estado: <strong>{MODE_LABELS[mode]}</strong>
        </p>

        <div className={styles.controls}>
          {MASCOT_MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={m === mode ? styles.active : undefined}
              onClick={() => pickMode(m)}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
          <button type="button" onClick={() => mascot.current?.success()}>
            Success
          </button>
          <button type="button" onClick={() => mascot.current?.error()}>
            Error
          </button>
          <button type="button" onClick={() => mascot.current?.appear()}>
            Appear
          </button>
        </div>
      </section>

      <section className={styles.chat} aria-label="Chat">
        <ol className={styles.log} aria-live="polite">
          {messages.map((m) => (
            <li key={m.id} className={m.role === "user" ? styles.user : styles.bot}>
              {m.text}
            </li>
          ))}
        </ol>

        <form className={styles.form} onSubmit={send}>
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              touch();
            }}
            placeholder="Escribe un mensaje…"
            aria-label="Mensaje"
            disabled={busy}
          />
          <button type="submit" disabled={busy || !input.trim()}>
            Enviar
          </button>
        </form>
      </section>
    </main>
  );
}
