import { useState, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import './admin.css'

const ADMIN_EMAILS = ['jhndy20170101@gmail.com', 'forwhani23@gmail.com']
const PAGE_SIZE = 20

const TYPE_COLORS: Record<string, string> = {
  '열감형': '#E85A30', '냉증형': '#2E5DA8', '무기력형': '#D49B2A',
  '건조형': '#8B6CA8', '스트레스형': '#3D8B7A', '미판별': '#B8B8B8',
}

const Q_TITLES: Record<string, string> = {
  q1: '체온 변화', q2: '땀', q3: '수면', q4: '에너지·피로',
  q5: '체형·체중', q6: '정서', q7: '소화·식욕', q8: '피부·모발·감각',
}

const PRE_LABELS: Record<string, string> = {
  age: '연령대', menopause: '월경·완경 상태', hrt: '호르몬 치료(HRT)',
}

interface SurveyDoc {
  id: string
  preAnswers: Record<string, string>
  mainAnswers: Record<string, { index: number; text: string }>
  resultType: string | null
  resultLabel: string | null
  kakaoClicked: boolean
  createdAt: Timestamp | null
}

function formatDate(ts: Timestamp | null) {
  if (!ts) return '-'
  const d = ts.toDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [docs, setDocs] = useState<SurveyDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedDoc, setSelectedDoc] = useState<SurveyDoc | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setAuthLoading(false)
      if (u) {
        if (ADMIN_EMAILS.includes(u.email || '')) {
          setUser(u)
          setDenied(false)
        } else {
          setDenied(true)
          signOut(auth)
        }
      } else {
        setUser(null)
      }
    })
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'surveyResults'), orderBy('createdAt', 'desc')))
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SurveyDoc))
    } catch (e) {
      console.error('Failed to load survey data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    setLoginError('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e: unknown) {
      const code = (e as { code?: string }).code
      if (code === 'auth/popup-closed-by-user') return
      if (code === 'auth/operation-not-allowed') setLoginError('Google 로그인이 활성화되지 않았습니다.')
      else setLoginError('로그인 중 오류가 발생했습니다.')
    }
  }

  function handleLogout() {
    signOut(auth)
    setDocs([])
    setVisibleCount(PAGE_SIZE)
  }

  // ── Auth screens ──
  if (authLoading) return <div className="adm-center"><p className="adm-loading">로딩 중...</p></div>

  if (denied) {
    return (
      <div className="adm-center">
        <div className="adm-box">
          <p style={{ fontSize: '2.5rem', marginBottom: 16 }}>🚫</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#D76618', marginBottom: 24 }}>접근 권한이 없습니다</p>
          <button className="adm-btn" onClick={() => setDenied(false)}>다른 계정으로 로그인</button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="adm-center">
        <div className="adm-box">
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, color: '#1A3270' }}>자가진단 대시보드</h1>
          <p style={{ color: '#999', marginBottom: 28, fontSize: '0.9rem' }}>관리자 로그인이 필요합니다</p>
          <button className="adm-btn adm-btn-google" onClick={handleLogin}>Google로 로그인</button>
          {loginError && <p style={{ color: '#D76618', fontSize: '0.85rem', marginTop: 16 }}>{loginError}</p>}
        </div>
      </div>
    )
  }

  // ── Dashboard ──
  const totalCount = docs.length
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayMs = todayStart.getTime()
  const todayCount = docs.filter(d => d.createdAt && d.createdAt.toMillis() >= todayMs).length
  const kakaoCount = docs.filter(d => d.kakaoClicked).length
  const kakaoRate = totalCount > 0 ? ((kakaoCount / totalCount) * 100).toFixed(1) : '0'

  const typeDist: Record<string, number> = {}
  docs.forEach(d => { const l = d.resultLabel || '미판별'; typeDist[l] = (typeDist[l] || 0) + 1 })
  const typeEntries = Object.entries(typeDist).sort((a, b) => b[1] - a[1])
  const maxTypeCount = typeEntries.length > 0 ? typeEntries[0][1] : 1

  const visibleDocs = docs.slice(0, visibleCount)
  const hasMore = visibleCount < docs.length

  return (
    <div className="adm">
      <header className="adm-header">
        <h1>자가진단 대시보드</h1>
        <div className="adm-header-right">
          <span className="adm-user">{user.email}</span>
          <button className="adm-btn adm-btn-logout" onClick={handleLogout}>로그아웃</button>
        </div>
      </header>

      {loading ? (
        <div className="adm-center" style={{ minHeight: '60vh' }}><p className="adm-loading">데이터 로딩 중...</p></div>
      ) : (
        <div className="adm-body">
          {/* Summary Cards */}
          <div className="adm-cards">
            <div className="adm-card">
              <p className="adm-card-label">총 응답 수</p>
              <p className="adm-card-value">{totalCount}</p>
            </div>
            <div className="adm-card">
              <p className="adm-card-label">오늘 응답 수</p>
              <p className="adm-card-value">{todayCount}</p>
            </div>
            <div className="adm-card">
              <p className="adm-card-label">카카오 상담 전환율</p>
              <p className="adm-card-value">{kakaoRate}%</p>
              <p className="adm-card-sub">{kakaoCount} / {totalCount}건</p>
            </div>
          </div>

          {/* Type Distribution */}
          <div className="adm-section">
            <h2 className="adm-section-title">유형별 분포</h2>
            {totalCount === 0 ? (
              <p className="adm-empty">데이터가 없습니다</p>
            ) : (
              <div className="adm-dist">
                {typeEntries.map(([label, count]) => (
                  <div key={label} className="adm-dist-row">
                    <span className="adm-dist-label" style={{ color: TYPE_COLORS[label] || '#888' }}>{label}</span>
                    <div className="adm-dist-bar-wrap">
                      <div className="adm-dist-bar" style={{ width: `${(count / maxTypeCount) * 100}%`, backgroundColor: TYPE_COLORS[label] || '#ccc' }} />
                    </div>
                    <span className="adm-dist-count">{count}건 ({((count / totalCount) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response List */}
          <div className="adm-section">
            <h2 className="adm-section-title">개별 응답 <span className="adm-section-count">{totalCount}건</span></h2>
            {totalCount === 0 ? (
              <p className="adm-empty">데이터가 없습니다</p>
            ) : (
              <>
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>날짜/시간</th><th>연령대</th><th>판별 유형</th><th>카카오</th></tr>
                    </thead>
                    <tbody>
                      {visibleDocs.map(d => (
                        <tr key={d.id} className="adm-row" onClick={() => setSelectedDoc(d)}>
                          <td>{formatDate(d.createdAt)}</td>
                          <td>{d.preAnswers?.age || '-'}</td>
                          <td>
                            <span className="adm-badge" style={{ backgroundColor: TYPE_COLORS[d.resultLabel || '미판별'] || '#ccc' }}>
                              {d.resultLabel || '미판별'}
                            </span>
                          </td>
                          <td className={d.kakaoClicked ? 'adm-kakao-yes' : ''}>{d.kakaoClicked ? '✓' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasMore && (
                  <button className="adm-btn adm-btn-more" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                    더 보기 ({docs.length - visibleCount}건 남음)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDoc && (
        <div className="adm-modal-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h2>응답 상세</h2>
              <button className="adm-modal-close" onClick={() => setSelectedDoc(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <section className="adm-detail-sec">
                <h3>기본 정보</h3>
                <p className="adm-detail-time">{formatDate(selectedDoc.createdAt)}</p>
                <div className="adm-detail-grid">
                  {Object.entries(PRE_LABELS).map(([key, label]) => (
                    <div key={key} className="adm-detail-item">
                      <span className="adm-detail-key">{label}</span>
                      <span className="adm-detail-val">{selectedDoc.preAnswers?.[key] || '-'}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="adm-detail-sec">
                <h3>판별 결과</h3>
                <div className="adm-detail-result">
                  <span className="adm-badge adm-badge-lg" style={{ backgroundColor: TYPE_COLORS[selectedDoc.resultLabel || '미판별'] || '#ccc' }}>
                    {selectedDoc.resultLabel || '미판별'}
                  </span>
                  <span className="adm-detail-kakao">카카오 상담: {selectedDoc.kakaoClicked ? '클릭함' : '클릭 안 함'}</span>
                </div>
              </section>
              <section className="adm-detail-sec">
                <h3>본설문 응답</h3>
                <div className="adm-detail-answers">
                  {Object.entries(Q_TITLES).map(([qId, title]) => (
                    <div key={qId} className="adm-detail-answer">
                      <span className="adm-detail-q">{title}</span>
                      <span className="adm-detail-a">{selectedDoc.mainAnswers?.[qId]?.text || '-'}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
