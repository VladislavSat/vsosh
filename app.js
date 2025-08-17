/* ---------- 0. НАСТРОЙКИ ----------------------------------------- */
const CITIES = {
  moscow:{lat:55.7558, lon:37.6176,  tz:3},
  spb   :{lat:59.9311, lon:30.3609,  tz:3},
  novosibirsk:{lat:55.0084, lon:82.9357, tz:7},
  ekaterinburg:{lat:56.8431, lon:60.6454, tz:5},
  london:{lat:51.5074, lon:-0.1278, tz:0},
  newyork:{lat:40.7128, lon:-74.006, tz:-5}
};
const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const P_SYMBOL=['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇'];
const SIGNS   = ['Овен','Телец','Близнецы','Рак','Лев','Дева',
                 'Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];
const S_SYMBOL=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

/* ---------- 1. ПОДГОТОВКА UI ------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // текущая дата-время
  const now=new Date();
  id('birth-date').value = now.toISOString().slice(0,10);
  id('birth-time').value = now.toTimeString().slice(0,5);

  // координаты по умолчанию (Москва)
  fillCoords('moscow');

  // переключение города
  id('city').onchange = e=>{
    if(e.target.value==='custom') showManual(true);
    else { showManual(false); fillCoords(e.target.value); }
  };

  // обработка формы
  id('birth-form').onsubmit = async ev=>{
    ev.preventDefault();
    const data = collectForm();
    const chart = calculateChart(data);
    renderResults(data, chart);
  };
});

/* ---------- 2. СБОР ДАННЫХ ФОРМЫ --------------------------------- */
function collectForm(){
  const cityCode = id('city').value;
  const city = CITIES[cityCode] || {
    lat:+id('latitude').value, lon:+id('longitude').value, tz:+id('timezone').value
  };
  return {
    date: id('birth-date').value,
    time: id('birth-time').value,
    lat : city.lat,
    lon : city.lon,
    tz  : city.tz,
    system: id('house-system').value || 'placidus'
  };
}

/* ---------- 3. ОСНОВНЫЙ РАСЧЁТ ----------------------------------- */
function calculateChart(fd){
  /* UTC-время */
  const local = new Date(`${fd.date}T${fd.time}:00`);
  const utc   = new Date(local.getTime() - fd.tz*3600e3);
  const T     = new Astronomy.AstroTime(utc);

  /* Планеты */
  const plist = PLANETS.map((body,i)=>{
    const eq = Astronomy.Equator(Astronomy.Body[body],T,null,true,true);
    const ec = Astronomy.Ecliptic(eq);
    return {
      name: body, symbol:P_SYMBOL[i],
      lon :(ec.lon+360)%360,
      lat : ec.lat
    };
  });

  return {planets:plist};
}

/* ---------- 4. ОТРИСОВКА РЕЗУЛЬТАТОВ ----------------------------- */
function renderResults(fd,chart){
  id('results').classList.remove('hidden');

  /* инфо о рождении */
  id('birth-info').innerHTML =
    `<b>${fd.date}</b> ${fd.time} UTC${fd.tz>=0?'+':''}${fd.tz}<br>
     Широта ${fd.lat.toFixed(4)}° Долгота ${fd.lon.toFixed(4)}°`;

  /* планеты */
  const tbody = chart.planets.map(p=>{
    const sign = SIGNS[Math.floor(p.lon/30)];
    const pos  = (p.lon%30).toFixed(2);
    return `<tr><td>${p.symbol}</td><td>${sign}</td><td>${pos}°</td></tr>`;
  }).join('');
  id('planets').innerHTML = `<tr><th>Пл</th><th>Знак</th><th>Позиция</th></tr>${tbody}`;

  /* простая диаграмма распределения */
  drawCharts(chart.planets);
}

/* ---------- 5. ДИАГРАММЫ ---------------------------------------- */
let signsChart;
function drawCharts(planets){
  /* счётчик планет по знакам */
  const count = Array(12).fill(0);
  planets.forEach(p=>++count[Math.floor(p.lon/30)]);
  if(signsChart) signsChart.destroy();
  signsChart = new Chart(id('signs-chart'),{
    type:'bar',
    data:{ labels:SIGNS, datasets:[{ data:count, backgroundColor:'#1f77b4' }]},
    options:{ plugins:{ legend:{display:false} } }
  });
}

/* ---------- 6. МЕЛКИЕ ВСПОМОГАТЕЛЬНЫЕ ---------------------------- */
function id(x){return document.getElementById(x);}
function fillCoords(code){
  const c=CITIES[code]; if(!c) return;
  id('latitude').value  = c.lat;
  id('longitude').value = c.lon;
  id('timezone').value  = c.tz;
}
function showManual(show){
  id('manual-coords').style.display = show? 'block':'none';
}
