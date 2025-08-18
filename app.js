/*****  app.js  *****/
console.log('📦 app.js подключён');

// > Список городов
const CITY={moscow:{lat:55.7558,lon:37.6176,tz:3},
            spb:{lat:59.9311,lon:30.3609,tz:3},
            london:{lat:51.5074,lon:-0.1278,tz:0},
            tokyo:{lat:35.6762,lon:139.6503,tz:9}};
const PLAN=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const PNAME=['Солнце','Луна','Меркурий','Венера','Марс','Юпитер','Сатурн','Уран','Нептун','Плутон'];
const PSYM =['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇'];
const SIGN =['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];

let PRO=false;               // true если Astronomy Engine доступна

window.addEventListener('astronomyReady',()=>{PRO=true;boot('Профессиональный режим активирован','ok');});
window.addEventListener('astronomyLoadFailed',()=>boot('Переход на упрощённый режим','warn'));

function boot(msg,cls){
  stat(msg,cls);
  initForm();
}
function stat(m,c){const el=id('stat');el.className='stat '+c;el.textContent=m;}
const id=s=>document.getElementById(s);

// ---------- Форма ----------
function initForm(){
  const d=new Date();
  id('d').value=d.toISOString().slice(0,10);
  id('t').value=d.toTimeString().slice(0,5);
  setCity('moscow');

  id('city').onchange=e=>{
    e.target.value==='custom'?id('coord').classList.remove('hidden')
                              : (id('coord').classList.add('hidden'),setCity(e.target.value));
  };
  id('frm').onsubmit=e=>{
    e.preventDefault();
    calc(getData());
  };
}

function setCity(code){const c=CITY[code]; if(!c)return;
  id('lat').value=c.lat; id('lon').value=c.lon; id('tz').value=c.tz;
}
function getData(){
  const city=id('city').value;
  const c=city==='custom'?{lat:+id('lat').value,lon:+id('lon').value,tz:+id('tz').value}:CITY[city];
  return {date:id('d').value,time:id('t').value,...c};
}

// ---------- Расчёт ----------
function calc(fd){
  const local=new Date(`${fd.date}T${fd.time}:00`);
  const utc=new Date(local.getTime()-fd.tz*3600000);
  let planets=[];

  if(PRO){
    const T=new Astronomy.AstroTime(utc);
    planets=PLAN.map((b,i)=>{
      const ecl=Astronomy.Ecliptic(Astronomy.Equator(Astronomy.Body[b],T,null,true,true));
      return {name:PNAME[i],sym:PSYM[i],lon:(ecl.lon+360)%360};
    });
  }else{
    const jd=utc/86400000+2440587.5;
    planets=PLAN.map((_,i)=>({name:PNAME[i],sym:PSYM[i],lon:(jd*10+i*30)%360}));
  }

  render(fd,planets);
}

// ---------- Вывод ----------
function render(fd,pl){
  id('res').classList.remove('hidden');
  id('info').innerHTML=`${fd.date} ${fd.time} UTC${fd.tz>=0?'+':''}${fd.tz}<br>
                        Lat ${fd.lat}°, Lon ${fd.lon}°<br>
                        Режим: ${PRO?'профессиональный':'упрощённый'}`;

  id('tbl').innerHTML='<tr><th>Планета</th><th>Знак</th><th>°</th></tr>'+
    pl.map(p=>{
      const s=SIGN[Math.floor(p.lon/30)],d=(p.lon%30).toFixed(1);
      return `<tr><td>${p.sym} ${p.name}</td><td>${s}</td><td>${d}</td></tr>`;
    }).join('');
}
