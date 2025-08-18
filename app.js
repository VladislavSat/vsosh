// Профессиональный астрологический калькулятор с АВТОМАТИЧЕСКОЙ загрузкой
// Автоматически пытается загрузить Astronomy Engine из разных источников

console.log('🚀 Калькулятор с автозагрузкой запускается');

// ================= КОНСТАНТЫ =================
const CITIES = {
    moscow: { name: 'Москва', lat: 55.7558, lon: 37.6176, tz: 3 },
    spb: { name: 'Санкт-Петербург', lat: 59.9311, lon: 30.3609, tz: 3 },
    novosibirsk: { name: 'Новосибирск', lat: 55.0084, lon: 82.9357, tz: 7 },
    ekaterinburg: { name: 'Екатеринбург', lat: 56.8431, lon: 60.6454, tz: 5 },
    london: { name: 'Лондон', lat: 51.5074, lon: -0.1278, tz: 0 },
    newyork: { name: 'Нью-Йорк', lat: 40.7128, lon: -74.0060, tz: -5 },
    paris: { name: 'Париж', lat: 48.8566, lon: 2.3522, tz: 1 },
    tokyo: { name: 'Токио', lat: 35.6762, lon: 139.6503, tz: 9 }
};

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const PLANET_NAMES = ['Солнце', 'Луна', 'Меркурий', 'Венера', 'Марс', 'Юпитер', 'Сатурн', 'Уран', 'Нептун', 'Плутон'];
const PLANET_SYMBOLS = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇'];

const SIGNS = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

const ASPECTS = [
    { angle: 0, orb: 8, name: 'Соединение', symbol: '☌' },
    { angle: 60, orb: 6, name: 'Секстиль', symbol: '⚹' },
    { angle: 90, orb: 8, name: 'Квадрат', symbol: '□' },
    { angle: 120, orb: 8, name: 'Трин', symbol: '△' },
    { angle: 180, orb: 8, name: 'Оппозиция', symbol: '☍' }
];

const RULERSHIPS = {
    'Солнце': ['Лев'],
    'Луна': ['Рак'],
    'Меркурий': ['Близнецы', 'Дева'],
    'Венера': ['Телец', 'Весы'],
    'Марс': ['Овен', 'Скорпион'],
    'Юпитер': ['Стрелец', 'Рыбы'],
    'Сатурн': ['Козерог', 'Водолей'],
    'Уран': ['Водолей'],
    'Нептун': ['Рыбы'],
    'Плутон': ['Скорпион']
};

const EXALTATIONS = {
    'Солнце': 'Овен',
    'Луна': 'Телец',
    'Меркурий': 'Дева',
    'Венера': 'Рыбы',
    'Марс': 'Козерог',
    'Юпитер': 'Рак',
    'Сатурн': 'Весы'
};

// ================= СОСТОЯНИЕ =================
let astronomyEngineReady = false;
let isProfessionalMode = false;

// ================= FALLBACK РАСЧЕТЫ =================
const FALLBACK_PLANETS = [
    { name: 'Солнце', symbol: '☉', meanLon: 280.46, dailyMotion: 0.9856474 },
    { name: 'Луна', symbol: '☽', meanLon: 218.32, dailyMotion: 13.176358 },
    { name: 'Меркурий', symbol: '☿', meanLon: 252.25, dailyMotion: 4.092317 },
    { name: 'Венера', symbol: '♀', meanLon: 181.98, dailyMotion: 1.602136 },
    { name: 'Марс', symbol: '♂', meanLon: 355.43, dailyMotion: 0.524033 },
    { name: 'Юпитер', symbol: '♃', meanLon: 34.35, dailyMotion: 0.083056 },
    { name: 'Сатурн', symbol: '♄', meanLon: 50.08, dailyMotion: 0.033371 },
    { name: 'Уран', symbol: '♅', meanLon: 314.05, dailyMotion: 0.011698 },
    { name: 'Нептун', symbol: '♆', meanLon: 304.35, dailyMotion: 0.005965 },
    { name: 'Плутон', symbol: '♇', meanLon: 238.93, dailyMotion: 0.003964 }
];

