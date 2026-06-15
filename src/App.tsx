import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Survey from './Survey'

// ── Scroll Reveal ────────────────────────────────────
function useReveal(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          obs.unobserve(el)
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return ref
}

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useReveal()
  return <div ref={ref} className="reveal">{children}</div>
}

// ── 1. Hero ──────────────────────────────────────────
function Hero() {
  return (
    <section className="s-hero">
      <div className="hero-text">
        <Reveal><p>지금 이 순간에도</p></Reveal>
        <Reveal><p>답답한 마음에</p></Reveal>
        <Reveal><p className="hero-last">이유라도 알고 싶어서</p></Reveal>
        <Reveal><p>여기까지 오셨나요?</p></Reveal>
      </div>
      <div className="hero-scroll-hint" aria-hidden="true" />
    </section>
  )
}

// ── 2. Bridge ────────────────────────────────────────
function Bridge() {
  return (
    <section className="s-bridge">
      <div className="bridge-inner">
        <Reveal>
          <p className="bp-1">여러분은 <span className="hi-navy">잘못한 게 없어요</span>.</p>
        </Reveal>
        <Reveal>
          <p className="bp-2"><span className="hi-orange">몸이 바뀐</span> 겁니다.</p>
        </Reveal>
        <Reveal>
          <p className="bp-3">저도 진료실에서<br className="mobile-br" /> 매일 듣는 말이 있어요.</p>
        </Reveal>
      </div>
    </section>
  )
}

// ── 3. Empathy — D(온기 원) × F(네이비 수직 바) ──────
const EMPATHY = [
  <>작년에 입던 옷이 <span className="mob" />올해는 안 맞아요.</>,
  <>밥도 줄였는데 <span className="mob" />체중계 숫자는 그대로예요.</>,
  <>운동도 시작했는데 <span className="pc" />배는 <span className="mob" />오히려 더 나왔어요.</>,
  <>뭘 해도 안 되는 건지 <span className="pc" /><span className="mob" />나만 이상한 건지.</>,
  <>답을 찾고 싶어서 <span className="mob pc" />오늘도 막연하게 <span className="mob pc" />검색하고 있어요.</>,
]

const EMP_CFG = [
  { bg: '#fdf9f2',  scale: 0.18 },
  { bg: '#faf2e5',  scale: 0.32 },
  { bg: '#f6ebd6',  scale: 0.48 },
  { bg: '#f0e0c2',  scale: 0.64 },
  { bg: '#e9d3aa',  scale: 0.80 },
] as const

