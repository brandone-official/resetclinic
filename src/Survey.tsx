import { useState, useRef } from 'react'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import './survey.css'

// ─── TYPES ──────────────────────────────────────────────────
type TypeKey = 'umheo' | 'yangheo' | 'giheo' | 'hyulheo' | 'ganul'
type Scores = Record<TypeKey, number>

interface TypeMeta {
  label: string; hanja: string; emoji: string; color: string
  light: string; accent: string; desc: string; detail: string
}
interface Q0Item { id: string; title: string; sub: string; opts: string[] }
interface QSItem { id: string; title: string; opts: { t: string; s: Partial<Scores> }[] }

// ─── DATA ───────────────────────────────────────────────────
const TYPE_META: Record<TypeKey, TypeMeta> = {
  umheo:   { label:'열감형',    hanja:'음허(陰虛)', emoji:'🔥', color:'#D76618', light:'#FDF4EE', accent:'#F5C9A0', desc:'몸의 열 조절 기능이 불안정해진 상태입니다.', detail:'갑자기 달아오르는 열감, 밤에 나는 식은땀, 새벽에 자꾸 깨는 증상이 가장 큰 불편함일 가능성이 큽니다. 갱년기에 체온을 조절하는 뇌의 중추가 민감해지면서 나타나는 변화이며, 몸 안의 수분과 영양을 채워 열 균형을 되찾는 것이 핵심입니다.' },
  yangheo: { label:'냉증형',    hanja:'양허(陽虛)', emoji:'❄️', color:'#1A3270', light:'#E8EDF5', accent:'#C5D0E8', desc:'몸의 체온 유지 기능이 떨어진 상태입니다.', detail:'손발 냉증, 부종, 아침 무기력이 주된 불편함일 가능성이 큽니다. 완경 이후 호르몬 변화가 장기화되면서 기초대사와 체온 유지 능력이 떨어진 상태입니다. 몸을 따뜻하게 하고 기초대사를 끌어올리는 것이 핵심입니다.' },
  giheo:   { label:'무기력형',  hanja:'기허(氣虛)', emoji:'🪫', color:'#D76618', light:'#FDF4EE', accent:'#F5C9A0', desc:'에너지를 만들어내는 힘 자체가 약해진 상태입니다.', detail:'만성 피로, 식욕 저하, 식후 졸림이 주된 불편함일 가능성이 큽니다. 소화 흡수 기능이 약해지면서 에너지 생산 자체가 줄어든 상태이며, 소화력과 기력을 함께 회복시키는 것이 핵심입니다.' },
  hyulheo: { label:'건조형',    hanja:'혈허(血虛)', emoji:'💫', color:'#1A3270', light:'#E8EDF5', accent:'#C5D0E8', desc:'몸 곳곳에 영양 공급이 부족한 상태입니다.', detail:'어지럼, 멍함, 푸석한 피부·모발, 감정 기복이 주된 불편함일 가능성이 큽니다. 오랜 기간의 월경과 영양 불균형이 누적된 결과이며, 영양 흡수와 순환을 회복시키는 것이 핵심입니다.' },
  ganul:   { label:'스트레스형', hanja:'간울(肝鬱)', emoji:'😤', color:'#1A1A1A', light:'#F0F0F0', accent:'#D8D8D8', desc:'스트레스로 인해 몸의 순환이 막혀 있는 상태입니다.', detail:'짜증, 스트레스성 열감, 폭식, 복부비만이 주된 불편함일 가능성이 큽니다. 갱년기 호르몬 변화에 심리적 스트레스가 겹치면서 몸의 순환과 조절 기능이 약해진 상태이며, 스트레스 해소와 순환 회복이 핵심입니다.' },
}
const TYPE_KEYS: TypeKey[] = ['umheo', 'yangheo', 'giheo', 'hyulheo', 'ganul']

