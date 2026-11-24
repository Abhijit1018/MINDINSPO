import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowUpRight, Sparkles, Lightbulb, Users, Zap, Brain,
  MessageSquare, GitBranch, TrendingUp, ChevronRight
} from 'lucide-react';
import { displayTitle, thumbUrl, imgFallback } from '../lib/ideaDisplay';

/* ─── Marquee Band ─── */
function MarqueeBand() {
  const items = [
    'AI-Powered Research', 'Architecture Diagrams', 'Tech Stack Analysis',
    'Market Validation', 'Idea Incubation', 'Find Co-founders',
    'Chat With Your Idea', 'Remix Ideas', 'Build Together'
  ];
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-4 bg-mi-accent">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="mx-8 font-heading text-xl tracking-wider text-white/90 flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Stats counter ─── */
function StatCounter({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-heading text-[clamp(2.5rem,5vw,4rem)] leading-none text-white">{value}</div>
      <div className="font-body text-sm text-mi-text-muted mt-1 tracking-wide">{label}</div>
    </div>
  );
}

/* ─── Home Page ─── */
export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 1.05]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const [stats, setStats] = useState({ loaded: false, total_users: 0, total_ideas: 0, public_ideas: 0, recent: [], recent_users: [] });

  useEffect(() => {
    const base = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '') || 'http://localhost:5000';
    // Cold backend can take ~45s; give up after 20s rather than spin forever.
    fetch(`${base}/api/stats`, { signal: AbortSignal.timeout(20000) })
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(prev => ({ ...prev, ...(d || {}), loaded: true })))
      // Failure/timeout: stop showing skeletons; sections with no real data hide.
      .catch(() => setStats(prev => ({ ...prev, loaded: true })));
  }, []);

  const features = [
    { icon: Lightbulb, title: 'Drop a raw idea', desc: 'A sentence, a tool name, a shower thought. No template, no blank-page pressure.' },
    { icon: Brain, title: 'Get the research', desc: 'Summary, suggested tech stack, strengths and risks, what already exists, and a concept image.' },
    { icon: GitBranch, title: 'See how it would work', desc: 'An architecture diagram generated for every idea, so you can reason about the build.' },
    { icon: TrendingUp, title: 'Validate with real people', desc: 'Publish it and builders tell you if they would use it, and what they would pay in rupees.' },
    { icon: Users, title: 'Find who you need', desc: 'Mark what you are looking for (co-founder, designer, developer) and let the right people reach out.' },
    { icon: MessageSquare, title: 'Iterate with AI', desc: 'Chat with your idea, ask what to cut, and accept or reject the changes it proposes.' },
  ];

  return (
    <div className="overflow-hidden relative" style={{ position: 'relative' }}>
      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-end overflow-hidden" style={{ position: 'relative' }}>
        {/* Background video */}
        <motion.div
          style={{ scale: heroScale }}
          className="absolute inset-0 z-0"
        >
          <img
            src="/hero-bg.png"
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Subtle gradient to ensure text readability on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-mi-bg via-mi-bg/60 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(255,77,0,0.05),transparent)]" />

          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,77,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,0,0.4) 1px, transparent 1px)',
              backgroundSize: '80px 80px'
            }}
          />
        </motion.div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-mi-bg to-transparent z-[1]" />

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 min-h-screen flex items-center"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full pt-16">
            {/* Left side: branding and description */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-mi-accent animate-pulse" />
                <span className="font-heading text-sm tracking-[0.2em] text-mi-accent uppercase">AI-Powered Incubator</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-editorial text-[clamp(3rem,10vw,7.5rem)] leading-[0.9] tracking-tight text-white mb-6"
              >
                <span className="italic">mind</span>
                <span className="text-mi-accent font-heading not-italic tracking-wide">INSPO.</span>
              </motion.h1>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-heading text-2xl md:text-3xl text-white/90 tracking-wide mt-2 mb-8 max-w-lg leading-snug"
              >
                / TRANSFORM RAW IDEAS INTO STRUCTURED <span className="text-mi-accent">INTELLIGENCE.</span>
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-body text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-lg"
              >
                Drop any concept, tool, or fleeting thought. Our AI pipeline researches, structures,
                and visualizes it — turning sparks into blueprints.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4 items-center"
              >
                <Link to="/login?mode=register" className="btn-primary py-3.5 px-8 text-base shadow-lg shadow-mi-accent/20">
                  Start Building
                  <ArrowUpRight size={18} />
                </Link>
                <Link to="/community" className="btn-secondary py-3.5 px-8 text-base">
                  Explore
                </Link>
              </motion.div>

              {/* Social proof */}
              {stats.loaded && stats.total_users > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-16 flex items-center gap-4"
              >
                <div className="flex -space-x-3">
                  {(stats.recent_users || []).map((u, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-mi-bg shadow-sm overflow-hidden bg-mi-surface flex items-center justify-center">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.initials} className="w-full h-full object-cover" />
                        : <span className="font-heading text-xs text-white/80 tracking-wide">{u.initials}</span>
                      }
                    </div>
                  ))}
                </div>
                <p className="font-body text-sm text-white/50">
                  <span className="text-white font-medium">{stats.total_users} builders</span> already incubating
                </p>
              </motion.div>
              )}
            </div>

            {/* Right side: Empty space to let the planet image show through */}
            <div className="hidden lg:block pointer-events-none">
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          MARQUEE BAND
          ═══════════════════════════════════════════ */}
      <MarqueeBand />

      {/* ═══════════════════════════════════════════
          WHAT WE DO — Editorial split section
          ═══════════════════════════════════════════ */}
      <section className="relative py-32 bg-mi-cream text-[#1a1a1a]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Left — editorial text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="section-label mb-6 before:!bg-mi-accent"
              >
                <span className="text-[#666]">How it works</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-editorial text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] text-[#1a1a1a] mb-8"
              >
                dive into the <span className="text-mi-accent italic">/</span> future with past ideas —
              </motion.h2>

              <div className="space-y-4 font-body text-[#555] text-base leading-relaxed max-w-lg">
                <p>
                  MindInspo isn't just another note-taking app. It's an <strong className="text-[#1a1a1a]">AI-powered research engine</strong> that
                  takes your raw, unstructured thoughts and transforms them into comprehensive technical catalogs.
                </p>
                <p>
                  Every idea gets a full breakdown: recommended tech stack, pros & cons analysis,
                  competitive landscape, architecture diagrams, and even a generated concept image.
                </p>
              </div>

              {/* Process steps */}
              <div className="mt-12 space-y-0 border-l-2 border-mi-accent/30 ml-1">
                {[
                  { step: '/01', title: 'Drop Your Idea', text: 'Type any raw concept, tool, or thought' },
                  { step: '/02', title: 'AI Researches', text: 'Market, stack and architecture in about 15 seconds' },
                  { step: '/03', title: 'Get Your Catalog', text: 'Tech stack, diagrams, analysis — all automated' },
                  { step: '/04', title: 'Share & Collaborate', text: 'Publish to community, find co-builders' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="pl-6 py-4 group"
                  >
                    <span className="font-heading text-mi-accent text-sm tracking-wider">{item.step}</span>
                    <h3 className="font-heading text-xl tracking-wide text-[#1a1a1a] mt-1">{item.title}</h3>
                    <p className="font-body text-sm text-[#777] mt-0.5">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right — image/card showcase */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                {/* Card: a real community idea when one is available */}
                {stats.recent?.[0] ? (
                  <Link to={`/idea/${stats.recent[0].id}`} className="block bg-[#1a1a1e] rounded-2xl overflow-hidden shadow-2xl group">
                    {stats.recent[0].image_url && (
                      <img src={thumbUrl(stats.recent[0].image_url, 900)} alt="" loading="lazy" className="w-full aspect-[16/9] object-cover" onError={imgFallback(stats.recent[0].image_url)} />
                    )}
                    <div className="p-6 space-y-3">
                      <span className="px-3 py-1 bg-mi-accent/20 text-mi-accent text-xs font-body font-semibold rounded-full">LIVE FROM THE COMMUNITY</span>
                      <h4 className="text-2xl font-semibold text-white leading-tight group-hover:text-mi-accent transition-colors">{displayTitle(stats.recent[0])}</h4>
                      <p className="text-white/70 font-body text-sm leading-relaxed line-clamp-3">{stats.recent[0].tagline || stats.recent[0].summary}</p>
                      <span className="inline-flex items-center gap-1 text-sm text-mi-accent">See the full breakdown <ArrowUpRight size={15} /></span>
                    </div>
                  </Link>
                ) : (
                <div className="bg-[#1a1a1e] rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="px-3 py-1 bg-white/10 text-white/70 text-xs font-body font-semibold rounded-full">EXAMPLE BREAKDOWN</span>
                        <h4 className="font-heading text-2xl tracking-wide text-white mt-3">AI-POWERED CODE REVIEW</h4>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-white/70 font-body text-sm leading-relaxed">
                      An automated code review tool that uses LLMs to analyze pull requests, detect bugs,
                      suggest improvements, and enforce team coding standards in real-time.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Python', 'GPT-4', 'GitHub API', 'AST Parser', 'Docker'].map(tech => (
                        <span key={tech} className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 text-xs font-body rounded-lg">
                          {tech}
                        </span>
                      ))}
                    </div>
                    {/* Mini mermaid mockup */}
                    <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <GitBranch size={14} className="text-mi-accent" />
                        <span className="text-xs text-white/40 font-body">Architecture Diagram</span>
                      </div>
                      <div className="space-y-2">
                        {['PR Submitted → Webhook Trigger', 'Code Parse → AST Analysis', 'LLM Review → Report Generation', 'Slack Notification → Dashboard Update'].map((line, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-mi-accent/60" />
                            <span className="text-xs text-white/50 font-body">{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}

                <div className="absolute -top-4 -right-4 bg-mi-accent text-white px-4 py-2 rounded-full font-heading text-sm tracking-wider shadow-lg">
                  AI GENERATED
                </div>
              </motion.div>

              {/* Price-like tag from reference */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex justify-end"
              >
                <div className="text-right">
                  <span className="font-heading text-5xl text-[#1a1a1a]">FREE</span>
                  <p className="font-body text-sm text-[#6b6b6b] mt-1">No credit card. Your ideas stay private until you publish.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES GRID — Dark section
          ═══════════════════════════════════════════ */}
      <section className="relative py-32 bg-mi-bg noise-overlay">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-16">
            <div>
              <div className="section-label mb-4">From idea to signal</div>
              <h2 className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-wide text-white">
                WHAT YOU <span className="text-mi-accent">/</span>
                <br />
                GET.
              </h2>
            </div>
          </div>

          <ol className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 border-t border-mi-border">
            {features.map((f, i) => (
              <motion.li
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: (i % 2) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-6 py-8 border-b border-mi-border"
              >
                <span className="font-heading text-3xl text-mi-accent leading-none w-10 shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-semibold text-white"><f.icon size={18} className="text-mi-text-secondary" /> {f.title}</h3>
                  <p className="mt-2 font-body text-mi-text-secondary leading-relaxed max-w-md">{f.desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS BAR
          ═══════════════════════════════════════════ */}
      {stats.loaded && stats.total_ideas > 0 && (
      <section className="py-16 border-b border-mi-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={stats.total_users} label="Builders" />
            <StatCounter value={stats.total_ideas} label="Ideas researched" />
            <StatCounter value={stats.public_ideas} label="Published for feedback" />
            <StatCounter value="~15s" label="From idea to breakdown" />
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════
          LATEST / CTA SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative py-32 bg-mi-bg">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-4">Get Started Today</div>
              <h2 className="font-heading text-[clamp(2.5rem,5vw,4rem)] leading-[0.95] tracking-wide text-white mb-6">
                / LATEST
                <br />
                <span className="text-mi-text-muted">IDEAS.</span>
              </h2>
              <p className="font-body text-mi-text-secondary text-base leading-relaxed max-w-md mb-8">
                Join the community of builders, thinkers, and creators. Share your ideas,
                get AI-powered analysis, and find collaborators to bring them to life.
              </p>
              <Link to="/community" className="btn-primary">
                Browse Community
                <ArrowUpRight size={16} />
              </Link>
            </div>

            {/* Latest real ideas */}
            {stats.recent?.length > 0 ? (
              <ul className="rounded-2xl border border-mi-border bg-mi-surface divide-y divide-mi-border overflow-hidden">
                {stats.recent.map((card) => (
                  <li key={card.id}>
                    <Link to={`/idea/${card.id}`} className="group flex items-center gap-4 p-4 sm:p-5 hover:bg-white/[0.03] transition-colors">
                      {card.image_url ? (
                        <img src={thumbUrl(card.image_url, 160)} alt="" loading="lazy" width="64" height="64" className="w-16 h-16 rounded-xl object-cover ring-1 ring-mi-border shrink-0" onError={imgFallback(card.image_url)} />
                      ) : <span className="w-16 h-16 rounded-xl bg-mi-surface-2 shrink-0" />}
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-semibold text-white truncate group-hover:text-mi-accent transition-colors">{displayTitle(card)}</span>
                        <span className="block font-body text-sm text-mi-text-secondary line-clamp-2 mt-0.5">{card.tagline || card.summary}</span>
                      </span>
                      <ChevronRight size={20} className="text-mi-text-muted group-hover:text-mi-accent shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : !stats.loaded ? (
              <div className="rounded-2xl border border-mi-border bg-mi-surface divide-y divide-mi-border" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-5 animate-pulse">
                    <span className="w-16 h-16 rounded-xl bg-white/[0.05]" />
                    <span className="flex-1 space-y-2"><span className="block h-4 w-1/2 rounded bg-white/[0.06]" /><span className="block h-3 w-3/4 rounded bg-white/[0.05]" /></span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
