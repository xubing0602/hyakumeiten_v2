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

// Genre Chinese translations (for bilingual display)
const GENRE_CN_MAPPING = {
    '甜点与面包': {
        'パン': '面包',
        'ケーキ': '蛋糕',
        'スイーツ': '甜点',
        '和菓子': '日式点心',
        'ジェラート・アイスクリーム': '意式冰淇淋・冰淇淋',
        'チョコレート': '巧克力',
        '甘味処': '日式甜品店',
        'かき氷': '刨冰',
        '洋菓子': '西式甜点',
        'ドーナツ': '甜甜圈',
        'ベーグル': '贝果',
        'たい焼き・大判焼き': '鲷鱼烧・今川烧',
        '焼き芋・大学芋': '烤红薯・拔丝红薯',
        'マカロン': '马卡龙',
        'フルーツパーラー': '水果甜品店',
        'バームクーヘン': '年轮蛋糕',
        'クレープ・ガレット': '可丽饼・法式薄饼',
        'パンケーキ': '松饼',
        '中華菓子': '中式点心',
        'ソフトクリーム': '软冰淇淋',
        'カステラ': '长崎蛋糕',
        'プリン': '布丁',
        'せんべい': '仙贝',
        'どら焼き': '铜锣烧',
    },
    '日本料理': {
        '寿司': '寿司',
        'うなぎ': '鳗鱼',
        '日本料理': '日本料理',
        '料理旅館': '料理旅馆',
        '天ぷら': '天妇罗',
        '海鮮': '海鲜',
        '棒寿司': '棒寿司',
        '郷土料理': '乡土料理',
        '回転寿司': '回转寿司',
        '豆腐料理': '豆腐料理',
        '立ち食い寿司': '立食寿司',
        '食堂': '大众食堂',
        '立ち飲み': '立饮居酒屋',
        '居酒屋': '居酒屋',
        'スープカレー': '汤咖喱'
    },
    '面类与粉物': {
        'うどん': '乌冬面',
        'カレーうどん': '咖喱乌冬',
        'ラーメン': '拉面',
        'そば': '荞麦面',
        'お好み焼き': '御好烧',
        '冷麺': '冷面',
        'つけ麺': '蘸面',
        '沖縄そば': '冲绳面',
        '立ち食いそば': '立食荞麦面',
        '担々麺': '担担面',
        '油そば・まぜそば': '油面・拌面'
    },
    '肉料理': {
        'しゃぶしゃぶ': '涮涮锅',
        'とんかつ': '炸猪排',
        'すき焼き': '寿喜烧',
        '牛料理': '牛肉料理',
        '焼き鳥': '烧鸟',
        '焼肉': '烧肉',
        '豚しゃぶ': '猪肉涮涮锅',
        'ステーキ': '牛排',
        'ホルモン': '内脏',
        '鉄板焼き': '铁板烧',
        'シュラスコ': '巴西烤肉',
        '牛タン': '牛舌',
        '鳥料理': '鸡肉料理'
    },
    '西餐与洋食': {
        'スペイン料理': '西班牙菜',
        'イタリアン': '意大利菜',
        'フレンチ': '法国菜',
        'ハンバーガー': '汉堡',
        'ピザ': '披萨',
        '洋食': '日式西餐',
        'ハンバーグ': '汉堡排',
        'ビストロ': '小酒馆',
        'スープ': '汤品',
        'オムライス': '蛋包饭',
        'コロッケ': '可乐饼',
        'イノベーティブ': '创新菜',
        '創作料理': '创意料理',
        'カレー': '咖喱'
    },
    '世界料理': {
        '中華料理': '中华料理',
        '四川料理': '四川菜',
        '韓国料理': '韩国菜',
        'インドカレー': '印度咖喱',
        'インド料理': '印度菜',
        'タイ料理': '泰国菜',
        '餃子': '饺子',
        'ベトナム料理': '越南菜',
        '南アジア料理': '南亚菜',
        '飲茶・点心': '饮茶・点心',
        'スリランカ料理': '斯里兰卡菜',
        'パキスタン料理': '巴基斯坦菜',
        '台湾料理': '台湾菜',
        'アジア・エスニック': '亚洲・民族特色菜',
        'ネパール料理': '尼泊尔菜',
        'シンガポール料理': '新加坡菜',
        '東南アジア料理': '东南亚菜',
        'インドネシア料理': '印尼菜',
        'バインミー': '越南法包',
        'ペルー料理': '秘鲁菜',
        'タコス': '塔可',
        'トルコ料理': '土耳其菜',
        '中東料理': '中东菜',
        'メキシコ料理': '墨西哥菜',
        'モロッコ料理': '摩洛哥菜',
        'アフリカ料理': '非洲菜',
        '中南米料理': '中南美料理',
        'ブラジル料理': '巴西菜'
    },
    '咖啡与酒': {
        'バー': '酒吧',
        '喫茶店': '咖啡馆',
        'ジューススタンド': '果汁摊',
        'カフェ': '咖啡店',
        'コーヒースタンド': '咖啡摊',
        'ワインバー': '红酒吧'
    }
};

