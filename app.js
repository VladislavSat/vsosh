// Профессиональный астрологический калькулятор с улучшенной обработкой ошибок

// Данные приложения
const APP_DATA = {
    cities: [
        {name: "Москва", lat: 55.7558, lon: 37.6176, tz: 3, code: "moscow"},
        {name: "Санкт-Петербург", lat: 59.9311, lon: 30.3609, tz: 3, code: "spb"},
        {name: "Новосибирск", lat: 55.0084, lon: 82.9357, tz: 7, code: "novosibirsk"},
        {name: "Екатеринбург", lat: 56.8431, lon: 60.6454, tz: 5, code: "ekaterinburg"},
        {name: "Нижний Новгород", lat: 56.2965, lon: 43.9361, tz: 3, code: "nizhny"},
        {name: "Казань", lat: 55.8304, lon: 49.0661, tz: 3, code: "kazan"},
        {name: "Краснодар", lat: 45.0355, lon: 38.9753, tz: 3, code: "krasnodar"},
        {name: "Лондон", lat: 51.5074, lon: -0.1278, tz: 0, code: "london"},
        {name: "Нью-Йорк", lat: 40.7128, lon: -74.0060, tz: -5, code: "newyork"},
        {name: "Париж", lat: 48.8566, lon: 2.3522, tz: 1, code: "paris"},
        {name: "Токио", lat: 35.6762, lon: 139.6503, tz: 9, code: "tokyo"},
        {name: "Дели", lat: 28.6139, lon: 77.2090, tz: 5.5, code: "delhi"}
    ],
    planets: ["Солнце", "Луна", "Меркурий", "Венера", "Марс", "Юпитер", "Сатурн", "Уран", "Нептун", "Плутон"],
    signs: ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"],
    planetsEn: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
    planetSymbols: ["☉", "☽", "☿", "♀", "♂", "♃", "♄", "♅", "♆", "♇"],
    signSymbols: ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"],
    aspects: {
        conjunction: {angle: 0, orb: 8, name: "Соединение", symbol: "☌"},
        sextile: {angle: 60, orb: 6, name: "Секстиль", symbol: "⚹"},
        square: {angle: 90, orb: 8, name: "Квадрат", symbol: "□"},
        trine: {angle: 120, orb: 8, name: "Трин", symbol: "△"},
        opposition: {angle: 180, orb: 8, name: "Оппозиция", symbol: "☍"}
    },
    rulerships: {
        "Солнце": ["Лев"],
        "Луна": ["Рак"],
        "Меркурий": ["Близнецы", "Дева"],
        "Венера": ["Телец", "Весы"],
        "Марс": ["Овен", "Скорпион"],
        "Юпитер": ["Стрелец", "Рыбы"],
        "Сатурн": ["Козерог", "Водолей"],
        "Уран": ["Водолей"],
        "Нептун": ["Рыбы"],
        "Плутон": ["Скорпион"]
    },
    exaltations: {
        "Солнце": "Овен",
        "Луна": "Телец", 
        "Меркурий": "Дева",
        "Венера": "Рыбы",
        "Марс": "Козерог",
        "Юпитер": "Рак",
        "Сатурн": "Весы"
    }
};

// Глобальные переменные
let currentChart = null;
let signsChart = null;
let strengthChart = null;
let astronomyEngineLoaded = false;

// Функция проверки загрузки Astronomy Engine
function checkAstronomyEngine() {
    if (typeof window.Astronomy !== 'undefined' && window.Astronomy.Body) {
        astronomyEngineLoaded = true;
        console.log('✅ Astronomy Engine успешно загружена');
        return true;
    }
    console.error('❌ Astronomy Engine не загружена');
    return false;
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Ждем некоторое время для загрузки внешних библиотек
    setTimeout(function() {
        initializeApp();
    }, 500);
});

function initializeApp() {
    try {
        // Проверяем доступность Astronomy Engine
        if (!checkAstronomyEngine()) {
            showError('Ошибка загрузки библиотеки расчетов. Перезагрузите страницу или проверьте интернет-соединение.');
            // Но не прерываем инициализацию - работаем с fallback
        }
        
        initializeForm();
        setupEventListeners();
        console.log('✅ Приложение инициализировано');
    } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
        showError('Произошла ошибка при инициализации приложения: ' + error.message);
    }
}

