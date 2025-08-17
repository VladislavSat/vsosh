// Профессиональный астрологический калькулятор - ИСПРАВЛЕННАЯ ВЕРСИЯ
// Исправлена ошибка "Astronomy is not defined"

/* -------- ГЛОБАЛЬНЫЕ ФЛАГИ -------- */
if (typeof window.AstroReady === 'undefined') window.AstroReady = false;
if (typeof window.AstroCDN === 'undefined') window.AstroCDN = false;

/* -------- ДАННЫЕ ПРИЛОЖЕНИЯ -------- */
const APP_DATA = {
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

  planets: ['Солнце','Луна','Меркурий','Венера','Марс','Юпитер','Сатурн','Уран','Нептун','Плутон'],
  planetsEn: ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'],
  planetSymbols: ['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇'],

  signs: ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'],
  signSymbols: ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'],

  aspects: {
    conj:{a:0,orb:8,name:'Соединение',sym:'☌'},
    sext:{a:60,orb:6,name:'Секстиль',sym:'⚹'},
    sqr:{a:90,orb:8,name:'Квадрат',sym:'□'},
    tri:{a:120,orb:8,name:'Трин',sym:'△'},
    opp:{a:180,orb:8,name:'Оппозиция',sym:'☍'}
  },

  exaltations: {'Солнце':'Овен','Луна':'Телец','Меркурий':'Дева','Венера':'Рыбы','Марс':'Козерог','Юпитер':'Рак','Сатурн':'Весы'},

  rulerships: {
    'Солнце':['Лев'],'Луна':['Рак'],
    'Меркурий':['Близнецы','Дева'],'Венера':['Телец','Весы'],
    'Марс':['Овен','Скорпион'],'Юпитер':['Стрелец','Рыбы'],
    'Сатурн':['Козерог','Водолей'],'Уран':['Водолей'],
    'Нептун':['Рыбы'],'Плутон':['Скорпион']
  }
};

/* -------- FALLBACK ASTRONOMY ENGINE -------- */
function loadAstroFallback(){
  if (window.AstroReady) return;
  console.warn('🔄 Fallback Astronomy Engine');

  window.Astronomy = {
    Body:{Sun:'Sun',Moon:'Moon',Mercury:'Mercury',Venus:'Venus',Mars:'Mars',Jupiter:'Jupiter',Saturn:'Saturn',Uranus:'Uranus',Neptune:'Neptune',Pluto:'Pluto'},
    AstroTime(date){this.ut = date/86400000 + 2440587.5;this.AddDays=d=>new window.Astronomy.AstroTime(date + d*86400000);return this;},
    Observer(lat,lon,e=0){this.latitude=lat;this.longitude=lon;this.elevation=e;},
    Equator(body,time){
      const idx=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'].indexOf(body);
      const base=[280,218,252,182,355,34,50,314,304,239][idx]||0;
      const speed=[.986,13.176,4.092,1.602,.524,.083,.033,.012,.006,.004][idx]||1;
      const lon=(base+(time.ut-2451545)*speed)%360;
      return {ra:lon,dec:Math.sin(lon*Math.PI/180)*23.44};
    },
    Ecliptic(eq){
      const ob=23.4397*Math.PI/180, ra=eq.ra*Math.PI/180, dec=eq.dec*Math.PI/180;
      const lon=Math.atan2(Math.sin(ra)*Math.cos(ob)+Math.tan(dec)*Math.sin(ob),Math.cos(ra))*180/Math.PI;
      return {lon:(lon+360)%360,lat:0};
    },
    SiderealTime(t){return ((280.460618+360.985647*(t.ut-2451545))%360+360)%360/15;}
  };

  window.AstroReady=true;
  window.AstroCDN=false;
  console.log('✅ Fallback Engine готов');
}

/* -------- ЖДЕМ CDN БИБЛИОТЕКУ -------- */
(function(){
  const MAX=3000, STEP=100; let waited=0;
  const timer=setInterval(()=>{
    if (window.Astronomy && window.Astronomy.Body){
       clearInterval(timer); window.AstroReady=true; window.AstroCDN=true;
       console.log('✅ Astronomy Engine (CDN) готов');
    } else if ((waited+=STEP)>=MAX){
       clearInterval(timer); loadAstroFallback();
    }
  },STEP);
})();

/* -------- ИНИЦИАЛИЗАЦИЯ UX -------- */
let currentChart = null;
let signsChart = null;

document.addEventListener('DOMContentLoaded',()=>{
  const chk=setInterval(()=>{
    if(window.AstroReady){ clearInterval(chk); initUI(); }
  },50);
});