const Q0: Q0Item[] = [
  { id:'age',       title:'연령대를 선택해주세요.',               sub:'결과의 정확도를 높이기 위한 사전 정보입니다.',    opts:['44세 이하','45~49세','50~54세','55~59세','60세 이상'] },
  { id:'menopause', title:'월경·완경 상태를 선택해주세요.',        sub:'완경 시기에 따라 같은 증상도 의미가 다릅니다.',   opts:['폐경 전 (월경 규칙적)','폐경 이행기 (불규칙)','완경 직후 (1~3년)','완경 중기 (3~7년)','완경 후기 (7년 이상)'] },
  { id:'hrt',       title:'호르몬 치료(HRT) 여부를 선택해주세요.', sub:'호르몬 치료 여부에 따라 맞춤 안내가 달라집니다.', opts:['복용한 적 없음','현재 복용 중','과거 복용 후 중단'] },
]

const QS: QSItem[] = [
  { id:'q1', title:'가장 불편한 체온 변화는?', opts:[
    {t:'갑자기 달아오르면서 식은땀이 나고, 특히 밤에 심하다',s:{umheo:3}},
    {t:'평소엔 추운데, 가끔 열이 왔다 갔다 한다',s:{yangheo:3}},
    {t:'스트레스 받을 때 열이 확 오르면서 짜증이 함께 난다',s:{ganul:3}},
    {t:'열감보다 항상 기운이 없고 축 처져 있는 게 더 문제다',s:{giheo:3}},
    {t:'열감보다 어지럽고 멍한 느낌이 더 자주 온다',s:{hyulheo:3}},
  ]},
  { id:'q2', title:'땀과 관련해서 가장 가까운 것은?', opts:[
    {t:'밤에 자다가 식은땀으로 옷이나 이불을 적신다',s:{umheo:3}},
    {t:'추운 환경에서도 손발이 축축하게 식은땀이 난다',s:{yangheo:2,giheo:1}},
    {t:'긴장하거나 화가 나면 갑자기 땀이 확 난다',s:{ganul:3}},
    {t:'조금만 움직여도 땀이 쏟아지고 이후 탈진감이 있다',s:{giheo:3}},
    {t:'땀이 잘 안 나고 피부가 건조하다',s:{hyulheo:3}},
  ]},
  { id:'q3', title:'수면에서 가장 불편한 점은?', opts:[
    {t:'열감이나 식은땀 때문에 자다가 깬다',s:{umheo:3}},
    {t:'손발이 차거나 몸이 으슬으슬해서 잠들기 어렵다',s:{yangheo:3}},
    {t:'생각이 꼬리를 물거나 짜증이 나서 잠들기 힘들다',s:{ganul:3}},
    {t:'잠은 자는데 아무리 자도 개운하지 않다',s:{giheo:3}},
    {t:'잠은 드는데 꿈이 많고 자주 깬다',s:{hyulheo:2,umheo:1}},
  ]},
  { id:'q4', title:'에너지·피로에서 가장 가까운 것은?', opts:[
    {t:'잠을 못 자니까 낮에 더 지치는 악순환이다',s:{umheo:2,giheo:1}},
    {t:'아침이 특히 힘들고 몸이 무거운데, 움직이면 좀 나아진다',s:{yangheo:2,giheo:1}},
    {t:'신경 쓰는 일이 있으면 급격히 지치고 회복이 느리다',s:{ganul:2,giheo:1}},
    {t:'하루 종일 기운이 없고 쉬어도 회복이 안 된다',s:{giheo:3}},
    {t:'자꾸 멍해지고 집중이 안 되며 깜빡깜빡한다',s:{hyulheo:3}},
  ]},
  { id:'q5', title:'체형·체중에서 가장 눈에 띄는 변화는?', opts:[
    {t:'체중은 비슷한데 허리 라인이 두꺼워졌다 (마른비만)',s:{umheo:2,ganul:1}},
    {t:'얼굴·하체가 잘 붓고 살이 물렁물렁하다',s:{yangheo:3}},
    {t:'체중이 늘었고, 특히 뱃살이 많이 늘었다',s:{ganul:3}},
    {t:'식욕이 없어지면서 살이 빠지고 기운도 같이 빠졌다',s:{giheo:2,hyulheo:1}},
    {t:'피부 탄력이 떨어지고 전체적으로 푸석해졌다',s:{hyulheo:2,giheo:1}},
  ]},
  { id:'q6', title:'갱년기 이후 정서에서 가장 큰 변화는?', opts:[
    {t:'불안하고 가슴이 두근거리며, 밤에 더 심하다',s:{umheo:3}},
    {t:'감정 기복이 별로 없는데, 의욕 자체가 사라졌다',s:{yangheo:2,giheo:1}},
    {t:'짜증·화가 자주 나고, 사소한 일에 폭발한다',s:{ganul:3}},
    {t:'무기력하고 아무것도 하기 싫다',s:{giheo:3}},
    {t:'쉽게 슬퍼지고, 감정 기복이 심해졌다',s:{hyulheo:2,ganul:1}},
  ]},
  { id:'q7', title:'소화·식욕에서 가장 가까운 것은?', opts:[
    {t:'입이 마르고, 밤에 갈증이 나서 물을 자주 찾는다',s:{umheo:3}},
    {t:'소화가 느리고, 찬 음식만 먹으면 배가 불편하다',s:{yangheo:3}},
    {t:'스트레스 받으면 폭식하거나 단 음식을 찾게 된다',s:{ganul:3}},
    {t:'입맛이 없고, 먹어도 식후 졸림·더부룩함이 있다',s:{giheo:3}},
    {t:'식사량은 비슷한데 영양 흡수가 안 되는 느낌이다',s:{hyulheo:2,giheo:1}},
  ]},
  { id:'q8', title:'피부·모발·감각에서 가장 불편한 것은?', opts:[
    {t:'피부가 화끈거리거나 가려움증이 생겼다',s:{umheo:2,hyulheo:1}},
    {t:'손발이 자주 저리고 감각이 둔해졌다',s:{yangheo:2,hyulheo:1}},
    {t:'스트레스 받으면 목·어깨가 뻣뻣하고 두통이 온다',s:{ganul:2,hyulheo:1}},
    {t:'얼굴색이 칙칙하고 입술에 혈색이 없다',s:{giheo:1,hyulheo:2}},
    {t:'피부가 건조해지고 머리카락이 푸석해졌다',s:{hyulheo:3}},
  ]},
]