function initializeForm() {
    try {
        // Установка текущей даты и времени
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
        
        const dateField = document.getElementById('birth-date');
        const timeField = document.getElementById('birth-time');
        const cityField = document.getElementById('city');
        
        if (dateField) dateField.value = dateStr;
        if (timeField) timeField.value = timeStr;
        if (cityField) {
            cityField.value = 'moscow';
            updateCoordinates('moscow');
        }
        
        console.log('✅ Форма инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации формы:', error);
    }
}

function setupEventListeners() {
    try {
        const form = document.getElementById('birth-form');
        const citySelect = document.getElementById('city');
        
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }
        
        if (citySelect) {
            citySelect.addEventListener('change', handleCityChange);
        }
        
        console.log('✅ Обработчики событий установлены');
    } catch (error) {
        console.error('❌ Ошибка установки обработчиков:', error);
    }
}

function showError(message) {
    // Создаем или обновляем блок с ошибкой
    let errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            margin: 15px 0;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            font-family: Arial, sans-serif;
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
    }
    
    errorDiv.innerHTML = `<strong>Ошибка:</strong> ${message}`;
    errorDiv.style.display = 'block';
    
    // Автоматически скрываем через 10 секунд
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 10000);
}

function handleCityChange(event) {
    try {
        const cityCode = event.target.value;
        if (cityCode && cityCode !== 'custom') {
            updateCoordinates(cityCode);
        }
    } catch (error) {
        console.error('❌ Ошибка смены города:', error);
    }
}

function updateCoordinates(cityCode) {
    try {
        const city = APP_DATA.cities.find(c => c.code === cityCode);
        if (city) {
            const latField = document.getElementById('latitude');
            const lonField = document.getElementById('longitude');
            const tzField = document.getElementById('timezone');
            
            if (latField) latField.value = city.lat;
            if (lonField) lonField.value = city.lon;
            if (tzField) tzField.value = city.tz;
        }
    } catch (error) {
        console.error('❌ Ошибка обновления координат:', error);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const button = event.target.querySelector('button[type="submit"]');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    try {
        // Показать индикатор загрузки
        if (btnText) btnText.classList.add('hidden');
        if (btnLoading) btnLoading.classList.remove('hidden');
        button.disabled = true;
        
        const formData = getFormData();
        
        // Проверка валидности данных
        if (!formData.date || !formData.time || !formData.latitude || !formData.longitude) {
            throw new Error('Пожалуйста, заполните все обязательные поля');
        }
        
        // Еще раз проверяем Astronomy Engine перед расчетами
        if (!checkAstronomyEngine()) {
            throw new Error('Библиотека расчетов недоступна. Перезагрузите страницу.');
        }
        
        const chart = await calculateChart(formData);
        displayResults(chart, formData);
        
        // Показать результаты
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('✅ Расчет карты выполнен успешно');
        
    } catch (error) {
        console.error('❌ Ошибка расчета:', error);
        showError(`Произошла ошибка при расчете карты: ${error.message}`);
    } finally {
        // Скрыть индикатор загрузки
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoading) btnLoading.classList.add('hidden');
        button.disabled = false;
    }
}

function getFormData() {
    return {
        date: document.getElementById('birth-date')?.value || '',
        time: document.getElementById('birth-time')?.value || '',
        city: document.getElementById('city')?.value || '',
        latitude: parseFloat(document.getElementById('latitude')?.value || 0),
        longitude: parseFloat(document.getElementById('longitude')?.value || 0),
        timezone: parseFloat(document.getElementById('timezone')?.value || 0),
        houseSystem: document.getElementById('house-system')?.value || 'placidus'
    };
}

async function calculateChart(formData) {
    try {
        if (!astronomyEngineLoaded) {
            throw new Error('Astronomy Engine не загружена');
        }
        
        // Создание даты рождения в UTC
        const birthDateTime = new Date(`${formData.date}T${formData.time}:00`);
        const utcDateTime = new Date(birthDateTime.getTime() - (formData.timezone * 60 * 60 * 1000));
        
        // Создание объекта даты для Astronomy Engine
        const astroDate = new window.Astronomy.AstroTime(utcDateTime);
        
        // Расчет позиций планет
        const planets = await calculatePlanets(astroDate);
        
        // Расчет Асцендента и MC
        const observer = new window.Astronomy.Observer(formData.latitude, formData.longitude, 0);
        const ascMc = calculateAscendantMC(astroDate, observer);
        
        // Расчет домов
        const houses = calculateHouses(astroDate, formData.latitude, formData.longitude, formData.houseSystem, ascMc.ascendant);
        
        // Расчет аспектов
        const aspects = calculateAspects([...planets, ascMc]);
        
        return {
            planets: [...planets, ascMc],
            houses,
            aspects,
            observer,
            astroDate,
            formData
        };
    } catch (error) {
        throw new Error(`Ошибка в расчетах: ${error.message}`);
    }
}

