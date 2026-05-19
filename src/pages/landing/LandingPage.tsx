import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, ArrowRight, ScrollText, CheckSquare, Bot, Calendar,
  Users, FileText, Sparkles, ChevronDown, BarChart3, Mail,
  GraduationCap,
} from 'lucide-react'
import AnimatedTestimonials from '@/components/ui/testimonial'
import { LogoCarousel } from '@/components/ui/logo-carousel'
import './landing.css'

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }

const FEATURES = [
  {
    badge: 'Paper Generation', icon: ScrollText, bg: 'blue',
    title: 'AI-Powered Paper Creator',
    desc: 'Generate perfectly structured exam papers in seconds. Choose difficulty, question types, marks distribution — AI handles the rest using your uploaded course materials.',
    img: '/images/landing/paper_generator.png',
    cta: 'Generate Your First Paper',
  },
  {
    badge: 'Smart Grading', icon: CheckSquare, bg: 'teal',
    title: 'Instant OCR Grading',
    desc: 'Upload scanned answer sheets and watch AI grade them instantly with detailed per-question feedback, score breakdowns, and confidence indicators.',
    img: '/images/landing/grading_preview.png',
    cta: 'Grade Your First Sheet',
  },
  {
    badge: 'AI Assistant', icon: Bot, bg: 'purple',
    title: 'RAG-Powered AI Assistant',
    desc: 'Ask questions and get accurate answers grounded in your own uploaded textbooks and study materials. Like having an AI teaching assistant available 24/7.',
    img: '/images/landing/ai_assistant.png',
    cta: 'Ask Your First Question',
  },
  {
    badge: 'Scheduling', icon: Calendar, bg: 'amber',
    title: 'Smart Schedule & Calendar',
    desc: 'Powerful scheduling system to manage your classes, exams, and deadlines. Color-coded calendar with reminders keeps you organized effortlessly.',
    img: '/images/landing/schedule_preview.png',
    cta: 'Organize Your Schedule',
  },
  {
    badge: 'Attendance', icon: Users, bg: 'rose',
    title: 'Advanced Attendance Tracking',
    desc: 'Record and analyze attendance with heatmaps, trend charts, and student performance indicators. Identify at-risk students before it\'s too late.',
    img: '/images/landing/attendance_preview.png',
    cta: 'Track Your Class',
  },
  {
    badge: 'Assignments', icon: Mail, bg: 'sky',
    title: 'Assignment Collection & Auto-Grading',
    desc: 'Students submit via email — the system automatically collects, processes, and grades assignments using AI. Review results in a beautiful dashboard.',
    img: '/images/landing/dashboard_preview.png',
    cta: 'Set Up Auto-Grading',
  },
]

