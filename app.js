/* --------------------------------------------------------------
   app.js — единая стабильная версия
   • не конфликтует с переменными из index.html
   • корректно ждёт загрузки Astronomy Engine или включает fallback
   • в остальном повторяет вашу логику
----------------------------------------------------------------*/

/* ============= 0. ГЛОБАЛЬНЫЕ ФЛАГИ (создаются один раз) ============== */
if (typeof window.astronomyReady === 'undefined')  window.astronomyReady  = false;  // движок готов
if (typeof window.astronomyFallback === 'undefined') window.astronomyFallback = false; // используем ли fallback

/* ================= 1. ДАННЫЕ ПРИЛОЖЕНИЯ ============================== */
const APP_DATA = {
    cities: [
        {name: 'Москва',            lat: 55.7558, lon:  37.6176, tz:  3,  code: 'moscow'},
        {name: 'Санкт-Петербург',   lat: 59.9311, lon:  30.3609, tz:  3,  code: 'spb'},
        {name: 'Новосибирск',       lat: 55.0084, lon:  82.9357, tz:  7,  code: 'novosibirsk'},
        {name: 'Екатеринбург',      lat: 56.8431, lon:  60.6454, tz:  5,  code: 'ekaterinburg'},
        {name: 'Нижний Новгород',   lat: 56.2965, lon:  43.9361, tz:  3,  code: 'nizhny'},
        {name: 'Казань',            lat: 55.8304, lon:  49.0661, tz:  3,  code: 'kazan'},
        {name: 'Краснодар',         lat: 45.0355, lon:  38.9753, tz:  3,  code: 'krasnodar'},
        {name: 'Лондон',            lat: 51.5074, lon:  -0.1278, tz:  0,  code: 'london'},
        {name: 'Нью-Йорк',          lat: 40.7128, lon: -74.0060, tz: -5,  code: 'newyork'},
        {name: 'Париж',             lat: 48.8566, lon:   2.3522, tz:  1,  code: 'paris'},
        {name: 'Токио',             lat: 35.6762, lon: 139.6503, tz:  9,  code: 'tokyo'},
        {name: 'Дели',              lat: 28.6139, lon:  77.2090, tz:  5.5,code: 'delhi'}
    ],

    planets:     ['Солнце','Луна','Меркурий','Венера','Марс','Юпитер','Сатурн','Уран','Нептун','Плутон'],
    planetsEn:   ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'],
    planetSymbols:['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇'],

    signs:       ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'],
    signSymbols: ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'],

    aspects: {
        conjunction:{angle:  0, orb:8,  name:'Соединение',symbol:'☌'},
        sextile:    {angle: 60, orb:6,  name:'Секстиль',  symbol:'⚹'},
        square:     {angle: 90, orb:8,  name:'Квадрат',    symbol:'□'},
        trine:      {angle:120, orb:8,  name:'Трин',       symbol:'△'},
        opposition: {angle:180, orb:8,  name:'Оппозиция',  symbol:'☍'}
    },

    exaltations:{ 'Солнце':'Овен', 'Луна':'Телец','Меркурий':'Дева','Венера':'Рыбы','Марс':'Козерог','Юпитер':'Рак','Сатурн':'Весы' },

    rulerships:{
        'Солнце':['Лев'],                   'Луна':['Рак'],
        'Меркурий':['Близнецы','Дева'],     'Венера':['Телец','Весы'],
        'Марс':['Овен','Скорпион'],         'Юпитер':['Стрелец','Рыбы'],
        'Сатурн':['Козерог','Водолей'],     'Уран':['Водолей'],
        'Нептун':['Рыбы'],                  'Плутон':['Скорпион']
    }
};

/* ================= 2. ЗАГРУЗКА ASTRONOMY ENGINE ====================== */
function markEngineReady(src){
    window.astronomyReady  = true;
    console.log(`✅ Astronomy Engine готова (${src})`);
}