// Function to get display text for genre (Chinese - Japanese)
function getGenreDisplayName(jpName) {
  const cn = GENRE_CN_MAPPING[jpName];
  if(cn) {
    return `${cn} - ${jpName}`;
  }
  return jpName;
}

// Sort genres by Chinese characters (using localeCompare for Chinese)
function sortByChinese(a, b) {
  const aCn = GENRE_CN_MAPPING[a] || a;
  const bCn = GENRE_CN_MAPPING[b] || b;
  return aCn.localeCompare(bCn, 'zh-CN');
}

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

const UNMATCHABLE_GENRES = new Set();

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

function prepareGenreIcons(){
  const DISPLAY_SIZE = 128;
  const genreImageMap = {};
  
  // Build dynamic mapping from available JPG files
  AVAILABLE_GENRE_JPGS.forEach(genre=>{
    genreImageMap[genre] = `./assets/markers/${encodeURIComponent(genre)}.jpg`;
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
  const rating = p.rating? `<div class="info-rating"><span class="label">评分:</span><span class="stars">${generateStars(p.rating)}</span>${p.rating} / ${p.rating_users || 0}</span></div>`: '';
  const mainGenre = p.main_genre? `<div class="info-genre"><span class="label">类别:</span> ${p.main_genre}</div>`: '';
  const priceRange = p.price_range? `<div class="info-price"><span class="label">人均消费:</span> ${p.price_range}</div>`: '';
  const img = p.image? `<img data-src="${p.image}" class="info-image"/>` : '';
  const reservationStatus = p.reservation_status? `<div class="info-reservation"><span class="label">预约要求:</span> ${p.reservation_status}</div>`: '';
  const link = p.tabelog_site? `<a href="${p.tabelog_site}" target="_blank" rel="noopener" class="info-link">Tabelog</a>`: '';
  return `<div class="info-window">
    ${img}
    <h3 class="info-title">${title}</h3>
    ${mainGenre}
    ${rating}
    ${priceRange}
    ${reservationStatus}
    ${link ? `<div class="info-footer">${link}</div>` : ''}
  </div>`;
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
  // Update result count display
  const countEl = document.getElementById('resultCount');
  if(countEl){
    countEl.textContent = `符合要求: ${allMarkers.length} 家餐厅`;
  }
  console.log('Markers added:', allMarkers.length);
}

function buildCheckboxes(list, containerId, key, options = {}){
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  let uniq = Array.from(new Set(list.map(x=>x[key]).filter(x => x !== null && x !== undefined && x !== '')));
  
  // Handle empty values for reservation_status and price_range
  const hasEmptyValue = list.some(x => !x[key] || x[key] === '');
  if(hasEmptyValue && (key === 'reservation_status' || key === 'price_range')){
    uniq.push('UNKNOWN_PLACEHOLDER');
  }
  
  // Special handling for main_genre: build grouped structure
  if(key === 'main_genre'){
    // Category order
    const categoryOrder = ['日本料理','面类与粉物','肉料理','西餐与洋食','世界料理','甜点与面包','咖啡与酒'];
    
    categoryOrder.forEach(category => {
      const subgenres = GENRE_CN_MAPPING[category];
      if(!subgenres) return;
      
      // Check if any subgenre is in our data
      const availableSubgenres = Object.keys(subgenres).filter(sg => uniq.includes(sg));
      if(availableSubgenres.length === 0) return;
      
      // Create category header with checkbox
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'genre-category';
      
      const categoryCheckbox = document.createElement('input');
      categoryCheckbox.type = 'checkbox';
      categoryCheckbox.id = `category_${category}`;
      categoryCheckbox.dataset.category = category;
      categoryCheckbox.className = 'category-checkbox';
      
      const categoryLabel = document.createElement('label');
      categoryLabel.htmlFor = `category_${category}`;
      categoryLabel.textContent = category;
      categoryLabel.className = 'category-label';
      
      categoryCheckbox.addEventListener('change', (e) => {
        // Toggle all subgenres in this category
        const checkboxes = container.querySelectorAll(`.subgenre-checkbox[data-category="${category}"]`);
        checkboxes.forEach(cb => {
          cb.checked = e.target.checked;
        });
        applyFilters();
      });
      
      categoryDiv.appendChild(categoryCheckbox);
      categoryDiv.appendChild(categoryLabel);
      container.appendChild(categoryDiv);
      
      // Sort subgenres by Chinese
      const sortedSubgenres = availableSubgenres.sort((a, b) => {
        const aCn = subgenres[a];
        const bCn = subgenres[b];
        return aCn.localeCompare(bCn, 'zh-CN');
      });
      
      // Add subgenres
      sortedSubgenres.forEach(subgenre => {
        const div = document.createElement('div');
        div.className = 'checkbox-item subgenre-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `subgenre_${subgenre}`;
        checkbox.value = subgenre;
        checkbox.dataset.filterKey = key;
        checkbox.dataset.category = category;
        checkbox.className = 'subgenre-checkbox';
        
        checkbox.addEventListener('change', () => {
          // Update category checkbox state
          const allCheckboxes = container.querySelectorAll(`.subgenre-checkbox[data-category="${category}"]`);
          const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
          const categoryCheckbox = container.querySelector(`#category_${category}`);
          categoryCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
          categoryCheckbox.checked = checkedCount === allCheckboxes.length;
          applyFilters();
        });
        
        const displayValue = `${subgenres[subgenre]} - ${subgenre}`;
        const label = document.createElement('label');
        label.htmlFor = `subgenre_${subgenre}`;
        label.textContent = displayValue;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
      });
    });
    return;
  }
  
  let sorted = uniq;
  
  if(key === 'address_region'){
    sorted = uniq.sort((a,b)=>JAPAN_REGIONS.indexOf(a)-JAPAN_REGIONS.indexOf(b));
  } else if(key === 'price_range'){
    // Sort price ranges by numeric value, handling UNKNOWN_PLACEHOLDER
    sorted = uniq.filter(v => v !== 'UNKNOWN_PLACEHOLDER')
      .map(v => ({val: v, num: parsePrice(v) || 0}))
      .sort((a,b) => a.num - b.num)
      .map(x => x.val);
    // Add UNKNOWN at the end if present
    if(uniq.includes('UNKNOWN_PLACEHOLDER')){
      sorted.push('UNKNOWN_PLACEHOLDER');
    }
  } else {
    sorted = uniq.sort();
  }
  
  sorted.forEach(v=>{
    const div = document.createElement('div');
    div.className = 'checkbox-item';
    let displayValue = v;
    if(v === 'UNKNOWN_PLACEHOLDER'){
      displayValue = '未知';
    } else if(v.replace(/&nbsp;/g, ' ').trim() === ''){
      displayValue = '未知';
    } else {
      displayValue = v.replace(/&nbsp;/g, ' ').trim();
    }
    
    const id = `${key}_${displayValue.replace(/\s|[^\w]/g,'_')}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.value = v === 'UNKNOWN_PLACEHOLDER' ? '' : v;
    checkbox.dataset.filterKey = key;
    
    // Add auto-apply listener
    checkbox.addEventListener('change', applyFilters);
    
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = displayValue;
    div.appendChild(checkbox);
    div.appendChild(label);
    container.appendChild(div);
  });
}

function getSelectedCheckboxes(containerId){
  const container = document.getElementById(containerId);
  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes)
    .filter(cb => !cb.classList.contains('category-checkbox')) // Exclude category checkboxes
    .map(cb=>cb.value);
}

function applyFilters(){
  const regions = getSelectedCheckboxes('regionCheckboxes');
  const genres = getSelectedCheckboxes('genreCheckboxes');
  const prices = getSelectedCheckboxes('priceCheckboxes');
  const reservations = getSelectedCheckboxes('reservationCheckboxes');
  const minRating = Number(document.getElementById('ratingSlider').value);
  const showNearby = document.getElementById('showNearby').checked;
  const radiusKm = Number(document.getElementById('radius').value);

  let filtered = allPlaces.filter(p=>p.lat && p.lng);
  if(regions.length > 0) filtered = filtered.filter(p=>regions.includes(p.address_region));
  if(genres.length > 0) filtered = filtered.filter(p=>genres.includes(p.main_genre));
  if(prices.length > 0) filtered = filtered.filter(p=>{
    const hasEmpty = prices.includes('');
    const hasNonEmpty = prices.some(pr => pr !== '');
    if(hasEmpty && hasNonEmpty){
      return prices.includes(p.price_range) || !p.price_range;
    } else if(hasEmpty){
      return !p.price_range;
    } else {
      return prices.includes(p.price_range);
    }
  });
  if(reservations.length > 0) filtered = filtered.filter(p=>{
    const hasEmpty = reservations.includes('');
    const hasNonEmpty = reservations.some(r => r !== '');
    if(hasEmpty && hasNonEmpty){
      return reservations.includes(p.reservation_status) || !p.reservation_status;
    } else if(hasEmpty){
      return !p.reservation_status;
    } else {
      return reservations.includes(p.reservation_status);
    }
  });
  // Filter by minimum rating
  filtered = filtered.filter(p=>{
    const rating = p.rating ? Number(p.rating) : 0;
    return rating >= minRating;
  });
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
  document.getElementById('ratingSlider').value=3.00;
  document.getElementById('ratingVal').textContent='3.00';
  addMarkersForPlaces(allPlaces);
}

document.getElementById('resetBtn').addEventListener('click', resetFilters);
document.getElementById('radius').addEventListener('input', e=>{ 
  document.getElementById('radiusVal').textContent = e.target.value;
  applyFilters();
});
document.getElementById('ratingSlider').addEventListener('input', e=>{
  document.getElementById('ratingVal').textContent = e.target.value;
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
  // Set favicon from asset folder
  const faviconHref = `/assets/favicon/v1.jpg`;
  document.getElementById('dynamicFavicon').href = faviconHref;
  
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

