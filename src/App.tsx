import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Survey from './Survey'

const Admin = lazy(() => import('./Admin'))

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

// ── 0. TopSection ────────────────────────────────────
function TopSection() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = () => {
      const line1 = el.querySelector('.s-top-wipe-line') as HTMLElement
      const line2 = el.querySelector('.s-top-wipe-line--2') as HTMLElement
      const brand = el.querySelector('.s-top-brand') as HTMLElement
      const sub = el.querySelector('.s-top-sub') as HTMLElement
      const scroll = el.querySelector('.s-top-scroll') as HTMLElement
      if (!line1 || !line2 || !brand || !sub) return
      line1.classList.add('is-active')
      line1.querySelector('span')!.addEventListener('animationend', () => {
        line2.classList.add('is-active')
        line2.querySelector('span')!.addEventListener('animationend', () => {
          brand.classList.add('is-active')
          brand.addEventListener('animationend', () => {
            sub.classList.add('is-active')
            if (scroll) scroll.classList.add('is-active')
          }, { once: true })
        }, { once: true })
      }, { once: true })
      el.classList.add('is-ready')
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
  }, [])
  return (
    <section className="s-top" ref={ref}>
      <div className="s-top-bg" aria-hidden="true">
        <div className="s-top-halo" />
        <svg viewBox="0 0 200 200">
          <circle className="s-top-arc-orange" cx="100" cy="100" r="90" />
          <circle className="s-top-arc-navy" cx="100" cy="100" r="70" />
        </svg>
      </div>

      <div className="s-top-content">
        <div className="s-top-text">
          <div className="s-top-wipe-line">
            <div className="s-top-bar" />
            <span className="s-top-accent">갱년기!</span>
          </div>
          <div className="s-top-wipe-line s-top-wipe-line--2">
            <div className="s-top-bar" />
            <span>안 빠지는 몸엔</span>
          </div>
        </div>
        <div className="s-top-brand">
          <div className="s-top-logo-wrap">
            <img className="s-top-logo" src="/images/logo.png" alt="리셋 다이어트" />
          </div>
          <div className="s-top-sub">
            <span className="s-top-sub-line" />
            <span className="s-top-sub-text">리셋 바디</span>
            <span className="s-top-sub-amp">&amp;</span>
            <span className="s-top-sub-text">리셋 마인드</span>
            <span className="s-top-sub-line" />
          </div>
        </div>
      </div>

      <div className="s-top-scroll" aria-hidden="true">
        <span>SCROLL</span>
        <div className="s-top-scroll-dot" />
      </div>
    </section>
  )
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

    const scenes  = [...wrap.querySelectorAll<HTMLElement>('.emp-scene')]
    const bars    = [...wrap.querySelectorAll<HTMLElement>('.prog-bar')]
    const counter = wrap.querySelector<HTMLElement>('.emp-counter')!
    let cur = -1

    function show(idx: number) {
      if (idx === cur) return
      const prev = cur
      scenes.forEach((s, i) => {
        if (i === idx) { s.classList.remove('exit'); s.classList.add('active') }
        else if (i === prev && prev >= 0) { s.classList.remove('active'); s.classList.add('exit') }
        else { s.classList.remove('active', 'exit') }
      })
      bars.forEach((b, i) => b.classList.toggle('filled', i <= idx))
      counter.querySelector('.emp-cur')!.textContent = `${idx + 1}`
      sticky.style.backgroundColor = EMP_CFG[idx].bg
      breath.style.opacity   = '1'
      breath.style.transform = `translate(-50%,-50%) scale(${EMP_CFG[idx].scale})`
      cur = idx
    }

    const isPC = matchMedia('(pointer: fine)').matches
    show(0)

    if (isPC) {
      /* ═══ PC ═══ */
      let locked = false
      let exitGuard = false
      let exitGuardTimer = 0
      let lastWrapTop = NaN
      let stepping = false
      let stepTimer = 0

      function lock(dir: number) {
        if (locked) return
        locked = true
        const sw = window.innerWidth - document.documentElement.clientWidth
        const wr = wrap.getBoundingClientRect()
        window.scrollTo({ top: window.scrollY + wr.top, behavior: 'instant' })
        sticky.style.position = 'fixed'
        sticky.style.inset = '0'
        sticky.style.zIndex = '1000'
        document.documentElement.style.overflow = 'hidden'
        if (sw > 0) document.documentElement.style.paddingRight = `${sw}px`
        show(dir > 0 ? 0 : N - 1)
        window.addEventListener('wheel', onWheel, { passive: false })
      }

      function unlock(dir: number) {
        if (!locked) return
        locked = false
        window.removeEventListener('wheel', onWheel)
        stepping = false
        clearTimeout(stepTimer)
        sticky.style.position = ''
        sticky.style.inset = ''
        sticky.style.zIndex = ''
        document.documentElement.style.overflow = ''
        document.documentElement.style.paddingRight = ''
        const wr = wrap.getBoundingClientRect()
        if (Math.abs(wr.top) > 1) window.scrollTo({ top: window.scrollY + wr.top, behavior: 'instant' })
        lastWrapTop = 0
        exitGuard = true
        clearTimeout(exitGuardTimer)
        exitGuardTimer = window.setTimeout(() => { exitGuard = false }, 800)
        window.scrollBy({ top: dir * window.innerHeight, behavior: 'smooth' })
      }

      function onWheel(e: WheelEvent) {
        if (!locked) return
        e.preventDefault()
        if (e.deltaY === 0 || stepping) return
        const dir = e.deltaY > 0 ? 1 : -1
        const next = cur + dir
        if (next < 0 || next >= N) { unlock(dir); return }
        show(next)
        stepping = true
        clearTimeout(stepTimer)
        stepTimer = window.setTimeout(() => { stepping = false }, 400)
      }

      function onScroll() {
        if (locked || exitGuard) return
        const r = wrap.getBoundingClientRect()
        const prev = lastWrapTop
        lastWrapTop = r.top
        if (isNaN(prev) || r.bottom < window.innerHeight * 0.8) return
        if ((prev > 0 && r.top <= 0) || (prev < 0 && r.top >= 0)) {
          lock(r.top <= prev ? 1 : -1)
        }
      }

      function onVisibility() { if (document.hidden && locked) unlock(1) }

      window.addEventListener('scroll', onScroll, { passive: true })
      document.addEventListener('visibilitychange', onVisibility)

      return () => {
        clearTimeout(stepTimer)
        clearTimeout(exitGuardTimer)
        if (locked) {
          window.removeEventListener('wheel', onWheel)
          sticky.style.position = ''
          sticky.style.inset = ''
          sticky.style.zIndex = ''
          document.documentElement.style.overflow = ''
          document.documentElement.style.paddingRight = ''
        }
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', onVisibility)
      }

    } else {
      /* ═══ Mobile ═══ */
      let locked = false
      let exitGuard = false
      let exitGuardTimer = 0
      let lastWrapTop = NaN
      let touchY = 0
      let touchDone = false

      function lock(dir: number) {
        if (locked) return
        locked = true
        const wr = wrap.getBoundingClientRect()
        window.scrollTo({ top: window.scrollY + wr.top, behavior: 'instant' })
        document.documentElement.style.overflow = 'hidden'
        show(dir > 0 ? 0 : N - 1)
      }

      function unlock(dir: number) {
        if (!locked) return
        locked = false
        document.documentElement.style.overflow = ''
        exitGuard = true
        clearTimeout(exitGuardTimer)
        exitGuardTimer = window.setTimeout(() => { exitGuard = false }, 800)
        window.scrollBy({ top: dir * window.innerHeight, behavior: 'smooth' })
      }

      function onTouchStart(e: TouchEvent) {
        if (!locked) return
        touchY = e.touches[0].clientY
        touchDone = false
      }

      function onTouchMove(e: TouchEvent) {
        if (!locked) return
        e.preventDefault()
        if (touchDone) return
        const dy = touchY - e.touches[0].clientY
        if (Math.abs(dy) < 30) return
        touchDone = true
        const dir = dy > 0 ? 1 : -1
        const next = cur + dir
        if (next < 0 || next >= N) { unlock(dir); return }
        show(next)
      }

      function onScroll() {
        if (locked || exitGuard) return
        const r = wrap.getBoundingClientRect()
        const prev = lastWrapTop
        lastWrapTop = r.top
        if (isNaN(prev) || r.bottom < window.innerHeight * 0.8) return
        if ((prev > 0 && r.top <= 0) || (prev < 0 && r.top >= 0)) {
          lock(r.top <= prev ? 1 : -1)
        }
      }

      function onVisibility() { if (document.hidden && locked) unlock(1) }

      window.addEventListener('scroll', onScroll, { passive: true })
      wrap.addEventListener('touchstart', onTouchStart, { passive: true })
      wrap.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('visibilitychange', onVisibility)

      return () => {
        clearTimeout(exitGuardTimer)
        if (locked) document.documentElement.style.overflow = ''
        window.removeEventListener('scroll', onScroll)
        wrap.removeEventListener('touchstart', onTouchStart)
        wrap.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
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
          <span className="emp-counter"><span className="emp-cur">1</span><span className="emp-sep"> / {N}</span></span>
          <div className="emp-bars">
            {EMPATHY.map((_, i) => (
              <span key={i} className={`prog-bar${i === 0 ? ' filled' : ''}`} />
            ))}
          </div>
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
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const readIdx = () =>
      setIdx(Math.round(track.scrollLeft / track.clientWidth))

    let startX = 0
    let startY = 0
    let scrollStart = 0
    let axis: '' | 'x' | 'y' = ''

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      scrollStart = track.scrollLeft
      axis = ''
    }

    const onTouchMove = (e: TouchEvent) => {
      if (axis === 'y') return
      if (!axis) {
        const dx = Math.abs(e.touches[0].clientX - startX)
        const dy = Math.abs(e.touches[0].clientY - startY)
        if (dx < 8 && dy < 8) return
        axis = dx > dy ? 'x' : 'y'
        if (axis === 'y') return
      }
      track.scrollLeft = scrollStart - (e.touches[0].clientX - startX)
    }

    const onTouchEnd = () => {
      if (axis === 'x') {
        const w = track.clientWidth
        const target = Math.round(track.scrollLeft / w) * w
        track.scrollTo({ left: target, behavior: 'smooth' })
      }
    }

    track.addEventListener('touchstart', onTouchStart, { passive: true })
    track.addEventListener('touchmove', onTouchMove, { passive: true })
    track.addEventListener('touchend', onTouchEnd, { passive: true })

    if ('onscrollend' in window) {
      track.addEventListener('scrollend', readIdx, { passive: true })
      return () => {
        track.removeEventListener('scrollend', readIdx)
        track.removeEventListener('touchstart', onTouchStart)
        track.removeEventListener('touchmove', onTouchMove)
        track.removeEventListener('touchend', onTouchEnd)
      }
    } else {
      let timer: ReturnType<typeof setTimeout>
      const onScroll = () => {
        clearTimeout(timer)
        timer = setTimeout(readIdx, 80)
      }
      track.addEventListener('scroll', onScroll, { passive: true })
      return () => {
        clearTimeout(timer)
        track.removeEventListener('scroll', onScroll)
        track.removeEventListener('touchstart', onTouchStart)
        track.removeEventListener('touchmove', onTouchMove)
        track.removeEventListener('touchend', onTouchEnd)
      }
    }
  }, [])

  const goTo = (next: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' })
    setIdx(next)
  }

  return (
    <div className="tr-ph-swipe">
      <div className="b-prog" aria-hidden="true">
        <span className="b-prog-counter">
          <span className="b-prog-cur">{idx + 1}</span>
          <span className="b-prog-sep"> / 3</span>
        </span>
        <div className="b-prog-bars">
          {[0, 1, 2].map(i => (
            <span key={i} className={`b-prog-bar${i <= idx ? ' filled' : ''}`} />
          ))}
        </div>
      </div>

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
        className={`b-arrow b-arrow--prev${idx === 0 ? ' b-arrow--disabled' : ''}`}
        onClick={() => goTo(Math.max(0, idx - 1))}
        aria-label="이전 카드"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        className={`b-arrow b-arrow--next${idx === 2 ? ' b-arrow--disabled' : ''}`}
        onClick={() => goTo(Math.min(2, idx + 1))}
        aria-label="다음 카드"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
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
      <section className="tr-profile">
        <div className="tr-prof-grid">
          <div className="tr-prof-left">
            <img src="/images/doctor.png" alt="박승현 원장" className="tr-prof-img" />
            <div className="tr-prof-overlay" />
            <div className="tr-prof-caption">
              <p className="tr-prof-name">박승현 원장</p>
              <p className="tr-prof-sub">전주W한의원 · 리셋다이어트</p>
            </div>
          </div>
          <div className="tr-prof-right">
            <p className="tr-prof-anchor">
              10년이 쌓은<br />
              <span className="tr-prof-orange">한 가지 확신</span>
            </p>
            <div className="tr-prof-rule" />
            <div className="tr-prof-story">
              <p className="tr-prof-story-lead">
                10년 이상 다이어트와 <span className="mob" />
                대사질환을 진료하며<br />
                반복해서 확인한 게 하나 있습니다.
              </p>
              <p className="tr-prof-story-core">갱년기 살은 <span className="mob" />의지의 문제가 아닙니다.</p>
              <p className="tr-prof-punch">
                방법이 달라야 합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Part 4: 유튜브 */}
      <div className="tr-youtube">
        <Reveal>
          <p className="tr-yt-title">리셋다이어트 채널</p>
          <p className="tr-yt-desc">갱년기 다이어트, <span className="mob" />왜 안 되는지부터 설명합니다.</p>
          <div className="tr-yt-iframe-wrap">
            <iframe
              src="https://www.youtube.com/embed/nUM2M4_rF0E"
              title="리셋다이어트 유튜브 메인 영상"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="tr-yt-iframe"
            />
          </div>
          <div className="tr-yt-sub-row">
            <div className="tr-yt-iframe-wrap tr-yt-sub">
              <iframe
                src="https://www.youtube.com/embed/1h25HpZfNEQ"
                title="리셋다이어트 유튜브 보조 영상 1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="tr-yt-iframe"
              />
            </div>
            <div className="tr-yt-iframe-wrap tr-yt-sub">
              <iframe
                src="https://www.youtube.com/embed/tevlolLxysc"
                title="리셋다이어트 유튜브 보조 영상 2"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="tr-yt-iframe"
              />
            </div>
          </div>
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
    q: '갱년기에 탄수화물을 끊어야 하나요?',
    lead: '끊을 필요 없습니다.',
    body: '다만 조절은 필요합니다. 갱년기에는 같은 양의 탄수화물도 혈당을 더 크게 흔들 수 있습니다. 흰쌀밥·면·빵을 줄이고 단백질을 먼저 드시는 것부터 시작하시면 됩니다.',
  },
  {
    q: '갱년기에 잠을 못 자면 살이 더 찌나요?',
    lead: '그렇습니다.',
    body: '수면이 부족하면 인슐린 저항성이 올라가고 식욕 호르몬이 흔들립니다. 식단을 아무리 잘 해도 잠이 무너지면 효과가 떨어집니다. 리셋다이어트에서 수면을 핵심 축으로 보는 이유입니다.',
  },
  {
    q: '갱년기인데 한약 다이어트 해도 되나요?',
    lead: '됩니다.',
    body: '오히려 갱년기에 가장 잘 맞는 방법 중 하나입니다. 호르몬 흐름을 보정하면서 살을 빼기 때문에 열감·불면 같은 증상도 함께 좋아집니다.',
  },
  {
    q: '호르몬 치료(HRT)와 같이 해도 되나요?',
    lead: '병행 가능합니다.',
    body: '현재 복용 중인 호르몬제 정보를 상담 시 알려주시면 처방에 반영합니다.',
  },
  {
    q: '한 달에 얼마나 빠지나요?',
    lead: '개인 상태에 따라 다릅니다.',
    body: '리셋다이어트는 체중계 숫자만 보지 않습니다. 내장지방·근육량·갱년기 증상을 함께 봅니다.',
  },
  {
    q: '요요는 안 오나요?',
    lead: '요요는 다이어트 방식이 만듭니다.',
    body: '리셋다이어트는 마무리 단계에서 식사법을 일상에 정착시키기 때문에 끝나도 흔들리지 않도록 설계되어 있습니다.',
  },
] as const

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const toggle = (i: number) => setOpen(open === i ? null : i)

  return (
    <section className="s-faq">
      <Reveal>
        <div className="faq-header">
          <svg className="faq-bubble" xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 11v.01"/><path d="M8 11v.01"/><path d="M16 11v.01"/>
            <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/>
          </svg>
          <p className="faq-head">상담 전에 많이 물어보시는 것들</p>
        </div>
      </Reveal>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className={`faq-item${open === i ? ' open' : ''}`}>
            <button className="faq-q" onClick={() => toggle(i)}>
              <span><span className="faq-q-label">Q.</span> {item.q}</span>
              <svg className="faq-chev" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6l6 -6"/>
              </svg>
            </button>
            <div className="faq-a-wrap">
              <div className="faq-a">
                <div className="faq-a-inner">
                  <p className="faq-lead">{item.lead}</p>
                  <p className="faq-body">{item.body}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Reveal>
        <div className="faq-cta">
          <a
            href="https://pf.kakao.com/_xjxcgpxl"
            target="_blank"
            rel="noopener noreferrer"
            className="faq-kakao"
          >
            카카오톡으로 편하게 물어보세요
            <svg className="faq-kakao-chev" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6l6 -6"/>
            </svg>
          </a>
        </div>
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
          <p className="kk-kicker">카카오톡 채널 · 무료 상담</p>
          <p className="kk-body">
            지금 내 몸 상태가 궁금하다면<br />
            편하게 물어보세요.
          </p>
        </Reveal>
        <Reveal>
          <div className="kk-convo">
            <div className="kk-msg-row">
              <img src="/images/doctor.png" alt="원장 박승현" className="kk-msg-avatar" />
              <div className="kk-msg-bubble">
                <p className="kk-msg-name">원장 박승현</p>
                <p className="kk-msg-text">원장이 직접 답합니다.</p>
              </div>
            </div>
            <a
              href="https://pf.kakao.com/_xjxcgpxl"
              target="_blank"
              rel="noopener noreferrer"
              className="kk-input-cta"
            >
              <span className="kk-input-placeholder">지금 궁금한 것을 물어보세요</span>
              <span className="kk-input-send">→</span>
            </a>
          </div>
        </Reveal>
        <Reveal>
          <ul className="kk-strengths">
            <li><span className="kk-chk">✓</span>비용 없이 궁금한 점부터</li>
            <li><span className="kk-chk">✓</span>진료 예약 강요 없습니다</li>
            <li><span className="kk-chk">✓</span>평일 진료시간 내 빠른 답변</li>
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

// ── 11. VisitGuide ───────────────────────────────────
function VisitGuide() {
  return (
    <section className="s-visit">
      <div className="visit-inner">
        <Reveal>
          <h2 className="visit-title">오시기 전에</h2>
        </Reveal>
        <Reveal>
          <div className="visit-block">
            <p className="visit-label">진료시간</p>
            <ul className="visit-hours">
              <li>
                <span className="visit-day">평일</span>
                <span className="visit-time">09:00 – 19:30<span className="visit-note"> (점심 12:30 – 14:00)</span></span>
              </li>
              <li>
                <span className="visit-day">토요일</span>
                <span className="visit-time">08:30 – 14:00<span className="visit-note"> (점심시간 없이 진료)</span></span>
              </li>
              <li>
                <span className="visit-day visit-day-off">일요일 · 공휴일</span>
                <span className="visit-time visit-time-off">휴진</span>
              </li>
            </ul>
          </div>
        </Reveal>
        <Reveal>
          <div className="visit-block">
            <p className="visit-label">찾아오시는 길</p>
            <div className="visit-addr-group">
              <p className="visit-addr">전북 전주시 완산구 홍산1길 21, 207호</p>
              <p className="visit-addr-sub">(효자동 서희스타힐스 상가)</p>
            </div>
            <div className="visit-addr-group">
              <p className="visit-addr">상가 2층 주차장 이용 시<br />한의원 입구와 바로 연결됩니다.</p>
              <p className="visit-addr-sub">(무료 주차 가능)</p>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <a href="https://naver.me/F5Dd4I3m" target="_blank" rel="noopener noreferrer" className="visit-map-btn">
            네이버 지도에서 보기
          </a>
        </Reveal>
      </div>
    </section>
  )
}

// ── Footer Modal Content ──────────────────────────────
function TermsContent() {
  return (
    <>
      <div className="ft-modal-section">
        <p className="ft-modal-h">제1조 (목적)</p>
        <p className="ft-modal-p">이 약관은 전주W한의원(이하 "본원")이 운영하는 웹사이트(이하 "사이트")에서 제공하는 인터넷 관련 서비스(이하 "서비스")를 이용함에 있어 본원과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">제2조 (정의)</p>
        <ul className="ft-modal-list">
          <li>"사이트"란 본원이 정보를 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 설정한 가상의 영업장을 말합니다.</li>
          <li>"이용자"란 "사이트"에 접속하여 이 약관에 따라 "사이트"가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
        </ul>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">제3조 (약관의 명시와 개정)</p>
        <p className="ft-modal-p">본원은 이 약관의 내용과 상호, 영업소 소재지, 대표자의 성명, 사업자등록번호, 연락처 등을 이용자가 알 수 있도록 사이트의 초기 서비스 화면에 게시합니다. 본원은 약관의 규제 등에 관한 법률, 전자거래기본법 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">제4조 (서비스의 제공 및 변경)</p>
        <p className="ft-modal-p">본원은 사이트를 통해 다음과 같은 업무를 수행합니다.</p>
        <ul className="ft-modal-list">
          <li>의료 정보 및 본원 소개 정보 제공</li>
          <li>진료 예약 및 상담 신청 서비스</li>
          <li>기타 본원이 정하는 업무</li>
        </ul>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">제5조 (서비스의 중단)</p>
        <p className="ft-modal-p">본원은 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">제6조 (이용자의 의무)</p>
        <p className="ft-modal-p">이용자는 다음 행위를 하여서는 안 됩니다.</p>
        <ul className="ft-modal-list">
          <li>신청 또는 변경 시 허위내용의 등록</li>
          <li>사이트에 게시된 정보의 변경</li>
          <li>본원이 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시</li>
          <li>본원 및 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
          <li>본원 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
        </ul>
      </div>
    </>
  )
}

function PrivacyContent() {
  return (
    <>
      <div className="ft-modal-section">
        <p className="ft-modal-h">1. 개인정보의 처리 목적</p>
        <p className="ft-modal-p">전주W한의원(이하 '본원')은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
        <ul className="ft-modal-list">
          <li>진료 및 치료 서비스 제공</li>
          <li>진료 예약 및 상담</li>
          <li>진료비 청구, 수납, 환불 등의 원무 처리</li>
          <li>의료법, 건강보험법 등 관련 법령에 따른 의무 이행</li>
        </ul>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">2. 처리하는 개인정보 항목</p>
        <p className="ft-modal-p">본원은 진료 및 서비스 제공을 위해 아래와 같은 최소한의 개인정보를 수집하고 있습니다.</p>
        <ul className="ft-modal-list">
          <li>필수항목: 성명, 주민등록번호(또는 외국인등록번호), 주소, 연락처, 병력 및 가족력 등 진료에 필요한 건강정보</li>
          <li>선택항목: 이메일, 보호자 연락처 등</li>
        </ul>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">3. 개인정보의 처리 및 보유 기간</p>
        <p className="ft-modal-p">본원은 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
        <ul className="ft-modal-list">
          <li>진료기록부: 10년 (의료법)</li>
          <li>환자 명부: 5년 (의료법)</li>
          <li>처방전: 2년 (의료법)</li>
          <li>건강보험 청구 관련 기록: 5년 (국민건강보험법)</li>
        </ul>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">4. 정보주체의 권리·의무 및 행사방법</p>
        <p className="ft-modal-p">정보주체는 본원에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
        <ul className="ft-modal-list">
          <li>개인정보 열람요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제요구</li>
          <li>처리정지 요구</li>
        </ul>
      </div>
      <div className="ft-modal-section">
        <p className="ft-modal-h">5. 개인정보의 안전성 확보조치</p>
        <p className="ft-modal-p">본원은 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
        <ul className="ft-modal-list">
          <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
          <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
          <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
        </ul>
      </div>
    </>
  )
}

// ── 12. SiteFooter ────────────────────────────────────
function SiteFooter() {
  const [modal, setModal] = useState<'terms' | 'privacy' | null>(null)

  return (
    <>
      <footer className="s-footer">
        <div className="ft-inner">
          <p className="ft-name">전주W한의원</p>
          <ul className="ft-info">
            <li>의료기관명: 전주W한의원</li>
            <li>대표자: 박승현</li>
            <li>주소: 전북 전주시 완산구 홍산1길 21, 207호</li>
            <li>대표전화: 063-221-7500</li>
            <li>사업자등록번호: 887-23-01841</li>
          </ul>
          <div className="ft-legal">
            <button className="ft-legal-btn" onClick={() => setModal('terms')}>이용약관</button>
            <span className="ft-legal-sep">|</span>
            <button className="ft-legal-btn" onClick={() => setModal('privacy')}>개인정보처리방침</button>
          </div>
          <p className="ft-copy">© 2026 Jeonju W Korean Medicine Clinic. All rights reserved.</p>
        </div>
      </footer>
      {modal && (
        <div className="ft-modal-backdrop" onClick={() => setModal(null)}>
          <div className="ft-modal" onClick={e => e.stopPropagation()}>
            <div className="ft-modal-header">
              <h2 className="ft-modal-title">
                {modal === 'terms' ? '이용약관' : '개인정보처리방침'}
              </h2>
              <button className="ft-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="ft-modal-body">
              {modal === 'terms' ? <TermsContent /> : <PrivacyContent />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── HomePage ─────────────────────────────────────────
function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initState = location.state as { openSurvey?: boolean } | null
  const [showSurvey, setShowSurvey] = useState(initState?.openSurvey === true)

  useEffect(() => {
    if (initState?.openSurvey !== undefined) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem('rc_referrer')) return
    sessionStorage.setItem('rc_referrer', document.referrer || '')
    const params = new URLSearchParams(window.location.search)
    const utm: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = params.get(key)
      if (v) utm[key] = v
    }
    sessionStorage.setItem('rc_utm', JSON.stringify(utm))
  }, [])

  useEffect(() => {
    document.body.style.overflow = showSurvey ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showSurvey])

  function closeSurvey() {
    setShowSurvey(false)
  }

  return (
    <>
      <main>
        <TopSection />
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
        <VisitGuide />
      </main>
      <SiteFooter />
      {!showSurvey && <ScrollTopBtn />}
      {!showSurvey && <QuickMenu onSurvey={() => setShowSurvey(true)} />}
      {showSurvey && (
        <div style={{ position:'fixed', inset:0, zIndex:1000 }}>
          <Survey onClose={closeSurvey} />
        </div>
      )}
    </>
  )
}

// ── ScrollTopBtn — 맨 위로 스크롤 ────────────────────
function ScrollTopBtn() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const pastHero = y > window.innerHeight
        const scrollingUp = y < lastY
        const atTop = y < 10

        setVisible(pastHero && scrollingUp && !atTop)
        lastY = y
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      className={`scroll-top-btn${visible ? ' is-visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="맨 위로 이동"
    >
      <i className="ti ti-chevron-up" />
    </button>
  )
}

// ── QuickMenu — 플로팅 퀵메뉴 ────────────────────────
function QuickMenu({ onSurvey }: { onSurvey: () => void }) {
  return (
    <>
      {/* PC: 우하단 세로 플로팅 */}
      <div className="qm-pc">
        <a href="https://pf.kakao.com/_xjxcgpxl" target="_blank" rel="noopener noreferrer" className="qm-pc-item qm-pc-kakao" aria-label="카카오톡 상담">
          <span className="qm-pc-pill">
            <span className="qm-pc-label">카카오톡</span>
            <span className="qm-pc-icon"><i className="ti ti-message-circle"></i></span>
          </span>
        </a>
        <button onClick={onSurvey} className="qm-pc-item qm-pc-survey" aria-label="자가진단">
          <span className="qm-pc-pill">
            <span className="qm-pc-label">자가진단</span>
            <span className="qm-pc-icon"><i className="ti ti-clipboard-heart"></i></span>
          </span>
        </button>
      </div>

      {/* 모바일: 하단 고정 바 */}
      <nav className="qm-mob">
        <a href="tel:063-221-7500" className="qm-mob-btn qm-mob-phone">
          <i className="ti ti-phone" />
          <span>전화</span>
        </a>
        <button onClick={onSurvey} className="qm-mob-btn qm-mob-survey">
          <span className="qm-mob-survey-icon"><i className="ti ti-clipboard-heart" /></span>
          <span>자가진단</span>
        </button>
        <a href="https://pf.kakao.com/_xjxcgpxl" target="_blank" rel="noopener noreferrer" className="qm-mob-btn qm-mob-kakao">
          <i className="ti ti-message-circle" />
          <span>카카오톡</span>
        </a>
      </nav>
    </>
  )
}

// ── App ──────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/survey" element={<Navigate to="/" state={{ openSurvey: true }} replace />} />
      <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
    </Routes>
  )
}
