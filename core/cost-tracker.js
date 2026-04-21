/* ============================================================
   통합 콘텐츠 생성기 · 비용 추적기
   - 토큰 추정 (한국어/영어/일본어)
   - 모델별 단가 계산
   - localStorage 누적 저장 (오늘/이번달/히스토리)
   - 생성 완료 시 record() 호출
   - 예산·경고 상태 조회
   ============================================================ */

(function(global){
  'use strict';

  /* ─── 모델별 단가 (달러/토큰) ─── */
  const PRICING = {
    'claude-sonnet-4-20250514':         { in:0.000003,    out:0.000015,   label:'Claude Sonnet' },
    'claude-haiku-4-5-20251001':        { in:0.00000025,  out:0.00000125, label:'Claude Haiku'  },
    'gpt-4o':                           { in:0.000005,    out:0.000015,   label:'GPT-4o'        },
    'gpt-4o-mini':                      { in:0.00000015,  out:0.0000006,  label:'GPT-4o-mini'   },
    'gemini-2.0-flash':                 { in:0.000000075, out:0.0000003,  label:'Gemini Flash'  },
    'gemini-2.5-pro-exp-03-25':         { in:0.00000125,  out:0.000005,   label:'Gemini 2.5 Pro'}
  };

  const PROVIDER_BY_MODEL = {
    'claude-sonnet-4-20250514':'claude',
    'claude-haiku-4-5-20251001':'claude',
    'gpt-4o':'openai',
    'gpt-4o-mini':'openai',
    'gemini-2.0-flash':'gemini',
    'gemini-2.5-pro-exp-03-25':'gemini'
  };

  /* ─── 환율 (1달러 = ? 원) ─── */
  function getFxRate(){
    const v = parseFloat(localStorage.getItem('uc_fx_rate')||'1350');
    return isNaN(v) ? 1350 : v;
  }
  function setFxRate(v){
    localStorage.setItem('uc_fx_rate', String(v));
    fireUpdate();
  }

  /* ─── 예산 ─── */
  function getBudget(){
    return {
      monthly: parseFloat(localStorage.getItem('uc_budget_monthly')||'10000'),
      warnAt:  parseFloat(localStorage.getItem('uc_budget_warn')||'80'),
      blockAt: parseFloat(localStorage.getItem('uc_budget_block')||'100')
    };
  }
  function setBudget(monthly, warnAt, blockAt){
    if (monthly != null) localStorage.setItem('uc_budget_monthly', String(monthly));
    if (warnAt  != null) localStorage.setItem('uc_budget_warn', String(warnAt));
    if (blockAt != null) localStorage.setItem('uc_budget_block', String(blockAt));
    fireUpdate();
  }

  /* ─── 토큰 추정 ─── */
  function estimateTokens(text, lang){
    if (!text) return 0;
    const s = String(text);
    if (lang === 'ko' || /[\uac00-\ud7a3]/.test(s)) {
      return Math.ceil(s.length / 2.5);
    }
    if (lang === 'ja' || /[\u3040-\u30ff\u4e00-\u9fff]/.test(s)) {
      return Math.ceil(s.length / 2.0);
    }
    const words = s.trim().split(/\s+/).filter(Boolean).length;
    return Math.ceil(words * 1.3);
  }

  /* ─── 비용 계산 ─── */
  function calcCostKRW(model, inputTokens, outputTokens){
    const p = PRICING[model];
    if (!p) return 0;
    const usd = inputTokens * p.in + outputTokens * p.out;
    return usd * getFxRate();
  }

  /* ─── 날짜 키 ─── */
  function todayKey(){
    const d = new Date();
    return 'cost_today_' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  }
  function monthKey(){
    const d = new Date();
    return 'cost_month_' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0');
  }

  /* ─── 기록 ─── */
  /** 생성 완료 시 호출.
   *  record({ model, inputText, outputText, featureId, inputTokens, outputTokens })
   *  inputTokens/outputTokens 가 없으면 text 로 추정.
   */
  function record(opts){
    opts = opts || {};
    const model = opts.model || 'claude-sonnet-4-20250514';
    const inputTokens  = opts.inputTokens  != null ? opts.inputTokens  : estimateTokens(opts.inputText);
    const outputTokens = opts.outputTokens != null ? opts.outputTokens : estimateTokens(opts.outputText);
    const krw = calcCostKRW(model, inputTokens, outputTokens);
    const provider = PROVIDER_BY_MODEL[model] || 'unknown';

    // 오늘
    const tk = todayKey();
    const today = JSON.parse(localStorage.getItem(tk) || '{"total":0,"byProvider":{},"byFeature":{}}');
    today.total += krw;
    today.byProvider[provider] = (today.byProvider[provider]||0) + krw;
    if (opts.featureId) {
      today.byFeature[opts.featureId] = today.byFeature[opts.featureId] || { count:0, krw:0 };
      today.byFeature[opts.featureId].count++;
      today.byFeature[opts.featureId].krw += krw;
    }
    localStorage.setItem(tk, JSON.stringify(today));

    // 이번달
    const mk = monthKey();
    const month = JSON.parse(localStorage.getItem(mk) || '{"total":0,"byProvider":{},"byFeature":{},"count":0}');
    month.total += krw;
    month.count = (month.count||0) + 1;
    month.byProvider[provider] = (month.byProvider[provider]||0) + krw;
    if (opts.featureId) {
      month.byFeature[opts.featureId] = month.byFeature[opts.featureId] || { count:0, krw:0 };
      month.byFeature[opts.featureId].count++;
      month.byFeature[opts.featureId].krw += krw;
    }
    localStorage.setItem(mk, JSON.stringify(month));

    // 히스토리 (최근 30일 일자별 총액)
    const histKey = 'cost_history';
    const hist = JSON.parse(localStorage.getItem(histKey)||'{}');
    hist[tk] = today.total;
    const keys = Object.keys(hist).sort();
    if (keys.length > 30) {
      keys.slice(0, keys.length - 30).forEach(k => delete hist[k]);
    }
    localStorage.setItem(histKey, JSON.stringify(hist));

    fireUpdate();
    return { krw, model, provider, inputTokens, outputTokens };
  }

  /* ─── 조회 ─── */
  function getToday(){ return JSON.parse(localStorage.getItem(todayKey())||'{"total":0,"byProvider":{},"byFeature":{}}'); }
  function getMonth(){ return JSON.parse(localStorage.getItem(monthKey())||'{"total":0,"byProvider":{},"byFeature":{},"count":0}'); }
  function getHistory(){ return JSON.parse(localStorage.getItem('cost_history')||'{}'); }

  function getStatus(){
    const t = getToday();
    const m = getMonth();
    const b = getBudget();
    const pct = b.monthly > 0 ? (m.total / b.monthly * 100) : 0;
    let level = 'ok'; // ok | warn | block
    if (pct >= b.blockAt) level = 'block';
    else if (pct >= b.warnAt) level = 'warn';
    return {
      todayKRW: t.total,
      monthKRW: m.total,
      budget: b.monthly,
      usedPct: pct,
      level,
      remaining: Math.max(0, b.monthly - m.total),
      projected: projectedMonth(m)
    };
  }
  function projectedMonth(m){
    const d = new Date();
    const day = d.getDate();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
    if (day <= 0) return m.total;
    return m.total / day * daysInMonth;
  }

  function canGenerate(){
    const s = getStatus();
    return s.level !== 'block';
  }

  /* ─── 초기화 ─── */
  function resetAll(){
    Object.keys(localStorage).forEach(k => {
      if (k.indexOf('cost_') === 0) localStorage.removeItem(k);
    });
    fireUpdate();
  }

  /* ─── 이벤트 ─── */
  const listeners = [];
  function onUpdate(fn){ if (typeof fn === 'function') listeners.push(fn); }
  function fireUpdate(){ listeners.forEach(fn => { try{ fn(getStatus()); }catch(e){} }); }

  /* ─── 외부 노출 ─── */
  const CostTracker = {
    PRICING, PROVIDER_BY_MODEL,
    estimateTokens, calcCostKRW,
    record, canGenerate,
    getToday, getMonth, getHistory, getStatus,
    getBudget, setBudget,
    getFxRate, setFxRate,
    resetAll, onUpdate
  };

  global.CostTracker = CostTracker;
  if (typeof module !== 'undefined' && module.exports) module.exports = CostTracker;

})(typeof window !== 'undefined' ? window : globalThis);
