// Main JS for Google Maps version with multi-select, genre colors, and JP region ordering
const CSV_PATH = 'tabelog_hyakumeiten_output.csv';
const JAPAN_REGIONS = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','香川県','徳島県','高知県','愛媛県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

// Genre to color mapping (Material Design colors for variety)
const GENRE_COLORS = {
  '寿司': '#E91E63',
  'すし': '#E91E63',
  '焼き鳥': '#FF6F00',
  '焼鳥': '#FF6F00',
  '焼肉': '#D32F2F',
  '中華料理': '#FBC02D',
  'うなぎ': '#7B1FA2',
  'フレンチ': '#1976D2',
  'イタリアン': '#388E3C',
  'スペイン料理': '#F57C00',
  '日本料理': '#C2185B',
  'とんかつ': '#FF5722',
  'バー': '#512DA8',
  'その他': '#757575'
};

const AVAILABLE_GENRE_JPGS = [
  'うどん', 'うなぎ', 'お好み焼き', 'すき焼き・しゃぶしゃぶ', 'そば', 'とんかつ',
  'アイス・ジェラート', 'アジア・エスニック', 'イタリアン', 'カフェ', 'カレー',
  'スペイン料理', 'スイーツ', 'ステーキ・鉄板焼き', 'ハンバーガー', 'バー', 'パン',
  'ピザ', 'フレンチ', 'ラーメン', '中国料理', '創作料理・イノベーティブ',
  '和菓子・甘味処', '喫茶店', '天ぷら', '寿司', '居酒屋', '日本料理', '洋食',
  '焼き鳥', '焼肉', '立ち飲み', '食堂', '餃子', '鳥料理'
];

let map;
let allPlaces = [];
let allMarkers = [];
let currentPosition = null;
let currentCircle = null;
let infoWindow;
let sidebarCollapsed = false;

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const decimal = rating - fullStars;
  let stars = "★".repeat(fullStars);
  if (decimal > 0) {
    stars += "☆";
    stars += "☆".repeat(4 - fullStars);
  } else {
    stars += "☆".repeat(5 - fullStars);
  }
  return stars;
}

function parsePrice(priceStr){
  if(!priceStr) return null;
  const m = priceStr.replace(/,|\s|\u00A0/g,'').match(/(\d+)/);
  if(!m) return null;
  return parseInt(m[1],10);
}

function haversine(lat1,lon1,lat2,lon2){
  function toRad(v){return v*Math.PI/180}
  const R=6371;
  const dLat=toRad(lat2-lat1); const dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return R*c;
}

function getMarkerColor(mainGenre){
  return GENRE_COLORS[mainGenre] || GENRE_COLORS['その他'];
}

// Canvas-processed circular icon cache
const GENRE_ICON_CACHE = {};

function loadImage(url){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>resolve(img);
    img.onerror = (e)=>reject(e);
    img.src = url;
  });
}