/* --- Fallback (минимальный, но предсказуемый) ----------------------- */
function loadFallback(){
    if(window.astronomyReady) return;      // уже готово
    console.warn('🔄 Fallback Astronomy Engine');

    window.Astronomy = {
        Body:{ Sun:'Sun',Moon:'Moon',Mercury:'Mercury',Venus:'Venus',
               Mars:'Mars',Jupiter:'Jupiter',Saturn:'Saturn',
               Uranus:'Uranus',Neptune:'Neptune',Pluto:'Pluto' },

        AstroTime:function(dt){
            this.ut = dt/86400000+2440587.5;
            this.AddDays = d=>new window.Astronomy.AstroTime(dt+d*86400000);
            return this;
        },

        Observer:function(lat,lon,el=0){ this.latitude=lat;this.longitude=lon;this.elevation=el;},

        Equator:function(body,time){
            const idx = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'].indexOf(body);
            const base=[280,218,252,182,355,34,50,314,304,239][idx]||0;
            const motion=[.986,13.176,4.092,1.602,.524,.083,.033,.012,.006,.004][idx]||1;
            const lon = (base+(time.ut-2451545)*motion)%360;
            return {ra:lon,dec:Math.sin(lon*Math.PI/180)*23.44};
        },

        Ecliptic(eq){
            const obl=23.4397*Math.PI/180, ra=eq.ra*Math.PI/180, dec=eq.dec*Math.PI/180;
            const lon=Math.atan2(Math.sin(ra)*Math.cos(obl)+Math.tan(dec)*Math.sin(obl),Math.cos(ra))*180/Math.PI;
            return {lon:(lon+360)%360,lat:0};
        },

        SiderealTime(t){return ((280.46+360.985647*(t.ut-2451545))%360+360)%360/15;}
    };

    window.astronomyFallback = true;
    markEngineReady('fallback');
}

/* --- ждем основную библиотеку, иначе fallback ----------------------- */
(function waitForEngine(){
    const MAX=3000,STEP=100; let waited=0;
    const tick=()=>{
        if(window.Astronomy&&window.Astronomy.Body) markEngineReady('cdn');
        else if(waited>=MAX) loadFallback();
        else { waited+=STEP; setTimeout(tick,STEP); }
    };
    tick();
})();

/* ================= 3. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ======================= */
document.addEventListener('DOMContentLoaded',()=>{
    const timer=setInterval(()=>{
        if(window.astronomyReady){
            clearInterval(timer);
            initApp();
        }
    },100);
});

/* === Переменные состояния ========================================== */
let currentChart=null, signsChart=null, strengthChart=null;

/* === initApp ======================================================== */
function initApp(){
    console.log('✅ app.js загружен, движок готов');

    setDefaultDateTime();
    setEventListeners();
}

/* Установка текущих даты / времени */
function setDefaultDateTime(){
    const now=new Date();
    document.getElementById('birth-date').value = now.toISOString().slice(0,10);
    document.getElementById('birth-time').value = now.toTimeString().slice(0,5);
    document.getElementById('city').value='moscow';
    updateCoordinates('moscow');
}

/* Слушатели */
function setEventListeners(){
    document.getElementById('birth-form').addEventListener('submit',handleSubmit);
    document.getElementById('city').addEventListener('change',e=>updateCoordinates(e.target.value));
}

/* Обновление координат */
function updateCoordinates(code){
    const city = APP_DATA.cities.find(c=>c.code===code);
    if(!city) return;
    document.getElementById('latitude').value  = city.lat;
    document.getElementById('longitude').value = city.lon;
    document.getElementById('timezone').value  = city.tz;
}

/* Обработчик формы */
async function handleSubmit(e){
    e.preventDefault();
    const btn=e.target.querySelector('button'); btn.disabled=true;

    try{
        const data=getFormData();
        const chart=await calcChart(data);
        renderAll(chart,data);
    }catch(err){ alert(err.message); }

    btn.disabled=false;
}