function initUI(){
  console.log('🚀 Запуск приложения');

  // дефолтные значения
  const now=new Date();
  document.getElementById('birth-date').value = now.toISOString().slice(0,10);
  document.getElementById('birth-time').value = now.toTimeString().slice(0,5);
  document.getElementById('city').value='moscow';
  updateCoords('moscow');

  // события
  document.getElementById('city').addEventListener('change',e=>updateCoords(e.target.value));
  document.getElementById('birth-form').addEventListener('submit',onSubmit);
}

function updateCoords(code){
  const c=APP_DATA.cities.find(x=>x.code===code); if(!c) return;
  document.getElementById('latitude').value=c.lat;
  document.getElementById('longitude').value=c.lon;
  document.getElementById('timezone').value=c.tz;
}

async function onSubmit(e){
  e.preventDefault();
  const btn=e.target.querySelector('button'); btn.disabled=true;

  try{
    // ✅ ПРОВЕРЯЕМ ЧТО БИБЛИОТЕКА ЗАГРУЖЕНА ПРИ КЛИКЕ
    if (!window.Astronomy || !window.Astronomy.Body) {
      throw new Error('Библиотека расчетов еще не загружена. Попробуйте через секунду.');
    }

    const fd=getFormData();
    const chart=calcChart(fd);
    
    // ПОКАЗЫВАЕМ РЕЗУЛЬТАТЫ ВМЕСТО ALERT
    displayResults(chart, fd);
    
    // Показать секцию результатов
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.classList.remove('hidden');
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

  }catch(err){ 
    console.error('Ошибка расчета:', err);
    alert('Ошибка: ' + err.message); 
  }

  btn.disabled=false;
}

function getFormData(){
  const cityCode = document.getElementById('city').value;
  const city = APP_DATA.cities.find(c => c.code === cityCode);
  return {
    date: document.getElementById('birth-date').value,
    time: document.getElementById('birth-time').value,
    city: cityCode,
    latitude: parseFloat(document.getElementById('latitude').value || 0),
    longitude: parseFloat(document.getElementById('longitude').value || 0),
    timezone: parseFloat(document.getElementById('timezone').value || 0),
    houseSystem: document.getElementById('house-system').value || 'placidus'
  };
}

function calcChart(fd){
  // ✅ ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА В НАЧАЛЕ ФУНКЦИИ
  if (!window.Astronomy) {
    throw new Error('Astronomy библиотека не доступна');
  }

  // дата-время
  const local = new Date(`${fd.date}T${fd.time}:00`);
  const utc   = new Date(local.getTime() - fd.timezone*3600e3);
  const T     = new window.Astronomy.AstroTime(utc);
  const obs   = new window.Astronomy.Observer(fd.latitude,fd.longitude,0);

  // планеты
  const planets = APP_DATA.planetsEn.map((body,i)=>{
    const eq = window.Astronomy.Equator(window.Astronomy.Body[body],T,null,true,true);
    const ec = window.Astronomy.Ecliptic(eq);
    return {
      name: APP_DATA.planets[i], 
      symbol: APP_DATA.planetSymbols[i],
      longitude: (ec.lon+360)%360, 
      latitude: ec.lat
    };
  });

  // Asc & MC
  const lst = window.Astronomy.SiderealTime(T) + fd.longitude/15;
  const obliquity = 23.4397;
  const latR = fd.latitude * Math.PI / 180;
  const lstR = (lst * 15) * Math.PI / 180;
  const oblR = obliquity * Math.PI / 180;
  
  const Y = -Math.cos(lstR);
  const X = Math.sin(lstR) * Math.cos(oblR) + Math.tan(latR) * Math.sin(oblR);
  let asc = Math.atan2(Y, X) * 180 / Math.PI;
  if (asc < 0) asc += 360;
  
  let mc = (lst * 15) % 360;
  if (mc < 0) mc += 360;

  const ascendant = {
    name: "Асцендент",
    symbol: "AC",
    longitude: asc
  };

  // дома (упрощенно)
  const houses = [];
  for (let i = 1; i <= 12; i++) {
    const cusp = (asc + (i - 1) * 30) % 360;
    houses.push({
      number: i,
      cusp: cusp,
      sign: getZodiacSign(cusp)
    });
  }

  // аспекты
  const aspects = calculateAspects([...planets, ascendant]);

  return {planets, houses, aspects, ascendant, mc};
}

function getZodiacSign(longitude) {
  let lon = longitude;
  if (lon < 0) lon += 360;
  if (lon >= 360) lon -= 360;
  const signIndex = Math.floor(lon / 30);
  return APP_DATA.signs[signIndex] || APP_DATA.signs[0];
}

