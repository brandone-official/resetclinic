import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <div className="home-inner">
        <div className="home-greeting">
          <div className="home-clinic-row">
            <span className="home-clinic-dot" />
            <span className="home-clinic-name">전주W한의원</span>
          </div>
          <h1 className="home-title">
            어떤 진료가<br />필요하신가요?
          </h1>
        </div>

        <div className="home-cards">
          <Link to="/traffic-accident" className="home-card home-card--traffic">
            <span className="home-card-tag">자동차보험 적용</span>
            <h2 className="home-card-title">교통사고 치료</h2>
            <p className="home-card-desc">
              사고 후 통증부터 입원·통원 치료까지,<br />
              자동차보험으로 부담 없이 받으세요.
            </p>
            <div className="home-card-footer">
              <span className="home-card-cta">자세히 보기</span>
              <span className="home-card-arrow">→</span>
            </div>
          </Link>

          <Link to="/diet" className="home-card home-card--diet">
            <span className="home-card-tag">리셋 프로그램</span>
            <h2 className="home-card-title">리셋 다이어트</h2>
            <p className="home-card-desc">
              반복된 실패, 무너진 대사.<br />
              의지가 아니라 몸의 시스템부터 다시 잡습니다.
            </p>
            <div className="home-card-footer">
              <span className="home-card-cta">자세히 보기</span>
              <span className="home-card-arrow">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