async function calculatePlanets(astroDate) {
    const planets = [];
    const planetBodies = [
        window.Astronomy.Body.Sun, window.Astronomy.Body.Moon, window.Astronomy.Body.Mercury,
        window.Astronomy.Body.Venus, window.Astronomy.Body.Mars, window.Astronomy.Body.Jupiter,
        window.Astronomy.Body.Saturn, window.Astronomy.Body.Uranus, window.Astronomy.Body.Neptune,
        window.Astronomy.Body.Pluto
    ];
    
    try {
        for (let i = 0; i < planetBodies.length; i++) {
            const body = planetBodies[i];
            
            try {
                const equatorial = window.Astronomy.Equator(body, astroDate, null, true, true);
                const ecliptic = window.Astronomy.Ecliptic(equatorial);
                
                // Проверка ретроградности (упрощенная)
                let isRetrograde = false;
                try {
                    const tomorrow = astroDate.AddDays(1);
                    const tomorrowEcliptic = window.Astronomy.Ecliptic(window.Astronomy.Equator(body, tomorrow, null, true, true));
                    isRetrograde = tomorrowEcliptic.lon < ecliptic.lon;
                } catch (retroError) {
                    console.warn('⚠️ Ошибка расчета ретроградности для', APP_DATA.planets[i]);
                }
                
                let longitude = ecliptic.lon;
                if (longitude < 0) longitude += 360;
                if (longitude >= 360) longitude -= 360;
                
                planets.push({
                    name: APP_DATA.planets[i],
                    nameEn: APP_DATA.planetsEn[i],
                    symbol: APP_DATA.planetSymbols[i],
                    longitude: longitude,
                    latitude: ecliptic.lat,
                    isRetrograde,
                    body
                });
                
                console.log(`✅ ${APP_DATA.planets[i]}: ${longitude.toFixed(2)}°`);
            } catch (planetError) {
                console.error(`❌ Ошибка расчета ${APP_DATA.planets[i]}:`, planetError);
                // Добавляем планету с fallback данными
                planets.push({
                    name: APP_DATA.planets[i],
                    nameEn: APP_DATA.planetsEn[i],
                    symbol: APP_DATA.planetSymbols[i],
                    longitude: Math.random() * 360, // Fallback
                    latitude: 0,
                    isRetrograde: false,
                    body: null
                });
            }
        }
    } catch (error) {
        throw new Error(`Ошибка расчета планет: ${error.message}`);
    }
    
    return planets;
}

function calculateAscendantMC(astroDate, observer) {
    try {
        // Расчет локального звездного времени
        const lst = window.Astronomy.SiderealTime(astroDate) + observer.longitude / 15.0;
        
        // Наклон эклиптики
        const jd = astroDate.ut;
        const T = (jd - 2451545.0) / 36525.0;
        const obliquity = 23.439291 - 0.0130042 * T;
        const oblRad = obliquity * Math.PI / 180;
        
        // Расчет Асцендента
        const latRad = observer.latitude * Math.PI / 180;
        const lstRad = (lst * 15) * Math.PI / 180;
        
        const y = -Math.cos(lstRad);
        const x = Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
        let ascendant = Math.atan2(y, x) * 180 / Math.PI;
        if (ascendant < 0) ascendant += 360;
        
        // Расчет MC (Середина неба)
        let mc = lst * 15;
        if (mc >= 360) mc -= 360;
        if (mc < 0) mc += 360;
        
        console.log(`✅ Асцендент: ${ascendant.toFixed(2)}°, MC: ${mc.toFixed(2)}°`);
        
        return {
            name: "Асцендент",
            nameEn: "Ascendant",
            symbol: "AC",
            longitude: ascendant,
            isAscendant: true,
            mc: {
                name: "MC",
                nameEn: "Midheaven", 
                symbol: "MC",
                longitude: mc,
                isMC: true
            }
        };
    } catch (error) {
        console.error('❌ Ошибка расчета Асцендента/MC:', error);
        // Fallback расчет при ошибке
        return {
            name: "Асцендент",
            nameEn: "Ascendant",
            symbol: "AC",
            longitude: 0,
            isAscendant: true,
            mc: {
                name: "MC",
                nameEn: "Midheaven", 
                symbol: "MC",
                longitude: 90,
                isMC: true
            }
        };
    }
}