function createCircularIconFromImage(img, size){
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size/2;
  const cy = size/2;
  const radius = size/2;

  ctx.clearRect(0,0,size,size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI*2);
  ctx.closePath();
  ctx.clip();

  // Draw the image cover-style (cover the circle)
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(size/iw, size/ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (size - dw) / 2;
  const dy = (size - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  // Add subtle white border
  ctx.beginPath();
  ctx.arc(cx, cy, radius-1.5, 0, Math.PI*2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

// Dynamic genre JPG mapping - built from available markers


const UNMATCHABLE_GENRES = new Set();

function prepareGenreIcons(){
  const DISPLAY_SIZE = 128;
  const genreImageMap = {};
  
  // Build dynamic mapping from available JPG files
  AVAILABLE_GENRE_JPGS.forEach(genre=>{
    genreImageMap[genre] = `/assets/markers/${genre}.jpg`;
  });

  const urlToKeys = {};
  Object.keys(genreImageMap).forEach(k=>{
    const url = genreImageMap[k];
    urlToKeys[url] = urlToKeys[url] || [];
    urlToKeys[url].push(k);
  });

  const promises = Object.keys(urlToKeys).map(url=>{
    return loadImage(url).then(img=>{
      const dataUrl = createCircularIconFromImage(img, DISPLAY_SIZE);
      urlToKeys[url].forEach(k=>{ GENRE_ICON_CACHE[k] = dataUrl; });
    }).catch(err=>{
      console.warn('Failed to load icon', url, err);
    });
  });

  return Promise.all(promises);
}

function createColoredMarker(position, title, color, awardGenre){
  const DISPLAY_SIZE = 64;

  // If we already prepared a circular dataURL for this genre, use it
  if(GENRE_ICON_CACHE[awardGenre]){
    return {
      url: GENRE_ICON_CACHE[awardGenre],
      size: new google.maps.Size(DISPLAY_SIZE, DISPLAY_SIZE),
      scaledSize: new google.maps.Size(DISPLAY_SIZE, DISPLAY_SIZE),
      anchor: new google.maps.Point(DISPLAY_SIZE / 2, DISPLAY_SIZE / 2)
    };
  }

  // Track unmatchable genres
  if(awardGenre && !UNMATCHABLE_GENRES.has(awardGenre) && !AVAILABLE_GENRE_JPGS.includes(awardGenre)){
    UNMATCHABLE_GENRES.add(awardGenre);
  }

  // Fallback to colored circle for unmatched genres
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${DISPLAY_SIZE}" height="${DISPLAY_SIZE}" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  const dataURI = 'data:image/svg+xml;base64,' + btoa(svg);
  return {
    url: dataURI,
    size: new google.maps.Size(DISPLAY_SIZE, DISPLAY_SIZE),
    scaledSize: new google.maps.Size(DISPLAY_SIZE, DISPLAY_SIZE),
    anchor: new google.maps.Point(Math.round(DISPLAY_SIZE/2), DISPLAY_SIZE)
  };
};


function makeInfoHtml(p){
  const title = p.restaurant_name || p.name || '';
  const rating = p.rating? `<div>Rating: <span style="color: #f4a460;">${generateStars(p.rating)}</span> ${p.rating} / ${p.rating_users || 0} </div>`: '';
  const mainGenre = p.main_genre? `<div>Genre: ${p.main_genre}</div>`: '';
  // const addr = p.address_region? `<div>Region: ${p.address_region} ${p.address_locality || ''}</div>`: '';
  const priceRange = p.price_range? `<div>Price Range: ${p.price_range}</div>`: '';
  const img = p.image? `<img data-src="${p.image}" style="max-width:200px;display:block;margin-top:6px;"/>` : '';
  const reservationStatus = p.reservation_status? `<div>Reservation Status: ${p.reservation_status}</div>`: '';
  const link = p.tabelog_site? `<div><a href="${p.tabelog_site}" target="_blank" rel="noopener">Tabelog Site</a></div>`: '';
  return `<div>${img}<h3>${title}</h3>${mainGenre}${rating}${priceRange}${reservationStatus}${link}</div>`;
}

function addMarkersForPlaces(places){
  allMarkers.forEach(m=>m.setMap(null));
  allMarkers = [];
  places.forEach(p=>{
    if(!p.lat || !p.lng) return;
    const pos = {lat: Number(p.lat), lng: Number(p.lng)};
    const color = getMarkerColor(p.main_genre);
    const icon = createColoredMarker(pos, p.restaurant_name || p.name, color, p.award_selections_genre);
    const marker = new google.maps.Marker({position: pos, map: map, title: p.restaurant_name || p.name, icon});
    marker._place = p;
    marker.addListener('click', ()=>{
      const content = makeInfoHtml(p);
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
      setTimeout(()=>{
        const iw = document.querySelector('.gm-style-iw');
        if(iw){
          const imgs = iw.querySelectorAll('img[data-src]');
          imgs.forEach(img=>{ if(!img.src) img.src = img.dataset.src; });
        }
      }, 50);
    });
    allMarkers.push(marker);
  });
  console.log('Markers added:', allMarkers.length);
}

function buildCheckboxes(list, containerId, key, options = {}){
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const uniq = Array.from(new Set(list.map(x=>x[key]).filter(Boolean)));
  let sorted = uniq;
  
  if(key === 'address_region'){
    sorted = uniq.sort((a,b)=>JAPAN_REGIONS.indexOf(a)-JAPAN_REGIONS.indexOf(b));
  } else if(key === 'price_range'){
    // Sort price ranges by numeric value
    sorted = uniq.map(v => ({val: v, num: parsePrice(v) || 0}))
      .sort((a,b) => a.num - b.num)
      .map(x => x.val);
  } else {
    sorted = uniq.sort();
  }
  
  sorted.forEach(v=>{
    const div = document.createElement('div');
    div.className = 'checkbox-item';
    const id = `${key}_${v.replace(/\s|[^\w]/g,'_')}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.value = v;
    checkbox.dataset.filterKey = key;
    
    // Add auto-apply listener
    checkbox.addEventListener('change', applyFilters);
    
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = v;
    div.appendChild(checkbox);
    div.appendChild(label);
    container.appendChild(div);
  });
}

function getSelectedCheckboxes(containerId){
  const container = document.getElementById(containerId);
  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb=>cb.value);
}

function applyFilters(){
  const regions = getSelectedCheckboxes('regionCheckboxes');
  const genres = getSelectedCheckboxes('genreCheckboxes');
  const prices = getSelectedCheckboxes('priceCheckboxes');
  const reservations = getSelectedCheckboxes('reservationCheckboxes');
  const showNearby = document.getElementById('showNearby').checked;
  const radiusKm = Number(document.getElementById('radius').value);

  let filtered = allPlaces.filter(p=>p.lat && p.lng);
  if(regions.length > 0) filtered = filtered.filter(p=>regions.includes(p.address_region));
  if(genres.length > 0) filtered = filtered.filter(p=>genres.includes(p.main_genre));
  if(prices.length > 0) filtered = filtered.filter(p=>prices.includes(p.price_range));
  if(reservations.length > 0) filtered = filtered.filter(p=>reservations.includes(p.reservation_status));
  if(showNearby && currentPosition){
    const [lat, lng] = currentPosition;
    filtered = filtered.filter(p=>{
      const d = haversine(lat,lng,Number(p.lat),Number(p.lng));
      return d <= radiusKm;
    });
  }
  addMarkersForPlaces(filtered);
}

function resetFilters(){
  document.querySelectorAll('#regionCheckboxes input[type="checkbox"]').forEach(cb=>cb.checked=false);
  document.querySelectorAll('#genreCheckboxes input[type="checkbox"]').forEach(cb=>cb.checked=false);
  document.querySelectorAll('#priceCheckboxes input[type="checkbox"]').forEach(cb=>cb.checked=false);
  document.querySelectorAll('#reservationCheckboxes input[type="checkbox"]').forEach(cb=>cb.checked=false);
  
  document.getElementById('showNearby').checked=false;
  document.getElementById('radius').value=10;
  document.getElementById('radiusVal').textContent='10';
  addMarkersForPlaces(allPlaces);
}

document.getElementById('resetBtn').addEventListener('click', resetFilters);
document.getElementById('radius').addEventListener('input', e=>{ 
  document.getElementById('radiusVal').textContent = e.target.value;
  applyFilters();
});
document.getElementById('showNearby').addEventListener('change', applyFilters);

document.getElementById('locateBtn').addEventListener('click', ()=>{
  if(!navigator.geolocation){ alert('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    currentPosition = [pos.coords.latitude, pos.coords.longitude];
    map.setCenter({lat: currentPosition[0], lng: currentPosition[1]});
    map.setZoom(13);
    if(currentCircle) currentCircle.setMap(null);
    currentCircle = new google.maps.Circle({center:{lat: currentPosition[0], lng: currentPosition[1]}, radius: Number(document.getElementById('radius').value)*1000, strokeColor:'#5B7FFF', fillOpacity:0.08, strokeWeight:2, map});
  }, err=>{ alert('位置情報が取得できませんでした: '+err.message); });
});

window.initMap = function(){
  map = new google.maps.Map(document.getElementById('map'), {center:{lat:36.0,lng:138.0}, zoom:5});
  infoWindow = new google.maps.InfoWindow({maxWidth:320});

  // 设置展开按钮的位置
  const expandBtn = document.getElementById('expandSidebar');
  expandBtn.style.position = 'fixed';
  expandBtn.style.left = '8px';
  expandBtn.style.top = '60px';
  expandBtn.style.zIndex = '999';

  // Toggle sidebar
  document.getElementById('toggleSidebar').addEventListener('click', ()=>{
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    sidebarCollapsed = !sidebarCollapsed;
  });

  // Expand sidebar from button
  document.getElementById('expandSidebar').addEventListener('click', ()=>{
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('collapsed');
    sidebarCollapsed = false;
  });

  console.log('initMap called, loading CSV...');
  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results){
      console.log('CSV parsed rows:', results.data.length);
      allPlaces = results.data.map(r=>({
        restaurant_name: r.restaurant_name || r.name,
        rating: r.rating,
        rating_users: r.rating_users,
        main_genre: r.main_genre,
        award_selections_genre: r.award_selections_genre,
        address_region: r.address_region,
        address_locality: r.address_locality,
        lat: r.lat,
        lng: r.lng,
        reservation_status: r.reservation_status,
        image: r.image,
        price_range: r.price_range || r.dinner_budget || r.lunch_budget,
        tabelog_site: r.tabelog_site,
        lunch_budget: r.lunch_budget,
        dinner_budget: r.dinner_budget
      }));

      buildCheckboxes(allPlaces, 'regionCheckboxes', 'address_region');
      buildCheckboxes(allPlaces, 'genreCheckboxes', 'main_genre');
      buildCheckboxes(allPlaces, 'priceCheckboxes', 'price_range');
      buildCheckboxes(allPlaces, 'reservationCheckboxes', 'reservation_status');
      // Prepare circular icons (Canvas) first, then add markers. If preparation fails, still add markers.
      prepareGenreIcons().then(()=>{
        addMarkersForPlaces(allPlaces);
        console.log('Init complete (icons prepared)');
        if(UNMATCHABLE_GENRES.size > 0){
          console.warn('⚠️ 以下の award_selections_genre は対応する JPG ファイルが見つかりません:', Array.from(UNMATCHABLE_GENRES));
        }
      }).catch(()=>{
        addMarkersForPlaces(allPlaces);
        console.log('Init complete (icons preparation failed)');
      });
    }
  });
};