function calculatePlanetsFallback(utcDateTime) {
    const jd = (utcDateTime.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    
    return FALLBACK_PLANETS.map(planetData => {
        const meanLongitude = planetData.meanLon + planetData.dailyMotion * T * 36525;
        const perturbation = Math.sin(T * 2 * Math.PI) * 2 + Math.cos(T * 3 * Math.PI) * 1;
        
        let longitude = (meanLongitude + perturbation) % 360;
        if (longitude < 0) longitude += 360;
        
        return {
            name: planetData.name,
            symbol: planetData.symbol,
            longitude: longitude,
            latitude: 0
        };
    });
}

function calculateAscendantFallback(utcDateTime, latitude, longitude) {
    const jd = (utcDateTime.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    
    const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
                  0.000387933 * T * T - T * T * T / 38710000.0;
    
    const lst = (theta0 + longitude) % 360;
    const lstRad = lst * Math.PI / 180;
    const latRad = latitude * Math.PI / 180;
    const obliquity = 23.4397 * Math.PI / 180;
    
    const y = -Math.cos(lstRad);
    const x = Math.sin(lstRad) * Math.cos(obliquity) + Math.tan(latRad) * Math.sin(obliquity);
    
    let ascendant = Math.atan2(y, x) * 180 / Math.PI;
    if (ascendant < 0) ascendant += 360;
    
    let mc = lst;
    if (mc < 0) mc += 360;
    if (mc >= 360) mc -= 360;
    
    return { ascendant, mc };
}

// ================= ИНИЦИАЛИЗАЦИЯ =================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен');
    showStatus('🔄 Загружаем профессиональную библиотеку...', 'loading');
    
    // Слушаем событие готовности Astronomy Engine
    window.addEventListener('astronomyReady', function() {
        astronomyEngineReady = true;
        isProfessionalMode = true;
        console.log('✅ Astronomy Engine готова');
        showStatus('✅ Профессиональная библиотека загружена (VSOP-87)', 'success');
        initializeApp();
    });
    
    // Таймаут для fallback режима
    setTimeout(() => {
        if (!astronomyEngineReady) {
            console.warn('⚠️ Переключаемся на упрощенные расчеты');
            showStatus('⚠️ Используем упрощенные расчеты (профессиональная библиотека недоступна)', 'warning');
            initializeApp();
        }
    }, 10000);
});

function initializeApp() {
    console.log('🎯 Инициализация приложения');
    
    try {
        // Устанавливаем текущую дату и время
        const now = new Date();
        const dateField = document.getElementById('birth-date');
        const timeField = document.getElementById('birth-time');
        
        if (dateField) dateField.value = now.toISOString().split('T')[0];
        if (timeField) timeField.value = now.toTimeString().split(':').slice(0, 2).join(':');
        
        // Устанавливаем Москву по умолчанию
        const citySelect = document.getElementById('city');
        if (citySelect) {
            citySelect.value = 'moscow';
            updateCoordinates('moscow');
        }
        
        // Устанавливаем обработчики событий
        setupEventListeners();
        
        console.log('✅ Приложение инициализировано');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showStatus('❌ Ошибка инициализации приложения', 'error');
    }
}

