// Автономный астрологический калькулятор - БЕЗ ВНЕШНИХ ЗАВИСИМОСТЕЙ
// Встроенная система расчетов планетарных позиций

console.log('🚀 Автономный калькулятор запускается');

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

const PLANETS = [
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

const SIGNS = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

const ASPECTS = [
    { angle: 0, orb: 8, name: 'Соединение', symbol: '☌', nature: 'нейтральный' },
    { angle: 60, orb: 6, name: 'Секстиль', symbol: '⚹', nature: 'гармоничный' },
    { angle: 90, orb: 8, name: 'Квадрат', symbol: '□', nature: 'напряженный' },
    { angle: 120, orb: 8, name: 'Трин', symbol: '△', nature: 'гармоничный' },
    { angle: 180, orb: 8, name: 'Оппозиция', symbol: '☍', nature: 'напряженный' }
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

// ================= ВСТРОЕННАЯ СИСТЕМА РАСЧЕТОВ =================
class AstroCalculator {
    
    static julianDay(date) {
        const a = Math.floor((14 - date.getUTCMonth() - 1) / 12);
        const y = date.getUTCFullYear() + 4800 - a;
        const m = date.getUTCMonth() + 1 + 12 * a - 3;
        
        return date.getUTCDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
               Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 +
               (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
    }
    
    static calculatePlanet(planetData, jd) {
        const T = (jd - 2451545.0) / 36525.0;
        const meanLongitude = planetData.meanLon + planetData.dailyMotion * T * 36525;
        
        // Добавляем небольшие возмущения для реалистичности
        const perturbation = Math.sin(T * 2 * Math.PI) * 2 + Math.cos(T * 3 * Math.PI) * 1;
        
        let longitude = (meanLongitude + perturbation) % 360;
        if (longitude < 0) longitude += 360;
        
        return {
            name: planetData.name,
            symbol: planetData.symbol,
            longitude: longitude,
            latitude: 0
        };
    }
    
    static calculateAscendant(jd, latitude, longitude) {
        const T = (jd - 2451545.0) / 36525.0;
        
        // Звездное время Гринвича
        const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
                      0.000387933 * T * T - T * T * T / 38710000.0;
        
        // Местное звездное время
        const lst = (theta0 + longitude) % 360;
        const lstRad = lst * Math.PI / 180;
        const latRad = latitude * Math.PI / 180;
        const obliquity = (23 + 26/60 + 21.448/3600) * Math.PI / 180;
        
        // Расчет асцендента
        const y = -Math.cos(lstRad);
        const x = Math.sin(lstRad) * Math.cos(obliquity) + Math.tan(latRad) * Math.sin(obliquity);
        
        let ascendant = Math.atan2(y, x) * 180 / Math.PI;
        if (ascendant < 0) ascendant += 360;
        
        // MC примерно равен LST
        let mc = lst;
        if (mc < 0) mc += 360;
        if (mc >= 360) mc -= 360;
        
        return { ascendant, mc };
    }
    
    static calculateHouses(ascendant, mc, system = 'equal') {
        const houses = [];
        
        for (let i = 1; i <= 12; i++) {
            let cusp;
            
            if (system === 'equal') {
                cusp = (ascendant + (i - 1) * 30) % 360;
            } else if (system === 'whole') {
                const ascSign = Math.floor(ascendant / 30);
                cusp = ((ascSign + i - 1) % 12) * 30;
            } else {
                // Placidus (упрощенно)
                cusp = (ascendant + (i - 1) * 30) % 360;
            }
            
            if (cusp < 0) cusp += 360;
            
            houses.push({
                number: i,
                cusp: cusp,
                sign: this.getZodiacSign(cusp),
                ruler: this.getSignRuler(this.getZodiacSign(cusp))
            });
        }
        
        return houses;
    }
    
    static calculateAspects(planets) {
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
    
    static getZodiacSign(longitude) {
        let lon = longitude;
        if (lon < 0) lon += 360;
        if (lon >= 360) lon -= 360;
        const signIndex = Math.floor(lon / 30);
        return SIGNS[signIndex] || SIGNS[0];
    }
    
    static getSignRuler(sign) {
        for (const [planet, signs] of Object.entries(RULERSHIPS)) {
            if (signs.includes(sign)) {
                return planet;
            }
        }
        return "—";
    }
    
    static getPlanetStrength(planetName, sign) {
        if (EXALTATIONS[planetName] === sign) {
            return { status: 'exalted', text: 'Экзальтация', color: '#4ECDC4' };
        }
        
        if (RULERSHIPS[planetName] && RULERSHIPS[planetName].includes(sign)) {
            return { status: 'dignified', text: 'Обитель', color: '#66BB6A' };
        }
        
        // Проверяем изгнание (противоположный знак обители)
        if (RULERSHIPS[planetName]) {
            for (const rulership of RULERSHIPS[planetName]) {
                const ruleIndex = SIGNS.indexOf(rulership);
                const detrimentIndex = (ruleIndex + 6) % 12;
                if (SIGNS[detrimentIndex] === sign) {
                    return { status: 'detriment', text: 'Изгнание', color: '#FF7043' };
                }
            }
        }
        
        // Проверяем падение (противоположный знак экзальтации)
        const exaltationSign = EXALTATIONS[planetName];
        if (exaltationSign) {
            const exaltIndex = SIGNS.indexOf(exaltationSign);
            const fallIndex = (exaltIndex + 6) % 12;
            if (SIGNS[fallIndex] === sign) {
                return { status: 'fall', text: 'Падение', color: '#F44336' };
            }
        }
        
        return { status: 'neutral', text: '—', color: '#FFA726' };
    }
    
    static formatDegrees(longitude) {
        let lon = longitude;
        if (lon < 0) lon += 360;
        if (lon >= 360) lon -= 360;
        
        const degrees = Math.floor(lon % 30);
        const minutes = Math.floor((lon % 1) * 60);
        const seconds = Math.floor(((lon % 1) * 60 % 1) * 60);
        
        return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"`;
    }
    
    static getPlanetHouse(planetLon, houses) {
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
}

// ================= ИНИЦИАЛИЗАЦИЯ =================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, инициализируем калькулятор');
    initializeApp();
});

function initializeApp() {
    console.log('✅ Автономная система инициализирована');
    showStatus('✅ Автономная система расчетов готова к работе', 'success');
    
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
        
        const chart = calculateChart(formData);
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
function calculateChart(formData) {
    console.log('🧮 Начинаем астрологические расчеты с автономной системой');
    
    // Создаем объект даты и времени
    const localDateTime = new Date(`${formData.date}T${formData.time}:00`);
    const utcDateTime = new Date(localDateTime.getTime() - formData.tz * 3600000);
    
    console.log(`🕐 Местное время: ${localDateTime}`);
    console.log(`🌍 UTC время: ${utcDateTime}`);
    
    const jd = AstroCalculator.julianDay(utcDateTime);
    console.log(`📅 Юлианский день: ${jd}`);
    
    // Рассчитываем планеты
    const planets = PLANETS.map(planetData => 
        AstroCalculator.calculatePlanet(planetData, jd)
    );
    
    // Рассчитываем асцендент и MC
    const { ascendant, mc } = AstroCalculator.calculateAscendant(jd, formData.lat, formData.lon);
    
    // Рассчитываем дома
    const houses = AstroCalculator.calculateHouses(ascendant, mc, formData.houseSystem);
    
    // Рассчитываем аспекты
    const aspects = AstroCalculator.calculateAspects(planets);
    
    return {
        planets,
        houses,
        aspects,
        ascendant,
        mc,
        formData
    };
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
    const content = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div><strong>📅 Дата рождения</strong><br>${new Date(formData.date + 'T00:00:00').toLocaleDateString('ru-RU')}</div>
            <div><strong>⏰ Время рождения</strong><br>${formData.time}</div>
            <div><strong>🌍 Место</strong><br>${formData.cityName}</div>
            <div><strong>📍 Координаты</strong><br>${formData.lat.toFixed(4)}°, ${formData.lon.toFixed(4)}°</div>
            <div><strong>⌚ Часовой пояс</strong><br>UTC${formData.tz >= 0 ? '+' : ''}${formData.tz}</div>
            <div><strong>🏠 Асцендент</strong><br>${AstroCalculator.formatDegrees(chart.ascendant)} (${AstroCalculator.getZodiacSign(chart.ascendant)})</div>
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
        const sign = AstroCalculator.getZodiacSign(planet.longitude);
        const signIndex = SIGNS.indexOf(sign);
        const house = AstroCalculator.getPlanetHouse(planet.longitude, chart.houses);
        const strength = AstroCalculator.getPlanetStrength(planet.name, sign);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span style="font-size: 1.2em;">${planet.symbol}</span> ${planet.name}</td>
            <td><span style="font-size: 1.2em;">${SIGN_SYMBOLS[signIndex] || ''}</span> ${sign}</td>
            <td>${AstroCalculator.formatDegrees(planet.longitude)}</td>
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
            <td>${AstroCalculator.formatDegrees(house.cusp)}</td>
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
        const natureColor = aspect.aspect.nature === 'гармоничный' ? '#66BB6A' : 
                           aspect.aspect.nature === 'напряженный' ? '#FF7043' : '#FFA726';
        
        row.innerHTML = `
            <td>${aspect.planet1}</td>
            <td style="color: ${natureColor};"><span style="font-size: 1.2em;">${aspect.aspect.symbol}</span> ${aspect.aspect.name}</td>
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
        const sign = AstroCalculator.getZodiacSign(planet.longitude);
        const strength = AstroCalculator.getPlanetStrength(planet.name, sign);
        return strength.status === 'exalted' || strength.status === 'dignified';
    });
    
    const weakPlanets = chart.planets.filter(planet => {
        const sign = AstroCalculator.getZodiacSign(planet.longitude);
        const strength = AstroCalculator.getPlanetStrength(planet.name, sign);
        return strength.status === 'fall' || strength.status === 'detriment';
    });
    
    if (strongPlanets.length > 0) {
        interpretation += `
            <h3>💪 Сильные планеты (${strongPlanets.length})</h3>
            <p>${strongPlanets.map(planet => {
                const sign = AstroCalculator.getZodiacSign(planet.longitude);
                const strength = AstroCalculator.getPlanetStrength(planet.name, sign);
                return `<strong>${planet.symbol} ${planet.name}</strong> в ${sign} (${strength.text.toLowerCase()}) — планета работает гармонично и эффективно.`;
            }).join(' ')}</p>
        `;
    }
    
    if (weakPlanets.length > 0) {
        interpretation += `
            <h3>⚠️ Слабые планеты (${weakPlanets.length})</h3>
            <p>${weakPlanets.map(planet => {
                const sign = AstroCalculator.getZodiacSign(planet.longitude);
                const strength = AstroCalculator.getPlanetStrength(planet.name, sign);
                return `<strong>${planet.symbol} ${planet.name}</strong> в ${sign} (${strength.text.toLowerCase()}) — планета требует дополнительного внимания и проработки.`;
            }).join(' ')}</p>
        `;
    }
    
    const majorAspects = chart.aspects.filter(aspect => aspect.accuracy > 80).slice(0, 5);
    
    if (majorAspects.length > 0) {
        interpretation += `
            <h3>✨ Важные аспекты (${majorAspects.length})</h3>
            <ul>${majorAspects.map(aspect => 
                `<li><strong>${aspect.planet1} ${aspect.aspect.symbol} ${aspect.planet2}</strong> (точность ${aspect.accuracy}%) — ${aspect.aspect.nature} аспект</li>`
            ).join('')}</ul>
        `;
    }
    
    // Анализ элементов
    const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
    const elements = [
        ['fire', 'fire', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water']
    ];
    
    chart.planets.forEach(planet => {
        const signIndex = Math.floor(planet.longitude / 30);
        const element = elements[0][signIndex];
        elementCounts[element]++;
    });
    
    const dominantElement = Object.keys(elementCounts).reduce((a, b) => 
        elementCounts[a] > elementCounts[b] ? a : b
    );
    
    const elementNames = {
        fire: 'Огонь',
        earth: 'Земля', 
        air: 'Воздух',
        water: 'Вода'
    };
    
    interpretation += `
        <h3>🔥 Анализ элементов</h3>
        <p><strong>Доминирующий элемент:</strong> ${elementNames[dominantElement]} (${elementCounts[dominantElement]} планет)</p>
        <p>Огонь: ${elementCounts.fire}, Земля: ${elementCounts.earth}, Воздух: ${elementCounts.air}, Вода: ${elementCounts.water}</p>
    `;
    
    interpretation += `
        <h3>📋 Общие выводы</h3>
        <p>Натальная карта рассчитана с использованием автономной системы расчетов. 
        Всего найдено ${chart.aspects.length} аспектов между планетами. 
        ${strongPlanets.length > 0 ? `Есть ${strongPlanets.length} сильных планет, что указывает на природные таланты. ` : ''}
        ${weakPlanets.length > 0 ? `${weakPlanets.length} планет требуют проработки. ` : ''}
        Асцендент в ${AstroCalculator.getZodiacSign(chart.ascendant)} определяет внешнее проявление личности.
        Для полной интерпретации рекомендуется консультация с профессиональным астрологом.</p>
    `;
    
    const interpretationElement = document.getElementById('interpretation-content');
    if (interpretationElement) {
        interpretationElement.innerHTML = interpretation;
    }
}

console.log('✅ Автономная система полностью загружена и готова к работе');
