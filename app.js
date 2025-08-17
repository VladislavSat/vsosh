window.addEventListener('AstroReady', initApp);

const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const P_NAMES = ['Солнце','Луна','Меркурий','Венера','Марс','Юпитер','Сатурн','Уран','Нептун','Плутон'];
const P_SIGN  = ['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇'];
const SIGNS   = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];
const S_SYMBOL= ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

const CITIES  = {
  moscow: {lat: 55.7558, lon: 37.6176, tz: 3},
  spb:    {lat: 59.9311, lon: 30.3609, tz: 3},
  london: {lat: 51.5074, lon: -0.1278, tz: 0},
  tokyo:  {lat: 35.6762, lon: 139.6503, tz: 9}
};

const id = s => document.getElementById(s);

function initApp(){
  console.log('✅ Astronomy Engine готова (профессиональный режим)');

  // Устанавливаем текущую дату и время
  const now = new Date();
  id('birth-date').value = now.toISOString().slice(0,10);
  id('birth-time').value = now.toTimeString().slice(0,5);
  
  // Устанавливаем Москву по умолчанию
  fillCoords('moscow');

  // Обработчик смены города
  id('city').addEventListener('change', function(e) {
    if(e.target.value === 'custom') {
      id('manual').style.display = 'flex';
    } else {
      id('manual').style.display = 'none';
      fillCoords(e.target.value);
    }
  });

  // Обработчик отправки формы
  id('birth-form').addEventListener('submit', function(e) {
    e.preventDefault();
    try {
      const data = collectForm();
      console.log('📊 Собранные данные:', data);
      const chart = calcChart(data);
      console.log('🔮 Рассчитанная карта:', chart);
      render(chart, data);
    } catch(error) {
      console.error('❌ Ошибка:', error);
      alert('Ошибка расчета: ' + error.message);
    }
  });
}

function fillCoords(cityCode) {
  const city = CITIES[cityCode];
  if (city) {
    id('latitude').value = city.lat;
    id('longitude').value = city.lon;
    id('timezone').value = city.tz;
    console.log(`📍 Координаты установлены для ${cityCode}:`, city);
  }
}

function collectForm() {
  const cityCode = id('city').value;
  let coords;
  
  if (cityCode === 'custom') {
    coords = {
      lat: parseFloat(id('latitude').value),
      lon: parseFloat(id('longitude').value),
      tz: parseFloat(id('timezone').value)
    };
  } else {
    coords = CITIES[cityCode];
  }

  return {
    date: id('birth-date').value,
    time: id('birth-time').value,
    lat: coords.lat,
    lon: coords.lon,
    tz: coords.tz,
    system: id('house-system').value
  };
}

function calcChart(fd) {
  console.log('🧮 Начинаем расчет с данными:', fd);
  
  const local = new Date(`${fd.date}T${fd.time}:00`);
  const utc = new Date(local.getTime() - fd.tz * 3600000);
  const T = new Astronomy.AstroTime(utc);

  console.log('🕐 Время:', {local: local.toString(), utc: utc.toString()});

  // Рассчитываем планеты
  const planets = PLANETS.map((bodyName, i) => {
    const body = Astronomy.Body[bodyName];
    const eq = Astronomy.Equator(body, T, null, true, true);
    const ec = Astronomy.Ecliptic(eq);
    let lon = ec.lon;
    if (lon < 0) lon += 360;
    if (lon >= 360) lon -= 360;

    return {
      name: P_NAMES[i],
      nameEn: bodyName,
      symbol: P_SIGN[i],
      longitude: lon
    };
  });

  // Рассчитываем асцендент
  const lst = Astronomy.SiderealTime(T) + fd.lon / 15.0;
  const latRad = fd.lat * Math.PI / 180;
  const lstRad = lst * 15 * Math.PI / 180;
  const oblRad = 23.4397 * Math.PI / 180;

  const y = -Math.cos(lstRad);
  const x = Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  if (asc < 0) asc += 360;

  // Рассчитываем дома (Equal House)
  const houses = [];
  for (let i = 1; i <= 12; i++) {
    const cusp = (asc + (i - 1) * 30) % 360;
    houses.push({
      number: i,
      cusp: cusp,
      sign: SIGNS[Math.floor(cusp / 30)]
    });
  }

  // Рассчитываем аспекты
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].longitude - planets[j].longitude);
      if (diff > 180) diff = 360 - diff;

      const aspectTypes = [
        {angle: 0, orb: 8, name: 'Соединение', symbol: '☌'},
        {angle: 60, orb: 6, name: 'Секстиль', symbol: '⚹'},
        {angle: 90, orb: 8, name: 'Квадрат', symbol: '□'},
        {angle: 120, orb: 8, name: 'Трин', symbol: '△'},
        {angle: 180, orb: 8, name: 'Оппозиция', symbol: '☍'}
      ];

      aspectTypes.forEach(asp => {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({
            planet1: planets[i].name,
            planet2: planets[j].name,
            type: asp.name,
            symbol: asp.symbol,
            orb: orb.toFixed(1)
          });
        }
      });
    }
  }

  aspects.sort((a, b) => parseFloat(a.orb) - parseFloat(b.orb));

  return { planets, houses, aspects, asc };
}