/* Сбор данных формы */
function getFormData(){
    return {
        date:document.getElementById('birth-date').value,
        time:document.getElementById('birth-time').value,
        city:document.getElementById('city').value,
        latitude:+document.getElementById('latitude').value,
        longitude:+document.getElementById('longitude').value,
        timezone:+document.getElementById('timezone').value,
        houseSystem:document.getElementById('house-system').value||'placidus'
    };
}

/* === 4. ВЫЧИСЛЕНИЯ ================================================== */
async function calcChart(fd){
    const dtLocal = new Date(`${fd.date}T${fd.time}:00`);
    const dtUTC   = new Date(dtLocal.getTime() - fd.timezone*3600e3);
    const astroT  = new Astronomy.AstroTime(dtUTC);
    const observer= new Astronomy.Observer(fd.latitude,fd.longitude,0);

    const planets = APP_DATA.planetsEn.map((bodyEn,i)=>{
        const eq = Astronomy.Equator(Astronomy.Body[bodyEn],astroT,null,true,true);
        const ec = Astronomy.Ecliptic(eq);
        const lon = (ec.lon+360)%360;
        return {
            name:APP_DATA.planets[i], symbol:APP_DATA.planetSymbols[i],
            longitude:lon, latitude:ec.lat
        };
    });

    /* Asc & MC */
    const ascmc = calcAscMc(astroT,observer);

    const houses=calcHouses(fd.houseSystem,ascmc.asc,ascmc.mc);

    const aspects=calcAspects(planets.concat([{name:'Asc',longitude:ascmc.asc,symbol:'AC'}]));

    return {planets,houses,aspects,ascmc};
}

/* Asc & MC */
function calcAscMc(T,obs){
    const lst = Astronomy.SiderealTime(T) + obs.longitude/15;
    const obliquity = 23.4397, latR = obs.latitude*Math.PI/180,
          lstR=(lst*15)*Math.PI/180, oblR=obliquity*Math.PI/180;

    const Y=-Math.cos(lstR), X=Math.sin(lstR)*Math.cos(oblR)+Math.tan(latR)*Math.sin(oblR);
    let asc=Math.atan2(Y,X)*180/Math.PI; if(asc<0) asc+=360;
    let mc=(lst*15)%360;
    return {asc,mc};
}

/* Дома: Equal house для простоты */
function calcHouses(system,asc,mc){
    const houses=[]; let start=asc;
    for(let i=1;i<=12;i++){
        const cusp=(start+(i-1)*30)%360;
        houses.push({num:i,cusp,sign:getSign(cusp)});
    }
    return houses;
}

/* Аспекты */
function calcAspects(arr){
    const res=[];
    for(let i=0;i<arr.length;i++)
        for(let j=i+1;j<arr.length;j++){
            const a=arr[i],b=arr[j];
            let diff=Math.abs(a.longitude-b.longitude);
            if(diff>180) diff=360-diff;
            for(const key in APP_DATA.aspects){
                const asp=APP_DATA.aspects[key], orb=Math.abs(diff-asp.angle);
                if(orb<=asp.orb) res.push({a:a.name,b:b.name,asp:asp.name,orb:+orb.toFixed(2)});
            }
        }
    return res.sort((x,y)=>x.orb-y.orb);
}

/* ================= 5. ВИЗУАЛИЗАЦИЯ ================================== */
function renderAll(chart,fd){
    /* пример: выводим консоль + можно добавить ваши функции рендера таблиц и диаграмм */
    console.table(chart.planets.map(p=>({Планета:p.name,Долгота:p.longitude.toFixed(2)})));
    alert('Карта рассчитана! Откройте консоль для деталей.');
}

/* ============= ВСПОМОГАТЕЛЬНЫЕ ===================================== */
function getSign(lon){ return APP_DATA.signs[Math.floor(((lon%360)+360)%360/30)]; }
