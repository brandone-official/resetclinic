import { useState, useEffect, useRef } from 'react';
import './TrafficAccident.css';
import imgRoom1 from '../assets/입원실 전경.png';
import imgRoom2 from '../assets/입원실 디테일.png';
import imgTreat1 from '../assets/치료실.png';
import imgTreat2 from '../assets/치료실 디테일.png';

/* ════════════════════
   HOOKS
════════════════════ */
function useCountUp(target, duration = 2200) {
  const [count, setCount] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  useEffect(() => {
    if (!triggered) return;
    const steps = Math.ceil(duration / 16);
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(cur));
    }, 16);
    return () => clearInterval(id);
  }, [triggered, target, duration]);

  return { count, ref };
}

/* ════════════════════
   SHARED COMPONENTS
════════════════════ */
function Accordion({ items, defaultOpen = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = (i) => setOpen(open === i ? -1 : i);

  return (
    <div className="accordion">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`accordion-item${isOpen ? ' is-open' : ''}`}>
            <button className="accordion-header" onClick={() => toggle(i)}>
              <span className="accordion-title">{item.title}</span>
              <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
            </button>
            <div className="accordion-body">
              <div className="accordion-inner">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Carousel({ slides, dark = false }) {
  const [cur, setCur] = useState(0);
  const touchX = useRef(null);
  const touchY = useRef(null);

  const prev = () => setCur(c => Math.max(c - 1, 0));
  const next = () => setCur(c => Math.min(c + 1, slides.length - 1));

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = touchX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 48 && Math.abs(dx) > dy) { dx > 0 ? next() : prev(); }
    touchX.current = null;
  };

  return (
    <div className={`carousel${dark ? ' carousel--dark' : ''}`}>
      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${cur * 100}%)` }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {slides.map((s, i) => <div key={i} className="carousel-slide">{s}</div>)}
        </div>
      </div>
      <div className="carousel-controls">
        <button className="carousel-btn" onClick={prev} disabled={cur === 0} aria-label="이전">‹</button>
        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === cur ? ' is-active' : ''}`}
              onClick={() => setCur(i)}
              aria-label={`${i + 1}번`}
            />
          ))}
        </div>
        <button className="carousel-btn" onClick={next} disabled={cur === slides.length - 1} aria-label="다음">›</button>
      </div>
    </div>
  );
}

function ImgPlaceholder({ label, aspect = '4/3' }) {
  return (
    <div className="img-placeholder" style={{ aspectRatio: aspect }}>
      <span>{label}</span>
    </div>
  );
}

/* ════════════════════════════════
   ① 훅 — 3 CUTS
════════════════════════════════ */

/* Cut 1: 첫 인사 */
function HookCut1() {
  return (
    <section className="cut cut--navy">
      <div className="cut-inner">
        <span className="cut-eyebrow">전주W한의원 교통사고 클리닉</span>
        <h1 className="cut-title cut-title--white">
          갑작스러운 사고에<br />많이 놀라셨죠?
        </h1>
      </div>
    </section>
  );
}

/* Cut 2: 증상 열거 */
function HookCut2() {
  return (
    <section className="cut">
      <div className="cut-inner">
        <p className="cut-subtitle cut-subtitle--muted">사고 이후,</p>
        <div className="cut-divider" />
        <p className="cut-subtitle">
          목, 허리, 어깨부터<br />
          두통, 어지러움,<br />
          잠 못 드는 밤까지.
        </p>
      </div>
    </section>
  );
}

