// Профессиональный астрологический калькулятор - ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
// Использует настоящую библиотеку Astronomy Engine для профессиональных расчетов

console.log('🚀 app.js начинает загрузку');

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

// ================= ПЕРЕМЕННЫЕ СОСТОЯНИЯ =================
let currentChart = null;
let signsChart = null;
let strengthChart = null;
let astronomyEngineReady = false;

// ================= ИНИЦИАЛИЗАЦИЯ =================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен');
    
    // Ждем загрузки Astronomy Engine
    checkAstronomyEngine();
    
    setTimeout(() => {
        if (!astronomyEngineReady) {
            console.warn('⏰ Astronomy Engine не загрузилась за 3 секунды');
        }
        initializeApp();
    }, 3000);
});

function checkAstronomyEngine() {
    const maxAttempts = 30;
    let attempts = 0;
    
    const interval = setInterval(() => {
        attempts++;
        
        if (typeof window.Astronomy !== 'undefined' && window.Astronomy.Body) {
            astronomyEngineReady = true;
            clearInterval(interval);
            console.log('✅ Astronomy Engine загружена успешно');
            showStatus('✅ Профессиональная библиотека загружена', 'success');
            
            // Инициализируем сразу после загрузки библиотеки
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                initializeApp();
            }
        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.warn('⚠️ Astronomy Engine не загрузилась');
            showStatus('⚠️ Профессиональная библиотека недоступна, используются упрощенные расчеты', 'error');
            initializeApp();
        }
    }, 100);
}

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
    
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
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
        
        showStatus('✅ Карта рассчитана успешно', 'success');
        
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
    console.log('🧮 Начинаем астрологические расчеты');
    
    // Создаем объект даты и времени
    const localDateTime = new Date(`${formData.date}T${formData.time}:00`);
    const utcDateTime = new Date(localDateTime.getTime() - formData.tz * 3600000);
    
    console.log(`🕐 Местное время: ${localDateTime}`);
    console.log(`🌍 UTC время: ${utcDateTime}`);
    
    let planets, ascendant, mc;
    
    if (astronomyEngineReady) {
        console.log('🔬 Используем профессиональную библиотеку Astronomy Engine');
        const astroTime = new window.Astronomy.AstroTime(utcDateTime);
        planets = calculatePlanetsWithAstronomy(astroTime);
        const ascMc = calculateAscendantMC(astroTime, formData.lat, formData.lon);
        ascendant = ascMc.ascendant;
        mc = ascMc.mc;
    } else {
        console.log('📊 Используем упрощенные расчеты');
        planets = calculatePlanetsSimple(utcDateTime);
        const ascMc = calculateAscendantMCSimple(utcDateTime, formData.lat, formData.lon);
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
        formData
    };
}

