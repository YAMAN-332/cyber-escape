// خادم بسيط بدون أي مكتبات: يقدّم اللعبة ويحفظ قائمة الصدارة (الاسم + الوقت + الأخطاء فقط)
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const KEY = process.env.ADMIN_KEY || '';          // كلمة سر لتصفير القائمة
const FILE = path.join(__dirname, 'scores.json');
let scores = [];
try { scores = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {}
const save = () => { try { fs.writeFileSync(FILE, JSON.stringify(scores)); } catch (e) {} };

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/scores') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') return res.end(JSON.stringify(scores.slice(0, 50)));
    if (req.method === 'POST') {
      let b = '';
      req.on('data', c => { b += c; if (b.length > 1000) req.destroy(); });
      req.on('end', () => {
        try {
          const d = JSON.parse(b);
          const name = String(d.name || '').trim().slice(0, 20);
          const total = Math.round(+d.total * 10) / 10;
          const errs = Math.max(0, Math.min(99, parseInt(d.errs) || 0));
          if (!name || !(total >= 10 && total <= 3600)) throw 0;
          scores.push({ name, total, errs });
          scores.sort((a, z) => a.total - z.total);
          scores = scores.slice(0, 200);
          save();
          res.end('{"ok":true}');
        } catch (e) { res.statusCode = 400; res.end('{"ok":false}'); }
      });
      return;
    }
    res.statusCode = 405; return res.end();
  }
  if (u.pathname === '/reset') {                     // تصفير القائمة: /reset?key=كلمة_السر
    if (KEY && u.searchParams.get('key') === KEY) { scores = []; save(); res.end('تم تصفير القائمة'); }
    else { res.statusCode = 403; res.end('ممنوع'); }
    return;
  }
  if (u.pathname === '/' || u.pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  }
  res.statusCode = 404; res.end('404');
}).listen(PORT, () => console.log('running on ' + PORT));
