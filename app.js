console.log('📦 app.js загружен');

// Структурные данные
const APP = {
  cities: [
    {name:'Москва',lat:55.7558,lon:37.6176,tz:3,code:'moscow'},
    {name:'Санкт-Петербург',lat:59.9311,lon:30.3609,tz:3,code:'spb'},
    {name:'Новосибирск',lat:55.0084,lon:82.9357,tz:7,code:'novosibirsk'},
    {name:'Екатеринбург',lat:56.8431,lon:60.6454,tz:5,code:'ekaterinburg'},
    {name:'Нижний Новгород',lat:56.2965,lon:43.9361,tz:3,code:'nizhny'},
    {name:'Казань',lat:55.8304,lon:49.0661,tz:3,code:'kazan'},
    {name:'Краснодар',lat:45.0355,lon:38.9753,tz:3,code:'krasnodar'},
    {name:'Лондон',lat:51.5074,lon:-0.1278,tz:0,code:'london'},
    {name:'Нью-Йорк',lat:40.7128,lon:-74.0060,tz:-5,code:'newyork'},
    {name:'Париж',lat:48.8566,lon:2.3522,tz:1,code:'paris'},
    {name:'Токио',lat:35.6762,lon:139.6503,tz:9,code:'tokyo'},
    {name:'Дели',lat:28.6139,lon:77.2090,tz:5.5,code:'delhi'}
  ],
  planetList: [
    {name:'Солнце',en:'Sun', symbol:'☉'},
    {name:'Луна', en:'Moon', symbol:'☽'},
    {name:'Меркурий', en:'Mercury', symbol:'☿'},
    {name:'Венера', en:'Venus', symbol:'♀'},
    {name:'Марс', en:'Mars', symbol:'♂'},
    {name:'Юпитер', en:'Jupiter', symbol:'♃'},
    {name:'Сатурн', en:'Saturn', symbol:'♄'},
    {name:'Уран', en:'Uranus', symbol:'♅'},
    {name:'Нептун', en:'Neptune', symbol:'♆'},
    {name:'Плутон', en:'Pluto', symbol:'♇'}
  ],
  signs:   ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'],
  signSymbols: ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'],
  exalt : {'Солнце':'Овен','Луна':'Телец','Меркурий':'Дева','Венера':'Рыбы',
           'Марс':'Козерог','Юпитер':'Рак','Сатурн':'Весы'},
  ruler : {
     'Солнце':['Лев'],           'Луна':['Рак'],
     'Меркурий':['Близнецы','Дева'],'Венера':['Телец','Весы'],
     'Марс':['Овен','Скорпион'], 'Юпитер':['Стрелец','Рыбы'],
     'Сатурн':['Козерог','Водолей'],'Уран':['Водолей'],
     'Нептун':['Рыбы'],          'Плутон':['Скорпион']
  }
};

document.addEventListener('DOMContentLoaded', ()=>{
  // Значения по умолчанию
  const now = new Date();
  qs('#birth-date').value=now.toISOString().slice(0,10);
  qs('#birth-time').value=now.toTimeString().slice(0,5);
  qs('#city').value='moscow';
  updateCoords('moscow');
  // События
  qs('#city').addEventListener('change',e=>updateCoords(e.target.value));
  qs('#birth-form').addEventListener('submit',onSubmit);
});

function qs(sel){return document.querySelector(sel);}

function updateCoords(code){
  const c = APP.cities.find(x=>x.code===code);
  if(!c) { qs('#coordinates-section').style.display='block'; return; }
  qs('#coordinates-section').style.display='none';
  qs('#latitude').value=c.lat;
  qs('#longitude').value=c.lon;
  qs('#timezone').value=c.tz;
}

async function onSubmit(e){
  e.preventDefault();
  const btn = e.target.querySelector('button'); btn.disabled=true;
  try{
    const fd = getForm();
    const chart = calcChart(fd);
    renderResults(chart, fd);
  }catch(err){ alert(err.message); }
  btn.disabled=false;
}

