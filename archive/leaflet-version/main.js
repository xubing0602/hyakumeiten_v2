// Main JS for Hyakumeiten Map (Leaflet Version)
const CSV_PATH = '../../../tabelog_hyakumeiten_output.csv';

const map = L.map('map').setView([36.0, 138.0], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const markers = L.markerClusterGroup();
let allPlaces = [];
let currentPosition = null;

function parsePrice(priceStr){
  if(!priceStr) return null;
  const m = priceStr.replace(/,|\s|\u00A0/g,'').match(/(\d{1,3,})/);
  if(!m) return null;
  return parseInt(m[1],10);
}

function makePopupContent(p){
  const div = document.createElement('div');
  div.innerHTML = `<h3>${p.restaurant_name || p.name}</h3><br/>` +
    (p.rating? `<em>Rating: ${p.rating}</em><br/>`: '') +
    (p.genre? `<div>Genre: ${p.genre}</div>`: '') +
    (p.address_locality? `<div>${p.address_region} ${p.address_locality}</div>`:'');
  if(p.image){
    const img = document.createElement('img');
    img.alt = p.restaurant_name || p.name;
    img.dataset.src = p.image;
    img.loading = 'lazy';
    img.style.maxWidth = '180px';
    div.appendChild(img);
  }
  return div;
}

function addMarkers(data){
  markers.clearLayers();
  data.forEach(p=>{
    if(!p.lat || !p.lng) return;
    const m = L.marker([+p.lat, +p.lng]);
    const popupContent = makePopupContent(p);
    m.bindPopup(popupContent);
    m.on('popupopen', e=>{
      const imgs = e.popup.getElement().querySelectorAll('img[data-src]');
      imgs.forEach(img=>{ if(!img.src) img.src = img.dataset.src; });
    });
    markers.addLayer(m);
  });
  map.addLayer(markers);
}

function buildFilterOptions(list, selectEl, key){
  const uniq = Array.from(new Set(list.map(x=>x[key]).filter(Boolean))).sort();
  uniq.forEach(v=>{ const opt = document.createElement('option'); opt.value=v; opt.textContent=v; selectEl.appendChild(opt); });
}

function applyFilters(){
  const region = document.getElementById('regionSelect').value;
  const genre = document.getElementById('genreSelect').value;
  const priceLimit = document.getElementById('priceSelect').value;
  const showNearby = document.getElementById('showNearby').checked;
  const radiusKm = Number(document.getElementById('radius').value);

  let filtered = allPlaces.filter(p=>p.lat && p.lng);
  if(region) filtered = filtered.filter(p=>p.address_region===region);
  if(genre) filtered = filtered.filter(p=>p.genre && p.genre.indexOf(genre)!==-1 || p.main_genre===genre);
  if(priceLimit){ filtered = filtered.filter(p=>{ const pr = parsePrice(p.price_range) || parsePrice(p.lunch_budget) || parsePrice(p.dinner_budget); return pr && pr<=Number(priceLimit); }); }
  if(showNearby && currentPosition){
    const [lat, lng] = currentPosition;
    filtered = filtered.filter(p=>{
      const d = haversine(lat,lng,Number(p.lat),Number(p.lng));
      return d <= radiusKm;
    });
  }
  addMarkers(filtered);
}

function resetFilters(){
  document.getElementById('regionSelect').value='';
  document.getElementById('genreSelect').value='';
  document.getElementById('priceSelect').value='';
  document.getElementById('showNearby').checked=false;
  document.getElementById('radius').value=10;
  document.getElementById('radiusVal').textContent='10';
  addMarkers(allPlaces);
}

function haversine(lat1,lon1,lat2,lon2){
  function toRad(v){return v*Math.PI/180}
  const R=6371;
  const dLat=toRad(lat2-lat1); const dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return R*c;
}

document.getElementById('applyBtn').addEventListener('click', applyFilters);
document.getElementById('resetBtn').addEventListener('click', resetFilters);
document.getElementById('radius').addEventListener('input', e=>{ document.getElementById('radiusVal').textContent = e.target.value; });

document.getElementById('locateBtn').addEventListener('click', ()=>{
  if(!navigator.geolocation){ alert('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    currentPosition = [pos.coords.latitude, pos.coords.longitude];
    map.setView(currentPosition, 13);
    L.circle(currentPosition, {radius: Number(document.getElementById('radius').value)*1000, color:'#2b8cff', weight:1}).addTo(map);
  }, err=>{ alert('位置情報が取得できませんでした: '+err.message); });
});

// Load CSV
Papa.parse(CSV_PATH, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results){
    allPlaces = results.data.map(r=>({
      restaurant_name: r.restaurant_name || r.name,
      rating: r.rating,
      genre: r.genre || r.main_genre,
      address_region: r.address_region,
      address_locality: r.address_locality,
      lat: r.lat,
      lng: r.lng,
      image: r.image,
      price_range: r.price_range || r.dinner_budget || r.lunch_budget,
      tabelog_site: r.tabelog_site
    }));

    buildFilterOptions(allPlaces, document.getElementById('regionSelect'), 'address_region');
    buildFilterOptions(allPlaces, document.getElementById('genreSelect'), 'genre');
    addMarkers(allPlaces);
  }
});
