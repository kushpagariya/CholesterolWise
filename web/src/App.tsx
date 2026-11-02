import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowDown, ArrowRight, ArrowUpRight, BookOpen, ChevronRight, CircleHelp, Dna, Download, FlaskConical, Heart, HeartPulse, Info, Leaf, Menu, Pause, Play, Rotate3D, RotateCcw, ShieldCheck, Sparkles, Utensils, X } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { sample, validateInputs, type AnalysisResponse, type FieldErrors, type MetricKey, type Readings, type ReferenceScale, type SexContext } from './analysis';
import { AnalysisError, analyzeReadings } from './api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);
const Scene = lazy(() => import('./components/Scene'));
const metrics: { key: MetricKey; name: string; subtitle: string; short: string }[] = [
  { key: 'ldl', name: 'LDL cholesterol', subtitle: 'Low-density lipoprotein', short: 'LDL' },
  { key: 'hdl', name: 'HDL cholesterol', subtitle: 'High-density lipoprotein', short: 'HDL' },
  { key: 'total', name: 'Total cholesterol', subtitle: 'The overall picture', short: 'Total' },
];
const sourceLinks = {
  levels: 'https://medlineplus.gov/lab-tests/cholesterol-levels/',
  pcsk9: 'https://medlineplus.gov/genetics/gene/pcsk9/',
  living: 'https://www.nhlbi.nih.gov/health/TLC-Therapeutic-Lifestyle-Changes-Lower-Cholesterol',
};

function Logo() { return <Link to="/" className="logo" aria-label="CholesterolWise home"><span className="logo-symbol"><Activity size={22} strokeWidth={2} /></span><span>CHOLESTEROL<span className="logo-blue">WISE</span></span></Link>; }
function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) { return <div className={`eyebrow ${dark ? 'on-dark' : ''}`}><span />{children}</div>; }
function SceneLoader() { return <div className="scene-loading"><Rotate3D size={28} /><span>Preparing your 3D view</span></div>; }
function Source({ href, children }: { href: string; children: ReactNode }) { return <a className="source-link" href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={14} /></a>; }

function Header({ dark }: { dark: boolean }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return <header className={`site-header ${dark ? 'dark-header' : ''}`}><div className="header-inner"><Logo />
    <button className="menu-toggle icon-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>{open ? <X size={22} /> : <Menu size={22} />}</button>
    <nav aria-label="Main navigation" className={open ? 'navigation open' : 'navigation'}>
      <NavLink to="/" end>Home</NavLink><NavLink to="/analyzer">Analyzer</NavLink><NavLink to="/dashboard">Dashboard</NavLink><NavLink to="/learn">Learn</NavLink><NavLink to="/pcsk9">PCSK9 <span className="nav-new">3D</span></NavLink>
    </nav><Link to="/analyzer" className="header-cta">Start analysis <ArrowUpRight size={16} /></Link>
  </div></header>;
}

function Footer() { return <footer><div className="footer-inner"><div><Logo /><p>A little understanding goes a long way.</p></div><div className="footer-note"><span>UNDERSTAND · LEARN · DISCUSS</span><p>For education and awareness. Individual goals belong in a conversation with your healthcare professional.</p></div></div><div className="footer-bottom"><span>CholesterolWise · A healthcare mini-project</span><span>Server-side analysis · The app does not save your readings.</span></div></footer>; }