const TOTAL = Q0.length + QS.length
const NUMS = ['①','②','③','④','⑤']
const HRT_MSG: Record<string, string> = {
  '현재 복용 중': '현재 호르몬 치료를 받고 계시는 상태에서도 위 증상들이 남아 있을 수 있습니다. 호르몬 치료가 열감 등 일부 증상을 완화시키더라도, 체질적 불균형 자체는 별도의 접근이 필요한 영역입니다. 양·한방 통합 접근을 통해 호르몬 치료의 효과를 보완하면서 더 안정적인 결과가 가능합니다.\n\n진료 시 현재 복용 중인 약물명을 알려주시면 더 정확한 상담이 가능합니다.',
  '과거 복용 후 중단': '호르몬 치료를 중단하신 이후 증상이 다시 나타나거나 달라질 수 있습니다. 특히 중단 직후에는 반동성 증상(열감 재발, 수면 장애 등)이 일시적으로 강해지는 시기가 있으며, 이 시기에 한의학적 접근이 도움이 될 수 있습니다.',
}

// ─── DEVICE INFO ───────────────────────────────────────────
function getDeviceInfo() {
  const ua = navigator.userAgent
  let deviceType = 'PC'
  if (/Tablet|iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) deviceType = '태블릿'
  else if (/Mobile|iPhone|Android.*Mobile/i.test(ua)) deviceType = '모바일'

  let os = '기타'
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'

  let browser = '기타'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung'
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'

  return { deviceType, os, browser, screenWidth: window.innerWidth }
}

// ─── COMPONENT ──────────────────────────────────────────────
interface SurveyProps { onClose?: () => void }

