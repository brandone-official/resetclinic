import { useEffect, useRef, useState } from 'react'

// ── Scroll Reveal ────────────────────────────────────
function useReveal(threshold = 0.4) {
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
      <div className="hero-text">
        <p>지금 이 순간에도</p>
        <p>답답한 마음에</p>
        <p>이유라도 알고 싶어서</p>
        <p>여기까지 오셨나요?</p>
      </div>
    </section>
  )
}

// ── 2. Bridge ────────────────────────────────────────
function Bridge() {
  return (
    <section className="s-bridge">
      <Reveal><p className="bridge-p">여러분은 잘못한 게 없어요.</p></Reveal>
      <Reveal><p className="bridge-p">몸이 바뀐 겁니다.</p></Reveal>
      <Reveal><p className="bridge-p">저도 진료실에서 매일 드는 말이 있어요.</p></Reveal>
    </section>
  )
}

// ── 3. Empathy ───────────────────────────────────────
const EMPATHY = [
  { text: '작년에 입던 옷이 올해는 안 맞아요.', weight: 300, step: 1 },
  { text: '밥도 줄였는데 체중계 숫자는 그대로예요.', weight: 400, step: 2 },
  { text: '운동도 시작했는데 배는 오히려 더 나왔어요.', weight: 500, step: 3 },
  { text: '뭘 해도 안 되는 건지 나만 이상한 건지.', weight: 600, step: 4 },
  { text: '답을 찾고 싶어서 오늘도 검색하고 있어요.', weight: 800, step: 5 },
] as const

function Empathy() {
  return (
    <section className="s-empathy">
      {EMPATHY.map(({ text, step }, i) => (
        <div key={i} className="empathy-zone">
          <Reveal>
            <p
              className="em"
              data-step={step}
              style={{ fontWeight: EMPATHY[i].weight }}
            >
              {text}
            </p>
          </Reveal>
        </div>
      ))}
    </section>
  )
}

// ── 4. Placeholder ───────────────────────────────────
function Placeholder() {
  return (
    <section className="s-placeholder" aria-hidden="true">
      <span className="ph-line" />
    </section>
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