function Home({ onSample, reducedMotion }: { onSample: () => void; reducedMotion: boolean }) {
  const [paused, setPaused] = useState(reducedMotion);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => setPaused(reducedMotion), [reducedMotion]);
  return <>
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-copy"><Eyebrow dark>YOUR CHOLESTEROL, EXPLAINED</Eyebrow><h1>Your numbers.<br />Your heart.<br /><em>A clearer picture.</em></h1><p className="hero-description">Understand your cholesterol.<br />Make informed health choices.</p><div className="hero-actions"><Link to="/analyzer" className="button primary">Start your analysis <ArrowRight size={19} /></Link><Link to="/learn" className="text-button">Explore the science <ArrowUpRight size={17} /></Link></div><div className="hero-reassurance"><ShieldCheck size={16} /><span>No account needed</span><i /> <span>Simple. Private. Informative.</span></div></div>
        <div className="heart-stage"><div className="orbital orbital-one" /><div className="orbital orbital-two" /><div className="stage-topline"><span className="live-dot" /> A CLOSER LOOK AT YOUR HEART</div><Suspense fallback={<SceneLoader />}><Scene playing={!paused} resetKey={resetKey} /></Suspense><div className="heart-tag tag-one"><span className="tag-icon"><HeartPulse size={17} /></span><div>Your heart matters<small>Understanding is the first step.</small></div></div><div className="heart-tag tag-two"><span className="tag-blue-dot" /><span>Small insights. Better conversations.</span></div><div className="stage-bottom"><span><Rotate3D size={15} /> Drag to explore in 3D</span><div><button onClick={() => setPaused(!paused)} className="scene-control" aria-label={paused ? 'Play heart animation' : 'Pause heart animation'}>{paused ? <Play size={14} /> : <Pause size={14} />}</button><button onClick={() => setResetKey(k => k + 1)} className="scene-control" aria-label="Reset heart view"><RotateCcw size={14} /></button></div></div><p className="model-note">Schematic 3D illustration</p></div>
      </div>
      <div className="hero-bottom"><span>LESS CONFUSION. MORE UNDERSTANDING.</span><a href="#how-it-works" onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' }); }}>GET TO KNOW YOUR NUMBERS <ArrowDown size={15} /></a></div>
    </section>
    <section className="home-intro section-wrap" id="how-it-works"><div className="section-heading"><div><Eyebrow>FROM REPORT TO UNDERSTANDING</Eyebrow><h2>Blood-test results,<br /><span>made a little more human.</span></h2></div><p>Your report gives you numbers. We help you see what they mean, how they connect, and what to ask next.</p></div><div className="steps-grid">{[
      { n: '01', icon: FlaskConical, title: 'Bring your numbers', text: 'Enter the LDL, HDL and total cholesterol values from your laboratory report.', to: '/analyzer', link: 'Enter your values' },
      { n: '02', icon: Activity, title: 'See the bigger picture', text: 'Explore clear reference ranges, visual indicators and plain-language explanations.', to: '/dashboard', link: 'Explore a sample', sample: true },
      { n: '03', icon: Dna, title: 'Understand the science', text: 'Go beneath the numbers. Discover how PCSK9 affects cholesterol clearance in 3D.', to: '/pcsk9', link: 'Meet PCSK9' },
    ].map(s => <article className="step-card" key={s.n}><div className="step-top"><s.icon size={25} strokeWidth={1.5} /><span>{s.n}</span></div><h3>{s.title}</h3><p>{s.text}</p>{s.sample ? <button onClick={onSample} className="inline-link">{s.link}<ArrowRight size={17} /></button> : <Link to={s.to} className="inline-link">{s.link}<ArrowRight size={17} /></Link>}</article>)}</div></section>
    <section className="science-banner section-wrap"><div className="science-banner-inner"><div className="science-mark"><Dna size={62} strokeWidth={1} /></div><div><span className="mini-label">BEYOND THE BLOOD TEST</span><h2>A small protein.<br />A fascinating role.</h2><p>Meet PCSK9, one of the proteins involved in how your liver clears LDL cholesterol.</p></div><Link to="/pcsk9" className="button light">Explore the mechanism <ArrowUpRight size={18} /></Link></div></section>
  </>;
}

function PageIntro({ label, title, description, children }: { label: string; title: string; description: string; children?: ReactNode }) { return <div className="page-intro"><div><Eyebrow>{label}</Eyebrow><h1>{title}</h1><p>{description}</p></div>{children}</div>; }