export default function Survey({ onClose }: SurveyProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const savedDocId = useRef<string | null>(null)
  const saving = useRef(false)
  const startTime = useRef(Date.now())

  function handleClose() {
    if (onClose) onClose()
  }

  function handleSetAnswer(id: string, val: number) {
    setAnswers(prev => ({ ...prev, [id]: val }))
  }
  function handleNext() {
    if (step < TOTAL - 1) setStep(s => s + 1)
    else setShowResult(true)
  }
  function handleBack() {
    if (showResult) setShowResult(false)
    else if (step > 0) setStep(s => s - 1)
  }
  function handleRestart() {
    setStep(0); setAnswers({}); setShowResult(false); savedDocId.current = null; saving.current = false; startTime.current = Date.now()
  }
  function handleCopyLink() {
    navigator.clipboard.writeText('https://resetclinic.web.app/survey').then(() => {
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2500)
    })
  }
  async function saveResult(resultType: string | null) {
    if (savedDocId.current || saving.current) return
    saving.current = true
    try {
      const preAnswers: Record<string, string> = {}
      Q0.forEach(q => {
        if (answers[q.id] !== undefined) preAnswers[q.id] = q.opts[answers[q.id]]
      })
      const mainAnswers: Record<string, { index: number; text: string }> = {}
      QS.forEach(q => {
        if (answers[q.id] !== undefined) {
          mainAnswers[q.id] = { index: answers[q.id], text: q.opts[answers[q.id]].t }
        }
      })
      const durationSec = Math.round((Date.now() - startTime.current) / 1000)
      const ref = await addDoc(collection(db, 'surveyResults'), {
        preAnswers,
        mainAnswers,
        resultType,
        resultLabel: resultType ? TYPE_META[resultType as TypeKey]?.label ?? null : null,
        kakaoClicked: false,
        createdAt: serverTimestamp(),
        deviceInfo: getDeviceInfo(),
        durationSec,
      })
      savedDocId.current = ref.id
    } catch (_) { saving.current = false }
  }
  function handleKakaoClick() {
    if (!savedDocId.current) return
    updateDoc(doc(db, 'surveyResults', savedDocId.current), { kakaoClicked: true }).catch(() => {})
  }
  function isValid() {
    if (step < 3) return answers[Q0[step].id] !== undefined
    return answers[QS[step - 3].id] !== undefined
  }
  function calcResult() {
    const sc: Scores = { umheo:0, yangheo:0, giheo:0, hyulheo:0, ganul:0 }
    QS.forEach(q => {
      const sel = answers[q.id]
      if (sel !== undefined) {
        const s = q.opts[sel].s
        for (const k in s) sc[k as TypeKey] += s[k as TypeKey] ?? 0
      }
    })
    const sorted = TYPE_KEYS.map(k => ({ key: k, score: sc[k] })).sort((a, b) => b.score - a.score)
    if (sorted[0].score <= 4) return { primary: null }
    const pri: TypeKey[] = ['umheo', 'ganul', 'giheo', 'hyulheo', 'yangheo']
    const tied = sorted.filter(s => s.score === sorted[0].score)
    const primary = tied.length > 1
      ? tied.sort((a, b) => pri.indexOf(a.key) - pri.indexOf(b.key))[0]
      : sorted[0]
    return { primary }
  }

  const pct = ((step + 1) / TOTAL) * 100
  const stepLabel = step < 3 ? '사전 정보' : `Q${step - 2} / 8`
  const valid = isValid()

  // ── Result screen ──
  if (showResult) {
    const { primary } = calcResult()
    const hrtVal = Q0[2].opts[answers.hrt]
    const hrt = HRT_MSG[hrtVal] || ''
    saveResult(primary ? primary.key : null)

    const BottomButtons = () => (
      <div style={{ display:'flex', justifyContent:'center', gap:'12px', flexWrap:'wrap' }}>
        <button className="sv-btn-restart" onClick={handleRestart}>다시 하기</button>
        <button className="sv-btn-restart sv-btn-home" onClick={handleClose}>홈으로</button>
        <button className="sv-btn-restart sv-btn-share" onClick={handleCopyLink}>공유하기</button>
      </div>
    )

    const m = primary ? TYPE_META[primary.key] : null

    return (
      <div className="sv-overlay">
        <div className="sv-wrap">
          {!primary ? (
            <div className="sv-fade" style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:'2.75rem', marginBottom:'16px' }}>🌿</div>
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, color:'#1A3270', marginBottom:'12px', letterSpacing:'-.03em' }}>
                갱년기 증상이 뚜렷하지 않습니다
              </h2>
              <p style={{ fontSize:'0.875rem', color:'#444444', lineHeight:1.8, letterSpacing:'-.015em', wordBreak:'keep-all' }}>
                현재 갱년기 관련 증상이 미약하거나,<br />
                다른 원인에 의한 불편감일 가능성이 있습니다.<br />
                불편한 증상이 있으시다면 정확한 상담을 받아보시는 것을 권합니다.
              </p>
              <div style={{ marginTop:'24px' }}><BottomButtons /></div>
            </div>
          ) : (
            <div className="sv-fade">
              <div className="sv-result-profile">
                <span>📋 {Q0[0].opts[answers.age]}</span>
                <span>🩺 {Q0[1].opts[answers.menopause]}</span>
                <span>💊 {hrtVal}</span>
              </div>

              <div className="sv-result-card" style={{ background:m!.light, borderColor:m!.color }}>
                <div className="sv-emoji">{m!.emoji}</div>
                <div className="sv-tag" style={{ color:m!.color }}>나의 갱년기 유형</div>
                <h2 className="sv-result-h2" style={{ color:m!.color }}>{m!.label}</h2>
                <p className="sv-hanja">{m!.hanja}</p>
                <p className="sv-desc">{m!.desc}</p>
              </div>

              <div className="sv-detail-box">
                <h3 className="sv-detail-h3" style={{ color:m!.color }}>{m!.emoji} {m!.label} 상세 설명</h3>
                <p>{m!.detail}</p>
              </div>

              {hrt && (
                <div className="sv-hrt-box">
                  <h3>💊 호르몬 치료 관련 안내</h3>
                  <p>{hrt}</p>
                </div>
              )}

              <div className="sv-cta-box">
                <p>정확한 진단과 맞춤 처방은<br />진료를 통해 이루어집니다.</p>
                <a className="sv-cta-btn" href="https://pf.kakao.com/_xjxcgpxl" target="_blank" rel="noopener noreferrer" onClick={handleKakaoClick}>
                  카카오톡 상담하기
                </a>
              </div>

              <p className="sv-disclaimer">
                ※ 본 자가진단은 한의학적 변증 분류를 돕는 참고 도구이며,<br />
                정확한 진단과 처방은 진료를 통해 이루어집니다.<br />
                특히 호르몬 치료 중이시거나 다른 질환을 동반한 경우,<br />
                반드시 상담을 통해 통합적 접근을 받으시기 바랍니다.
              </p>

              <BottomButtons />
            </div>
          )}
        </div>
        {toastVisible && <div className="sv-toast">링크가 복사되었습니다</div>}
      </div>
    )
  }

  // ── Question screen ──
  let title = '', sub = ''
  const optItems: { label: string; value: number; selected: boolean; qId: string }[] = []

  if (step < 3) {
    const q = Q0[step]
    title = q.title; sub = q.sub
    q.opts.forEach((o, i) => optItems.push({ label:o, value:i, selected:answers[q.id]===i, qId:q.id }))
  } else {
    const q = QS[step - 3]
    title = q.title; sub = '가장 가까운 것 하나를 선택해주세요.'
    q.opts.forEach((o, i) => optItems.push({ label:o.t, value:i, selected:answers[q.id]===i, qId:q.id }))
  }

  return (
    <div className="sv-overlay">
      <div className="sv-wrap">
        <div className="sv-header">
          <h1>갱년기 자가진단</h1>
          <p>전주W한의원 리셋다이어트</p>
          <button className="sv-btn-close" onClick={handleClose}>✕</button>
        </div>

        <div className="sv-progress-wrap">
          <div className="sv-progress-labels">
            <span className="sv-left">{stepLabel}</span>
            <span className="sv-right">{step + 1} / {TOTAL}</span>
          </div>
          <div className="sv-progress-track">
            <div className="sv-progress-fill" style={{ width:`${pct}%` }} />
          </div>
        </div>

        <div className="sv-card sv-fade">
          <div className="sv-q-header">
            {step >= 3 && <span className="sv-q-badge">Q{step - 2}</span>}
            <h2>{title}</h2>
          </div>
          <p className="sv-q-sub">{sub}</p>
          <div className="sv-options">
            {optItems.map((o, i) => (
              <button
                key={i}
                className={`sv-opt-btn${o.selected ? ' selected' : ''}`}
                onClick={() => handleSetAnswer(o.qId, o.value)}
              >
                <span className="sv-num">{NUMS[i]}</span>
                <span className="sv-txt">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sv-nav">
          <button className="sv-btn-back" onClick={handleBack} disabled={step === 0}>이전</button>
          <button
            className={`sv-btn-next${valid ? ' active' : ''}`}
            onClick={valid ? handleNext : undefined}
          >
            {step === TOTAL - 1 ? '결과 보기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