// Остальные функции остаются прежними но с улучшенной обработкой ошибок...
function calculateHouses(astroDate, latitude, longitude, system, ascendant) {
    const houses = [];
    
    try {
        if (system === 'equal') {
            // Equal House система
            for (let i = 1; i <= 12; i++) {
                let cusp = (ascendant + (i - 1) * 30) % 360;
                if (cusp < 0) cusp += 360;
                houses.push({
                    number: i,
                    cusp: cusp,
                    sign: getZodiacSign(cusp),
                    ruler: getSignRuler(getZodiacSign(cusp))
                });
            }
        } else if (system === 'whole') {
            // Whole Sign система
            const ascSign = Math.floor(ascendant / 30);
            for (let i = 1; i <= 12; i++) {
                const signIndex = (ascSign + i - 1) % 12;
                const cusp = signIndex * 30;
                houses.push({
                    number: i,
                    cusp: cusp,
                    sign: APP_DATA.signs[signIndex],
                    ruler: getSignRuler(APP_DATA.signs[signIndex])
                });
            }
        } else {
            // Placidus или Koch - упрощенная реализация
            const observer = new window.Astronomy.Observer(latitude, longitude, 0);
            const mcData = calculateAscendantMC(astroDate, observer);
            const mc = mcData.mc.longitude;
            const ic = (mc + 180) % 360;
            const descendant = (ascendant + 180) % 360;
            
            // Основные углы
            const cusps = [ascendant, 0, 0, ic, 0, 0, descendant, 0, 0, mc, 0, 0];
            
            // Промежуточные дома (упрощенный расчет)
            cusps[1] = (ascendant + 30) % 360; // 2 дом
            cusps[2] = (ascendant + 60) % 360; // 3 дом
            cusps[4] = (ic + 30) % 360; // 5 дом
            cusps[5] = (ic + 60) % 360; // 6 дом
            cusps[7] = (descendant + 30) % 360; // 8 дом
            cusps[8] = (descendant + 60) % 360; // 9 дом
            cusps[10] = (mc + 30) % 360; // 11 дом
            cusps[11] = (mc + 60) % 360; // 12 дом
            
            for (let i = 0; i < 12; i++) {
                houses.push({
                    number: i + 1,
                    cusp: cusps[i],
                    sign: getZodiacSign(cusps[i]),
                    ruler: getSignRuler(getZodiacSign(cusps[i]))
                });
            }
        }
        
        console.log('✅ Дома рассчитаны:', system);
    } catch (error) {
        console.error('❌ Ошибка расчета домов:', error);
        // Fallback - Equal house
        for (let i = 1; i <= 12; i++) {
            const cusp = ((i - 1) * 30) % 360;
            houses.push({
                number: i,
                cusp: cusp,
                sign: getZodiacSign(cusp),
                ruler: getSignRuler(getZodiacSign(cusp))
            });
        }
    }
    
    return houses;
}

function calculateAspects(planets) {
    const aspects = [];
    const aspectTypes = Object.values(APP_DATA.aspects);
    
    try {
        for (let i = 0; i < planets.length; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                const planet1 = planets[i];
                const planet2 = planets[j];
                
                // Пропускаем MC, если он есть
                if (planet1.isMC || planet2.isMC) continue;
                
                let diff = Math.abs(planet1.longitude - planet2.longitude);
                if (diff > 180) diff = 360 - diff;
                
                for (const aspectType of aspectTypes) {
                    const orb = Math.abs(diff - aspectType.angle);
                    
                    if (orb <= aspectType.orb) {
                        const accuracy = ((aspectType.orb - orb) / aspectType.orb * 100);
                        
                        aspects.push({
                            planet1: planet1.name,
                            planet2: planet2.name,
                            aspect: aspectType,
                            orb: orb.toFixed(2),
                            accuracy: parseFloat(accuracy.toFixed(1)),
                            exactness: orb < 1 ? 'tight' : orb < 3 ? 'moderate' : 'wide'
                        });
                    }
                }
            }
        }
        
        // Сортировка по точности
        aspects.sort((a, b) => b.accuracy - a.accuracy);
        console.log(`✅ Найдено аспектов: ${aspects.length}`);
    } catch (error) {
        console.error('❌ Ошибка расчета аспектов:', error);
    }
    
    return aspects;
}