function Analyzer({ current, currentDemo, onAnalyze, busy, serverErrors }: { current: Readings | null; currentDemo: boolean; onAnalyze: (v: Readings, demo: boolean) => void; busy: boolean; serverErrors: FieldErrors }) {
  const [values, setValues] = useState<Record<MetricKey, string>>({ ldl: current ? String(current.ldl) : '', hdl: current ? String(current.hdl) : '', total: current ? String(current.total) : '' });
  const [sex, setSex] = useState<SexContext>(current?.sex ?? 'unspecified');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [demo, setDemo] = useState(currentDemo);
  const [notice, setNotice] = useState('');
  const inputRefs = useRef<Partial<Record<MetricKey, HTMLInputElement | null>>>({});
  useEffect(() => {
    setErrors(serverErrors);
    const first = metrics.find(m => serverErrors[m.key]);
    if (first) inputRefs.current[first.key]?.focus();
  }, [serverErrors]);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next = validateInputs(values);
    setErrors(next);
    const first = metrics.find(m => next[m.key]);
    if (first) { inputRefs.current[first.key]?.focus(); return; }
    onAnalyze({ ldl: Number(values.ldl), hdl: Number(values.hdl), total: Number(values.total), sex }, demo);
  }
  function loadSample() { setValues({ ldl: '120', hdl: '45', total: '210' }); setSex('unspecified'); setErrors({}); setDemo(true); setNotice('Sample values loaded. These are illustrative values, not a patient report.'); }
  return <main className="page-wrap analyzer-page"><PageIntro label="01 / YOUR NUMBERS" title="Let’s make sense of your report." description="A few numbers. A clearer understanding of your cholesterol." /><div className="workflow"><span className="active"><b>1</b> Enter values</span><i /><span><b>2</b> Explore results</span><i /><span><b>3</b> Learn more</span></div>
    <form className="analyzer-panel" onSubmit={submit} noValidate aria-busy={busy}><div className="panel-heading"><div><span className="mini-label">CHOLESTEROL ANALYZER</span><h2>Enter your blood-test values</h2><p>Use the values shown on your laboratory report, in <strong>mg/dL</strong>.</p></div><span className="neutral-pill"><ShieldCheck size={14} /> Server-side analysis</span></div>
      <div className="inputs-grid">{metrics.map(m => <div key={m.key} className={`input-card ${errors[m.key] ? 'has-error' : ''}`}><label htmlFor={m.key}>{m.name}</label><span className="input-subtitle">{m.subtitle}</span><div className="value-input"><input disabled={busy} id={m.key} ref={el => { inputRefs.current[m.key] = el; }} inputMode="decimal" type="number" min="0.1" step="any" placeholder="—" value={values[m.key]} onChange={e => { setValues({ ...values, [m.key]: e.target.value }); setErrors({ ...errors, [m.key]: undefined }); setDemo(false); setNotice(''); }} aria-invalid={Boolean(errors[m.key])} aria-describedby={`${m.key}-help`} /><span>mg/dL</span></div><span id={`${m.key}-help`} className={errors[m.key] ? 'field-error' : 'field-help'}>{errors[m.key] ?? 'From your laboratory report'}</span></div>)}</div>
      <div className="context-row"><div><label htmlFor="sex-context">HDL interpretation context <span>Optional</span></label><p>General HDL reference levels differ for adult men and women.</p></div><select disabled={busy} id="sex-context" aria-invalid={Boolean(errors.sex)} aria-describedby="sex-error" value={sex} onChange={e => setSex(e.target.value as SexContext)}><option value="unspecified">Prefer not to specify</option><option value="male">Adult male reference</option><option value="female">Adult female reference</option></select></div>{errors.sex && <p className="field-error" id="sex-error">{errors.sex}</p>}
      <div className="form-bottom"><button disabled={busy} type="button" className="text-button" onClick={loadSample}><FlaskConical size={16} /> Try sample values</button><button disabled={busy} className="button primary" type="submit">{busy ? 'Analyzing…' : 'Analyze my values'} <ArrowRight size={18} /></button></div><p className="sample-notice" role="status">{notice}</p>
    </form><div className="analyzer-notes"><div><Info size={19} /><p><strong>A starting point, not a diagnosis.</strong> These general reference categories apply to adults aged 20 and over. Personal targets depend on your wider health context.</p></div><div><ShieldCheck size={19} /><p><strong>Analysis without saved reports.</strong> Values are sent to the analysis server when you submit. The app does not save your readings; results in this tab clear on reload.</p></div></div><Source href={sourceLinks.levels}>Reference: MedlinePlus · Cholesterol levels</Source>
  </main>;
}

