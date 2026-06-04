import { useEffect, useRef, useState } from 'react'

// ── Scroll Reveal ────────────────────────────────────
function useReveal(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Reveal({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={`reveal${visible ? ' visible' : ''}`}>
      {children}
    </div>
  )
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
          <p>
            <span className="hi-orange">여기까지</span> 오셨나요?
          </p>
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
          <p className="bp-1">
            여러분은 <span className="hi-navy">잘못한 게 없어요</span>.
          </p>
        </Reveal>
        <Reveal>
          <p className="bp-2">
            <span className="hi-orange">몸이 바뀐</span> 겁니다.
          </p>
        </Reveal>
        <Reveal>
          <p className="bp-3">저도 진료실에서 매일 드는 말이 있어요.</p>
        </Reveal>
      </div>
    </section>
  )
}

// ── 3. Empathy — Sticky Scroll ───────────────────────
const EMPATHY = [
  '작년에 입던 옷이 올해는 안 맞아요.',
  '밥도 줄였는데 체중계 숫자는 그대로예요.',
  '운동도 시작했는데 배는 오히려 더 나왔어요.',
  '뭘 해도 안 되는 건지 나만 이상한 건지.',
  '답을 찾고 싶어서 오늘도 검색하고 있어요.',
] as const

function Empathy() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [cur, setCur] = useState(0)
  const N = EMPATHY.length

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const onScroll = () => {
      const scrolled   = -wrap.getBoundingClientRect().top
      const scrollable = wrap.offsetHeight - window.innerHeight
      if (scrolled <= 0)          { setCur(0); return }
      if (scrolled >= scrollable) { return }
      const idx = Math.min(Math.floor((scrolled / scrollable) * N), N - 1)
      setCur(idx)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [N])

  return (
    <div className="s-empathy-wrap" ref={wrapRef}>
      <div className="s-empathy-sticky">
        {EMPATHY.map((text, i) => (
          <p
            key={i}
            className={`emp-sentence${cur === i ? ' active' : ''}`}
            data-step={i + 1}
          >
            {text}
          </p>
        ))}
        <div className="emp-prog" aria-hidden="true">
          {EMPATHY.map((_, i) => (
            <span key={i} className={`prog-bar${i <= cur ? ' filled' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 4. Placeholder ───────────────────────────────────
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
      <Placeholder />
    </main>
  )
}