function Empathy() {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const breathRef = useRef<HTMLDivElement>(null)
  const N         = EMPATHY.length

  useEffect(() => {
    const wrap   = wrapRef.current
    const sticky = stickyRef.current
    const breath = breathRef.current
    if (!wrap || !sticky || !breath) return

    const scenes = [...wrap.querySelectorAll<HTMLElement>('.emp-scene')]
    const bars   = [...wrap.querySelectorAll<HTMLElement>('.prog-bar')]
    let cur      = -1

    const show = (idx: number) => {
      if (idx === cur) return
      const prev = cur
      scenes.forEach((s, i) => {
        if (i === idx) {
          s.classList.remove('exit')
          s.classList.add('active')
        } else if (i === prev && prev >= 0) {
          s.classList.remove('active')
          s.classList.add('exit')
        } else {
          s.classList.remove('active', 'exit')
        }
      })
      bars.forEach((b, i) => b.classList.toggle('filled', i <= idx))
      sticky.style.backgroundColor = EMP_CFG[idx].bg
      breath.style.opacity   = '1'
      breath.style.transform = `translate(-50%,-50%) scale(${EMP_CFG[idx].scale})`
      cur = idx
    }

    const onScroll = () => {
      const scrolled   = -wrap.getBoundingClientRect().top
      const scrollable = wrap.offsetHeight - window.innerHeight
      if (scrolled <= 0) { show(0); return }
      if (scrolled >= scrollable) return
      show(Math.min(Math.floor((scrolled / scrollable) * N), N - 1))
    }

    show(0)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [N])

  return (
    <div className="s-empathy-wrap" ref={wrapRef}>
      <div className="s-empathy-sticky" ref={stickyRef}>

        {/* D: 온기 원 */}
        <div className="emp-breath" ref={breathRef} />

        {EMPATHY.map((text, i) => (
          <div key={i} className={`emp-scene${i === 0 ? ' active' : ''}`}>
            <p className="emp-text" data-step={i + 1}>{text}</p>
          </div>
        ))}

        <div className="emp-prog" aria-hidden="true">
          {EMPATHY.map((_, i) => (
            <span key={i} className={`prog-bar${i === 0 ? ' filled' : ''}`} />
          ))}
        </div>

      </div>
    </div>
  )
}

// ── 4. Bridge2 ───────────────────────────────────────
function Bridge2() {
  return (
    <section className="s-bridge2">
      <div className="b2-inner">
        <Reveal><p className="b2-answer">답은 분명히 있습니다.</p></Reveal>
        <Reveal><p className="b2-first">그 전에 한 가지만 먼저!</p></Reveal>
        <Reveal>
          <p className="b2-body">
            지금 내 몸에서 정확히<br />
            무슨 일이 일어나고 있는지<br />
            알고 가야 합니다.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ── 5. Cause ─────────────────────────────────────────
const CP3_ITEMS: { num: string; sym: string; mech: React.ReactNode }[] = [
  { num: '01', sym: '열감',    mech: <>체온 조절이 <br className="pc" />흐트러지면서</> },
  { num: '02', sym: '불면',    mech: <>수면 리듬이 <br className="pc" />깨지면서</> },
  { num: '03', sym: '복부지방', mech: <>대사 균형이 <br className="pc" />무너지면서</> },
  { num: '04', sym: '피로',    mech: <>만성 피로가 <br className="pc" />쌓이면서</> },
]

function Cause() {

  return (
    <section className="s-cause">

      {/* Part 1: 시상하부 */}
      <div className="cause-part cause-p1">
        <div className="cp1-img-wrap">
          <img
            src="/images/hypothalamus.png"
            alt="시상하부 위치 — 뇌 단면 의학 이미지"
            className="cp1-img"
          />
        </div>
        <div className="cp1-text">
          <Reveal>
            <p className="cp1-ko">시상하부 (視床下部)</p>
            <p className="cp1-en">HYPOTHALAMUS</p>
          </Reveal>
          <Reveal>
            <p className="cp1-body">
              뇌 한가운데, 새끼손가락 끝만한 크기.<br />
              <span className="cp1-keywords">체온 · 식욕 · 수면 · 자율신경 —</span><br />
              이 모든 것을 여기서 조절합니다.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Part 2: 갱년기와의 연결 */}
      <div className="cause-part cause-p2">
        <Reveal>
          <p className="cp2-main">
            갱년기에 에스트로겐이 감소하면<br />
            시상하부의 조절 기능이 불안정해집니다.
          </p>
        </Reveal>
        <Reveal>
          <p className="cp2-focus">
            우리는 <span className="hi-orange">호르몬</span> 변화에<br />집중해야 합니다.
          </p>
        </Reveal>
      </div>

      {/* Part 3: 4가지 변화 */}
      <div className="cause-part cause-p3">
        <Reveal>
          <p className="cp3-eyebrow">시상하부 조절 이상</p>
          <p className="cp3-htitle">갱년기에 호르몬이 만들어내는 <span className="hi-orange">4가지 변화</span></p>
        </Reveal>
        <Reveal>
          <div className="cp3-tree">
            <div className="cp3-source">
              <span className="cp3-source-text">호르몬 변화</span>
            </div>
            <div className="cp3-trunk" />
            <div className="cp3-branches">
              {CP3_ITEMS.map((item, i) => (
                <div key={i} className="cp3-branch">
                  <div className="cp3-branch-item">
                    <div className="cp3-dot" />
                    <span className="cp3-num">{item.num}</span>
                    <p className="cp3-sym">{item.sym}</p>
                    <p className="cp3-mech">{item.mech}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="cp3-conc-wrap">
            <div className="cp3-chevron" aria-hidden="true" />
            <p className="cp3-conclusion">
              4가지 변화는<br />
              <span className="hi-orange">시상하부 하나에서</span><br />비롯된 결과입니다.
            </p>
          </div>
        </Reveal>
      </div>

    </section>
  )
}

// ── 6. Symptoms — 탭형 슬라이드 ──────────────────────
const SYM_TABS = [
  {
    label: '열감',
    image: '/images/symptom-heat.png',
    patient: '갑자기 얼굴이 화끈, 등에선 식은땀이 나요.',
    lines: [
      '시상하부가 체온 신호를 잘못 읽는 겁니다.',
      '실제로 덥지 않은데 몸이 열을 빼내려 과민 반응해요.',
    ],
  },
  {
    label: '불면',
    image: '/images/symptom-insomnia.png',
    patient: '새벽 3시, 또 이유없이 깼습니다.',
    lines: [
      '심부체온이 안정되지 않으면 깊은 잠에 들 수 없습니다.',
      '자다 깨고, 또 자다 깨고. 그게 반복되는 거예요.',
    ],
  },
  {
    label: '뱃살',
    image: '/images/symptom-belly.png',
    patient: '먹는 건 비슷한데 배만 늘었어요.',
    lines: [
      '에스트로겐이 줄면 지방이 배로 먼저 축적됩니다.',
      '인슐린 저항성까지 높아져 더 빠르게 쌓여요.',
    ],
  },
  {
    label: '피로',
    image: '/images/symptom-fatigue.png',
    patient: '아무것도 하기 싫고 종일 피곤합니다.',
    lines: [
      '수면 분절이 코르티솔 리듬을 교란시킵니다.',
      '푹 잔 것 같은데도 아침에 무거운 이유가 여기 있어요.',
    ],
  },
] as const

function Symptoms() {
  const [active, setActive] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleTab = (i: number) => {
    setActive(i)
    const slider = sliderRef.current
    if (!slider) return
    const card = slider.children[i] as HTMLElement
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  const handleScroll = () => {
    const slider = sliderRef.current
    if (!slider) return
    const cards = Array.from(slider.children) as HTMLElement[]
    let closest = 0
    let minDist = Infinity
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - slider.scrollLeft)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setActive(closest)
  }

  return (
    <section className="s-symptoms">
      <div className="sym-head">
        <p className="sym-kicker">증상과 원인</p>
        <p className="sym-title">왜 이런 일이 생기는 걸까요?</p>
      </div>

      <div className="sym-tabs" role="tablist">
        {SYM_TABS.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            className={`sym-tab${i === active ? ' active' : ''}`}
            onClick={() => handleTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sym-slider" ref={sliderRef} onScroll={handleScroll}>
        {SYM_TABS.map((tab, i) => (
          <div
            key={i}
            className={`sym-card${i === active ? ' active' : ''}`}
            role="tabpanel"
            aria-hidden={i !== active}
          >
            <img className="sym-img" src={tab.image} alt={tab.label} />
            <div className="sym-content">
              <p className="sym-patient">"{tab.patient}"</p>
              <span className="sym-rule" aria-hidden="true" />
              <div className="sym-explain">
                {tab.lines.map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── 7. SelfTest — 자가진단 진입 ──────────────────────
function SelfTest({ onOpen }: { onOpen: () => void }) {
  return (
    <section id="selftest" className="s-selftest">
      <div className="st-inner">
        <Reveal>
          <p className="st-body">
            같은 갱년기라도<br className="mob" /><span className="hi-orange">다르게 반응</span>합니다.
          </p>
        </Reveal>
        <Reveal>
          <p className="st-sub">
            나는 어떤 유형인지<br />
            1분이면 알 수 있어요.
          </p>
        </Reveal>
        <Reveal>
          <div className="st-btn-wrap">
            <button onClick={onOpen} className="st-btn" style={{ border:'none', cursor:'pointer' }}>1분 자가진단 시작하기</button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── 8. Trust — 신뢰 섹션 ─────────────────────────────
const PHILOSOPHY = [
  {
    num: '01',
    title: '데이터부터 봅니다',
    line1: '혈당 곡선, 인바디 그래프, 혈액검사 결과지.',
    line2: '이 세 가지를 같이 보고 나서야 한약을 짓습니다.',
  },
  {
    num: '02',
    title: '20대 방식을 50대 몸에 쓰지 않습니다',
    line1: '호르몬이 흔들리는 몸엔 다른 방법이 필요합니다.',
    line2: '의지의 문제가 아닙니다.',
  },
  {
    num: '03',
    title: '한의학과 생화학을 같이 씁니다',
    line1: '음양과 기혈, 호르몬과 효소.',
    line2: '같은 몸을 다른 각도에서 부르는 이름입니다.',
  },
] as const

// ── SVG 인포그래픽 (진료 철학 스와이프) ────────────
const PHIL_SVG_01 = `<svg viewBox="0 -14 320 239" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <text x="160" y="0" font-size="10.5" fill="#1A3270" font-weight="700" text-anchor="middle">혈당 곡선 비교</text>
  <text x="160" y="12" font-size="8" fill="#1A3270" opacity="0.4" text-anchor="middle">Blood Glucose Curve</text>
  <line x1="38" y1="42" x2="38" y2="188" stroke="#1A3270" stroke-opacity="0.12" stroke-width="1"/>
  <line x1="38" y1="188" x2="300" y2="188" stroke="#1A3270" stroke-opacity="0.12" stroke-width="1"/>
  <line x1="38" y1="67" x2="300" y2="67" stroke="#1A3270" stroke-opacity="0.06" stroke-dasharray="4 3"/>
  <line x1="38" y1="97" x2="300" y2="97" stroke="#1A3270" stroke-opacity="0.06" stroke-dasharray="4 3"/>
  <line x1="38" y1="127" x2="300" y2="127" stroke="#1A3270" stroke-opacity="0.06" stroke-dasharray="4 3"/>
  <line x1="38" y1="158" x2="300" y2="158" stroke="#1A3270" stroke-opacity="0.06" stroke-dasharray="4 3"/>
  <text x="32" y="70" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="end">180</text>
  <text x="32" y="100" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="end">140</text>
  <text x="32" y="130" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="end">100</text>
  <text x="32" y="161" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="end">70</text>
  <text x="58" y="201" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="middle">공복</text>
  <text x="110" y="201" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="middle">30분</text>
  <text x="169" y="201" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="middle">1시간</text>
  <text x="228" y="201" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="middle">2시간</text>
  <text x="284" y="201" font-size="7.5" fill="#1A3270" opacity="0.38" text-anchor="middle">3시간</text>
  <rect x="38" y="97" width="262" height="61" fill="#1A3270" opacity="0.04" rx="2"/>
  <path d="M58,158 C88,118 128,100 169,107 C210,114 248,136 284,151" stroke="#1A3270" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-opacity="0.35" stroke-dasharray="6 4"/>
  <path d="M58,158 C74,105 100,52 110,46 C122,40 146,58 169,78 C202,106 242,136 284,153 L284,188 L58,188 Z" fill="#D76618" fill-opacity="0.07"/>
  <path d="M58,158 C74,105 100,52 110,46 C122,40 146,58 169,78 C202,106 242,136 284,153" stroke="#D76618" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="58" cy="158" r="3.5" fill="#D76618"/>
  <circle cx="110" cy="46" r="5" fill="#D76618"/>
  <circle cx="169" cy="78" r="3.5" fill="#D76618"/>
  <circle cx="228" cy="122" r="3.5" fill="#D76618"/>
  <circle cx="284" cy="153" r="3.5" fill="#D76618"/>
  <line x1="110" y1="46" x2="110" y2="97" stroke="#D76618" stroke-opacity="0.35" stroke-width="1" stroke-dasharray="3 2"/>
  <rect x="88" y="21" width="44" height="15" rx="4" fill="#D76618" opacity="0.1"/>
  <text x="110" y="32" font-size="8" fill="#D76618" font-weight="700" text-anchor="middle">급등 피크</text>
  <line x1="96" y1="214" x2="112" y2="214" stroke="#1A3270" stroke-width="1.6" stroke-opacity="0.35" stroke-dasharray="5 3"/>
  <text x="116" y="217" font-size="7.5" fill="#1A3270" opacity="0.5">이상적 곡선</text>
  <line x1="170" y1="214" x2="186" y2="214" stroke="#D76618" stroke-width="2.2"/>
  <circle cx="178" cy="214" r="2.5" fill="#D76618"/>
  <text x="190" y="217" font-size="7.5" fill="#D76618" font-weight="600">현재 상태</text>
</svg>`

const PHIL_SVG_02 = `<svg viewBox="0 0 340 200" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <text x="170" y="18" font-size="11" fill="#1A3270" font-weight="700" text-anchor="middle">호르몬 환경 비교</text>
  <text x="170" y="30" font-size="8.5" fill="#1A3270" opacity="0.5" text-anchor="middle">20대 vs 50대</text>
  <text x="85" y="50" font-size="12" fill="#1A3270" font-weight="700" text-anchor="middle">20대</text>
  <text x="30" y="72" font-size="8" fill="#444" opacity="0.7">에스트로겐</text>
  <rect x="30" y="76" width="110" height="10" rx="5" fill="#1A3270" opacity="0.1"/>
  <rect x="30" y="76" width="100" height="10" rx="5" fill="#1A3270" opacity="0.6"/>
  <text x="142" y="85" font-size="8" fill="#1A3270" font-weight="700">↑ 풍부</text>
  <text x="30" y="102" font-size="8" fill="#444" opacity="0.7">기초대사</text>
  <rect x="30" y="106" width="110" height="10" rx="5" fill="#1A3270" opacity="0.1"/>
  <rect x="30" y="106" width="95" height="10" rx="5" fill="#1A3270" opacity="0.6"/>
  <text x="142" y="115" font-size="8" fill="#1A3270" font-weight="700">↑ 활발</text>
  <text x="30" y="132" font-size="8" fill="#444" opacity="0.7">스트레스 회복</text>
  <rect x="30" y="136" width="110" height="10" rx="5" fill="#1A3270" opacity="0.1"/>
  <rect x="30" y="136" width="90" height="10" rx="5" fill="#1A3270" opacity="0.6"/>
  <text x="142" y="145" font-size="8" fill="#1A3270" font-weight="700">↑ 빠름</text>
  <text x="255" y="50" font-size="12" fill="#D76618" font-weight="700" text-anchor="middle">50대</text>
  <text x="310" y="72" font-size="8" fill="#444" opacity="0.7" text-anchor="end">에스트로겐</text>
  <rect x="200" y="76" width="110" height="10" rx="5" fill="#D76618" opacity="0.1"/>
  <rect x="282" y="76" width="28" height="10" rx="5" fill="#D76618" opacity="0.5"/>
  <text x="198" y="85" font-size="8" fill="#D76618" font-weight="700" text-anchor="end">↓ 급감</text>
  <text x="310" y="102" font-size="8" fill="#444" opacity="0.7" text-anchor="end">기초대사</text>
  <rect x="200" y="106" width="110" height="10" rx="5" fill="#D76618" opacity="0.1"/>
  <rect x="275" y="106" width="35" height="10" rx="5" fill="#D76618" opacity="0.5"/>
  <text x="198" y="115" font-size="8" fill="#D76618" font-weight="700" text-anchor="end">↓ 저하</text>
  <text x="310" y="132" font-size="8" fill="#444" opacity="0.7" text-anchor="end">스트레스 회복</text>
  <rect x="200" y="136" width="110" height="10" rx="5" fill="#D76618" opacity="0.1"/>
  <rect x="288" y="136" width="22" height="10" rx="5" fill="#D76618" opacity="0.5"/>
  <text x="198" y="145" font-size="8" fill="#D76618" font-weight="700" text-anchor="end">↓ 느림</text>
  <rect x="40" y="170" width="260" height="22" rx="6" fill="#D76618" opacity="0.1"/>
  <text x="170" y="185" font-size="9" fill="#D76618" font-weight="700" text-anchor="middle">다른 몸에는 다른 접근이 필요합니다</text>
</svg>`

const PHIL_SVG_03 = `<svg viewBox="0 0 340 200" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <text x="170" y="18" font-size="11" fill="#1A3270" font-weight="700" text-anchor="middle">두 언어, 같은 몸</text>
  <text x="170" y="30" font-size="8.5" fill="#1A3270" opacity="0.5" text-anchor="middle">Traditional Medicine × Biochemistry</text>
  <svg x="130" y="52" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#B0B8C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M5 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
    <path d="M5 22v-5l-1 -1v-4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4l-1 1v5"/>
    <path d="M15 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
    <path d="M15 22v-4h-2l2 -6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1l2 6h-2v4"/>
  </svg>
  <circle cx="60" cy="75" r="22" fill="#1A3270" opacity="0.08" stroke="#1A3270" stroke-width="1.2" stroke-opacity="0.25"/>
  <text x="60" y="72" font-size="10" fill="#1A3270" font-weight="700" text-anchor="middle">음양</text>
  <text x="60" y="85" font-size="10" fill="#1A3270" font-weight="700" text-anchor="middle">기혈</text>
  <circle cx="60" cy="148" r="22" fill="#1A3270" opacity="0.08" stroke="#1A3270" stroke-width="1.2" stroke-opacity="0.25"/>
  <text x="60" y="145" font-size="9.5" fill="#1A3270" font-weight="700" text-anchor="middle">오장</text>
  <text x="60" y="158" font-size="9.5" fill="#1A3270" font-weight="700" text-anchor="middle">육부</text>
  <circle cx="280" cy="75" r="22" fill="#D76618" opacity="0.08" stroke="#D76618" stroke-width="1.2" stroke-opacity="0.3"/>
  <text x="280" y="72" font-size="9.5" fill="#D76618" font-weight="700" text-anchor="middle">호르몬</text>
  <text x="280" y="85" font-size="9.5" fill="#D76618" font-weight="700" text-anchor="middle">효소</text>
  <circle cx="280" cy="148" r="22" fill="#D76618" opacity="0.08" stroke="#D76618" stroke-width="1.2" stroke-opacity="0.3"/>
  <text x="280" y="145" font-size="9.5" fill="#D76618" font-weight="700" text-anchor="middle">대사</text>
  <text x="280" y="158" font-size="9.5" fill="#D76618" font-weight="700" text-anchor="middle">신경</text>
  <path d="M82 75 Q106 75 127 83" stroke="#1A3270" stroke-width="1.2" stroke-opacity="0.3" stroke-dasharray="4 3"/>
  <path d="M82 148 Q106 131 127 110" stroke="#1A3270" stroke-width="1.2" stroke-opacity="0.3" stroke-dasharray="4 3"/>
  <path d="M258 75 Q234 75 213 83" stroke="#D76618" stroke-width="1.2" stroke-opacity="0.3" stroke-dasharray="4 3"/>
  <path d="M258 148 Q234 131 213 110" stroke="#D76618" stroke-width="1.2" stroke-opacity="0.3" stroke-dasharray="4 3"/>
  <circle cx="127" cy="83" r="3.5" fill="#1A3270" opacity="0.4"/>
  <circle cx="127" cy="110" r="3.5" fill="#1A3270" opacity="0.4"/>
  <circle cx="213" cy="83" r="3.5" fill="#D76618" opacity="0.4"/>
  <circle cx="213" cy="110" r="3.5" fill="#D76618" opacity="0.4"/>
  <text x="60" y="186" font-size="8" fill="#1A3270" opacity="0.6" text-anchor="middle" font-weight="600">한의학</text>
  <text x="280" y="186" font-size="8" fill="#D76618" opacity="0.7" text-anchor="middle" font-weight="600">생화학</text>
  <text x="170" y="155" font-size="7.5" fill="#444" opacity="0.5" text-anchor="middle">같은 몸</text>
</svg>`

const PHIL_SVGS = [PHIL_SVG_01, PHIL_SVG_02, PHIL_SVG_03]

function PhilosophySwipe() {
  const trackRef = useRef<HTMLDivElement>(null)
  const currRef  = useRef<HTMLSpanElement>(null)
  const hintRef  = useRef<HTMLDivElement>(null)
  const swipedRef = useRef(false)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const updateUI = (idx: number) => {
      setActiveIdx(idx)
      if (currRef.current) currRef.current.textContent = String(idx + 1).padStart(2, '0')
      if (!swipedRef.current && idx > 0) {
        swipedRef.current = true
        hintRef.current?.classList.add('b-hint--hidden')
      }
    }
    const onScroll = () => updateUI(Math.round(track.scrollLeft / track.clientWidth))
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (idx: number) => {
    if (!trackRef.current) return
    trackRef.current.scrollTo({ left: idx * trackRef.current.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="tr-ph-swipe">
      <div className="b-track" ref={trackRef}>
        {PHILOSOPHY.map((item, i) => (
          <div className="b-slide" key={item.num}>
            <div className="b-card">
              <div className="b-graphic" dangerouslySetInnerHTML={{ __html: PHIL_SVGS[i] }} />
              <div className="b-text">
                <span className="tr-ph-num">{item.num}</span>
                <div className="b-divider" />
                <h2 className="tr-ph-title">{item.title}</h2>
                <p className="tr-ph-body">{item.line1}<br />{item.line2}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        className={`b-arrow b-arrow--prev${activeIdx === 0 ? ' b-arrow--disabled' : ''}`}
        onClick={() => goTo(Math.max(0, activeIdx - 1))}
        aria-label="이전 카드"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        className={`b-arrow b-arrow--next${activeIdx === 2 ? ' b-arrow--disabled' : ''}`}
        onClick={() => goTo(Math.min(2, activeIdx + 1))}
        aria-label="다음 카드"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <div className="b-nav">
        <div className="b-dots">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              className={`b-dot${activeIdx === i ? ' b-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번 카드`}
            />
          ))}
        </div>
        <div className="b-counter"><span ref={currRef}>01</span> / 03</div>
      </div>
      <div className="b-hint" ref={hintRef}>← 스와이프 →</div>
    </div>
  )
}

function Trust() {
  return (
    <section className="s-trust">

      {/* Part 1: 인용구 */}
      <div className="tr-quote-wrap">
        <Reveal>
          <blockquote className="tr-quote">
            "갱년기는 끝이 아니라<br />
            몸을 다시 시작하는 자리입니다.<br />
            데이터를 같이 봅니다.<br />
            처방은 그 다음입니다."
          </blockquote>
          <p className="tr-attr">— 박승현 원장</p>
        </Reveal>
      </div>

      {/* Part 2: 진료 철학 헤더 */}
      <div className="tr-philosophy">
        <Reveal>
          <p className="tr-eyebrow">원장의 진료 철학</p>
          <p className="tr-ph-head">
            처방전을 드리기 전에,<br />
            저와 함께 데이터를<br />
            들여다보는 시간이 있습니다.
          </p>
        </Reveal>
      </div>

      {/* Part 2b: 진료 철학 스와이프 */}
      <PhilosophySwipe />

      {/* Part 3: 원장 프로필 */}
      <div className="tr-profile">
        {/* 상단: 좌우 분할 */}
        <div className="tr-prof-top">
          {/* 좌측: 크림 배경 + 사진 + 이름/소속 */}
          <div className="tr-prof-left">
            <Reveal>
              <img src="/images/doctor.png" alt="박승현 원장" className="tr-prof-img" />
              <p className="tr-prof-name">박승현 원장</p>
              <p className="tr-prof-sub">전주W한의원 · 리셋다이어트</p>
            </Reveal>
          </div>
          {/* 우측: 네이비 배경 + 앵커 카피 */}
          <div className="tr-prof-right">
            <Reveal>
              <p className="tr-prof-anchor">
                10년이 쌓은<br />
                <span className="hi-orange">한 가지 확신</span>
              </p>
            </Reveal>
          </div>
        </div>

        {/* 하단: 전체 너비 크림 배경 + 스토리 + 약력 */}
        <div className="tr-prof-bottom">
          <Reveal>
            <p className="tr-prof-story">
              10년 이상 다이어트와 대사질환을 진료하며<br className="pc" />
              반복해서 확인한 게 하나 있습니다.<br />
              갱년기 살은 의지의 문제가 아닙니다.<br />
              방법이 달라야 합니다.
            </p>
            <ul className="tr-prof-list">
              <li>갱년기 다이어트 전문 진료</li>
              <li>동료 의사·한의사 생화학 스터디 운영</li>
              <li>데이터 기반 환자 맞춤 진료</li>
            </ul>
          </Reveal>
        </div>
      </div>

      {/* Part 4: 유튜브 */}
      <div className="tr-youtube">
        <Reveal>
          <a
            href="https://www.youtube.com/@리셋다이어트"
            target="_blank"
            rel="noopener noreferrer"
            className="tr-yt-thumb"
            aria-label="리셋다이어트 유튜브 채널 바로가기"
          >
            <div className="tr-yt-play" aria-hidden="true" />
            <p className="tr-yt-label">리셋다이어트 유튜브</p>
          </a>
          <a
            href="https://www.youtube.com/@리셋다이어트"
            target="_blank"
            rel="noopener noreferrer"
            className="tr-yt-more"
          >
            더 많은 영상 보기 →
          </a>
        </Reveal>
      </div>

    </section>
  )
}

// ── 9. FAQ ────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: '갱년기인데 한약 다이어트 해도 되나요?',
    a: '됩니다. 오히려 갱년기에 가장 잘 맞는 방법 중 하나입니다. 호르몬 흐름을 보정하면서 살을 빼기 때문에 열감·불면 같은 증상도 함께 좋아집니다.',
  },
  {
    q: '호르몬 치료(HRT)와 같이 해도 되나요?',
    a: '병행 가능합니다. 현재 복용 중인 호르몬제 정보를 상담 시 알려주시면 처방에 반영합니다.',
  },
  {
    q: '한 달에 얼마나 빠지나요?',
    a: '개인 상태에 따라 다릅니다. 리셋다이어트는 체중계 숫자만 보지 않습니다. 내장지방·근육량·갱년기 증상을 함께 봅니다.',
  },
  {
    q: '요요는 안 오나요?',
    a: '요요는 다이어트 방식이 만듭니다. 리셋다이어트는 마무리 단계에서 식사법을 일상에 정착시키기 때문에 끝나도 흔들리지 않도록 설계되어 있습니다.',
  },
] as const

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0)
  const toggle = (i: number) => setOpen(open === i ? null : i)

  return (
    <section className="s-faq">
      <Reveal>
        <p className="faq-head">상담 전에 많이 물어보시는 것들</p>
      </Reveal>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className={`faq-item${open === i ? ' open' : ''}`}>
            <button className="faq-q" onClick={() => toggle(i)}>
              <span>{item.q}</span>
              <span className="faq-icon" aria-hidden="true">{open === i ? '−' : '+'}</span>
            </button>
            <div className="faq-a-wrap">
              <div className="faq-a">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Reveal>
        <a
          href="https://pf.kakao.com/_xjxcgpxl"
          target="_blank"
          rel="noopener noreferrer"
          className="faq-kakao"
        >
          더 궁금한 점은 카카오톡으로 물어보세요 →
        </a>
      </Reveal>
    </section>
  )
}

// ── 10. KakaoConsult ─────────────────────────────────
function KakaoConsult() {
  return (
    <section className="s-kakao">
      <div className="kk-inner">
        <Reveal>
          <p className="kk-body">
            지금 내 몸 상태가 궁금하다면<br />
            편하게 물어보세요.
          </p>
          <p className="kk-sub">원장이 직접 답합니다.</p>
        </Reveal>
        <Reveal>
          <a href="https://pf.kakao.com/_xjxcgpxl" target="_blank" rel="noopener noreferrer" className="kk-btn">카카오톡으로 상담하기</a>
        </Reveal>
        <Reveal>
          <ul className="kk-notes">
            <li>비용 없이 궁금한 점부터 물어보실 수 있습니다</li>
            <li>진료 예약 강요 없습니다</li>
            <li>평일 진료시간 내 빠른 답변</li>
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

// ── 11. SiteFooter ────────────────────────────────────
function SiteFooter() {
  return (
    <footer className="s-footer">
      <p className="ft-name">전주W한의원</p>
      <ul className="ft-info">
        <li>의료기관명: 전주더블유(W)한의원</li>
        <li>대표자: 박승현</li>
        <li>주소: 전북 전주시 완산구 홍산1길 21 207호 (효자동 서희스타일스 상가)</li>
        <li>대표전화: 063-221-7500</li>
        <li>사업자등록번호: 887-23-01841</li>
      </ul>
      <p className="ft-copy">© 2026 Jeonju W Korean Medicine Clinic. All rights reserved.</p>
    </footer>
  )
}

// ── HomePage ─────────────────────────────────────────
function HomePage() {
  const [showSurvey, setShowSurvey] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const state = location.state as { openSurvey?: boolean } | null
    if (state?.openSurvey === true && !sessionStorage.getItem('surveyOpened')) {
      sessionStorage.setItem('surveyOpened', 'true')
      document.getElementById('selftest')?.scrollIntoView({ behavior: 'instant' })
      setShowSurvey(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  function closeSurvey() {
    setShowSurvey(false)
    setTimeout(() => {
      document.getElementById('selftest')?.scrollIntoView({ behavior: 'instant' })
    }, 50)
  }

  return (
    <>
      <main>
        <Hero />
        <Bridge />
        <Empathy />
        <Bridge2 />
        <Cause />
        <Symptoms />
        <SelfTest onOpen={() => setShowSurvey(true)} />
        <Trust />
        <FAQSection />
        <KakaoConsult />
      </main>
      <SiteFooter />
      {showSurvey && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, overflowY:'auto' }}>
          <Survey onClose={closeSurvey} />
        </div>
      )}
    </>
  )
}

// ── App ──────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/survey" element={<Survey />} />
    </Routes>
  )
}