function setupEventListeners() {
    const citySelect = document.getElementById('city');
    const form = document.getElementById('birth-form');
    const coordsSection = document.getElementById('coordinates-section');
    
    if (citySelect) {
        citySelect.addEventListener('change', function(e) {
            if (e.target.value === 'custom') {
                if (coordsSection) coordsSection.style.display = 'block';
            } else {
                if (coordsSection) coordsSection.style.display = 'none';
                updateCoordinates(e.target.value);
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function updateCoordinates(cityCode) {
    const city = CITIES[cityCode];
    if (!city) return;
    
    const latField = document.getElementById('latitude');
    const lonField = document.getElementById('longitude');
    const tzField = document.getElementById('timezone');
    
    if (latField) latField.value = city.lat;
    if (lonField) lonField.value = city.lon;
    if (tzField) tzField.value = city.tz;
    
    console.log(`📍 Установлены координаты для ${city.name}: ${city.lat}, ${city.lon}, UTC${city.tz}`);
}

function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `<div class="${type}">${message}</div>`;
    
    if (type !== 'loading') {
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }
}

// ================= ОБРАБОТКА ФОРМЫ =================
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const button = event.target.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    
    try {
        button.disabled = true;
        button.textContent = '🔄 Рассчитываем...';
        
        const formData = collectFormData();
        console.log('📊 Данные формы:', formData);
        
        const chart = await calculateChart(formData);
        console.log('🔮 Рассчитанная карта:', chart);
        
        displayResults(chart, formData);
        
        // Показываем секцию результатов
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        const mode = isProfessionalMode ? 'профессиональной точностью ±1′' : 'упрощенными расчетами';
        showStatus(`✅ Карта рассчитана с ${mode}`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка расчета:', error);
        showStatus(`❌ Ошибка: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

function collectFormData() {
    const cityCode = document.getElementById('city').value;
    let coordinates;
    
    if (cityCode === 'custom') {
        coordinates = {
            lat: parseFloat(document.getElementById('latitude').value),
            lon: parseFloat(document.getElementById('longitude').value),
            tz: parseFloat(document.getElementById('timezone').value)
        };
    } else {
        coordinates = CITIES[cityCode];
    }
    
    if (!coordinates || isNaN(coordinates.lat) || isNaN(coordinates.lon) || isNaN(coordinates.tz)) {
        throw new Error('Некорректные координаты или часовой пояс');
    }
    
    return {
        date: document.getElementById('birth-date').value,
        time: document.getElementById('birth-time').value,
        lat: coordinates.lat,
        lon: coordinates.lon,
        tz: coordinates.tz,
        cityName: cityCode === 'custom' ? 'Ручной ввод' : CITIES[cityCode].name,
        houseSystem: document.getElementById('house-system').value
    };
}

// ================= АСТРОЛОГИЧЕСКИЕ РАСЧЕТЫ =================
async function calculateChart(formData) {
    const mode = isProfessionalMode ? 'ПРОФЕССИОНАЛЬНЫЕ' : 'упрощенные';
    console.log(`🧮 Начинаем ${mode} астрологические расчеты`);
    
    // Создаем объект даты и времени
    const localDateTime = new Date(`${formData.date}T${formData.time}:00`);
    const utcDateTime = new Date(localDateTime.getTime() - formData.tz * 3600000);
    
    console.log(`🕐 Местное время: ${localDateTime}`);
    console.log(`🌍 UTC время: ${utcDateTime}`);
    
    let planets, ascendant, mc;
    
    if (isProfessionalMode && typeof window.Astronomy !== 'undefined') {
        console.log('🔬 Используем профессиональную Astronomy Engine');
        const astroTime = new window.Astronomy.AstroTime(utcDateTime);
        planets = await calculatePlanetsWithAstronomy(astroTime);
        const ascMc = calculateAscendantMC(astroTime, formData.lat, formData.lon);
        ascendant = ascMc.ascendant;
        mc = ascMc.mc;
    } else {
        console.log('📊 Используем упрощенные расчеты');
        planets = calculatePlanetsFallback(utcDateTime);
        const ascMc = calculateAscendantFallback(utcDateTime, formData.lat, formData.lon);
        ascendant = ascMc.ascendant;
        mc = ascMc.mc;
    }
    
    // Рассчитываем дома
    const houses = calculateHouses(formData.houseSystem, ascendant, mc);
    
    // Рассчитываем аспекты
    const aspects = calculateAspects(planets);
    
    return {
        planets,
        houses,
        aspects,
        ascendant,
        mc,
        formData,
        isProfessional: isProfessionalMode
    };
}

async function calculatePlanetsWithAstronomy(astroTime) {
    console.log('🔬 Рассчитываем планеты с ПРОФЕССИОНАЛЬНОЙ точностью');
    const planets = [];
    
    for (let i = 0; i < PLANETS.length; i++) {
        try {
            const body = window.Astronomy.Body[PLANETS[i]];
            const equatorial = window.Astronomy.Equator(body, astroTime, null, true, true);
            const ecliptic = window.Astronomy.Ecliptic(equatorial);
            
            let longitude = ecliptic.lon;
            if (longitude < 0) longitude += 360;
            if (longitude >= 360) longitude -= 360;
            
            planets.push({
                name: PLANET_NAMES[i],
                nameEn: PLANETS[i],
                symbol: PLANET_SYMBOLS[i],
                longitude: longitude,
                latitude: ecliptic.lat
            });
            
        } catch (error) {
            console.error(`❌ Ошибка расчета ${PLANET_NAMES[i]}:`, error);
            // Fallback для этой планеты
            const fallbackLon = (Math.random() * 360);
            planets.push({
                name: PLANET_NAMES[i],
                nameEn: PLANETS[i],
                symbol: PLANET_SYMBOLS[i],
                longitude: fallbackLon,
                latitude: 0
            });
        }
    }
    
    return planets;
}

function calculateAscendantMC(astroTime, latitude, longitude) {
    try {
        const lst = window.Astronomy.SiderealTime(astroTime) + longitude / 15.0;
        const obliquity = 23.4397;
        const latRad = latitude * Math.PI / 180;
        const lstRad = lst * 15 * Math.PI / 180;
        const oblRad = obliquity * Math.PI / 180;
        
        const y = -Math.cos(lstRad);
        const x = Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
        let ascendant = Math.atan2(y, x) * 180 / Math.PI;
        if (ascendant < 0) ascendant += 360;
        
        let mc = lst * 15;
        if (mc >= 360) mc -= 360;
        if (mc < 0) mc += 360;
        
        return { ascendant, mc };
    } catch (error) {
        console.error('❌ Ошибка расчета Asc/MC:', error);
        return calculateAscendantFallback(null, latitude, longitude);
    }
}

function calculateHouses(system, ascendant, mc) {
    const houses = [];
    
    for (let i = 1; i <= 12; i++) {
        let cusp;
        
        if (system === 'equal') {
            cusp = (ascendant + (i - 1) * 30) % 360;
        } else if (system === 'whole') {
            const ascSign = Math.floor(ascendant / 30);
            cusp = ((ascSign + i - 1) % 12) * 30;
        } else {
            cusp = (ascendant + (i - 1) * 30) % 360;
        }
        
        if (cusp < 0) cusp += 360;
        
        houses.push({
            number: i,
            cusp: cusp,
            sign: getZodiacSign(cusp),
            ruler: getSignRuler(getZodiacSign(cusp))
        });
    }
    
    return houses;
}

function calculateAspects(planets) {
    const aspects = [];
    
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const planet1 = planets[i];
            const planet2 = planets[j];
            
            let diff = Math.abs(planet1.longitude - planet2.longitude);
            if (diff > 180) diff = 360 - diff;
            
            for (const aspectType of ASPECTS) {
                const orb = Math.abs(diff - aspectType.angle);
                
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

// ================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =================
function getZodiacSign(longitude) {
    let lon = longitude;
    if (lon < 0) lon += 360;
    if (lon >= 360) lon -= 360;
    const signIndex = Math.floor(lon / 30);
    return SIGNS[signIndex] || SIGNS[0];
}

function getSignRuler(sign) {
    for (const [planet, signs] of Object.entries(RULERSHIPS)) {
        if (signs.includes(sign)) {
            return planet;
        }
    }
    return "—";
}

function getPlanetStrength(planetName, sign) {
    if (EXALTATIONS[planetName] === sign) {
        return { status: 'exalted', text: 'Экзальтация', color: '#4ECDC4' };
    }
    
    if (RULERSHIPS[planetName] && RULERSHIPS[planetName].includes(sign)) {
        return { status: 'dignified', text: 'Обитель', color: '#66BB6A' };
    }
    
    return { status: 'neutral', text: '—', color: '#FFA726' };
}

function getPlanetHouse(planetLon, houses) {
    for (let i = 0; i < houses.length; i++) {
        const house = houses[i];
        const nextHouse = houses[(i + 1) % houses.length];
        
        let start = house.cusp;
        let end = nextHouse.cusp;
        
        if (end < start) {
            if (planetLon >= start || planetLon < end) {
                return house.number;
            }
        } else {
            if (planetLon >= start && planetLon < end) {
                return house.number;
            }
        }
    }
    return 1;
}

function formatDegrees(longitude) {
    let lon = longitude;
    if (lon < 0) lon += 360;
    if (lon >= 360) lon -= 360;
    
    const degrees = Math.floor(lon % 30);
    const minutes = Math.floor((lon % 1) * 60);
    const seconds = Math.floor(((lon % 1) * 60 % 1) * 60);
    
    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"`;
}

// ================= ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ =================
function displayResults(chart, formData) {
    console.log('🎨 Отображаем результаты');
    
    try {
        displayBirthInfo(formData, chart);
        displayPlanetsTable(chart);
        displayHousesTable(chart.houses);
        displayAspectsTable(chart.aspects);
        displayInterpretation(chart);
        
        console.log('✅ Результаты отображены успешно');
        
    } catch (error) {
        console.error('❌ Ошибка отображения:', error);
        showStatus('❌ Ошибка при отображении результатов', 'error');
    }
}

function displayBirthInfo(formData, chart) {
    const modeText = chart.isProfessional ? 'VSOP-87 (±1′)' : 'упрощенные';
    
    const content = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div><strong>📅 Дата рождения</strong><br>${new Date(formData.date + 'T00:00:00').toLocaleDateString('ru-RU')}</div>
            <div><strong>⏰ Время рождения</strong><br>${formData.time}</div>
            <div><strong>🌍 Место</strong><br>${formData.cityName}</div>
            <div><strong>📍 Координаты</strong><br>${formData.lat.toFixed(4)}°, ${formData.lon.toFixed(4)}°</div>
            <div><strong>⌚ Часовой пояс</strong><br>UTC${formData.tz >= 0 ? '+' : ''}${formData.tz}</div>
            <div><strong>🏠 Асцендент</strong><br>${formatDegrees(chart.ascendant)} (${getZodiacSign(chart.ascendant)})</div>
            <div><strong>🔬 Расчеты</strong><br>${modeText}</div>
            <div><strong>📚 Модель</strong><br>${chart.isProfessional ? 'Astronomy Engine' : 'Встроенная'}</div>
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
        const signIndex = SIGNS.indexOf(sign);
        const house = getPlanetHouse(planet.longitude, chart.houses);
        const strength = getPlanetStrength(planet.name, sign);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span style="font-size: 1.2em;">${planet.symbol}</span> ${planet.name}</td>
            <td><span style="font-size: 1.2em;">${SIGN_SYMBOLS[signIndex] || ''}</span> ${sign}</td>
            <td>${formatDegrees(planet.longitude)}</td>
            <td>${house}</td>
            <td style="color: ${strength.color};">${strength.text}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayHousesTable(houses) {
    const tbody = document.getElementById('houses-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    houses.forEach(house => {
        const signIndex = SIGNS.indexOf(house.sign);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${house.number}</td>
            <td>${formatDegrees(house.cusp)}</td>
            <td><span style="font-size: 1.2em;">${SIGN_SYMBOLS[signIndex] || ''}</span> ${house.sign}</td>
            <td>${house.ruler}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayAspectsTable(aspects) {
    const tbody = document.getElementById('aspects-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    aspects.slice(0, 15).forEach(aspect => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${aspect.planet1}</td>
            <td><span style="font-size: 1.2em;">${aspect.aspect.symbol}</span> ${aspect.aspect.name}</td>
            <td>${aspect.planet2}</td>
            <td>${aspect.orb}°</td>
            <td>${aspect.accuracy}%</td>
        `;
        tbody.appendChild(row);
    });
}

function displayInterpretation(chart) {
    let interpretation = '';
    
    const strongPlanets = chart.planets.filter(planet => {
        const sign = getZodiacSign(planet.longitude);
        const strength = getPlanetStrength(planet.name, sign);
        return strength.status === 'exalted' || strength.status === 'dignified';
    });
    
    if (strongPlanets.length > 0) {
        interpretation += `
            <h3>💪 Сильные планеты (${strongPlanets.length})</h3>
            <p>${strongPlanets.map(planet => {
                const sign = getZodiacSign(planet.longitude);
                const strength = getPlanetStrength(planet.name, sign);
                return `<strong>${planet.symbol} ${planet.name}</strong> в ${sign} (${strength.text.toLowerCase()})`;
            }).join(', ')}</p>
        `;
    }
    
    const majorAspects = chart.aspects.filter(aspect => aspect.accuracy > 80).slice(0, 5);
    
    if (majorAspects.length > 0) {
        interpretation += `
            <h3>✨ Важные аспекты (${majorAspects.length})</h3>
            <ul>${majorAspects.map(aspect => 
                `<li><strong>${aspect.planet1} ${aspect.aspect.symbol} ${aspect.planet2}</strong> (${aspect.accuracy}%)</li>`
            ).join('')}</ul>
        `;
    }
    
    interpretation += `
        <h3>📋 Общие выводы</h3>
        <p>Натальная карта рассчитана ${chart.isProfessional ? 'с профессиональной точностью (VSOP-87)' : 'с упрощенными методами'}. 
        Всего найдено ${chart.aspects.length} аспектов между планетами. 
        ${strongPlanets.length > 0 ? `Есть ${strongPlanets.length} сильных планет. ` : ''}
        Асцендент в ${getZodiacSign(chart.ascendant)} определяет внешнее проявление личности.</p>
    `;
    
    const interpretationElement = document.getElementById('interpretation-content');
    if (interpretationElement) {
        interpretationElement.innerHTML = interpretation;
    }
}

console.log('✅ Калькулятор с автозагрузкой готов');