function RangeBar({ metric, value, scale }: { metric: MetricKey; value: number; scale: ReferenceScale }) {
  const colors = { good: '#59afa7', blue: '#69a8d6', amber: '#dfbc76', red: '#ca7281' };
  return <div className="range-wrap" aria-label={`${metric.toUpperCase()} ${value} mg/dL on a general reference scale`}><div className="range-track">{scale.segments.map((segment, i) => <span key={i} style={{ background: colors[segment.tone], flex: segment.end - segment.start }} />)}<span className="range-marker" style={{ left: `${scale.marker_percent}%` }} /></div><div className="range-labels"><span>0</span><span>{scale.maximum}{value > scale.maximum ? '+' : ''} mg/dL</span></div></div>;
}

function Dashboard({ analysis, demo, onSample }: { analysis: AnalysisResponse | null; demo: boolean; onSample: () => void }) {
  if (!analysis) return <main className="page-wrap"><PageIntro label="02 / YOUR RESULTS" title="Your clearer picture starts here." description="Enter your cholesterol values to bring your dashboard to life." /><div className="empty-state"><span className="empty-icon"><Activity size={38} strokeWidth={1.3} /></span><h2>A space for your numbers.</h2><p>Your results, visual indicators and explanations will appear here after an analysis.</p><Link className="button primary" to="/analyzer">Enter your values <ArrowRight size={17} /></Link><button className="text-button" onClick={onSample}>Or explore a sample dashboard <ArrowUpRight size={16} /></button></div></main>;
  const readings = analysis.readings;
  const chartColors = { good: '#52a89d', blue: '#4a91d6', amber: '#d7a64e', red: '#ce7681' };
  const data = { labels: ['LDL cholesterol', 'HDL cholesterol', 'Total cholesterol'], datasets: [{ data: [readings.ldl, readings.hdl, readings.total], backgroundColor: metrics.map(m => chartColors[analysis.metrics[m.key].tone]), borderRadius: 5, barThickness: 23 }] };
  return <main className="page-wrap dashboard-page"><PageIntro label="02 / YOUR RESULTS" title="From numbers to understanding." description="Your cholesterol values, with a little more context."><div className="page-actions"><Link to="/analyzer" className="button secondary small">Edit values <ArrowUpRight size={16} /></Link><button onClick={() => window.print()} className="icon-button print-button" aria-label="Print or save results as PDF"><Download size={19} /></button></div></PageIntro>
    <div className="dashboard-context"><span className="neutral-pill"><span className="status-dot" /> {demo ? 'Illustrative sample results' : 'Your current analysis'}</span><span>General adult reference categories · mg/dL</span></div>
    <div className="results-grid">{metrics.map(m => { const result = analysis.metrics[m.key]; return <article className="result-card" key={m.key}><div className="result-heading"><h2>{m.name}</h2><span className="metric-initial">{m.short === 'Total' ? <Activity size={17} /> : m.short}</span></div><div className="result-value">{readings[m.key]}<span>mg/dL</span></div><span className={`category category-${result.tone}`}><span />{result.label}</span><RangeBar metric={m.key} value={readings[m.key]} scale={result.scale} /><p className="reference-caption">{result.reference}</p></article>; })}</div>
    <div className="dashboard-middle"><section className="white-panel chart-panel"><div className="small-panel-heading"><div><span className="mini-label">AT A GLANCE</span><h2>Your lipid profile</h2></div><span className="chart-unit">mg/dL</span></div><div className="chart-container"><Bar data={data} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.x} mg/dL` } } }, scales: { x: { beginAtZero: true, max: Math.ceil(Math.max(readings.ldl, readings.hdl, readings.total) * 1.18 / 50) * 50, border: { display: false }, grid: { color: '#eaf0f5' }, ticks: { color: '#7c8d9e', font: { size: 11 } } }, y: { border: { display: false }, grid: { display: false }, ticks: { color: '#38516a', font: { size: 12 } } } } }} /></div><p className="chart-note">Each measure has its own reference range. Bar lengths compare amounts, not health scores.</p><div className="derived-results"><div><span>Non-HDL cholesterol</span><strong>{analysis.derived.non_hdl.value} <small>mg/dL</small></strong><p>{analysis.derived.non_hdl.formula}</p></div><div><span>Total / HDL ratio</span><strong>{analysis.derived.total_hdl_ratio.value.toFixed(2)}</strong><p>{analysis.derived.total_hdl_ratio.formula}</p></div></div><p className="chart-note">Calculated by the server. These values do not estimate overall cardiovascular risk.</p></section><section className="white-panel interpretation-panel"><span className="mini-label">THE CONTEXT BEHIND THE NUMBERS</span><h2>What your results mean</h2>{metrics.map(m => { const c = analysis.metrics[m.key]; return <div className="interpretation" key={m.key}><span className={`interpretation-dot ${c.tone}`} /><div><h3>{m.name}<span className={`text-${c.tone}`}>{c.label}</span></h3><p>{c.detail}</p></div></div>; })}</section></div>
    <section className="awareness-section"><div className="awareness-heading"><div><Eyebrow>SMALL STEPS, EVERYDAY</Eyebrow><h2>Build on your understanding.</h2></div><Link to="/learn" className="inline-link">Explore healthy habits <ArrowRight size={16} /></Link></div><div className="awareness-grid"><article><Leaf size={23} /><h3>Make room for fiber</h3><p>Foods such as oats, beans and fruit can be part of a heart-healthy eating pattern.</p></article><article><HeartPulse size={23} /><h3>Keep movement in the picture</h3><p>Regular activity supports cardiovascular health. Choose movement that fits your abilities.</p></article><article><BookOpen size={23} /><h3>{analysis.review_heading}</h3><p>Review your full lipid panel, family history and individual goals with your healthcare professional.</p></article></div></section><div className="information-strip"><Info size={18} /><p>These categories explain lab values; they do not calculate your overall cardiovascular risk or set a treatment target.</p></div><div className="sources-row"><Source href={sourceLinks.levels}>MedlinePlus · Reference levels</Source><Source href={sourceLinks.living}>NHLBI · Lifestyle awareness</Source></div>
  </main>;
}

const learnTopics = {
  ldl: { name: 'LDL', subtitle: 'Low-density lipoprotein', title: 'The cholesterol delivery system.', text: 'LDL particles carry cholesterol through your bloodstream. When LDL is elevated, cholesterol can accumulate in artery walls over time.', detail: 'Lower LDL is generally favorable, but your personal goal depends on your health history and other risk factors.', color: 'amber', icon: ArrowUpRight },
  hdl: { name: 'HDL', subtitle: 'High-density lipoprotein', title: 'Part of the return journey.', text: 'HDL helps transport cholesterol from other parts of the body back to the liver. It is often called “good cholesterol.”', detail: 'HDL is one part of the picture. A high HDL value does not cancel out an elevated LDL level.', color: 'teal', icon: RotateCcw },
  total: { name: 'Total', subtitle: 'Total blood cholesterol', title: 'One number. Several components.', text: 'Total cholesterol measures the overall amount of cholesterol in your blood, including cholesterol carried in LDL, HDL and other particles.', detail: 'Read total cholesterol alongside its components. It cannot explain the full picture on its own.', color: 'blue', icon: Activity },
};

function Learn() {
  const [topic, setTopic] = useState<MetricKey>('ldl');
  const content = learnTopics[topic];
  return <main className="page-wrap learn-page"><PageIntro label="THE KNOWLEDGE CORNER" title="A little science. A lot more clarity." description="Get to know the terms on your report—and the story behind them." /><div className="learn-feature"><div className="learn-tabs" role="tablist" aria-label="Cholesterol types">{Object.entries(learnTopics).map(([key, t]) => <button key={key} id={`tab-${key}`} role="tab" aria-selected={key === topic} aria-controls="learn-content" onClick={() => setTopic(key as MetricKey)}>{t.name}<span>{t.subtitle}</span><ChevronRight size={18} /></button>)}</div><div className="learn-content" role="tabpanel" id="learn-content" aria-labelledby={`tab-${topic}`} tabIndex={0}><div className={`lipid-illustration ${content.color}`} aria-hidden="true"><div className="lipid-orbit" /><div className="lipid-orbit second" /><div className="lipid-core"><content.icon size={42} strokeWidth={1.1} /></div>{Array.from({ length: 12 }, (_, i) => <span className="lipid-dot" key={i} style={{ transform: `rotate(${i * 30}deg) translateX(87px)` }} />)}</div><div><span className="mini-label">MEET {content.name.toUpperCase()} CHOLESTEROL</span><h2>{content.title}</h2><p>{content.text}</p><div className="learn-takeaway"><Info size={18} /><p>{content.detail}</p></div></div></div></div>
    <section className="habits-section"><div className="section-heading"><div><Eyebrow>LOOKING AFTER YOUR HEART</Eyebrow><h2>Everyday habits matter.</h2></div><p>General awareness to help you begin a conversation about your health.</p></div><div className="habits-grid">{[
      { icon: Utensils, title: 'Choose a balanced plate', text: 'Include whole grains, legumes, vegetables and fruit. Replace some saturated fats with unsaturated fats.' },
      { icon: Leaf, title: 'Think beyond one food', text: 'A consistent eating pattern matters more than a single ingredient. Oats, beans and fruit can add soluble fiber.' },
      { icon: Heart, title: 'Find movement you enjoy', text: 'Regular physical activity supports heart health. Start with a manageable routine suited to your abilities.' },
      { icon: BookOpen, title: 'Know your own context', text: 'Family history, existing conditions and medicines can affect your results. Discuss your individual goals with a professional.' },
    ].map(h => <article key={h.title}><span className="habit-icon"><h.icon size={23} strokeWidth={1.6} /></span><h3>{h.title}</h3><p>{h.text}</p></article>)}</div></section>
    <section className="faq-section"><div><Eyebrow>A FEW COMMON QUESTIONS</Eyebrow><h2>Good questions.<br />Clearer answers.</h2><CircleHelp size={50} strokeWidth={1} /></div><div className="faq-items">{[
      ['Can I tell my overall heart risk from these three numbers?', 'No. Cholesterol is part of the picture. Age, blood pressure, smoking, diabetes, family history and other factors also matter. This website does not calculate cardiovascular risk.'],
      ['Do I need to fast before a cholesterol test?', 'Some cholesterol tests require fasting and others do not. Follow the instructions from your laboratory or healthcare professional.'],
      ['Why is my personal LDL goal different from a general range?', 'Reference categories describe common lab ranges. Your healthcare professional may set a different goal based on your medical history and cardiovascular risk.'],
      ['Does this website recommend medicines?', 'No. CholesterolWise explains reference categories and biology. Medicine choices and treatment plans require a healthcare professional.'],
    ].map(([q, a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section><div className="learn-cta"><Dna size={30} /><div><h3>Ready to go a little deeper?</h3><p>See how PCSK9 and LDL receptors interact in our 3D explorer.</p></div><Link to="/pcsk9" className="button primary">Explore PCSK9 <ArrowRight size={17} /></Link></div><div className="sources-row"><Source href={sourceLinks.levels}>MedlinePlus · Cholesterol basics</Source><Source href={sourceLinks.living}>NHLBI · Therapeutic lifestyle changes</Source></div>
  </main>;
}

const pathwaySteps = [
  { title: 'A receptor waits', text: 'LDL receptors on the liver-cell surface can bind LDL particles in the bloodstream.' },
  { title: 'The interaction', text: 'LDL binds to its receptor. PCSK9 can also bind the receptor, affecting what happens next.' },
  { title: 'Inside the cell', text: 'The receptor complex moves into the liver cell, where its components are processed.' },
  { title: 'A different destination', text: 'When PCSK9 is bound, the receptor is directed toward breakdown rather than being reused.' },
];

function PCSK9({ reducedMotion }: { reducedMotion: boolean }) {
  const [view, setView] = useState<'mechanism' | 'gene'>('mechanism');
  const [playing, setPlaying] = useState(!reducedMotion);
  const [step, setStep] = useState(0);
  const [withPcsk9, setWithPcsk9] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => setPlaying(!reducedMotion), [reducedMotion]);
  useEffect(() => {
    if (!playing || view === 'gene') return;
    const interval = window.setInterval(() => setStep(s => (s + 1) % 4), 4200);
    return () => window.clearInterval(interval);
  }, [playing, view, withPcsk9]);
  const selectStep = (s: number) => { setStep(s); setPlaying(false); };
  const reset = () => { setStep(0); setResetKey(k => k + 1); setPlaying(!reducedMotion); };
  return <main className="page-wrap pcsk9-page"><PageIntro label="BENEATH THE NUMBERS" title="Small protein. Big part of the story." description="Explore how PCSK9 influences your liver’s ability to clear LDL cholesterol."><span className="explorer-pill"><Rotate3D size={16} /> INTERACTIVE 3D EXPLORER</span></PageIntro>
    <div className="pcsk9-layout"><section className="mechanism-viewer"><div className="viewer-toolbar"><div className="viewer-tabs" role="tablist" aria-label="3D view"><button role="tab" aria-selected={view === 'mechanism'} onClick={() => setView('mechanism')}>The mechanism</button><button role="tab" aria-selected={view === 'gene'} onClick={() => setView('gene')}>Gene → protein</button></div><span className="live-dot" /></div>
      <div className="mechanism-canvas"><Suspense fallback={<SceneLoader />}><Scene kind={view} playing={playing} step={step} withPcsk9={withPcsk9} resetKey={resetKey} /></Suspense></div>
      {view === 'mechanism' ? <><div className="viewer-legend"><span><i className="ldl-dot" /> LDL particle</span><span><i className="receptor-dot" /> LDL receptor</span>{withPcsk9 && <span><i className="pcsk9-dot" /> PCSK9 protein</span>}</div><div className="pathway-toggle"><button className={!withPcsk9 ? 'selected' : ''} onClick={() => { setWithPcsk9(false); setStep(0); }}>Recycling pathway</button><button className={withPcsk9 ? 'selected' : ''} onClick={() => { setWithPcsk9(true); setStep(0); }}>With PCSK9</button></div></> : <div className="gene-caption"><span>DNA</span><ArrowRight size={16} /><span>PCSK9 gene instructions</span><ArrowRight size={16} /><span>PCSK9 protein</span></div>}
      <div className="viewer-controls"><button onClick={() => setPlaying(!playing)} className="viewer-play">{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Pause' : 'Play'}</button>{view === 'mechanism' && <div className="viewer-dots">{pathwaySteps.map((_, i) => <button key={i} aria-label={`Go to step ${i + 1}`} aria-pressed={step === i} className={step === i ? 'active' : ''} onClick={() => selectStep(i)} />)}</div>}<button className="viewer-reset" onClick={reset} aria-label="Reset 3D explorer"><RotateCcw size={16} /></button></div><div className="viewer-caption"><Rotate3D size={13} /><span>Drag to rotate · Schematic illustration, not a molecular structure</span></div>
    </section><section className="mechanism-explanation">{view === 'mechanism' ? <><span className="mini-label">FOLLOW THE JOURNEY</span><h2>{withPcsk9 ? 'When receptors don’t return.' : 'A receptor’s return journey.'}</h2><p className="mechanism-intro">{withPcsk9 ? 'PCSK9 helps determine how many LDL receptors remain available on liver cells.' : 'Without PCSK9 bound, a receptor can return to the surface and help clear more LDL.'}</p><div className="pathway-steps">{pathwaySteps.map((s, i) => <button key={s.title} className={step === i ? 'current' : ''} onClick={() => selectStep(i)} aria-pressed={step === i}><span className="step-number">0{i + 1}</span><div><h3>{!withPcsk9 && i === 3 ? 'Ready to be reused' : s.title}</h3><p>{!withPcsk9 && i === 1 ? 'LDL binds to the receptor without PCSK9 attached.' : !withPcsk9 && i === 3 ? 'The receptor returns to the cell surface, ready for another LDL particle.' : s.text}</p></div></button>)}</div><div className="mechanism-takeaway"><Sparkles size={19} /><p>{withPcsk9 ? 'Fewer available receptors can mean less LDL clearance from the bloodstream.' : 'Receptor recycling helps the liver keep clearing LDL from the bloodstream.'}</p></div></> : <><span className="mini-label">START WITH THE INSTRUCTIONS</span><h2>The gene is the blueprint.<br />The protein does the work.</h2><p className="mechanism-intro">The PCSK9 gene provides instructions for making the PCSK9 protein. The DNA helix on the left represents genetic instructions in a simplified way.</p><div className="gene-explanation"><span><Dna size={24} /></span><div><h3>Gene → protein → receptor effect</h3><p>The protein influences LDL receptor availability. A cholesterol reading alone cannot reveal your PCSK9 genetic status.</p></div></div><button className="button primary" onClick={() => setView('mechanism')}>See the protein in action <ArrowRight size={16} /></button></> }</section></div>
    <section className="pcsk9-bottom"><div><span className="number-chip">01</span><h3>Why the liver?</h3><p>The liver plays a central role in removing LDL particles from the blood.</p></div><div><span className="number-chip">02</span><h3>Why receptors?</h3><p>Receptors help capture LDL. Their availability affects how efficiently it is cleared.</p></div><div><span className="number-chip">03</span><h3>Why PCSK9?</h3><p>It regulates receptor availability by promoting receptor breakdown.</p></div></section><div className="information-strip"><Info size={18} /><p>This animation simplifies a biological pathway. It does not model your personal PCSK9 activity or recommend a treatment.</p></div><Source href={sourceLinks.pcsk9}>Source: MedlinePlus Genetics · PCSK9 gene</Source>
  </main>;
}

function NotFound() { return <main className="page-wrap"><div className="empty-state"><span className="mini-label">PAGE NOT FOUND</span><h1>Let’s find a clearer path.</h1><p>This page doesn’t exist. Your next step is just a click away.</p><Link to="/" className="button primary">Back to home <ArrowRight size={17} /></Link></div></main>; }

export default function App() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const controllerRef = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const [demo, setDemo] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setReducedMotion(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
  useEffect(() => { window.scrollTo(0, 0); const titles: Record<string, string> = { '/': 'Understand your cholesterol', '/analyzer': 'Cholesterol analyzer', '/dashboard': 'Your results', '/learn': 'Learn about cholesterol', '/pcsk9': 'PCSK9 in 3D' }; document.title = `${titles[pathname] ?? 'Page not found'} | CholesterolWise`; }, [pathname]);
  useEffect(() => {
    controllerRef.current?.abort();
    requestId.current += 1;
    setBusy(false); setApiError(null); setServerErrors({});
    return () => { controllerRef.current?.abort(); };
  }, [pathname]);
  const analyze = async (v: Readings, isDemo: boolean) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const id = ++requestId.current;
    setBusy(true); setApiError(null); setServerErrors({});
    try {
      const result = await analyzeReadings(v, controller.signal);
      if (controller.signal.aborted || id !== requestId.current) return;
      setAnalysis(result); setDemo(isDemo); navigate('/dashboard');
    } catch (error) {
      if (controller.signal.aborted || id !== requestId.current) return;
      setApiError(error instanceof Error ? error.message : 'Unable to complete the analysis. Please try again.');
      if (error instanceof AnalysisError) setServerErrors(error.fieldErrors);
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  };
  const loadSample = () => { void analyze({ ...sample }, true); };
  return <><a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a><Header dark={pathname === '/'} /><div id="main-content" tabIndex={-1}>{busy && <div className="api-status" role="status"><Activity size={17} /> Analyzing your values on the server…</div>}{apiError && <div className="api-error" role="alert"><Info size={18} /><span>{apiError} Your entered values are still available.</span></div>}<Routes><Route path="/" element={<Home onSample={loadSample} reducedMotion={reducedMotion} />} /><Route path="/analyzer" element={<Analyzer current={analysis?.readings ?? null} currentDemo={demo} onAnalyze={analyze} busy={busy} serverErrors={serverErrors} />} /><Route path="/dashboard" element={<Dashboard analysis={analysis} demo={demo} onSample={loadSample} />} /><Route path="/learn" element={<Learn />} /><Route path="/pcsk9" element={<PCSK9 reducedMotion={reducedMotion} />} /><Route path="*" element={<NotFound />} /></Routes></div><Footer /></>;
}