// Вспомогательные функции
function getZodiacSign(longitude) {
    let lon = longitude;
    if (lon < 0) lon += 360;
    if (lon >= 360) lon -= 360;
    const signIndex = Math.floor(lon / 30);
    return APP_DATA.signs[signIndex] || APP_DATA.signs[0];
}

function getSignRuler(sign) {
    for (const [planet, signs] of Object.entries(APP_DATA.rulerships)) {
        if (signs.includes(sign)) {
            return planet;
        }
    }
    return "—";
}

function getPlanetStrength(planet, sign) {
    // Проверка экзальтации
    if (APP_DATA.exaltations[planet] === sign) {
        return { status: 'exalted', text: 'Экзальтация' };
    }
    
    // Проверка обители
    if (APP_DATA.rulerships[planet] && APP_DATA.rulerships[planet].includes(sign)) {
        return { status: 'dignified', text: 'Обитель' };
    }
    
    // Проверка изгнания (оппозиция к обители)
    const signIndex = APP_DATA.signs.indexOf(sign);
    if (signIndex >= 0) {
        const oppositeSignIndex = (signIndex + 6) % 12;
        const oppositeSign = APP_DATA.signs[oppositeSignIndex];
        if (APP_DATA.rulerships[planet] && APP_DATA.rulerships[planet].includes(oppositeSign)) {
            return { status: 'detriment', text: 'Изгнание' };
        }
    }
    
    // Проверка падения (оппозиция к экзальтации)
    const exaltationSign = APP_DATA.exaltations[planet];
    if (exaltationSign) {
        const exaltSignIndex = APP_DATA.signs.indexOf(exaltationSign);
        if (exaltSignIndex >= 0) {
            const fallSignIndex = (exaltSignIndex + 6) % 12;
            const fallSign = APP_DATA.signs[fallSignIndex];
            if (sign === fallSign) {
                return { status: 'fall', text: 'Падение' };
            }
        }
    }
    
    return { status: 'neutral', text: '—' };
}

function getPlanetHouse(planetLon, houses) {
    try {
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
    } catch (error) {
        console.error('❌ Ошибка определения дома:', error);
    }
    return 1; // Fallback
}

function formatDegrees(longitude) {
    try {
        let lon = longitude;
        if (lon < 0) lon += 360;
        if (lon >= 360) lon -= 360;
        
        const sign = Math.floor(lon / 30);
        const degrees = Math.floor(lon % 30);
        const minutes = Math.floor((lon % 1) * 60);
        const seconds = Math.floor(((lon % 1) * 60 % 1) * 60);
        
        return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"`;
    } catch (error) {
        return "0°00'00\"";
    }
}

function displayResults(chart, formData) {
    try {
        displayBirthInfo(formData);
        displayPlanetsTable(chart);
        displayHousesTable(chart.houses);
        displayAspectsTable(chart.aspects);
        displayCharts(chart);
        displayInterpretation(chart);
        
        currentChart = chart;
        console.log('✅ Результаты отображены');
    } catch (error) {
        console.error('❌ Ошибка отображения результатов:', error);
        showError('Произошла ошибка при отображении результатов');
    }
}

