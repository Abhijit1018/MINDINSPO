import React from 'react';
import { Link } from 'react-router-dom';

// Contact for privacy/grievance requests. Set VITE_CONTACT_EMAIL on Netlify.
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || '';
const LAST_UPDATED = '24 November 2026';

function Contact() {
  if (CONTACT_EMAIL) {
    return <a href={`mailto:${CONTACT_EMAIL}`} className="text-mi-accent hover:underline">{CONTACT_EMAIL}</a>;
  }
  return (
    <a href="https://github.com/Abhijit1018" target="_blank" rel="noreferrer" className="text-mi-accent hover:underline">
      github.com/Abhijit1018
    </a>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-heading text-xl tracking-wide text-white mb-3">{title}</h2>
      <div className="font-body text-[15px] leading-relaxed text-mi-text-secondary space-y-3">{children}</div>
    </section>
  );
}

function Shell({ title, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="section-label mb-3">Legal</p>
      <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-white mb-2">{title}</h1>
      <p className="font-body text-sm text-mi-text-secondary mb-12">Last updated: {LAST_UPDATED}</p>
      {children}
      <p className="font-body text-sm text-mi-text-secondary border-t border-mi-border pt-6">
        See also: <Link to="/privacy" className="text-mi-accent hover:underline">Privacy Policy</Link>
        {' · '}
        <Link to="/terms" className="text-mi-accent hover:underline">Terms of Service</Link>
      </p>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <Shell title="Privacy Policy">
      <Section title="Who we are">
        <p>
          MindInspo is an AI-powered idea incubator. This policy explains what personal data we process,
          why, and the rights you have, including under India's Digital Personal Data Protection Act, 2023.
        </p>
      </Section>

      <Section title="What we collect">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Account data</strong>: email address, name and profile picture (from email sign-up or Google sign-in), plus any bio, skills and social links you add to your profile.</li>
          <li><strong className="text-white">Content you create</strong>: ideas and tools you submit, the AI-generated research about them, chat messages with the AI assistant, updates, comments, reactions, likes, bookmarks, follows, connect requests, and collaboration workspace tasks and notes.</li>
          <li><strong className="text-white">Technical data</strong>: your IP address is used briefly to rate-limit abuse, and our hosting providers keep standard server logs. We do not use advertising or tracking cookies. Your sign-in session is kept in your browser's local storage.</li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul className="list-disc pl-5 space-y-2">
          <li>To run the service: sign you in, generate research for your ideas, and show your content to you and to the people you share it with.</li>
          <li>To power community features when you publish an idea: published ideas, your name and avatar are visible to everyone, and other users can react to, comment on, and remix (fork a private copy of) them.</li>
          <li>To keep the service secure and prevent abuse.</li>
        </ul>
        <p>We do not sell your personal data and we do not show ads.</p>
      </Section>

      <Section title="Who processes it">
        <p>We rely on these service providers, who process data on our behalf to run the service:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Supabase</strong>: authentication and database.</li>
          <li><strong className="text-white">Render</strong> (API) and <strong className="text-white">Netlify</strong> (website): hosting.</li>
          <li><strong className="text-white">n8n, Groq and other AI model providers</strong>: the text of ideas and chat messages you submit is sent to them to generate research and replies.</li>
          <li><strong className="text-white">fal.ai</strong> (image generation) and <strong className="text-white">ImgBB</strong> (image hosting): concept images for your ideas.</li>
        </ul>
        <p>Some of these providers process data outside India. Don't submit sensitive personal information as idea text.</p>
      </Section>

      <Section title="Retention and deletion">
        <p>
          We keep your data while your account is active. You can delete your account any time from
          {' '}<Link to="/settings" className="text-mi-accent hover:underline">Settings</Link>. Deleting your account
          permanently erases your profile, your ideas (including published ones), and your activity, including
          comments, reactions, chats and collaboration data. Remixes other people made of your published ideas
          are their own copies and are not deleted.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can access and correct your data in the app, erase it by deleting your account, and withdraw
          consent at any time by deleting your account. For any other request, or to raise a grievance, contact us
          at <Contact />. We aim to respond within 30 days.
        </p>
      </Section>

      <Section title="Children">
        <p>MindInspo is not intended for anyone under 18. Don't use it if you are under 18.</p>
      </Section>

      <Section title="Changes">
        <p>If we materially change this policy, we will update the date above and notify you in the app.</p>
      </Section>
    </Shell>
  );
}

export function TermsPage() {
  return (
    <Shell title="Terms of Service">
      <Section title="Using MindInspo">
        <p>
          By creating an account or using MindInspo you agree to these terms and to our
          {' '}<Link to="/privacy" className="text-mi-accent hover:underline">Privacy Policy</Link>.
          You must be 18 or older and responsible for activity on your account.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You own the ideas and content you submit. You give MindInspo permission to store, process (including
          with the AI providers listed in the Privacy Policy) and display that content in order to run the service.
        </p>
        <p>
          <strong className="text-white">When you publish an idea, it becomes public.</strong> Anyone can view it, and
          signed-in users can react, comment and <em>remix</em> it, which creates their own private copy they can
          build on. If you don't want that, keep the idea private. You can unpublish it at any time, but copies
          already remixed stay with the people who made them.
        </p>
      </Section>

      <Section title="AI-generated output">
        <p>
          Research, summaries, diagrams, images and chat replies are generated by AI and may be inaccurate,
          incomplete or similar to existing products. They are not legal, financial or professional advice. Verify
          anything important before relying on it.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>Don't use MindInspo to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>post unlawful, infringing, hateful, harassing or sexually explicit content, or other people's private data;</li>
          <li>spam, scrape, overload, or try to bypass security or rate limits;</li>
          <li>impersonate others or misuse connect requests and collaboration invites.</li>
        </ul>
        <p>We may remove content or suspend accounts that break these rules.</p>
      </Section>

      <Section title="The service">
        <p>
          MindInspo is provided "as is", without warranties. Features may change, and the service may be
          interrupted. To the extent the law allows, we are not liable for indirect or consequential losses or for
          loss of data, profits or business opportunities arising from your use of the service.
        </p>
      </Section>

      <Section title="Ending your use">
        <p>You can stop using MindInspo and delete your account at any time from Settings.</p>
      </Section>

      <Section title="Law and contact">
        <p>These terms are governed by the laws of India. Questions: <Contact />.</p>
      </Section>
    </Shell>
  );
}