/* Cut 3: 공감 + 브릿지 A */
function HookCut3() {
  return (
    <section className="cut">
      <div className="cut-inner">
        <p className="cut-body">
          사고 후 온몸이 보내는 불편함이<br />걱정되셨을 겁니다.<br />
          앞으로 뭘 어떻게 해야 할지<br />막막한 지금,<br />
          전주W한의원이 처음부터 함께하겠습니다.
        </p>
        <div className="cut-bridge">
          그 막막함,<br />전주W한의원은 잘 알고 있습니다.
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════
   ② 신뢰 숫자 — 3 CUTS
════════════════════════════════ */

/* Cut 1: 카운팅 숫자 */
function TrustCut1() {
  const { count, ref } = useCountUp(16374, 2200);
  return (
    <section className="cut" ref={ref}>
      <div className="cut-inner">
        <p className="cut-subtitle cut-subtitle--muted">저희 한의원은 지금까지</p>
        <div className="cut-counter">
          <span className="cut-counter-number">{count.toLocaleString()}</span>
          <span className="cut-counter-unit">건</span>
        </div>
        <p className="cut-subtitle">의 교통사고 치료를<br />함께했습니다.</p>
      </div>
    </section>
  );
}

/* Cut 2: 누가 왔는가 */
function TrustCut2() {
  return (
    <section className="cut cut--gray">
      <div className="cut-inner">
        <div className="cut-groups">
          <span className="cut-group-item">통원으로 꾸준히 다니신 분들,</span>
          <span className="cut-group-item">입원이 필요하셨던 분들,</span>
          <span className="cut-group-item">사고 당일 많이 놀라서 오신 분들까지.</span>
        </div>
        <div className="cut-divider" />
        <p className="cut-body cut-body--dark">
          어떤 상황에서 오셔도<br />
          당황하지 않고<br />
          처음부터 함께합니다.
        </p>
      </div>
    </section>
  );
}

/* Cut 3: 궁금한 것들 + 약속 */
function TrustCut3() {
  return (
    <section className="cut cut--navy">
      <div className="cut-inner">
        <p className="cut-body cut-body--white">
          통원으로 시작할지, 입원이 필요한지<br />
          보험 처리는 어떻게 되는지<br />
          치료 기간은 얼마나 걸리는지
        </p>
        <div className="cut-bridge cut-bridge--dark">
          궁금한 것들,<br />부담 없이 먼저 물어보셔도 됩니다.
        </div>
        <p className="cut-small cut-small--white" style={{ marginTop: 28 }}>
          화면 아래 버튼으로 언제든 연락하실 수 있습니다.
        </p>
      </div>
    </section>
  );
}

/* ════════════════════════════════
   ③ 공감 섹션 — ACCORDION
════════════════════════════════ */
function EmpathySection() {
  const items = [
    {
      title: '사고 후 몸이 걱정돼요',
      content: (
        <div className="accordion-content">
          <p>사고 직후엔 괜찮은 것 같았는데<br />다음 날 아침, 몸을 일으키기가 힘드셨나요?</p>
          <p>목, 허리, 어깨가 뻐근하고<br />두통에 어지러움까지.<br />손발이 저리고 잠도 제대로 못 주무셨나요?</p>
          <p>소화가 안 되고 입맛이 없거나<br />괜히 예민해지고 불안한 느낌.<br />운전대를 잡는 것조차 무서워지기도 하셨을 겁니다.</p>
          <div className="empathy-highlight">
            그 증상들,<br />당신이 유난스러운 게 아닙니다.<br />사고 후 몸이 보내는 당연한 신호입니다.
          </div>
        </div>
      ),
    },
    {
      title: '보험·합의가 막막해요',
      content: (
        <div className="accordion-content">
          <p>몸이 채 낫기도 전에<br />보험사에서 합의 연락이 왔나요?</p>
          <p>합의를 하면 치료가 끝나는 건지<br />미루면 내가 손해인 건지<br />판단이 서지 않는 게 당연합니다.</p>
          <div className="empathy-highlight">
            합의는 한 번 하면 되돌릴 수 없습니다.<br />몸 상태가 충분히 회복된 후에<br />결정하셔도 늦지 않습니다.
          </div>
        </div>
      ),
    },
    {
      title: '퇴원했는데 아직 아파요',
      content: (
        <div className="accordion-content">
          <p>보험사 기준으로 퇴원 처리가 됐는데<br />몸은 아직 예전 같지 않으신가요?</p>
          <p>퇴원 이후에도 남아있는 통증,<br />쉽게 피로해지는 몸,<br />뭔가 찜찜하게 마무리된 느낌.</p>
          <div className="empathy-highlight">
            퇴원했다고 해서 치료가 끝난 건 아닙니다.<br />혼자 감당하지 않으셔도 됩니다.
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="block">
      <div className="block-header">
        <span className="block-label">공감 클리닉</span>
        <h2 className="block-title">지금 어떤 부분이<br />가장 걱정되시나요?</h2>
      </div>
      <div className="block-content">
        <Accordion items={items} defaultOpen={0} />
      </div>
    </section>
  );
}

/* ════════════════════════════════
   브릿지 블록 — 회복 철학
════════════════════════════════ */
function PhilosophySection() {
  return (
    <section className="block block--gray">
      <div className="block-header">
        <span className="block-label">회복 철학</span>
        <h2 className="block-title">
          눈에 보이지 않는 통증까지,<br />
          전주W한의원의 세심한 회복 철학
        </h2>
      </div>
      <div className="block-content philosophy-list">
        <div className="philosophy-item">
          <span className="philosophy-num">01</span>
          <div>
            <strong>영상에 이상이 없어도 아플 수 있습니다</strong>
            <p>MRI·X-ray에 나타나지 않는 통증도 치료 대상입니다. 몸이 보내는 신호를 놓치지 않겠습니다.</p>
          </div>
        </div>
        <div className="philosophy-item">
          <span className="philosophy-num">02</span>
          <div>
            <strong>통증 부위가 아니라 몸 전체의 흐름을 봅니다</strong>
            <p>한의학적 관점으로 몸의 균형을 찾아 근본적인 회복을 돕습니다.</p>
          </div>
        </div>
        <div className="philosophy-item">
          <span className="philosophy-num">03</span>
          <div>
            <strong>정형외과와 함께 다니셔도 됩니다</strong>
            <p>양·한방 병행 치료는 일반적이며, 보험 처리에 전혀 문제가 없습니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════
   ④ 입원 / 통원 선택 — ACCORDION
════════════════════════════════ */
function TreatmentSection() {
  const items = [
    {
      title: '🛏 입원 치료가 맞는 분들',
      content: (
        <div className="accordion-content">
          <ul className="treatment-list">
            <li>사고 후 1~2일 이내, 통증이 극심해요</li>
            <li>혼자 움직이기 힘들거나 일상이 어려워요</li>
            <li>단기간에 집중적으로 회복하고 싶어요</li>
            <li>심리적으로 불안하고 절대 안정이 필요해요</li>
          </ul>
          <div className="treatment-goal">
            → 몸속 어혈을 빠르게 제거하고<br />후유증 가능성을 최소화하는 것이 목표입니다.
          </div>
        </div>
      ),
    },
    {
      title: '🚶 통원 치료가 맞는 분들',
      content: (
        <div className="accordion-content">
          <ul className="treatment-list">
            <li>직장·학업 등 일상을 유지하며 치료하고 싶어요</li>
            <li>거동은 되는데 특정 부위가 계속 뻐근해요</li>
            <li>급성기 이후 꾸준한 재활·교정이 필요해요</li>
            <li>외상은 없는데 사고 후 컨디션이 떨어졌어요</li>
          </ul>
          <div className="treatment-goal">
            → 추나, 침 치료로 신체 밸런스를 되찾고<br />통증을 완화하는 것이 목표입니다.
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="block">
      <div className="block-header">
        <span className="block-label">치료 선택</span>
        <h2 className="block-title">
          지금 나에게 필요한 치료가<br />
          입원인지 통원인지<br />
          잘 모르시는 게 당연합니다.
        </h2>
      </div>
      <div className="block-content">
        <Accordion items={items} defaultOpen={0} />
        <p className="treatment-note">
          어떤 치료가 맞는지 모르시겠다면<br />
          화면 아래 버튼으로 부담 없이 여쭤보셔도 됩니다.
        </p>
      </div>
    </section>
  );
}

/* ════════════════════════════════
   ⑤ 치료 환경 — CAROUSEL
════════════════════════════════ */
function EnvironmentSection() {
  const slides = [
    <div className="env-slide env-slide--intro" key="intro">
      <h3>치료만큼 중요한 것이<br />회복하는 환경입니다.</h3>
      <p>
        전주W한의원은 환자분이<br />
        오직 회복에만 집중하실 수 있도록<br />
        모든 공간을 관리하고 있습니다.
      </p>
      <div className="env-features">
        <span>1·2인실 위주 독립 공간</span>
        <span>일요일·공휴일 입원 접수 가능</span>
      </div>
    </div>,
    <div className="env-slide" key="r1">
      <img src={imgRoom1} alt="입원실 전경" className="env-img" />
      <p className="env-caption">편안한 회복을 위한 독립 공간</p>
    </div>,
    <div className="env-slide" key="r2">
      <img src={imgRoom2} alt="입원실 디테일" className="env-img" />
      <p className="env-caption">세심하게 준비된 입원 환경</p>
    </div>,
    <div className="env-slide" key="r3">
      <img src={imgTreat1} alt="치료실" className="env-img" />
      <p className="env-caption">1:1 집중 치료 공간</p>
    </div>,
    <div className="env-slide" key="r4">
      <img src={imgTreat2} alt="치료실 디테일" className="env-img" />
      <p className="env-caption">섬세한 케어</p>
    </div>,
  ];

  return (
    <section className="block block--gray">
      <div className="block-header">
        <span className="block-label">치료 환경</span>
      </div>
      <div className="block-content">
        <Carousel slides={slides} />
      </div>
    </section>
  );
}

/* ════════════════════════════════
   ⑥ 환자 후기 — CAROUSEL
════════════════════════════════ */
const REVIEWS = [
  { tag: '목·어깨 통증', text: '사고 직후 정형외과만 갔다가 잘 안 나아서 왔는데, 처음 상담부터 차분하게 설명해주셔서 안심이 됐어요. 2주 통원했더니 확실히 좋아졌습니다.', author: '30대 직장인' },
  { tag: '입원 치료', text: '충돌 사고 후 허리를 못 펼 정도였는데 1주일 입원하고 정말 회복됐어요. 원장님이 매일 직접 상태 확인해주시는 게 믿음직스러웠습니다.', author: '40대 주부' },
  { tag: '보험 처리', text: '보험 처리 어떻게 하면 되는지 하나도 몰랐는데 직원분이 처음부터 끝까지 다 안내해줘서 치료에만 집중할 수 있었어요.', author: '50대 자영업자' },
  { tag: '두통·어지러움', text: '사고 후 두통이 한 달 넘게 지속됐는데 다른 곳에선 별 이상 없다고만 했어요. 여기서 제대로 치료받고 나서야 비로소 편해졌습니다.', author: '40대 여성' },
  { tag: '퇴원 후 통원', text: '병원에서 퇴원했는데도 몸이 여전히 이상해서 왔어요. 추나 치료가 생각보다 효과가 좋았고 꾸준히 다닌 덕에 이제 일상 복귀했습니다.', author: '20대 대학생' },
  { tag: '후유증 관리', text: '합의 후에도 몸이 계속 아팠는데 포기하지 않고 한의원 다닌 덕분에 많이 좋아졌어요. 선생님들이 끝까지 신경 써주셔서 감사합니다.', author: '50대 남성' },
];

function ReviewSection() {
  const slides = REVIEWS.map((r, i) => (
    <div key={i} className="review-card">
      <div className="review-top">
        <span className="review-tag">{r.tag}</span>
        <span className="review-verified">VERIFIED</span>
      </div>
      <div className="review-stars">★★★★★</div>
      <p className="review-text">"{r.text}"</p>
      <span className="review-author">— {r.author}</span>
    </div>
  ));

  return (
    <section className="block block--navy">
      <div className="block-header">
        <span className="block-label">환자 후기</span>
        <h2 className="block-title block-title--white">
          실제로 치료받으신 분들의<br />이야기입니다.
        </h2>
      </div>
      <div className="block-content">
        <Carousel slides={slides} dark />
        <a
          href="https://naver.me/placeholder"
          className="naver-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          더 많은 후기가 궁금하신가요?<br />
          <span>네이버 플레이스에서 확인하기 →</span>
        </a>
      </div>
    </section>
  );
}

/* ════════════════════════════════
   ⑦ FAQ — ACCORDION
════════════════════════════════ */
const FAQ_ITEMS = [
  {
    title: '사고 직후엔 괜찮았는데 며칠 후 통증이 생겼어요. 지금 방문해도 되나요?',
    content: <div className="accordion-content"><p>네, 지금 방문하셔도 됩니다. 교통사고 후 통증은 수일 후에 나타나는 경우가 많습니다. 시간이 지났더라도 치료와 보험 처리 모두 가능하니 부담 없이 내원해 주세요.</p></div>,
  },
  {
    title: '정형외과와 한의원을 함께 다닐 수 있나요?',
    content: <div className="accordion-content"><p>네, 가능합니다. 양·한방 병행 치료는 교통사고 보험 체계에서 일반적입니다. 정형외과 치료와 한의원 치료를 동시에 받으셔도 보험 처리에 문제가 없습니다.</p></div>,
  },
  {
    title: '전치 2주 진단을 받았는데 치료도 2주만 가능한가요?',
    content: <div className="accordion-content"><p>전치 2주 진단은 형사 합의를 위한 기준일 뿐, 치료 기간과는 다릅니다. 몸 상태에 따라 충분한 기간 동안 치료받을 수 있으며, 실제 치료 기간은 회복 상태에 맞게 결정됩니다.</p></div>,
  },
  {
    title: '합의는 언제 하는 게 좋을까요?',
    content: <div className="accordion-content"><p>치료가 충분히 마무리된 후에 진행하시는 것을 권장합니다. 합의 후에는 추가 보상이 어렵기 때문에, 몸 상태가 안정되고 후유증이 없다고 판단되는 시점에 결정하시는 것이 좋습니다.</p></div>,
  },
  {
    title: '입원 기간은 보통 얼마나 되나요?',
    content: <div className="accordion-content"><p>환자분의 상태에 따라 다르지만 일반적으로 1~2주 내외입니다. 사고의 경중과 증상 회복 속도를 보면서 원장님과 상의 후 결정하게 됩니다. 퇴원 후에도 통원으로 이어질 수 있습니다.</p></div>,
  },
  {
    title: '일요일·공휴일에도 입원 접수가 가능한가요?',
    content: <div className="accordion-content"><p>네, 가능합니다. 전주W한의원은 일요일과 공휴일에도 입원 접수를 받고 있습니다. 사고는 예고 없이 찾아오는 만큼, 언제든 연락 주시면 안내해 드리겠습니다.</p></div>,
  },
  {
    title: '퇴원 후에도 후유증이 남으면 어떻게 하나요?',
    content: <div className="accordion-content"><p>퇴원 후에도 통원 치료를 통해 지속적인 관리가 가능합니다. 후유증이 남아 있다면 혼자 참지 마시고 다시 내원해 주세요. 보험 처리 범위 내에서 계속 치료받으실 수 있습니다.</p></div>,
  },
];

function FAQSection() {
  return (
    <section className="block">
      <div className="block-content">
        <div className="faq-bridge">
          <p>치료 전에 궁금한 것들,<br />미리 확인해보세요.</p>
        </div>
        <span className="block-label">자주 묻는 질문</span>
        <div style={{ height: 16 }} />
        <Accordion items={FAQ_ITEMS} defaultOpen={-1} />
      </div>
    </section>
  );
}

/* ════════════════════════════════
   ⑧ CTA
════════════════════════════════ */
function CTASection() {
  return (
    <section className="cut cut--navy">
      <div className="cut-inner">
        <p className="cta-text">
          처음 오시는 길이 낯설게 느껴지신다면<br />
          전화 한 통으로 시작하셔도 됩니다.<br />
          전주W한의원이 처음부터 끝까지<br />
          함께하겠습니다.
        </p>
        <p className="cta-hint">화면 아래 버튼을 눌러주세요.</p>
      </div>
    </section>
  );
}

/* ════════════════════════════════
   BOTTOM NAV
════════════════════════════════ */
function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="퀵메뉴">
      <a href="tel:063-000-0000" className="bottom-nav-item">
        <span className="bottom-nav-icon">📞</span>
        <span>전화 상담</span>
      </a>
      <a
        href="https://pf.kakao.com/_placeholder"
        className="bottom-nav-item bottom-nav-item--main"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="bottom-nav-icon">💬</span>
        <span>카카오톡 상담</span>
      </a>
      <a
        href="https://map.kakao.com/?q=전주W한의원"
        className="bottom-nav-item"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="bottom-nav-icon">📍</span>
        <span>오시는 길</span>
      </a>
    </nav>
  );
}

/* ════════════════════════════════
   MAIN
════════════════════════════════ */
export default function TrafficAccident() {
  return (
    <div className="page">
      {/* ① 훅 */}
      <HookCut1 />
      <HookCut2 />
      <HookCut3 />

      {/* ② 신뢰 숫자 */}
      <TrustCut1 />
      <TrustCut2 />
      <TrustCut3 />

      {/* ③ 공감 */}
      <EmpathySection />

      {/* 브릿지 — 회복 철학 */}
      <PhilosophySection />

      {/* ④ 입원/통원 */}
      <TreatmentSection />

      {/* ⑤ 치료 환경 */}
      <EnvironmentSection />

      {/* ⑥ 환자 후기 */}
      <ReviewSection />

      {/* ⑦ FAQ */}
      <FAQSection />

      {/* ⑧ CTA */}
      <CTASection />

      <BottomNav />
    </div>
  );
}
