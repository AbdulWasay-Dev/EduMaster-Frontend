import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, ScrollText, CheckSquare, FileText, Zap, Star, Crown,
  Check, ChevronDown, ArrowRight, Play, Upload, Sparkles,
  TrendingUp, Clock, Shield, Users, BookOpen, Award,
} from 'lucide-react'

/* ─── helpers ─── */
const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

/* ─── data ─── */
const FEATURES = [
  {
    icon: ScrollText, title: 'AI Paper Generator',
    desc: 'Generate perfectly structured exam papers in seconds. Choose difficulty, question types, and marks — AI does the rest.',
    color: 'from-brand-500 to-brand-600',
  },
  {
    icon: CheckSquare, title: 'Instant OCR Grading',
    desc: 'Upload answer sheets and watch AI grade them with detailed per-question feedback and score breakdowns.',
    color: 'from-accent-500 to-accent-600',
  },
  {
    icon: Bot, title: 'RAG AI Assistant',
    desc: 'Ask questions and get answers grounded in your own uploaded textbooks and study materials.',
    color: 'from-gold-400 to-gold-600',
  },
  {
    icon: FileText, title: 'Smart Document Library',
    desc: 'Upload PDFs and documents — they\'re automatically chunked and indexed for instant AI retrieval.',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: TrendingUp, title: 'Analytics Dashboard',
    desc: 'Track student progress, grade distributions, and class performance with beautiful real-time charts.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Users, title: 'Class Management',
    desc: 'Organize students into classes, track enrollment, and manage assignments all in one place.',
    color: 'from-violet-500 to-violet-600',
  },
]

const STEPS = [
  { icon: Upload,    num: '01', title: 'Upload Your Materials', desc: 'Add PDFs, textbooks, and study guides to your document library.' },
  { icon: Sparkles, num: '02', title: 'Generate with AI',       desc: 'Create exam papers or query your content — just describe what you need.' },
  { icon: CheckSquare, num: '03', title: 'Grade Instantly',     desc: 'Upload answer sheets and get detailed AI grading reports in seconds.' },
  { icon: TrendingUp,  num: '04', title: 'Track Progress',      desc: 'Visualize class performance with analytics dashboards and insights.' },
]

const TESTIMONIALS = [
  {
    name: 'Sarah K.', role: 'Biology Teacher, Springfield HS', avatar: 'S',
    quote: 'EduMaster cut my grading time by 80%. What used to take me an entire Sunday now takes 20 minutes.',
    stars: 5,
  },
  {
    name: 'James R.', role: 'Math Department Head', avatar: 'J',
    quote: 'The AI paper generator is incredible. I can create differentiated exams for different ability groups instantly.',
    stars: 5,
  },
  {
    name: 'Maria L.', role: 'Chemistry Teacher', avatar: 'M',
    quote: 'The RAG assistant answers student-style questions directly from my textbooks. It\'s like having an AI TA.',
    stars: 5,
  },
]

const FAQS = [
  { q: 'How does AI grading work?',       a: 'Students\' answer sheets are uploaded as images. Our OCR engine extracts the text, then our AI compares each answer against the marking scheme to award scores with detailed feedback.' },
  { q: 'What file formats are supported?', a: 'We support PDF, DOCX, and images (PNG, JPG) for documents and answer sheets.' },
  { q: 'Is my data secure?',              a: 'All data is encrypted at rest and in transit. We never use your content to train AI models. You own your data.' },
  { q: 'Can I try it for free?',          a: 'Yes! Our Free plan includes 5 documents, 3 papers per month, and 10 answer sheets with no credit card required.' },
  { q: 'Does it work offline?',           a: 'EduMaster is a web-based platform. An internet connection is required for AI features.' },
]

const PLANS = [
  { name: 'Free', price: '$0', period: '/month', cta: 'Get Started Free', icon: Zap, color: 'border-brand-200', features: ['5 documents','3 papers/month','10 graded sheets','50 AI queries','1 class'], },
  { name: 'Pro', price: '$12', period: '/month', cta: 'Start Free Trial', icon: Star, color: 'border-brand-500', badge: 'Most Popular', features: ['Unlimited documents','Unlimited papers','Unlimited grading','Unlimited AI queries','10 classes','PDF export','Priority support'], },
  { name: 'School', price: '$49', period: '/month', cta: 'Contact Sales', icon: Crown, color: 'border-accent-400', features: ['Everything in Pro','20 teacher accounts','Admin dashboard','Custom branding','API access','SSO','Dedicated support'], },
]

