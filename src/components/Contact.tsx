"use client";

import { useState, type FormEvent } from "react";
import { profile, socials, formspreeEndpoint } from "@/lib/data";
import { iconMap } from "@/components/icons";

type Status = "idle" | "submitting" | "sent" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  // Submits directly to Formspree (https://formspree.io/f/...) — no backend
  // code needed. Manage/export submissions from the Formspree dashboard.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="section-shell py-20 sm:py-28">
      <p className="text-sm font-mono text-accent mb-3">Contact</p>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
        Let&apos;s build something together
      </h2>
      <p className="text-muted max-w-xl mb-12">
        Have a project in mind or just want to say hi? My inbox is always
        open — I&apos;ll get back to you as soon as I can.
      </p>

      <div className="grid lg:grid-cols-5 gap-10">
        <form onSubmit={handleSubmit} className="lg:col-span-3 card p-6 sm:p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-xs text-muted mb-2">
                Name
              </label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg bg-surface border border-border px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs text-muted mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg bg-surface border border-border px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                placeholder="jane@example.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="block text-xs text-muted mb-2">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-lg bg-surface border border-border px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors resize-none"
              placeholder="Tell me a bit about your project..."
            />
          </div>
          <button
            type="submit"
            disabled={status === "submitting" || status === "sent"}
            className="w-full sm:w-auto rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "submitting"
              ? "Sending..."
              : status === "sent"
                ? "Message sent ✓"
                : "Send message"}
          </button>
          {status === "sent" && (
            <p className="text-sm text-muted">
              Thanks for reaching out — I&apos;ll get back to you soon.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-danger">
              Something went wrong sending that — mind trying again, or
              emailing me directly at{" "}
              <a href={`mailto:${profile.email}`} className="underline">
                {profile.email}
              </a>
              ?
            </p>
          )}
        </form>

        <div className="lg:col-span-2 card p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs text-muted mb-1">Email</p>
            <a href={`mailto:${profile.email}`} className="text-foreground hover:text-accent">
              {profile.email}
            </a>
          </div>
          {profile.location && (
            <div>
              <p className="text-xs text-muted mb-1">Location</p>
              <p>{profile.location}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted mb-3">Elsewhere</p>
            <div className="flex items-center gap-4">
              {socials.map((social) => {
                const Icon = iconMap[social.icon];
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target={social.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="text-muted hover:text-accent transition-colors"
                  >
                    {Icon ? <Icon size={20} /> : social.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
