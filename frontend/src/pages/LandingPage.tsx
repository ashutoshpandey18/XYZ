import { Link } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';

function PreviewBox() {
  return (
    <div className="relative mx-auto mt-20 max-w-4xl px-4">
      <div className="absolute -inset-[1px] z-0 rounded-2xl overflow-hidden">
        <div
          className="absolute inset-[-200%] animate-border-spin"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, transparent 60%, var(--conic-color) 75%, transparent 90%, transparent 100%)`,
          }}
        />
      </div>

      <div className="relative z-10 rounded-2xl p-[1px]" style={{ backgroundColor: 'var(--preview-outer)', boxShadow: `0 8px 32px var(--preview-shadow)` }}>
        <div className="relative z-10 rounded-[15px] overflow-hidden" style={{ backgroundColor: 'var(--preview-inner)', borderWidth: '1px', borderColor: 'var(--preview-border)' }}>
          <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottomWidth: '1px', borderColor: 'var(--preview-border)', backgroundColor: 'var(--preview-title-bg)' }}>
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
            <span className="ml-3 text-[11px] font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
              campusmail — admin dashboard
            </span>
          </div>

          <div className="relative px-6 py-8 sm:px-10 sm:py-10 min-h-[280px] sm:min-h-[340px]">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div
                className="absolute top-0 -left-full w-[200%] h-[1px] animate-light-sweep"
                style={{ background: `linear-gradient(to right, transparent, var(--sweep-color), transparent)` }}
              />
            </div>

            <div className="relative z-10 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Pending', value: '12', colorVar: '--stat-color-1' },
                  { label: 'Approved', value: '847', colorVar: '--stat-color-2' },
                  { label: 'Issued', value: '1,204', colorVar: '--stat-color-3' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl px-4 py-4"
                    style={{ backgroundColor: 'var(--card-bg)', borderWidth: '1px', borderColor: 'var(--border)' }}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: `var(${s.colorVar})` }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderWidth: '1px', borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider" style={{ borderBottomWidth: '1px', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <span>Student</span>
                  <span>Document</span>
                  <span>Status</span>
                </div>
                {[
                  { name: 'Arjun Mehta', doc: 'college_id.pdf', status: 'Verified', dotColor: 'bg-emerald-400' },
                  { name: 'Priya Sharma', doc: 'admission_letter.jpg', status: 'Processing', dotColor: 'bg-yellow-400' },
                  { name: 'Rahul Verma', doc: 'id_card.png', status: 'Pending', dotColor: 'bg-blue-400' },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-3 last:border-0"
                    style={{ borderBottomWidth: '1px', borderColor: 'var(--border)' }}
                  >
                    <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{row.name}</span>
                    <span className="text-sm truncate font-mono" style={{ color: 'var(--text-muted)' }}>{row.doc}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className={`h-1.5 w-1.5 rounded-full ${row.dotColor} animate-pulse`} />
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderWidth: '1px', borderColor: 'var(--border)' }}>
                  <div className="h-full w-3/4 rounded-full animate-shimmer-bar" style={{ backgroundColor: 'var(--accent)', opacity: 0.3 }} />
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>OCR pipeline active</span>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--pulse-dot)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Data ─── */
const features = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: 'OCR Document Extraction',
    description: 'Tesseract-powered pipeline extracts student name, roll number, and college ID from uploaded documents automatically.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: 'AI-Powered Verification',
    description: 'Confidence scoring and automated decisions validate documents before admin review. Reduces manual effort by 80%.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Admin Approval Workflow',
    description: 'Full dashboard with approve, reject, and issue-email flows. Complete audit trail with timestamps for every action.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    title: 'Automated Email Delivery',
    description: 'Brevo SMTP delivers verified college email credentials directly. Built-in retry logic and delivery status tracking.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    title: 'Real-Time Dashboard',
    description: 'Students track status live. Admins monitor pipeline stats, issued emails, and system health from a unified panel.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: 'Enterprise-Grade Security',
    description: 'JWT auth, bcrypt hashing, encrypted credentials, RBAC, and comprehensive audit logging baked in.',
  },
];

const steps = [
  { num: '01', title: 'Student Signs Up', desc: 'Creates an account and submits their college document for verification.' },
  { num: '02', title: 'OCR + AI Processes', desc: 'Tesseract extracts data, AI validates identity and assigns a confidence score.' },
  { num: '03', title: 'Admin Reviews', desc: 'Dashboard surfaces requests with AI decision and extracted data for review.' },
  { num: '04', title: 'Email Issued', desc: 'Approved students receive verified college email credentials via SMTP delivery.' },
];

const techStack = [
  'React', 'TypeScript', 'Vite', 'TailwindCSS', 'NestJS', 'Prisma', 'PostgreSQL', 'Tesseract OCR', 'JWT', 'Brevo SMTP', 'Docker', 'Railway',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)', color: 'var(--text-primary)' }}>
      <LandingNavbar />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--hero-bg)' }}>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full"
            style={{ background: `radial-gradient(circle, var(--gradient-1) 0%, transparent 70%)` }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full"
            style={{ background: `radial-gradient(circle, var(--gradient-2) 0%, transparent 70%)` }}
          />
        </div>

        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            opacity: 'var(--grid-opacity)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-28 pb-24 text-center">
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5" style={{ borderWidth: '1px', borderColor: 'var(--badge-border)', backgroundColor: 'var(--badge-bg)' }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--badge-text)' }}>
              Production-Ready College Email Automation
            </span>
          </div>

          <h1
            className="mx-auto max-w-4xl text-4xl font-bold tracking-[-0.025em] sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
          >
            Issue College Emails{' '}
            <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              in Minutes, Not Weeks
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8" style={{ color: 'var(--text-secondary)' }}>
            End-to-end automation for college email issuance. Students upload documents,
            OCR&nbsp;+&nbsp;AI extracts and verifies identity, admins approve with one click,
            and verified credentials are delivered instantly.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)' }}
            >
              Get Started Free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ borderWidth: '1px', borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
            >
              Sign In to Dashboard
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 pt-10 max-w-xl mx-auto" style={{ borderTopWidth: '1px', borderColor: 'var(--border)' }}>
            {[
              { value: '< 2 min', label: 'Avg. Processing' },
              { value: '95%+', label: 'AI Accuracy' },
              { value: 'Zero', label: 'Manual Entry' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Preview Box */}
          <PreviewBox />
        </div>
      </section>

      <section id="features" className="relative py-28" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--badge-text)' }}>
              Capabilities
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Everything You Need to Automate Email Issuance
            </h2>
            <p className="mt-4 text-base" style={{ color: 'var(--text-secondary)' }}>
              Built with production-grade engineering. Every component designed for reliability, security, and scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl p-6 transition-all"
                style={{ borderWidth: '1px', borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--accent)' }}>
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-28" style={{ backgroundColor: 'var(--section-alt-bg)' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--badge-text)' }}>
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Four Steps to a Verified College Email
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px" style={{ background: `linear-gradient(to right, var(--border), transparent)` }} />
                )}
                <div className="text-3xl font-bold mb-3" style={{ color: 'var(--badge-bg)' }}>{step.num}</div>
                <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Ready to Automate Your College Email Workflow?
            </h2>
            <p className="mt-4 text-base" style={{ color: 'var(--text-secondary)' }}>
              Stop processing email requests manually. Deploy a production-grade system that handles verification, approval, and delivery automatically.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all"
                style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)' }}
              >
                Get Started Free
              </Link>
              <a
                href="https://github.com/ashutoshpandey18/XYZ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold transition-colors"
                style={{ borderWidth: '1px', borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View Source
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer id="tech" className="py-8" style={{ borderTopWidth: '1px', borderColor: 'var(--border)', backgroundColor: 'var(--hero-bg)' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] mr-1" style={{ color: 'var(--text-muted)' }}>
              Built with
            </span>
            {techStack.map((tech) => (
              <span
                key={tech}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                style={{ color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', borderWidth: '1px', borderColor: 'var(--border)' }}
              >
                {tech}
              </span>
            ))}
          </div>
          <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} CampusMail &middot; Built by{' '}
            <a
              href="https://github.com/ashutoshpandey18"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Ashutosh Pandey
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
