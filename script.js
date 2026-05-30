const API_KEY = 'f79885915ff3c3c13ab55b58bd7cf1d0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BG_BASE = 'https://image.tmdb.org/t/p/original';

function goGenre(id, name) { window.location.href = `genre.html?id=${id}&name=${encodeURIComponent(name)}`; }

function renderItem(item, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container || (!item.poster_path && !item.profile_path)) return;
    const title = item.title || item.name;
    const img = item.poster_path || item.profile_path;
    const div = document.createElement('div');
    div.className = 'movie-card';
    div.innerHTML = `<img src="${IMG_BASE + img}"><p>${title}</p>`;
    div.onclick = () => {
        if (type === 'person' || item.media_type === 'person') {
            const isDir = window.location.pathname.includes('directors.html');
            window.location.href = `${isDir ? 'director' : 'actor'}-details.html?id=${item.id}`;
        } else {
            window.location.href = `movie.html?id=${item.id}&type=${type || item.media_type || 'movie'}`;
        }
    };
    container.appendChild(div);
}

async function main() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type');

    // 1. HOME
    if (document.getElementById('homeContent')) {
        const res = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=es-ES`);
        const data = await res.json();
        data.results.slice(0, 18).forEach(i => renderItem(i, 'newReleasesGrid', i.media_type));
        [238, 11, 597, 680, 155, 120, 13, 27205, 1891, 550, 603, 278, 157336, 129, 213, 15].forEach(async mid => {
            const r = await fetch(`${BASE_URL}/movie/${mid}?api_key=${API_KEY}&language=es-ES`);
            renderItem(await r.json(), 'classicsGrid', 'movie');
        });
    }

    // 2. BUSCADOR
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const q = document.getElementById('searchInput').value;
            const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=es-ES`);
            const data = await res.json();
            const home = document.getElementById('homeContent');
            if (home) home.style.display = 'none';
            const resultsSec = document.getElementById('searchResultsSection');
            resultsSec.style.display = 'block';
            const grid = document.getElementById('resultsGrid');
            grid.innerHTML = '';
            data.results.forEach(i => {
                if(i.poster_path || i.profile_path) renderItem(i, 'resultsGrid', i.media_type);
            });
        });
    }

    // 3. DETALLES PELÍCULA/SERIE
    const detailsDiv = document.getElementById('details-content');
    if (detailsDiv && id) {
        const res = await fetch(`${BASE_URL}/${type || 'movie'}/${id}?api_key=${API_KEY}&language=es-ES&append_to_response=videos,credits,recommendations`);
        const data = await res.json();
        const dir = type === 'tv' ? data.created_by?.[0]?.name : data.credits?.crew.find(p => p.job === 'Director')?.name;
        const trailer = data.videos?.results.find(v => v.type === 'Trailer')?.key;
        document.getElementById('bg-overlay').style.backgroundImage = `url(${BG_BASE + data.backdrop_path})`;
        detailsDiv.innerHTML = `<div class="main-info"><div class="poster-wrap"><img src="${IMG_BASE + data.poster_path}"></div><div class="text-wrap"><h1>${data.title || data.name}</h1><p class="meta-info">${dir || 'N/A'}</p><span class="genres">${data.genres.map(g => g.name).join(' / ')}</span><div class="action-btns"><a href="https://youtube.com/watch?v=${trailer}" target="_blank" class="btn btn-red">VER TRÁILER</a><a href="https://www.themoviedb.org/${type || 'movie'}/${id}/watch" target="_blank" class="btn btn-outline">DÓNDE VER</a></div></div></div><div class="synopsis-block"><p>${data.overview}</p></div>`;
        data.recommendations?.results.slice(0, 12).forEach(s => renderItem(s, 'similarGrid', type));
    }

    // 4. DETALLES PERSONA (DIRECTOR/ACTOR)
    const personDiv = document.getElementById('director-content') || document.getElementById('actor-content');
    if (personDiv && id) {
        const person = await (await fetch(`${BASE_URL}/person/${id}?api_key=${API_KEY}&language=es-ES`)).json();
        const credits = await (await fetch(`${BASE_URL}/person/${id}/combined_credits?api_key=${API_KEY}&language=es-ES`)).json();
        const isDirPage = personDiv.id === 'director-content';
        const list = isDirPage ? credits.crew.filter(c => c.job === 'Director') : credits.cast;
        if (list[0]) document.getElementById('bg-overlay').style.backgroundImage = `url(${BG_BASE + list[0].backdrop_path})`;
        personDiv.innerHTML = `<div class="main-info"><div class="poster-wrap"><img src="${IMG_BASE + person.profile_path}"></div><div class="text-wrap"><h1>${person.name}</h1><p class="meta-info">${person.place_of_birth || 'Cineasta'}</p></div></div><div class="synopsis-block"><h2>Biografía</h2><p>${person.biography || "Sin biografía disponible."}</p></div>`;
        list.sort((a,b) => b.popularity - a.popularity).slice(0, 20).forEach(m => renderItem(m, isDirPage ? 'filmographyGrid' : 'actorFilmGrid', m.media_type));
    }

    // 5. PASEO DE LA FAMA (LISTAS AMPLIADAS)
    if (document.getElementById('famaGrid')) {
        const famaType = params.get('type') || 'movie';
        document.getElementById('famaTitle').innerText = famaType === 'movie' ? 'Cine Galardonado' : 'Series Galardonadas';
        
        // Listas completas para llenar el grid simétricamente
        const movieIds = [496243, 238, 424, 122, 680, 13, 550, 157336, 129, 213, 15, 289, 389, 27205, 155, 98, 807, 348, 11, 597];
        const tvIds = [1396, 1399, 1668, 76331, 87108, 1362, 60625, 161, 2316, 4613, 66732, 42009, 94605, 94997, 189132, 1406, 62560, 46648, 1416, 37680];
        
        const list = famaType === 'movie' ? movieIds : tvIds;
        list.forEach(async fid => {
            const r = await fetch(`${BASE_URL}/${famaType}/${fid}?api_key=${API_KEY}&language=es-ES`);
            renderItem(await r.json(), 'famaGrid', famaType);
        });
    }

    // 6. OTROS LISTADOS
    if (document.getElementById('genreGrid')) {
        document.getElementById('pageTitle').innerText = params.get('name');
        const d = await (await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${id}&language=es-ES`)).json();
        d.results.forEach(i => renderItem(i, 'genreGrid', 'movie'));
    }
    if (document.getElementById('directorsGrid')) {
        [525, 488, 1032, 138, 2636, 1776, 240, 7467, 21684, 10830, 2710, 137427].forEach(async did => {
            const r = await fetch(`${BASE_URL}/person/${did}?api_key=${API_KEY}&language=es-ES`);
            renderItem(await r.json(), 'directorsGrid', 'person');
        });
    }
    if (document.getElementById('actorsGrid')) {
        [3, 380, 1158, 31, 6193, 5292, 5064, 192, 514, 4173, 2231, 73421, 5, 24, 112].forEach(async aid => {
            const r = await fetch(`${BASE_URL}/person/${aid}?api_key=${API_KEY}&language=es-ES`);
            renderItem(await r.json(), 'actorsGrid', 'person');
        });
    }
}

window.onload = main;