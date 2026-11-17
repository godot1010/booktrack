// Book612 쇼츠 녹화 공통 도구 (Playwright run_code 안에서 eval로 불러 씀)
// 가상의 책·지은이·문장으로 채운 시드 → 실제 책 문장 안 씀
const iso = (y, m, d) => `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T10:00:00.000Z`;
const SEED = [];
const mk = (i, title, author, status, genre, quotes = [], o = {}) => SEED.push({
  id: 'd' + i, title, author, publisher: '별빛출판', status, genre, format: o.fmt || 'paper', rec: !!o.rec,
  createdAt: o.created || iso(2026, 9, 1), updatedAt: o.created || iso(2026, 9, 1), startedAt: o.started || '', finishedAt: o.finished || '', feeling: o.feeling || '',
  summary: '사막에 떨어진 조종사가 작은 별에서 온 아이를 만나며 잊고 있던 마음을 다시 찾아가는 이야기.',
  quotes: quotes.map(([t, pg], k) => ({ id: 'q' + i + k, text: t, page: pg, createdAt: iso(2026, 10, 1 + k + i) })) });
mk(1, '별을 세는 밤', '한여름', 'reading', '소설', [['오래 바라본 것들은 결국 내 안에 별자리를 만든다.', '48'], ['천천히 걷는 사람만 볼 수 있는 길이 있다.', '112']], { rec: true, started: iso(2026, 10, 3), feeling: '잠들기 전에 한 장씩 아껴 읽는 책.' });
mk(2, '사막의 우물', '윤서하', 'reading', '수필', [['목이 마를 때 찾던 우물은 사실 함께 걷던 시간이었다.', '23']], { started: iso(2026, 10, 8) });
mk(3, '여우의 편지', '이도담', 'done', '소설', [['기다리는 시간도 만남의 일부라는 걸 너에게 배웠어.', '77'], ['익숙해진다는 건 서로의 이름을 오래 부르는 일이다.', '131']], { finished: iso(2026, 3, 14), rec: true });
mk(4, '작은 정원의 기록', '박온', 'done', '수필', [['물을 주는 날보다 기다리는 날이 더 많았다.', '15']], { finished: iso(2026, 6, 2) });
mk(5, '바람이 머문 자리', '서늘', 'done', '시', [['바람은 머물지 않아서 늘 새롭다.', '9']], { finished: iso(2026, 9, 21) });
mk(6, '가로등 아래에서', '정은솔', 'want', '소설', [], { created: iso(2026, 10, 10) });
mk(7, '왕의 하루', '김하람', 'want', '인문', [], { created: iso(2026, 10, 12) });
mk(8, '장미를 위한 시간', '문채', 'want', '시', [], { created: iso(2026, 10, 14) });
mk(9, '철도원의 노트', '류세', 'done', '인문', [], { finished: iso(2026, 8, 11) });
mk(10, '밤하늘 산책', '오로라', 'reading', '자기계발', [], { fmt: 'audio', started: iso(2026, 10, 12) });