const TESTIMONIALS = [
  {
    quote: 'EduMaster cut my grading time by 80%. What used to take an entire Sunday now takes 20 minutes. The OCR grading is incredibly accurate.',
    name: 'Sarah Kennedy',
    designation: 'Biology Teacher, Springfield HS',
    src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500&auto=format&fit=crop',
  },
  {
    quote: 'The AI paper generator is incredible. I create differentiated exams for different ability groups instantly. The scheduling system keeps my entire department organized.',
    name: 'James Rodriguez',
    designation: 'Math Department Head',
    src: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=500&auto=format&fit=crop',
  },
  {
    quote: 'The RAG assistant answers questions directly from my textbooks. Combined with auto-grading assignments, I\'ve reclaimed hours every single week.',
    name: 'Maria Lopez',
    designation: 'Chemistry Teacher',
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop',
  },
  {
    quote: 'The attendance tracking with heatmaps changed how I identify struggling students. I can intervene weeks earlier than before. Truly a game-changer.',
    name: 'David Chen',
    designation: 'English Teacher, Lincoln Academy',
    src: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=500&auto=format&fit=crop',
  },
  {
    quote: 'Assignment auto-collection via email saved my sanity. Students just email their work and it\'s graded by the time I check. The ROI was immediate.',
    name: 'Fatima Al-Rashid',
    designation: 'Physics Teacher, Central High',
    src: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=500&auto=format&fit=crop',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between py-5 text-left gap-4 group">
        <span className="font-semibold text-[#0a1628] group-hover:text-[#2d7dd2] transition-colors">{q}</span>
        <ChevronDown className={`w-5 h-5 text-[#2d7dd2] shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-[15px] text-[#5a7a9e] leading-relaxed">{a}</p>}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── NAV ── */}
      <nav className={`landing-nav fixed top-0 left-0 right-0 z-50 ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-[1200px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0281FF' }}>
              <BookOpen className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="font-extrabold text-[20px] text-[#0a1628]">EduMaster</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-[14px] font-medium text-[#3d5a80]">
            <a href="#features" className="hover:text-[#2d7dd2] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#2d7dd2] transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-[#2d7dd2] transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-[#2d7dd2] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex text-[14px] font-semibold text-[#3d5a80] hover:text-[#2d7dd2] transition-colors px-4 py-2">
              Login
            </Link>
            <Link to="/register" style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '13px', padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: 'none' }}>
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO — padded rounded card with teacher-assistant workspace background ── */}
      <div className="hero-wrapper">
      <section className="landing-hero">
        <div className="hero-background" aria-hidden="true">
          <div className="hero-bg-grid" />

          <div className="hero-workspace-panel">
            <div className="hero-workspace-header">
              <div className="hero-window-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="hero-workspace-title">AI Teaching Workspace</span>
              <span className="hero-workspace-status">Live</span>
            </div>
            <div className="hero-workspace-body">
              <div className="hero-metric-card">
                <ScrollText className="w-4 h-4" />
                <span>Paper creator</span>
                <strong>15 questions</strong>
              </div>
              <div className="hero-metric-card">
                <CheckSquare className="w-4 h-4" />
                <span>Grading queue</span>
                <strong>87/100</strong>
              </div>
              <div className="hero-metric-card">
                <Users className="w-4 h-4" />
                <span>Attendance</span>
                <strong>96%</strong>
              </div>
              <div className="hero-metric-card">
                <Bot className="w-4 h-4" />
                <span>Class AI</span>
                <strong>Ready</strong>
              </div>
            </div>
          </div>

          <div className="hero-snapshot hero-snapshot-paper">
            <div className="hero-snapshot-label">
              <ScrollText className="w-4 h-4" />
              <span>Generate exams</span>
            </div>
            <img src="/images/landing/paper_generator.png" alt="" />
          </div>

          <div className="hero-snapshot hero-snapshot-chat">
            <div className="hero-snapshot-label">
              <Bot className="w-4 h-4" />
              <span>Ask class material</span>
            </div>
            <img src="/images/landing/ai_assistant.png" alt="" />
          </div>

          <div className="hero-snapshot hero-snapshot-grading">
            <div className="hero-snapshot-label">
              <CheckSquare className="w-4 h-4" />
              <span>Grade answer sheets</span>
            </div>
            <img src="/images/landing/grading_preview.png" alt="" />
          </div>

          <div className="hero-snapshot hero-snapshot-attendance">
            <div className="hero-snapshot-label">
              <Users className="w-4 h-4" />
              <span>Track class presence</span>
            </div>
            <img src="/images/landing/attendance_preview.png" alt="" />
          </div>
        </div>

        <div className="hero-inner">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[800px] mx-auto text-center space-y-6">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/90 text-[12px] font-semibold px-5 py-2.5 rounded-full border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> AI assistant for teachers and classrooms
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-[44px] md:text-[60px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              Your AI Teaching<br />Assistant for <span className="text-[#a7f3d0]">Every Class</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[17px] md:text-[19px] text-white/65 max-w-[560px] mx-auto leading-relaxed">
              Generate papers, grade answer sheets, track attendance, manage schedules, and ask questions from your own course materials in one teacher workspace.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
              <Link to="/register" style={{ background: 'white', color: '#0f172a', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '12px', fontWeight: 600, fontSize: '15px', padding: '14px 36px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'all 0.3s', boxShadow: 'none' }}>
                Start For Free
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Trust strip inside hero at bottom */}
        <div className="hero-trust">
          <div className="hero-trust-label">Built around daily teacher workflows</div>
          <div className="hero-trust-items">
            {[
              { v: '2,500+', l: 'Teachers' },
              { v: '180K+', l: 'Papers' },
              { v: '500K+', l: 'Graded' },
              { v: '95%', l: 'Time Saved' },
              { v: '4.9★', l: 'Rating' },
            ].map(s => (
              <div key={s.l} className="hero-trust-item">
                <div className="val">{s.v}</div>
                <div className="lbl">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* ── LOGO CAROUSEL ── */}
      <LogoCarousel
        title="Trusted by educators worldwide"
        logos={[
          'https://cdn.worldvectorlogo.com/logos/microsoft-5.svg',
          'https://cdn.worldvectorlogo.com/logos/openai-2.svg',
          'https://cdn.worldvectorlogo.com/logos/notion-2.svg',
          'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg',
          'https://cdn.worldvectorlogo.com/logos/zoom-app.svg',
          'https://cdn.worldvectorlogo.com/logos/github-icon-1.svg',
          'https://cdn.worldvectorlogo.com/logos/stripe-4.svg',
          'https://cdn.worldvectorlogo.com/logos/aws-2.svg',
          'https://cdn.worldvectorlogo.com/logos/python-5.svg',
          'https://cdn.worldvectorlogo.com/logos/react-2.svg',
          'https://cdn.worldvectorlogo.com/logos/typescript.svg',
          'https://cdn.worldvectorlogo.com/logos/vercel.svg',
        ]}
        speed={30}
        logoHeight="26px"
      />

      {/* ── FEATURES (alternating, Instantly-style) ── */}
      <div id="features">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center pt-24 pb-8 px-6"
        >
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#0f172a] tracking-tight leading-tight">
            Everything a Teacher Needs, Instantly
          </h2>
        </motion.div>

        {FEATURES.map((f, i) => (
          <section key={f.badge} className="feature-section">
            <div className={`feature-row ${i % 2 === 1 ? 'reversed' : ''}`}>
              <motion.div
                className="feature-content"
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
              >
                <h2 className="feature-title">{f.title}</h2>
                <p className="feature-desc">{f.desc}</p>
                <Link to="/register" className="feature-cta">
                  {f.cta}
                </Link>
              </motion.div>
              <motion.div
                className="feature-image"
                initial={{ opacity: 0, x: i % 2 === 0 ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
              >
                <div className={`feature-image-bg ${f.bg}`}>
                  <div className="feature-glass-layer">
                    <div className="feature-image-wrapper">
                      <img src={f.img} alt={f.title} loading="lazy" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-[#f7fafd]">
        <div className="max-w-[1140px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#2d7dd2] font-semibold text-[13px] uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-[40px] font-extrabold text-[#0a1628] tracking-tight">Looks So Good, It's Like Cheating</h2>
            <p className="text-[17px] text-[#5a7a9e] mt-3 max-w-[500px] mx-auto">Set up in minutes. Save hours every week. Here's how.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileText, num: '01', title: 'Upload Materials', desc: 'Add PDFs, textbooks, and study guides to your document library.' },
              { icon: Sparkles, num: '02', title: 'Generate with AI', desc: 'Create exam papers, quizzes, or assignments — just describe what you need.' },
              { icon: CheckSquare, num: '03', title: 'Grade Instantly', desc: 'Upload answer sheets and get detailed AI grading reports in seconds.' },
              { icon: BarChart3, num: '04', title: 'Track & Analyze', desc: 'Monitor class performance, attendance trends, and student progress.' },
            ].map(step => (
              <motion.div key={step.num} variants={fadeUp} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: '#0281FF' }}>
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-[32px] font-extrabold text-[#e8f0f8] mb-2">{step.num}</p>
                <h3 className="font-bold text-[#0a1628] text-[16px] mb-2">{step.title}</h3>
                <p className="text-[14px] text-[#5a7a9e] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-16 px-6">
        <div className="max-w-[1140px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-4">
            <p className="text-[#0281FF] font-semibold text-[13px] uppercase tracking-widest mb-3">Customer Testimonials</p>
            <h2 className="text-[40px] font-extrabold text-[#0f172a] tracking-tight">Real Results. Real Educators.</h2>
          </motion.div>
          <AnimatedTestimonials testimonials={TESTIMONIALS} autoplay />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-[#f7fafd]">
        <div className="max-w-[680px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[#2d7dd2] font-semibold text-[13px] uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-[36px] font-extrabold text-[#0a1628] tracking-tight">Common Questions</h2>
          </motion.div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            {[
              { q: 'How does AI grading work?', a: 'Students\' answer sheets are uploaded as images. Our OCR engine extracts the text, then our AI compares each answer against the marking scheme to award scores with detailed feedback.' },
              { q: 'What features are included?', a: 'Paper generation, OCR grading, RAG AI assistant, schedule & calendar management, attendance tracking, assignment collection via email with auto-grading, analytics dashboard, and class management.' },
              { q: 'What file formats are supported?', a: 'We support PDF, DOCX, and images (PNG, JPG) for documents and answer sheets.' },
              { q: 'Is my data secure?', a: 'All data is encrypted at rest and in transit. We never use your content to train AI models. You own your data.' },
              { q: 'How does assignment collection work?', a: 'Students submit assignments via email to a designated address. The system automatically collects, processes, and grades them using AI, presenting results in your dashboard.' },
              { q: 'Can I try it for free?', a: 'Yes! Our Free plan includes core features with no credit card required. Upgrade anytime for unlimited access.' },
            ].map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bottom-cta">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-[700px] mx-auto text-center relative z-[1]"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ background: '#0281FF' }}>
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-white leading-tight tracking-tight">
            Start Building Your<br />AI Teaching Toolkit
          </h2>
          <p className="text-white/60 text-[17px] mt-4 mb-8">
            Stop spending hours on manual grading and paper creation. Join thousands of educators who've made the switch to EduMaster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" style={{ background: 'white', color: '#0f172a', border: 'none', borderRadius: '100px', fontWeight: 600, fontSize: '14px', padding: '14px 32px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '100px', fontWeight: 600, fontSize: '14px', padding: '14px 32px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              See pricing
            </Link>
          </div>
          <p className="text-white/40 text-[13px] mt-6">No credit card required.</p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0281FF' }}>
                <BookOpen className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="font-extrabold text-[18px] text-white">EduMaster</span>
            </div>
            <p className="text-[14px] text-white/50 leading-relaxed max-w-[280px]">
              AI-powered teaching assistant platform. Generate papers, grade instantly, track everything.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Features</div>
            {['Paper Generator', 'OCR Grading', 'AI Assistant', 'Scheduling', 'Attendance', 'Assignments'].map(l => (
              <Link key={l} to="/register" className="footer-link">{l}</Link>
            ))}
          </div>
          <div>
            <div className="footer-col-title">Resources</div>
            {['Documentation', 'API', 'Help Center', 'Community', 'Blog', 'Changelog'].map(l => (
              <a key={l} href="#" className="footer-link">{l}</a>
            ))}
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            {['About', 'Careers', 'Privacy', 'Terms', 'Contact', 'Security'].map(l => (
              <a key={l} href="#" className="footer-link">{l}</a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 EduMaster. All rights reserved.</span>
          <span>Built with ❤️ for educators</span>
        </div>
      </footer>
    </div>
  )
}