function getForm(){
  return {
    date:qs('#birth-date').value,
    time:qs('#birth-time').value,
    lat:+qs('#latitude').value,
    lon:+qs('#longitude').value,
    tz:+qs('#timezone').value,
    system:qs('#house-system').value
  };
}

function calcChart(fd){
  const local = new Date(`${fd.date}T${fd.time}:00`);
  const utc   = new Date(local.getTime() - fd.tz*3600e3);
  const T     = new Astronomy.AstroTime(utc);
  const obs   = new Astronomy.Observer(fd.lat,fd.lon,0);
  
  // Планеты
  const planets = APP.planetList.map((p,i) => {
    const eq = Astronomy.Equator(Astronomy.Body[p.en], T, null, true, true);
    const ec = Astronomy.Ecliptic(eq);
    return {
      name:p.name, symbol:p.symbol,
      longitude:(ec.lon+360)%360, latitude:ec.lat
    }
  });

  // Дома (Equal House)
  let houses = [];
  const lst = Astronomy.SiderealTime(T)+fd.lon/15;
  const ob  = 23.4397*Math.PI/180, latR=fd.lat*Math.PI/180, lstR=lst*15*Math.PI/180;
  const asc=(Math.atan2(-Math.cos(lstR),Math.sin(lstR)*Math.cos(ob)+Math.tan(latR)*Math.sin(ob))*180/Math.PI+360)%360;
  for(let i=1;i<=12;i++){
    const cusp=(asc+(i-1)*30)%360;
    houses.push({
      number:i,
      cusp:cusp,
      sign:APP.signs[Math.floor(cusp/30)],
      ruler:'–'
    });
  }

  // Аспекты
  let aspects=[];
  for(let i=0;i<planets.length;i++)
    for(let j=i+1;j<planets.length;j++){
      let diff=Math.abs(planets[i].longitude-planets[j].longitude);
      if(diff>180) diff=360-diff;
      [
        {a:0,orb:8,name:'Соединение',cls:'aspect-conjunction',sym:'☌'},
        {a:60,orb:6,name:'Секстиль',cls:'aspect-sextile',sym:'⚹'},
        {a:90,orb:8,name:'Квадрат',cls:'aspect-square',sym:'□'},
        {a:120,orb:8,name:'Трин',cls:'aspect-trine',sym:'△'},
        {a:180,orb:8,name:'Оппозиция',cls:'aspect-opposition',sym:'☍'},
      ].forEach(a=>{
        const orb = Math.abs(diff-a.a);
        if(orb<=a.orb)
          aspects.push({p1:planets[i],p2:planets[j],aspect:a,orb:orb.toFixed(2),acc:((a.orb-orb)/a.orb*100).toFixed(1)});
      });
    }

  return {planets, houses, aspects, asc};
}

