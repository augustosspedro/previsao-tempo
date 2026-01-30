const btn = document.getElementById('search-btn');
const input = document.getElementById('city-input');
const suggestionList = document.getElementById('suggestion-list');

// Dicionário de tradução (WMO Code para Português)
function traduzirClima(codigo) {
    const tabela = {
        0: "Céu Limpo", 1: "Céu aberto", 2: "Parcialmente Nublado", 3: "Nublado",
        45: "Nevoeiro", 51: "Garoa", 61: "Chuva Fraca", 63: "Chuva",
        80: "Pancadas de Chuva", 95: "Trovoada"
    };
    return tabela[codigo] || "Tempo Variável";
}

// --- API DO IBGE ---
input.addEventListener('input', async () => {
    const termo = input.value;
    
    if (termo.length < 2) {
        suggestionList.innerHTML = "";
        return;
    }

    try {
        // Busca cidades no IBGE que contêm o texto digitado
        const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome`;
        const res = await fetch(url);
        const cidades = await res.json();

        // Filtra as cidades que começam com o que digita
        const filtradas = cidades
            .filter(c => c.nome.toLowerCase().startsWith(termo.toLowerCase()))
            .slice(0, 6); // Pega apenas as 6 primeiras

        suggestionList.innerHTML = "";

        filtradas.forEach(cidade => {
            const li = document.createElement('li');
            li.innerText = `${cidade.nome} - ${cidade.microrregiao.mesorregiao.UF.sigla}`;
            
            li.onclick = () => {
                input.value = cidade.nome;
                suggestionList.innerHTML = "";
                buscarClima(cidade.nome);
            };
            suggestionList.appendChild(li);
        });
    } catch (e) {
        console.log("Erro ao carregar cidades do IBGE");
    }
});

// --- BUSCA DO CLIMA (OPEN-METEO) ---
async function buscarClima(cidadeNome) {
    const cidade = cidadeNome || input.value;
    if (!cidade) return;

    suggestionList.innerHTML = "";

    try {
        // 1. Descobrir Lat/Lon (Nominatim ainda é necessário para coordenadas)
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${cidade}&limit=1&countrycodes=br`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData.length === 0) return alert("Cidade não encontrada no mapa!");

        const { lat, lon } = geoData[0];

        // 2. Buscar Clima Real
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        // 3. Atualizar Interface
        document.getElementById('city-name').innerText = cidade;
        document.getElementById('temp').innerText = Math.floor(weatherData.current_weather.temperature);
        document.getElementById('wind').innerText = weatherData.current_weather.windspeed;
        document.getElementById('weather-desc').innerText = traduzirClima(weatherData.current_weather.weathercode);

    } catch (erro) {
        alert("Erro na conexão com o serviço meteorológico.");
    }
}

btn.onclick = () => buscarClima();
input.onkeypress = (e) => { if(e.key === 'Enter') buscarClima(); };
document.onclick = (e) => { if (e.target !== input) suggestionList.innerHTML = ""; };