/* ─── FAQ accordion item ─── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-brand-100 last:border-0">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between py-4 text-left gap-4 group">
        <span className="font-medium text-[#1C0A00] group-hover:text-brand-500 transition-colors text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-brand-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-brand-600 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── main ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#1C0A00] overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-brand-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg gradient-text">EduMaster</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-brand-700">
            <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-500 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-brand-500 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-brand-500 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-br from-white via-brand-50/40 to-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 -left-32 w-80 h-80 bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 -right-32 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl pointer-events-none" />

        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-xs font-semibold px-4 py-2 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Teaching Tools — Now in Beta
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Grade Smarter.<br />
            <span className="gradient-text">Teach Better.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-brand-600 max-w-2xl mx-auto leading-relaxed">
            EduMaster uses AI to generate exam papers, grade answer sheets instantly with OCR, and answer student questions from your own documents.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-primary text-base px-8 py-3 flex items-center gap-2 shadow-brand-lg">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="btn-ghost text-base px-8 py-3 flex items-center gap-2">
              <Play className="w-4 h-4" /> See how it works
            </a>
          </motion.div>
          <motion.p variants={fadeUp} className="text-xs text-brand-400">No credit card required · Free plan always available</motion.p>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          className="max-w-4xl mx-auto mt-16 rounded-2xl overflow-hidden shadow-2xl border border-brand-100 bg-[#1C0A00]"
        >
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
            {['#ef4444','#fbbf24','#22c55e'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>)}
            <span className="ml-2 text-xs text-white/40 font-mono">EduMaster — Dashboard</span>
          </div>
          <div className="p-6 grid grid-cols-4 gap-3">
            {[{l:'Classes',v:'6'},{l:'Students',v:'148'},{l:'Papers',v:'23'},{l:'Graded',v:'312'}].map(({l,v}) => (
              <div key={l} className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white">{v}</p>
                <p className="text-[10px] text-brand-300 mt-0.5">{l}</p>
              </div>
            ))}
            <div className="col-span-4 bg-white/5 rounded-xl p-4">
              <p className="text-xs text-brand-300 mb-2">Grading Activity</p>
              <div className="flex items-end gap-1 h-12">
                {[40,65,35,80,55,90,70,85,60,95,50,75].map((h,i) => (
                  <div key={i} className="flex-1 bg-brand-500 rounded-sm opacity-80 transition-all" style={{height:`${h}%`}}/>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section className="py-8 bg-brand-50 border-y border-brand-100">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-branch-700">
          {[
            {v:'2,500+', l:'Teachers'},
            {v:'180,000+', l:'Papers Generated'},
            {v:'4.9/5', l:'Average Rating'},
            {v:'95%', l:'Time Saved'},
          ].map(({v,l}) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-black text-brand-600">{v}</p>
              <p className="text-xs text-brand-500">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="text-center mb-14 space-y-3">
            <motion.p variants={fadeUp} className="text-brand-500 font-semibold text-sm uppercase tracking-widest">Features</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black">Everything a teacher needs</motion.h2>
            <motion.p variants={fadeUp} className="text-brand-600 max-w-xl mx-auto">From paper generation to grading to AI tutoring — all in one platform.</motion.p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeUp} whileHover={{y:-4}} className="card p-6 space-y-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-[#1C0A00]">{f.title}</h3>
                <p className="text-sm text-brand-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 bg-brand-50">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="text-center mb-14 space-y-3">
            <motion.p variants={fadeUp} className="text-brand-500 font-semibold text-sm uppercase tracking-widest">How It Works</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black">Up and running in minutes</motion.h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(step => (
              <motion.div key={step.num} variants={fadeUp} className="card p-5 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mx-auto">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-black text-brand-200">{step.num}</p>
                <h3 className="font-bold text-[#1C0A00] text-sm">{step.title}</h3>
                <p className="text-xs text-brand-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="text-center mb-14 space-y-3">
            <motion.p variants={fadeUp} className="text-brand-500 font-semibold text-sm uppercase tracking-widest">Testimonials</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black">Loved by teachers</motion.h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <motion.div key={t.name} variants={fadeUp} className="card p-6 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({length:t.stars}).map((_,i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400"/>)}
                </div>
                <p className="text-sm text-brand-700 leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-brand-50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1C0A00]">{t.name}</p>
                    <p className="text-[10px] text-brand-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6 bg-brand-50">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="text-center mb-14 space-y-3">
            <motion.p variants={fadeUp} className="text-brand-500 font-semibold text-sm uppercase tracking-widest">Pricing</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black">Simple, transparent pricing</motion.h2>
            <motion.p variants={fadeUp} className="text-brand-600">Start free. Upgrade when you need more.</motion.p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="grid sm:grid-cols-3 gap-5">
            {PLANS.map(p => (
              <motion.div key={p.name} variants={fadeUp} whileHover={{y:-4}} className={`card p-6 flex flex-col gap-4 relative border-2 ${p.color}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {p.badge}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <p.icon className="w-4 h-4 text-brand-500" />
                  </div>
                  <span className="font-bold">{p.name}</span>
                </div>
                <div>
                  <span className="text-3xl font-black">{p.price}</span>
                  <span className="text-brand-500 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-2 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-brand-700">
                      <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5"/>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all block ${p.name==='Pro' ? 'btn-primary' : 'btn-ghost border border-brand-300'}`}>
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{once:true}} className="text-center mb-12 space-y-3">
            <motion.p variants={fadeUp} className="text-brand-500 font-semibold text-sm uppercase tracking-widest">FAQ</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-black">Common questions</motion.h2>
          </motion.div>
          <div className="card p-6 divide-y divide-brand-100">
            {FAQS.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a}/>)}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#1C0A00] via-brand-950 to-[#2d0e00]">
        <motion.div
          initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          className="max-w-2xl mx-auto text-center space-y-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto shadow-brand-lg">
            <Award className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white">Ready to transform<br/>your classroom?</h2>
          <p className="text-brand-300">Join thousands of teachers who save hours every week with EduMaster.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-primary px-8 py-3 text-base flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4"/>
            </Link>
            <Link to="/login" className="text-brand-300 hover:text-white text-sm font-medium transition-colors">
              Already have an account →
            </Link>
          </div>
          <p className="text-xs text-brand-500">No credit card · 2-minute setup · Cancel anytime</p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1C0A00] border-t border-white/10 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-white">EduMaster</span>
          </div>
          <p className="text-xs text-brand-400">© 2026 EduMaster. Built with ❤️ for educators.</p>
          <div className="flex items-center gap-4 text-xs text-brand-400">
            <a href="#" className="hover:text-brand-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
