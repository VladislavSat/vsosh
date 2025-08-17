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

  // скрыть ручной ввод по умолчанию
  id('manual').style.display = 'none';

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

  // Дома (Equal House)
  const houses = [];
  for(let i=1; i<=12; i++){
    const cusp = (asc + (i-1)*30) % 360;
    const sign = SIGNS[Math.floor(cusp/30)];
    houses.push({
      number: i,
      cusp: cusp,
      sign: sign
    });
  }

  // Аспекты
  const aspects = [];
  for(let i=0; i<plist.length; i++){
    for(let j=i+1; j<plist.length; j++){
      let diff = Math.abs(plist[i].lon - plist[j].lon);
      if(diff > 180) diff = 360 - diff;
      
      // Проверяем основные аспекты
      if(Math.abs(diff - 0) < 8)   aspects.push({p1:plist[i].name, p2:plist[j].name, type:'☌ Соединение', orb:diff.toFixed(1)});
      if(Math.abs(diff - 60) < 6)  aspects.push({p1:plist[i].name, p2:plist[j].name, type:'⚹ Секстиль', orb:Math.abs(diff-60).toFixed(1)});
      if(Math.abs(diff - 90) < 8)  aspects.push({p1:plist[i].name, p2:plist[j].name, type:'□ Квадрат', orb:Math.abs(diff-90).toFixed(1)});
      if(Math.abs(diff - 120) < 8) aspects.push({p1:plist[i].name, p2:plist[j].name, type:'△ Трин', orb:Math.abs(diff-120).toFixed(1)});
      if(Math.abs(diff - 180) < 8) aspects.push({p1:plist[i].name, p2:plist[j].name, type:'☍ Оппозиция', orb:Math.abs(diff-180).toFixed(1)});
    }
  }

  // Сортируем аспекты по орбу (самые точные первыми)
  aspects.sort((a,b) => parseFloat(a.orb) - parseFloat(b.orb));

  return {planets:plist, asc, houses, aspects};
}

/* ---------- Отображение ---------- */
function render(chart,fd){
  id('results').classList.remove('hidden');

  /* birth-info */
  id('birth-info').innerHTML=
    `${fd.date} ${fd.time} UTC${fd.tz>=0?'+':''}${fd.tz}<br>
     Lat ${fd.lat}°, Lon ${fd.lon}°<br>
     Асцендент: ${chart.asc.toFixed(1)}°`;

  /* таблица планет */
  const planetRows = chart.planets.map(p=>{
    const sign = SIGNS[Math.floor(p.lon/30)];
    const deg = (p.lon%30).toFixed(1);
    return `<tr><td>${p.sym} ${p.name}</td><td>${sign}</td><td>${deg}°</td></tr>`;
  }).join('');
  id('planets').innerHTML = `<tr><th>Планета</th><th>Знак</th><th>Позиция</th></tr>${planetRows}`;

  /* таблица домов */
  const houseRows = chart.houses.map(h=>{
    const deg = (h.cusp%30).toFixed(1);
    return `<tr><td>${h.number}</td><td>${h.sign}</td><td>${deg}°</td></tr>`;
  }).join('');
  id('houses').innerHTML = `<tr><th>Дом</th><th>Знак</th><th>Куспид</th></tr>${houseRows}`;

  /* таблица аспектов */
  const aspectRows = chart.aspects.slice(0,15).map(a=>{
    return `<tr><td>${a.p1}</td><td>${a.type}</td><td>${a.p2}</td><td>${a.orb}°</td></tr>`;
  }).join('');
  id('aspects').innerHTML = `<tr><th>Планета 1</th><th>Аспект</th><th>Планета 2</th><th>Орб</th></tr>${aspectRows}`;

  /* диаграмма распределения */
  const cnt = Array(12).fill(0); 
  chart.planets.forEach(p=>++cnt[Math.floor(p.lon/30)]);
  
  new Chart(id('signs-chart'),{
    type:'bar', 
    data:{
      labels:SIGNS,
      datasets:[{
        data:cnt,
        backgroundColor:'#4ecdc4',
        borderColor:'#26a69a',
        borderWidth:1
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false}
      },
      scales:{
        y:{
          beginAtZero:true,
          ticks:{stepSize:1}
        }
      }
    }
  });
}