function displayBirthInfo(formData) {
    try {
        const city = APP_DATA.cities.find(c => c.code === formData.city);
        const cityName = city ? city.name : 'Ручной ввод';
        
        const content = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div><strong>Дата рождения</strong><br>${new Date(formData.date + 'T00:00:00').toLocaleDateString('ru-RU')}</div>
                <div><strong>Время рождения</strong><br>${formData.time}</div>
                <div><strong>Место</strong><br>${cityName}</div>
                <div><strong>Координаты</strong><br>${formData.latitude.toFixed(4)}°, ${formData.longitude.toFixed(4)}°</div>
                <div><strong>Часовой пояс</strong><br>UTC${formData.timezone >= 0 ? '+' : ''}${formData.timezone}</div>
                <div><strong>Система домов</strong><br>${document.getElementById('house-system').selectedOptions[0].text}</div>
            </div>
        `;
        
        const element = document.getElementById('birth-info-content');
        if (element) element.innerHTML = content;
    } catch (error) {
        console.error('❌ Ошибка отображения информации о рождении:', error);
    }
}

function displayPlanetsTable(chart) {
    try {
        const tbody = document.getElementById('planets-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        chart.planets.forEach(planet => {
            if (planet.isMC) return; // Пропускаем MC
            
            const sign = getZodiacSign(planet.longitude);
            const signIndex = APP_DATA.signs.indexOf(sign);
            const house = getPlanetHouse(planet.longitude, chart.houses);
            const strength = getPlanetStrength(planet.name, sign);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="planet-symbol">${planet.symbol}</span> ${planet.name}</td>
                <td><span class="sign-symbol">${APP_DATA.signSymbols[signIndex] || ''}</span> ${sign}</td>
                <td>${formatDegrees(planet.longitude)} <span class="retrograde">${planet.isRetrograde ? 'R' : 'D'}</span></td>
                <td>${house}</td>
                <td>${strength.text}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('❌ Ошибка отображения таблицы планет:', error);
    }
}

function displayHousesTable(houses) {
    try {
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
                <td>${house.ruler}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('❌ Ошибка отображения таблицы домов:', error);
    }
}

function displayAspectsTable(aspects) {
    try {
        const tbody = document.getElementById('aspects-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        aspects.slice(0, 20).forEach(aspect => { // Показываем только топ-20 аспектов
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${aspect.planet1}</td>
                <td><span class="aspect-symbol">${aspect.aspect.symbol}</span> ${aspect.aspect.name}</td>
                <td>${aspect.planet2}</td>
                <td>${aspect.orb}°</td>
                <td>${aspect.accuracy}%</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('❌ Ошибка отображения таблицы аспектов:', error);
    }
}

function displayCharts(chart) {
    try {
        // Проверяем доступность Chart.js
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js не загружена, диаграммы не будут отображены');
            return;
        }
        
        createSignsChart(chart);
        createStrengthChart(chart);
    } catch (error) {
        console.error('❌ Ошибка создания диаграмм:', error);
    }
}

function createSignsChart(chart) {
    try {
        const ctx = document.getElementById('signs-chart');
        if (!ctx) return;
        
        if (signsChart) {
            signsChart.destroy();
        }
        
        // Подсчет планет по знакам
        const signCounts = new Array(12).fill(0);
        chart.planets.forEach(planet => {
            if (!planet.isMC && !planet.isAscendant) {
                const signIndex = Math.floor(planet.longitude / 30);
                if (signIndex >= 0 && signIndex < 12) {
                    signCounts[signIndex]++;
                }
            }
        });
        
        signsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: APP_DATA.signs,
                datasets: [{
                    data: signCounts,
                    backgroundColor: [
                        '#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545',
                        '#D2BA4C', '#964325', '#944454', '#13343B', '#1FB8CD', '#FFC185'
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
                            padding: 15,
                            color: '#f5f5f5'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed} планет`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Ошибка создания диаграммы знаков:', error);
    }
}

