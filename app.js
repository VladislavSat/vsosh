/**********************************************************************
  app.js  (полностью исправленный, без конфликтов переменных)
  ─────────────────────────────────────────────────────────────────────
  •  Отслеживает загрузку основной библиотеки Astronomy Engine.
  •  Если CDN недоступен – автоматически включает fallback,
     но делает это ОДИН раз и без конфликтов.
  •  Не содержит переменной astronomyEngineLoaded, чтобы
     избежать ошибки «Identifier already been declared».
**********************************************************************/

/* -------- 0. ГЛОБАЛЬНЫЕ ФЛАГИ (создаются один раз) ---------------- */
if (typeof window.AstroReady   === 'undefined') window.AstroReady   = false;  // движок загружен
if (typeof window.AstroCDN     === 'undefined') window.AstroCDN     = false;  // true→CDN, false→fallback

/* -------- 1. ДАННЫЕ ПРИЛОЖЕНИЯ ------------------------------------ */
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

  planets     : ['Солнце','Луна','Меркурий','Венера','Марс','Юпитер','Сатурн','Уран','Нептун','Плутон'],
  planetsEn   : ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'],
  planetSymbols:['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇'],

  signs       : ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион',
                 'Стрелец','Козерог','Водолей','Рыбы'],
  signSymbols : ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'],

  aspects : {
      conj:{a:0  ,orb:8,name:'Соединение',sym:'☌'},
      sext:{a:60 ,orb:6,name:'Секстиль'  ,sym:'⚹'},
      sqr :{a:90 ,orb:8,name:'Квадрат'   ,sym:'□'},
      tri :{a:120,orb:8,name:'Трин'      ,sym:'△'},
      opp :{a:180,orb:8,name:'Оппозиция' ,sym:'☍'}
  },

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

/* -------- 2. FALLBACK Astronomy Engine ----------------------------- */
function loadAstroFallback(){
  if (window.AstroReady) return;
  console.warn('🔄 Fallback Astronomy Engine');

  window.Astronomy = {
    Body:{Sun:'Sun',Moon:'Moon',Mercury:'Mercury',Venus:'Venus',
          Mars:'Mars',Jupiter:'Jupiter',Saturn:'Saturn',
          Uranus:'Uranus',Neptune:'Neptune',Pluto:'Pluto'},

    AstroTime(date){
      this.ut = date/86400000 + 2440587.5;
      this.AddDays=d=>new window.Astronomy.AstroTime(date + d*86400000);
      return this;
    },

    Observer(lat,lon,e=0){ this.latitude=lat;this.longitude=lon;this.elevation=e; },

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

/* -------- 3. ЖДЁМ CDN-версии или fallback --------------------------- */
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

/* -------- 4. ИНИЦИАЛИЗАЦИЯ UX после готовности --------------------- */
document.addEventListener('DOMContentLoaded',()=>{
  const chk=setInterval(()=>{
    if(window.AstroReady){ clearInterval(chk); initUI(); }
  },50);
});

/* ========== 5. UI & ЛОГИКА ПРИЛОЖЕНИЯ ============================== */
function initUI(){
  console.log('🚀 Запуск приложения');

  // дефолтные значения
  const now=new Date();
  qs('#birth-date').value=now.toISOString().slice(0,10);
  qs('#birth-time').value=now.toTimeString().slice(0,5);
  qs('#city').value='moscow';
  updateCoords('moscow');

  // события
  qs('#city').addEventListener('change',e=>updateCoords(e.target.value));
  qs('#birth-form').addEventListener('submit',onSubmit);
}

function qs(sel){return document.querySelector(sel);}

/* --- координаты по городу --- */
function updateCoords(code){
  const c=APP.cities.find(x=>x.code===code); if(!c) return;
  qs('#latitude').value=c.lat;
  qs('#longitude').value=c.lon;
  qs('#timezone').value=c.tz;
}

/* --- обработчик формы --- */
async function onSubmit(e){
  e.preventDefault();
  const btn=e.target.querySelector('button'); btn.disabled=true;

  try{
    const fd=getForm();
    const chart=calcChart(fd);
    console.table(chart.planets.map(p=>({Планета:p.name,Долгота:p.longitude.toFixed(2)})));
    alert('Карта рассчитана!\nСмотрите консоль.');
  }catch(err){ alert(err.message); }

  btn.disabled=false;
}

/* --- сбор данных формы --- */
function getForm(){
  return {
    date:qs('#birth-date').value,
    time:qs('#birth-time').value,
    city:qs('#city').value,
    lat:+qs('#latitude').value,
    lon:+qs('#longitude').value,
    tz:+qs('#timezone').value,
    system:qs('#house-system').value||'placidus'
  };
}

/* ================= 6. АСТРО-РАСЧЁТЫ ================================ */
function calcChart(fd){
  // дата-время
  const local = new Date(`${fd.date}T${fd.time}:00`);
  const utc   = new Date(local.getTime() - fd.tz*3600e3);
  const T     = new Astronomy.AstroTime(utc);
  const obs   = new Astronomy.Observer(fd.lat,fd.lon,0);

  // планеты
  const planets = APP.planetsEn.map((body,i)=>{
    const eq = Astronomy.Equator(Astronomy.Body[body],T,null,true,true);
    const ec = Astronomy.Ecliptic(eq);
    return {
      name:APP.planets[i], symbol:APP.planetSymbols[i],
      longitude:(ec.lon+360)%360, latitude:ec.lat
    };
  });

  // Asc / MC
  const lst = Astronomy.SiderealTime(T)+fd.lon/15;
  const ob  = 23.4397*Math.PI/180, latR=fd.lat*Math.PI/180, lstR=lst*15*Math.PI/180;
  const asc=(Math.atan2(-Math.cos(lstR),Math.sin(lstR)*Math.cos(ob)+Math.tan(latR)*Math.sin(ob))*180/Math.PI+360)%360;
  const mc =(lst*15)%360;

  return {planets,asc,mc};
}