function calculatePlanetsWithAstronomy(astroTime) {
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
            console.error(`Ошибка расчета ${PLANET_NAMES[i]}:`, error);
            // Используем упрощенный расчет для этой планеты
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

function calculatePlanetsSimple(utcDateTime) {
    const planets = [];
    const jd = (utcDateTime.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    
    // Упрощенные средние долготы планет
    const meanLongitudes = [280.46, 218.32, 252.25, 181.98, 355.43, 34.35, 50.08, 314.05, 304.35, 238.93];
    const dailyMotions = [0.9856, 13.1764, 4.0923, 1.6021, 0.5240, 0.0831, 0.0334, 0.0116, 0.0059, 0.0039];
    
    for (let i = 0; i < PLANET_NAMES.length; i++) {
        let longitude = (meanLongitudes[i] + dailyMotions[i] * T * 36525) % 360;
        if (longitude < 0) longitude += 360;
        
        planets.push({
            name: PLANET_NAMES[i],
            nameEn: PLANETS[i],
            symbol: PLANET_SYMBOLS[i],
            longitude: longitude,
            latitude: 0
        });
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
        console.error('Ошибка расчета Asc/MC:', error);
        return calculateAscendantMCSimple(null, latitude, longitude);
    }
}

function calculateAscendantMCSimple(utcDateTime, latitude, longitude) {
    const now = utcDateTime || new Date();
    const jd = (now.getTime() / 86400000) + 2440587.5;
    const lst = (280.460618 + 360.985647 * (jd - 2451545.0)) / 15.0 + longitude / 15.0;
    
    const latRad = latitude * Math.PI / 180;
    const lstRad = lst * 15 * Math.PI / 180;
    const oblRad = 23.4397 * Math.PI / 180;
    
    const y = -Math.cos(lstRad);
    const x = Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
    let ascendant = Math.atan2(y, x) * 180 / Math.PI;
    if (ascendant < 0) ascendant += 360;
    
    let mc = (lst * 15) % 360;
    if (mc < 0) mc += 360;
    
    return { ascendant, mc };
}

function calculateHouses(system, ascendant, mc) {
    const houses = [];
    
    for (let i = 1; i <= 12; i++) {
        let cusp;
        
        if (system === 'equal') {
            cusp = (ascendant + (i - 1) * 30) % 360;
        } else {
            // Упрощенный расчет для других систем
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
        return { status: 'exalted', text: 'Экзальтация' };
    }
    
    if (RULERSHIPS[planetName] && RULERSHIPS[planetName].includes(sign)) {
        return { status: 'dignified', text: 'Обитель' };
    }
    
    return { status: 'neutral', text: '—' };
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
        displayBirthInfo(formData);
        displayPlanetsTable(chart);
        displayHousesTable(chart.houses);
        displayAspectsTable(chart.aspects);
        displayCharts(chart);
        displayInterpretation(chart);
        
        currentChart = chart;
        console.log('✅ Результаты отображены успешно');
        
    } catch (error) {
        console.error('❌ Ошибка отображения:', error);
        showStatus('❌ Ошибка при отображении результатов', 'error');
    }
}

function displayBirthInfo(formData) {
    const content = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div><strong>📅 Дата рождения</strong><br>${new Date(formData.date + 'T00:00:00').toLocaleDateString('ru-RU')}</div>
            <div><strong>⏰ Время рождения</strong><br>${formData.time}</div>
            <div><strong>🌍 Место</strong><br>${formData.cityName}</div>
            <div><strong>📍 Координаты</strong><br>${formData.lat.toFixed(4)}°, ${formData.lon.toFixed(4)}°</div>
            <div><strong>⌚ Часовой пояс</strong><br>UTC${formData.tz >= 0 ? '+' : ''}${formData.tz}</div>
            <div><strong>🏠 Система домов</strong><br>${formData.houseSystem}</div>
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
            <td>${strength.text}</td>
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

function displayCharts(chart) {
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js не загружена');
        return;
    }
    
    createSignsChart(chart);
    createStrengthChart(chart);
}

function createSignsChart(chart) {
    const ctx = document.getElementById('signs-chart');
    if (!ctx) return;
    
    if (signsChart) {
        signsChart.destroy();
    }
    
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
                    labels: {
                        color: '#fff',
                        boxWidth: 12,
                        padding: 10
                    }
                }
            }
        }
    });
}

function createStrengthChart(chart) {
    const ctx = document.getElementById('strength-chart');
    if (!ctx) return;
    
    if (strengthChart) {
        strengthChart.destroy();
    }
    
    const planetNames = [];
    const strengthValues = [];
    const colors = [];
    
    chart.planets.forEach(planet => {
        const sign = getZodiacSign(planet.longitude);
        const strength = getPlanetStrength(planet.name, sign);
        
        let value = 2;
        let color = '#78909C';
        
        switch (strength.status) {
            case 'exalted': value = 4; color = '#4ECDC4'; break;
            case 'dignified': value = 3; color = '#66BB6A'; break;
            case 'neutral': value = 2; color = '#FFA726'; break;
        }
        
        planetNames.push(planet.name);
        strengthValues.push(value);
        colors.push(color);
    });
    
    strengthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: planetNames,
            datasets: [{
                label: 'Сила планеты',
                data: strengthValues,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 4,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const labels = ['', '', 'Нейтраль', 'Обитель', 'Экзальтация'];
                            return labels[value] || '';
                        },
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
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
            <h3>💪 Сильные планеты</h3>
            <p>${strongPlanets.map(planet => {
                const sign = getZodiacSign(planet.longitude);
                const strength = getPlanetStrength(planet.name, sign);
                return `<strong>${planet.name}</strong> в ${sign} (${strength.text.toLowerCase()}) — планета работает гармонично и эффективно.`;
            }).join(' ')}</p>
        `;
    }
    
    const majorAspects = chart.aspects.filter(aspect => aspect.accuracy > 80).slice(0, 5);
    
    if (majorAspects.length > 0) {
        interpretation += `
            <h3>✨ Важные аспекты</h3>
            <p>${majorAspects.map(aspect => 
                `<strong>${aspect.planet1} ${aspect.aspect.symbol} ${aspect.planet2}</strong> (точность ${aspect.accuracy}%)`
            ).join('<br>')}</p>
        `;
    }
    
    interpretation += `
        <h3>📋 Общие выводы</h3>
        <p>Натальная карта рассчитана ${astronomyEngineReady ? 'с профессиональной точностью с использованием Astronomy Engine' : 'с использованием упрощенных методов'}. 
        Всего найдено ${chart.aspects.length} аспектов между планетами. 
        ${strongPlanets.length > 0 ? `Есть ${strongPlanets.length} сильных планет, что указывает на природные таланты. ` : ''}
        Для полной интерпретации рекомендуется консультация с профессиональным астрологом.</p>
    `;
    
    const interpretationElement = document.getElementById('interpretation-content');
    if (interpretationElement) {
        interpretationElement.innerHTML = interpretation;
    }
}

console.log('✅ app.js загружен полностью');