function render(chart, fd) {
  console.log('🎨 Отображаем результаты');
  
  id('results').classList.remove('hidden');

  // Информация о рождении
  const cityName = id('city').selectedOptions[0].text;
  id('birth-info').innerHTML = `
    <p><strong>📅 Дата:</strong> ${new Date(fd.date).toLocaleDateString('ru-RU')}</p>
    <p><strong>⏰ Время:</strong> ${fd.time}</p>
    <p><strong>🌍 Место:</strong> ${cityName}</p>
    <p><strong>📍 Координаты:</strong> ${fd.lat.toFixed(4)}°, ${fd.lon.toFixed(4)}°</p>
    <p><strong>⌚ Часовой пояс:</strong> UTC${fd.tz >= 0 ? '+' : ''}${fd.tz}</p>
    <p><strong>🏠 Асцендент:</strong> ${chart.asc.toFixed(1)}° (${SIGNS[Math.floor(chart.asc / 30)]})</p>
  `;

  // Таблица планет
  const planetRows = chart.planets.map(p => {
    const signIndex = Math.floor(p.longitude / 30);
    const sign = SIGNS[signIndex];
    const symbol = S_SYMBOL[signIndex];
    const degrees = (p.longitude % 30).toFixed(1);
    return `<tr>
      <td>${p.symbol} ${p.name}</td>
      <td>${symbol} ${sign}</td>
      <td>${degrees}°</td>
    </tr>`;
  }).join('');
  id('planets').innerHTML = `
    <tr><th>Планета</th><th>Знак зодиака</th><th>Позиция</th></tr>
    ${planetRows}
  `;

  // Таблица домов
  const houseRows = chart.houses.map(h => {
    const signIndex = Math.floor(h.cusp / 30);
    const symbol = S_SYMBOL[signIndex];
    const degrees = (h.cusp % 30).toFixed(1);
    return `<tr>
      <td>${h.number}</td>
      <td>${symbol} ${h.sign}</td>
      <td>${degrees}°</td>
    </tr>`;
  }).join('');
  id('houses').innerHTML = `
    <tr><th>Дом</th><th>Знак</th><th>Куспид</th></tr>
    ${houseRows}
  `;

  // Таблица аспектов
  const aspectRows = chart.aspects.slice(0, 15).map(a => {
    return `<tr>
      <td>${a.planet1}</td>
      <td>${a.symbol} ${a.type}</td>
      <td>${a.planet2}</td>
      <td>${a.orb}°</td>
    </tr>`;
  }).join('');
  id('aspects').innerHTML = `
    <tr><th>Планета 1</th><th>Аспект</th><th>Планета 2</th><th>Орб</th></tr>
    ${aspectRows}
  `;

  // Диаграмма
  const signCounts = Array(12).fill(0);
  chart.planets.forEach(p => {
    const signIndex = Math.floor(p.longitude / 30);
    signCounts[signIndex]++;
  });

  new Chart(id('signs-chart'), {
    type: 'doughnut',
    data: {
      labels: SIGNS,
      datasets: [{
        data: signCounts,
        backgroundColor: [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC', '#66BB6A',
          '#FFCA28', '#FF7043', '#8D6E63', '#78909C', '#A1887F', '#90A4AE'
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
          labels: { color: '#fff', boxWidth: 12 }
        }
      }
    }
  });

  console.log('✅ Результаты отображены успешно');
}