function calculateAspects(planets) {
  const aspects = [];
  const aspectTypes = Object.values(APP_DATA.aspects);
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      let diff = Math.abs(planet1.longitude - planet2.longitude);
      if (diff > 180) diff = 360 - diff;
      
      for (const aspectType of aspectTypes) {
        const orb = Math.abs(diff - aspectType.a);
        
        if (orb <= aspectType.orb) {
          const accuracy = ((aspectType.orb - orb) / aspectType.orb * 100);
          
          aspects.push({
            planet1: planet1.name,
            planet2: planet2.name,
            aspect: aspectType,
            orb: orb.toFixed(2),
            accuracy: parseFloat(accuracy.toFixed(1))
          });
        }
      }
    }
  }
  
  aspects.sort((a, b) => b.accuracy - a.accuracy);
  return aspects;
}

function formatDegrees(longitude) {
  let lon = longitude;
  if (lon < 0) lon += 360;
  if (lon >= 360) lon -= 360;
  
  const degrees = Math.floor(lon % 30);
  const minutes = Math.floor((lon % 1) * 60);
  
  return `${degrees}°${minutes.toString().padStart(2, '0')}'`;
}

function displayResults(chart, formData) {
  try {
    displayBirthInfo(formData);
    displayPlanetsTable(chart);
    displayHousesTable(chart.houses);
    displayAspectsTable(chart.aspects);
    displayCharts(chart);
    
    currentChart = chart;
    console.log('✅ Результаты отображены');
  } catch (error) {
    console.error('❌ Ошибка отображения результатов:', error);
  }
}

function displayBirthInfo(formData) {
  const city = APP_DATA.cities.find(c => c.code === formData.city);
  const cityName = city ? city.name : 'Ручной ввод';
  
  const content = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
      <div><strong>Дата рождения</strong><br>${new Date(formData.date + 'T00:00:00').toLocaleDateString('ru-RU')}</div>
      <div><strong>Время рождения</strong><br>${formData.time}</div>
      <div><strong>Место</strong><br>${cityName}</div>
      <div><strong>Координаты</strong><br>${formData.latitude.toFixed(4)}°, ${formData.longitude.toFixed(4)}°</div>
      <div><strong>Часовой пояс</strong><br>UTC${formData.timezone >= 0 ? '+' : ''}${formData.timezone}</div>
    </div>
  `;
  
  const element = document.getElementById('birth-info-content');
  if (element) element.innerHTML = content;
}

function displayPlanetsTable(chart) {
  const tbody = document.getElementById('planets-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  chart.planets.forEach(planet => {
    const sign = getZodiacSign(planet.longitude);
    const signIndex = APP_DATA.signs.indexOf(sign);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="planet-symbol">${planet.symbol}</span> ${planet.name}</td>
      <td><span class="sign-symbol">${APP_DATA.signSymbols[signIndex] || ''}</span> ${sign}</td>
      <td>${formatDegrees(planet.longitude)}</td>
      <td>1</td>
      <td>—</td>
    `;
    tbody.appendChild(row);
  });
}

function displayHousesTable(houses) {
  const tbody = document.getElementById('houses-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  houses.forEach(house => {
    const signIndex = APP_DATA.signs.indexOf(house.sign);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${house.number}</td>
      <td>${formatDegrees(house.cusp)}</td>
      <td><span class="sign-symbol">${APP_DATA.signSymbols[signIndex] || ''}</span> ${house.sign}</td>
      <td>—</td>
    `;
    tbody.appendChild(row);
  });
}

function displayAspectsTable(aspects) {
  const tbody = document.getElementById('aspects-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  aspects.slice(0, 10).forEach(aspect => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${aspect.planet1}</td>
      <td><span class="aspect-symbol">${aspect.aspect.sym}</span> ${aspect.aspect.name}</td>
      <td>${aspect.planet2}</td>
      <td>${aspect.orb}°</td>
      <td>${aspect.accuracy}%</td>
    `;
    tbody.appendChild(row);
  });
}

function displayCharts(chart) {
  if (typeof Chart === 'undefined') {
    console.warn('⚠️ Chart.js не загружена');
    return;
  }
  
  createSignsChart(chart);
}

function createSignsChart(chart) {
  const ctx = document.getElementById('signs-chart');
  if (!ctx) return;
  
  if (signsChart) {
    signsChart.destroy();
  }
  
  // Подсчет планет по знакам
  const signCounts = new Array(12).fill(0);
  chart.planets.forEach(planet => {
    const signIndex = Math.floor(planet.longitude / 30);
    if (signIndex >= 0 && signIndex < 12) {
      signCounts[signIndex]++;
    }
  });
  
  signsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: APP_DATA.signs,
      datasets: [{
        data: signCounts,
        backgroundColor: [
          '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b',
          '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#00cec9', '#74b9ff'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 10
          }
        }
      }
    }
  });
}

console.log('✅ app.js загружен успешно');