// Основная функция вывода
function renderResults(chart, fd) {
  qs("#results-section").classList.remove("hidden");

  // Информация
  qs("#birth-info-content").innerHTML = `
    <b>Дата:</b> ${fd.date}, <b>Время:</b> ${fd.time} <br>
    <b>Координаты:</b> ${fd.lat}, ${fd.lon} &nbsp; ЧП: UTC${fd.tz>=0?'+':''}${fd.tz}
  `;

  // Планеты
  let phtml = "";
  chart.planets.forEach((p, i) => {
    const sign = APP.signs[Math.floor(p.longitude / 30)];
    const signIndex = Math.floor(p.longitude/30);
    const degs = (p.longitude % 30).toFixed(2);
    const house = getPlanetHouse(p.longitude, chart.houses);
    const strength = getPlanetStrength(p.name, sign);
    phtml += `<tr>
      <td>${p.symbol} ${p.name}</td>
      <td>${APP.signSymbols[signIndex]} ${sign}</td>
      <td>${degs}°</td>
      <td>${house}</td>
      <td class="${strength.cls}">${strength.text}</td>
    </tr>`;
  });
  qs("#planets-tbody").innerHTML = phtml;

  // Дома
  let houses = "";
  chart.houses.forEach(h => {
    const signIndex = APP.signs.indexOf(h.sign);
    houses += `<tr>
      <td>${h.number}</td>
      <td>${h.cusp.toFixed(2)}°</td>
      <td>${APP.signSymbols[signIndex]} ${h.sign}</td>
      <td>${h.ruler}</td>
    </tr>`;
  });
  qs("#houses-tbody").innerHTML = houses;

  // Аспекты
  let aspects = "";
  chart.aspects.slice(0,20).forEach(a => {
    aspects += `<tr>
      <td>${a.p1.symbol} ${a.p1.name}</td>
      <td class="${a.aspect.cls}">${a.aspect.sym} ${a.aspect.name}</td>
      <td>${a.p2.symbol} ${a.p2.name}</td>
      <td>${a.orb}°</td>
      <td>${a.acc}%</td>
    </tr>`;
  });
  qs("#aspects-tbody").innerHTML = aspects;

  // Графики
  drawCharts(chart);

  // Интерпретация
  qs("#interpretation-content").innerHTML = getInterpretation(chart);
}

// Вспомогательные функции
function getPlanetHouse(lon, houses){
  for(let i=0;i<houses.length;i++){
    let start=houses[i].cusp, end=houses[(i+1)%houses.length].cusp;
    if(end<start) end+=360;
    if(lon>=start && lon<end) return houses[i].number;
    if(i===houses.length-1 && (lon>=houses[i].cusp||lon< houses[0].cusp)) return houses[i].number;
  }
  return 1;
}
function getPlanetStrength(name, sign){
  if(APP.exalt[name]===sign) return {text:'Экзальтация',cls:'strength-exalted'};
  if(APP.ruler[name] && APP.ruler[name].includes(sign)) return {text:'Обитель',cls:'strength-dignified'};
  return {text:'',cls:'strength-neutral'};
}
function getInterpretation(chart){
  const strong = chart.planets.filter(p=>{
    const sign=APP.signs[Math.floor(p.longitude/30)];
    const s=getPlanetStrength(p.name,sign).text;
    return s==='Экзальтация'||s==='Обитель';
  });
  return `
    <h3>Сильные планеты (${strong.length})</h3>
    <ul>${strong.map(p=>
      `<li><b>${p.symbol} ${p.name}</b> в ${APP.signs[Math.floor(p.longitude/30)]}</li>`
    ).join('')}</ul>
    <h3>Основные показатели</h3>
    <p>Планет с сильным положением: ${strong.length}.<br>
    Всего аспектов: ${chart.aspects.length}.</p>
  `;
}

// Графики Chart.js -- распределение по знакам и сила планет
function drawCharts(chart){
  // 1. Планеты по знакам
  const counts = Array(12).fill(0);
  chart.planets.forEach(p=>{counts[Math.floor(p.longitude/30)]++;});
  new Chart(qs('#signs-chart'), {
    type:'bar',
    data:{
      labels:APP.signs, datasets:[{label:'Планеты',data:counts,backgroundColor:'#667eea'}]
    },
    options:{responsive:true,plugins:{legend:{display:false}}}
  });

  // 2. Сила планет
  const labels=chart.planets.map(p=>p.name);
  const data=chart.planets.map(p=>{
    const sign=APP.signs[Math.floor(p.longitude/30)];
    const s=getPlanetStrength(p.name,sign).text;
    return s==='Экзальтация'?3:s==='Обитель'?2:1;
  });
  new Chart(qs('#strength-chart'), {
    type:'radar',
    data:{labels,datasets:[{label:'Сила',data,backgroundColor:'rgba(76,175,80,.2)',borderColor:'#66BB6A'}]},
    options:{responsive:true,plugins:{legend:{display:false}},scales:{r:{min:0,max:3}}}
  });
}
