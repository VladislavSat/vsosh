/******************************************************************
  app.js — запускается ТОЛЬКО после события AstroReady
******************************************************************/
window.addEventListener('AstroReady', initApp);

/* ---------- Константы ---------- */
const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const P_SIGN  = ['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇'];
const SIGNS   = ['Овен','Телец','Близнецы','Рак','Лев','Дева',
                 'Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];

const CITIES  = {
  moscow:{lat:55.7558, lon:37.6176, tz:3},
  spb   :{lat:59.9311, lon:30.3609, tz:3},
  london:{lat:51.5074, lon:-0.1278,tz:0},
  tokyo :{lat:35.6762, lon:139.6503,tz:9}
};

/* ---------- Инициализация UI ---------- */
function initApp(){
  console.log('✅ Astronomy Engine готова (проф-режим)');

  // дефолтные значения
  const now = new Date();
  id('birth-date').value = now.toISOString().slice(0,10);
  id('birth-time').value = now.toTimeString().slice(0,5);
  fillCoords('moscow');

  // события
  id('city').onchange = e=>{
    if(e.target.value==='custom') id('manual').style.display='flex';
    else{ id('manual').style.display='none'; fillCoords(e.target.value); }
  };
  id('birth-form').onsubmit = e=>{
    e.preventDefault();
    const data = collectForm();
    const chart= calcChart(data);
    render(chart,data);
  };
}

/* ---------- Вспомогательные ---------- */
const id = s=>document.getElementById(s);
function fillCoords(code){
  const c=CITIES[code]; if(!c) return;
  id('latitude').value = c.lat;
  id('longitude').value= c.lon;
  id('timezone').value = c.tz;
}
function collectForm(){
  const cityCode=id('city').value;
  const c=CITIES[cityCode]||{
    lat:+id('latitude').value, lon:+id('longitude').value, tz:+id('timezone').value
  };
  return {
    date:id('birth-date').value,
    time:id('birth-time').value,
    lat :c.lat, lon:c.lon, tz:c.tz
  };
}

/* ---------- Астрологический расчёт ---------- */
function calcChart(fd){
  const local = new Date(`${fd.date}T${fd.time}:00`);
  const utc   = new Date(local.getTime() - fd.tz*3600e3);
  const T     = new Astronomy.AstroTime(utc);

  // планеты
  const plist = PLANETS.map((b,i)=>{
    const eq = Astronomy.Equator(Astronomy.Body[b],T,null,true,true);
    const ec = Astronomy.Ecliptic(eq);
    return { name:b, sym:P_SIGN[i], lon:(ec.lon+360)%360 };
  });

  // Asc
  const lst  = Astronomy.SiderealTime(T)+fd.lon/15;
  const ascR = Math.atan2(-Math.cos(lst*15*Math.PI/180),
                   Math.sin(lst*15*Math.PI/180)*Math.cos(23.4397*Math.PI/180)
                   +Math.tan(fd.lat*Math.PI/180)*Math.sin(23.4397*Math.PI/180));
  const asc  = (ascR*180/Math.PI+360)%360;

  return {planets:plist, asc};
}

/* ---------- Отображение ---------- */
function render(chart,fd){
  id('results').classList.remove('hidden');

  /* birth-info */
  id('birth-info').innerHTML=
    `${fd.date} ${fd.time} UTC${fd.tz>=0?'+':''}${fd.tz}<br>
     Lat ${fd.lat}°, Lon ${fd.lon}°`;

  /* таблица планет */
  const rows = chart.planets.map(p=>{
    const sign= SIGNS[Math.floor(p.lon/30)];
    const deg = (p.lon%30).toFixed(1);
    return `<tr><td>${p.sym}</td><td>${sign}</td><td>${deg}°</td></tr>`;
  }).join('');
  id('planets').innerHTML = `<tr><th>П</th><th>Знак</th><th>Позн.</th></tr>${rows}`;

  /* диаграмма распределения */
  const cnt = Array(12).fill(0); chart.planets.forEach(p=>++cnt[Math.floor(p.lon/30)]);
  new Chart(id('signs-chart'),{
    type:'bar', data:{labels:SIGNS,datasets:[{data:cnt,backgroundColor:'#4ecdc4'}]},
    options:{plugins:{legend:{display:false}}}
  });
}
