import { useEffect, useRef, useState } from 'react'

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
      <Reveal><p className="hero-kicker">전주W한의원</p></Reveal>
      <div className="hero-text">
        <Reveal><p>지금 이 순간에도</p></Reveal>
        <Reveal><p>답답한 마음에</p></Reveal>
        <Reveal><p>이유라도 알고 싶어서</p></Reveal>
        <Reveal>
          <p><span className="hi-orange">여기까지</span> 오셨나요?</p>
        </Reveal>
      </div>
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
          <p className="bp-3">저도 진료실에서 매일 드는 말이 있어요.</p>
        </Reveal>
      </div>
    </section>
  )
}

// ── 3. Empathy — D(온기 원) × F(네이비 수직 바) ──────
const EMPATHY = [
  '작년에 입던 옷이 올해는 안 맞아요.',
  '밥도 줄였는데 체중계 숫자는 그대로예요.',
  '운동도 시작했는데 배는 오히려 더 나왔어요.',
  '뭘 해도 안 되는 건지 나만 이상한 건지.',
  '답을 찾고 싶어서 오늘도 검색하고 있어요.',
] as const

const EMP_CFG = [
  { bg: '#ffffff',  scale: 0.04 },
  { bg: '#fefcfa',  scale: 0.12 },
  { bg: '#fdf9f4',  scale: 0.21 },
  { bg: '#fbf4ec',  scale: 0.32 },
  { bg: '#f8ede1',  scale: 0.44 },
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
      scenes.forEach((s, i) => s.classList.toggle('active', i === idx))
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
              체온 · 식욕 · 수면 · 자율신경<br />
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
            우리는 <span className="hi-orange">호르몬</span> 변화에 집중해야 합니다.
          </p>
        </Reveal>
      </div>

      {/* Part 3: 증상 4가지 — 인포그래픽 카드 */}
      <div className="cause-part cause-p3">
        <Reveal>
          <p className="cp3-eyebrow">시상하부 조절 이상</p>
          <p className="cp3-htitle">4가지 신호</p>
        </Reveal>
        <Reveal>
          <div className="cp3-grid">
            <div className="cp3-card" data-num="01">
              <span className="cp3-num">01</span>
              <p className="cp3-sym">열감</p>
              <p className="cp3-mech">체온 조절이<br />흐트러지면서</p>
            </div>
            <div className="cp3-card" data-num="02">
              <span className="cp3-num">02</span>
              <p className="cp3-sym">불면</p>
              <p className="cp3-mech">수면 리듬이<br />깨지면서</p>
            </div>
            <div className="cp3-card" data-num="03">
              <span className="cp3-num">03</span>
              <p className="cp3-sym">복부지방</p>
              <p className="cp3-mech">대사 균형이<br />무너지면서</p>
            </div>
            <div className="cp3-card" data-num="04">
              <span className="cp3-num">04</span>
              <p className="cp3-sym">피로</p>
              <p className="cp3-mech">만성 피로가<br />쌓이면서</p>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <p className="cp3-conclusion">
            네 가지는 따로 오는 증상이 아닙니다.<br />
            시상하부 하나에서 비롯된 결과입니다.
          </p>
        </Reveal>
      </div>

    </section>
  )
}

// ── 6. Symptoms — 탭형 슬라이드 ──────────────────────
const SYM_TABS = [
  {
    label: '열감',
    patient: '갑자기 얼굴이 화끈, 등에선 식은땀이 나요.',
    lines: [
      '시상하부가 체온 신호를 잘못 읽는 겁니다.',
      '실제로 덥지 않은데 몸이 열을 빼내려 과민 반응해요.',
    ],
  },
  {
    label: '불면',
    patient: '새벽 3시, 또 이유없이 깼습니다.',
    lines: [
      '심부체온이 안정되지 않으면 깊은 잠에 들 수 없습니다.',
      '자다 깨고, 또 자다 깨고. 그게 반복되는 거예요.',
    ],
  },
  {
    label: '뱃살',
    patient: '먹는 건 비슷한데 배만 늘었어요.',
    lines: [
      '에스트로겐이 줄면 지방이 배로 먼저 축적됩니다.',
      '인슐린 저항성까지 높아져 더 빠르게 쌓여요.',
    ],
  },
  {
    label: '피로',
    patient: '아무것도 하기 싫고 종일 피곤합니다.',
    lines: [
      '수면 분절이 코르티솔 리듬을 교란시킵니다.',
      '푹 잔 것 같은데도 아침에 무거운 이유가 여기 있어요.',
    ],
  },
] as const

function Symptoms() {
  const [active, setActive] = useState(0)

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
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div key={active} className="sym-content" role="tabpanel">
        <p className="sym-patient">"{SYM_TABS[active].patient}"</p>
        <span className="sym-rule" aria-hidden="true" />
        <div className="sym-explain">
          {SYM_TABS[active].lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 7. Placeholder ───────────────────────────────────
function Placeholder() {
  return (
    <footer className="s-placeholder" aria-hidden="true">
      <span className="ph-line" />
    </footer>
  )
}

// ── App ──────────────────────────────────────────────
export default function App() {
  return (
    <main>
      <Hero />
      <Bridge />
      <Empathy />
      <Bridge2 />
      <Cause />
      <Symptoms />
      <Placeholder />
    </main>
  )
}
