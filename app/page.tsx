"use client";

import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type DesktopContext = {
  os: string;
  arch: string;
  profile: string;
};

type Step = {
  title: string;
  description: string;
  command: string;
};

const steps: Step[] = [
  {
    title: "Install dependencies",
    description: "Pull React, Next.js, Tailwind, and Tauri CLI binaries.",
    command: "pnpm install",
  },
  {
    title: "Run the desktop dev server",
    description: "Boot Next.js and wrap it inside the native shell.",
    command: "pnpm tauri dev",
  },
  {
    title: "Build production binaries",
    description: "Pre-render Next.js, then bundle installers for each OS.",
    command: "pnpm tauri build",
  },
];

export default function Home() {
  const [context, setContext] = useState<DesktopContext | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isDesktopShell, setIsDesktopShell] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDesktopShell("__TAURI_IPC__" in window);
    }
  }, []);

  const handleFetchContext = async () => {
    setStatus("loading");
    setError(null);
    try {
      const payload = await invoke<DesktopContext>("desktop_context");
      setContext(payload);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Tidak dapat membaca konteks desktop.",
      );
      setStatus("error");
    }
  };

  useEffect(() => {
    if (isDesktopShell) {
      handleFetchContext();
    }
  }, [isDesktopShell]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "loading":
        return "Mendeteksi lingkungan...";
      case "success":
        return "Desktop IPC aktif";
      case "error":
        return "Gagal membaca konteks";
      default:
        return "Siap membaca konteks";
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-16 text-slate-50">
      <main className="mx-auto flex max-w-5xl flex-col gap-12">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
            Post Creator Studio
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Next.js + Tauri starter, siap membungkus workflow konten ke dalam desktop
            native.
          </h1>
          <p className="text-lg text-slate-300">
            Jalankan frontend App Router modern dan integrasikan IPC Tauri v2 untuk
            mengakses fitur native (filesystem, notifikasi, dsb) tanpa meninggalkan React.
          </p>
        </section>

        <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-cyan-300">Workflow</span>
            <h2 className="text-2xl font-medium">Setup cepat</h2>
            <p className="text-sm text-slate-300">
              Ikuti langkah berikut untuk berpindah dari web preview ke aplikasi desktop.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.title}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                  {step.title}
                </p>
                <p className="mt-2 text-sm text-slate-300">{step.description}</p>
                <code className="mt-4 inline-flex rounded-full border border-white/20 px-3 py-1 text-sm text-cyan-200">
                  {step.command}
                </code>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">Handshake Tauri IPC</h2>
            <span className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs text-emerald-200">
              Status: {statusLabel}
            </span>
          </div>
          <p className="text-sm text-emerald-100/90">
            Penekanan tombol di bawah akan memanggil command Rust <code>desktop_context</code>
            untuk memastikan integrasi IPC berjalan baik.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-400/40"
              disabled={!isDesktopShell || status === "loading"}
              onClick={handleFetchContext}
            >
              {isDesktopShell ? "Baca konteks desktop" : "Buka via pnpm tauri dev"}
            </button>
            {!isDesktopShell && (
              <p className="text-xs text-emerald-100/80">
                Jalankan <code>pnpm tauri dev</code> untuk mengaktifkan bridge native.
              </p>
            )}
          </div>

          <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
            {context ? (
              <>
                <p>
                  <span className="text-white">OS:</span> {context.os}
                </p>
                <p>
                  <span className="text-white">Arsitektur:</span> {context.arch}
                </p>
                <p>
                  <span className="text-white">Profil build:</span> {context.profile}
                </p>
              </>
            ) : (
              <p className="text-slate-400">
                {status === "error"
                  ? error ?? "Terjadi kendala."
                  : "Belum ada data — coba jalankan dari shell Tauri."}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