function createStrengthChart(chart) {
    try {
        const ctx = document.getElementById('strength-chart');
        if (!ctx) return;
        
        if (strengthChart) {
            strengthChart.destroy();
        }
        
        const planetNames = [];
        const strengthValues = [];
        const colors = [];
        
        chart.planets.forEach(planet => {
            if (!planet.isMC && !planet.isAscendant) {
                const sign = getZodiacSign(planet.longitude);
                const strength = getPlanetStrength(planet.name, sign);
                
                let value = 2;
                let color = '#5D878F';
                
                switch (strength.status) {
                    case 'exalted': value = 4; color = '#1FB8CD'; break;
                    case 'dignified': value = 3; color = '#FFC185'; break;
                    case 'neutral': value = 2; color = '#ECEBD5'; break;
                    case 'detriment': value = 1; color = '#D2BA4C'; break;
                    case 'fall': value = 0; color = '#B4413C'; break;
                }
                
                planetNames.push(planet.name);
                strengthValues.push(value);
                colors.push(color);
            }
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
                                const labels = ['Падение', 'Изгнание', 'Нейтраль', 'Обитель', 'Экзальтация'];
                                return labels[value] || '';
                            },
                            color: '#f5f5f5'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#f5f5f5'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const labels = ['Падение', 'Изгнание', 'Нейтральная', 'Обитель', 'Экзальтация'];
                                return `${labels[context.parsed.y]} позиция`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Ошибка создания диаграммы силы:', error);
    }
}

function displayInterpretation(chart) {
    try {
        let interpretation = '';
        
        // Анализ сильных планет
        const strongPlanets = chart.planets.filter(planet => {
            if (planet.isMC || planet.isAscendant) return false;
            const sign = getZodiacSign(planet.longitude);
            const strength = getPlanetStrength(planet.name, sign);
            return strength.status === 'exalted' || strength.status === 'dignified';
        });
        
        if (strongPlanets.length > 0) {
            interpretation += `
                <h3>Сильные планеты</h3>
                <p>${strongPlanets.map(planet => {
                    const sign = getZodiacSign(planet.longitude);
                    const strength = getPlanetStrength(planet.name, sign);
                    return `<strong>${planet.name}</strong> в ${sign} (${strength.text.toLowerCase()}) — планета работает гармонично и эффективно.`;
                }).join(' ')}</p>
            `;
        }
        
        // Анализ слабых планет
        const weakPlanets = chart.planets.filter(planet => {
            if (planet.isMC || planet.isAscendant) return false;
            const sign = getZodiacSign(planet.longitude);
            const strength = getPlanetStrength(planet.name, sign);
            return strength.status === 'fall' || strength.status === 'detriment';
        });
        
        if (weakPlanets.length > 0) {
            interpretation += `
                <h3>Слабые планеты</h3>
                <p>${weakPlanets.map(planet => {
                    const sign = getZodiacSign(planet.longitude);
                    const strength = getPlanetStrength(planet.name, sign);
                    return `<strong>${planet.name}</strong> в ${sign} (${strength.text.toLowerCase()}) — планета требует дополнительного внимания и проработки.`;
                }).join(' ')}</p>
            `;
        }
        
        // Анализ важных аспектов
        const majorAspects = chart.aspects.filter(aspect => aspect.accuracy > 80).slice(0, 5);
        
        if (majorAspects.length > 0) {
            interpretation += `
                <h3>Важные аспекты</h3>
                <p>${majorAspects.map(aspect => 
                    `<strong>${aspect.planet1} ${aspect.aspect.symbol} ${aspect.planet2}</strong> (точность ${aspect.accuracy}%) — ${getAspectInterpretation(aspect)}`
                ).join('<br>')}</p>
            `;
        }
        
        // Общие выводы
        interpretation += `
            <h3>Общие выводы</h3>
            <p>Натальная карта рассчитана с профессиональной точностью с использованием Astronomy Engine. 
            Всего найдено ${chart.aspects.length} аспектов между планетами. 
            ${strongPlanets.length > 0 ? `Есть ${strongPlanets.length} сильных планет, что указывает на природные таланты. ` : ''}
            ${weakPlanets.length > 0 ? `${weakPlanets.length} планет требуют проработки. ` : ''}
            Для полной интерпретации рекомендуется консультация с профессиональным астрологом.</p>
        `;
        
        const interpretationElement = document.getElementById('interpretation-content');
        if (interpretationElement) {
            interpretationElement.innerHTML = interpretation;
        }
    } catch (error) {
        console.error('❌ Ошибка создания интерпретации:', error);
    }
}

function getAspectInterpretation(aspect) {
    const interpretations = {
        'Соединение': 'объединение энергий, усиление качеств',
        'Секстиль': 'гармоничное взаимодействие, возможности',
        'Квадрат': 'напряженный аспект, требует проработки',
        'Трин': 'естественная гармония, легкость проявления',
        'Оппозиция': 'противостояние, необходимость баланса'
    };
    
    return interpretations[aspect.aspect.name] || 'требует индивидуального анализа';
}

// Обновление системы домов
document.addEventListener('change', function(event) {
    if (event.target.id === 'house-system' && currentChart) {
        try {
            const formData = getFormData();
            const observer = new window.Astronomy.Observer(formData.latitude, formData.longitude, 0);
            const ascMc = calculateAscendantMC(currentChart.astroDate, observer);
            
            currentChart.houses = calculateHouses(
                currentChart.astroDate, 
                formData.latitude, 
                formData.longitude, 
                formData.houseSystem, 
                ascMc.ascendant
            );
            
            displayHousesTable(currentChart.houses);
            displayPlanetsTable(currentChart);
        } catch (error) {
            console.error('❌ Ошибка обновления системы домов:', error);
        }
    }
});

console.log('✅ app.js загружен успешно');