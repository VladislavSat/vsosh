/* app.js – запускается только после события astronomyReady или fallback */
console.log("📦 app.js загружен");

const CITIES={
  moscow:{lat:55.7558,lon:37.6176,tz:3},
  spb:{lat:59.9311,lon:30.3609,tz:3},
  london:{lat:51.5074,lon:-0.1278,tz:0},
  tokyo:{lat:35.6762,lon:139.6503,tz:9}
};
const PLANETS=["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
const NAMES  =["Солнце","Луна","Меркурий","Венера","Марс","Юпитер","Сатурн","Уран","Нептун","Плутон"];
const SYMBOL =["☉","☽","☿","♀","♂","♃","♄","♅","♆","♇"];
const SIGNS  =["Овен","Телец","Близнецы","Рак","Лев","Дева","Весы","Скорпион","Стрелец","Козерог","Водолей","Рыбы"];

let profMode=false;     // true = astronomy-engine доступна

/* ---- запуск только после события ---- */
window.addEventListener("astronomyReady",()=>{profMode=true;start();});
window.addEventListener("astronomyLoadFailed",start);

function start(){
  document.getElementById("status").innerHTML=
    `<div class="${profMode?"success":"warn"}">${profMode?"✅ Профи-библиотека загружена":"⚠️ Переход в упрощённый режим"}</div>`;
  initForm();
}

/* ---- инициализация формы ---- */
function initForm(){
  const d=new Date();
  id("date").value=d.toISOString().slice(0,10);
  id("time").value=d.toTimeString().slice(0,5);
  fillCity("moscow");

  id("city").onchange=e=>{
    if(e.target.value==="custom") qs("#coords").classList.remove("hidden");
    else{ qs("#coords").classList.add("hidden"); fillCity(e.target.value);}
  };

  id("form").onsubmit=e=>{
    e.preventDefault();
    calcChart(getFormData());
  };
}

/* ---- helpers ---- */
const id = s=>document.getElementById(s);
const qs = s=>document.querySelector(s);

function fillCity(code){
  const c=CITIES[code]; if(!c) return;
  id("lat").value=c.lat; id("lon").value=c.lon; id("tz").value=c.tz;
}

function getFormData(){
  const city=id("city").value;
  const c=city==="custom"?{
    lat:+id("lat").value,lon:+id("lon").value,tz:+id("tz").value
  }:CITIES[city];
  return{
    date:id("date").value,
    time:id("time").value,
    ...c,
    housesys:id("housesys").value
  };
}

/* ---- расчёт карты ---- */
function calcChart(fd){
  const local=new Date(`${fd.date}T${fd.time}:00`);
  const utc=new Date(local.getTime()-fd.tz*3600000);

  let planets=[];
  if(profMode){
    const T=new Astronomy.AstroTime(utc);
    planets=PLANETS.map((b,i)=>{
      const eq=Astronomy.Equator(Astronomy.Body[b],T,null,true,true);
      const ec=Astronomy.Ecliptic(eq);
      return {name:NAMES[i],sym:SYMBOL[i],lon:(ec.lon+360)%360};
    });
  }else{
    const jd=utc.getTime()/86400000+2440587.5;
    planets=PLANETS.map((_,i)=>{
      const lon=(jd*13+i*30)%360;
      return {name:NAMES[i],sym:SYMBOL[i],lon};
    });
  }

  render(fd,planets);
}

/* ---- вывод ---- */
function render(fd,pl){
  id("out").classList.remove("hidden");
  id("info").innerHTML=
    `${fd.date} ${fd.time} UTC${fd.tz>=0?"+":""}${fd.tz}<br>
     Lat ${fd.lat}°, Lon ${fd.lon}°<br>
     Режим: ${profMode?"профессиональный":"упрощённый"}`;

  const rows=pl.map(p=>{
    const sign=SIGNS[Math.floor(p.lon/30)];
    const deg=(p.lon%30).toFixed(1);
    return `<tr><td>${p.sym} ${p.name}</td><td>${sign}</td><td>${deg}°</td></tr>`;
  }).join("");
  id("planets").innerHTML="<tr><th>Планета</th><th>Знак</th><th>Позиция</th></tr>"+rows;
}
