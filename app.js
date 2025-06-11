// ========== KALICI VERİ (LocalStorage) ==========

// Kargo verisini LocalStorage'dan yükle/kaydet
function loadCargos() {
    try {
      return JSON.parse(localStorage.getItem("cargos") || "[]");
    } catch {
      return [];
    }
  }
  function saveCargos() {
    localStorage.setItem("cargos", JSON.stringify(cargos));
  }
  
  // Yorumları ve puanları takip numarasına göre sakla
  function loadComments(trackingNo) {
    return JSON.parse(localStorage.getItem("comments_" + trackingNo) || "[]");
  }
  function saveComments(trackingNo, comments) {
    localStorage.setItem("comments_" + trackingNo, JSON.stringify(comments));
  }
  
  // Dummy başlangıç verisi (ilk açılışta sadece bir kere setlenir)
  let cargos = loadCargos();
  if (!cargos || cargos.length === 0) {
    cargos = [
      {
        trackingNo: 'TR20240001',
        receiver: 'Ayşe Yılmaz',
        address: 'Istanbul, Kadıköy',
        status: 'Yolda',
        location: 'İstanbul'
      },
      {
        trackingNo: 'TR20240002',
        receiver: 'Mehmet Demir',
        address: 'Ankara, Çankaya',
        status: 'Dağıtımda',
        location: 'Ankara'
      },
      {
        trackingNo: 'TR20240003',
        receiver: 'Elif Kılıç',
        address: 'İzmir, Bornova',
        status: 'Teslim Edildi',
        location: 'İzmir'
      }
    ];
    saveCargos();
  }
  
  // ========== STAT KARTLARI ==========
  function updateStats() {
    document.getElementById('totalCount').innerText = cargos.length;
    document.getElementById('deliveredCount').innerText = cargos.filter(c => c.status === 'Teslim Edildi').length;
    document.getElementById('onWayCount').innerText = cargos.filter(c => c.status === 'Yolda').length;
    document.getElementById('outForDeliveryCount').innerText = cargos.filter(c => c.status === 'Dağıtımda').length;
  }
  
  // ========== BADGE RENKLERİ ==========
  function getStatusBadgeClass(status) {
    if (status === 'Yolda') return 'badge-status yolda';
    if (status === 'Dağıtımda') return 'badge-status dagitimda';
    if (status === 'Teslim Edildi') return 'badge-status teslim';
    return 'badge-status';
  }
  
  // ========== KARGO LİSTELEME ==========
  function renderCargos() {
    const list = document.getElementById('cargoList');
    list.innerHTML = "";
  
    // Arama & filtre
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
  
    let filtered = cargos.filter(cargo => {
      const matchSearch = cargo.trackingNo.toLowerCase().includes(searchValue) ||
                          cargo.receiver.toLowerCase().includes(searchValue);
      const matchStatus = !statusFilter || cargo.status === statusFilter;
      return matchSearch && matchStatus;
    });
  
    if (filtered.length === 0) {
      list.innerHTML = `<div class="col-12 text-center text-muted py-4">Hiç kargo bulunamadı.</div>`;
      return;
    }
  
    filtered.forEach((cargo, i) => {
      list.innerHTML += `
        <div class="col-md-6 col-lg-4">
          <div class="cargo-card d-flex flex-column h-100">
            <div>
              <span class="cargo-title">#${cargo.trackingNo}</span>
              <span class="${getStatusBadgeClass(cargo.status)} cargo-status">${cargo.status}</span>
            </div>
            <div class="mt-2 mb-1"><strong>Alıcı:</strong> ${cargo.receiver}</div>
            <div class="mb-1"><strong>Adres:</strong> ${cargo.address}</div>
            <div class="mt-auto text-end">
              <button class="btn btn-outline-primary btn-sm" onclick="showCargoDetail(${i})">
                Detay & Harita
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  // ========== KARGO DETAY + HARİTA + YORUM ALANI ==========
  function showCargoDetail(index) {
    const cargo = cargos[index];
    const modalBody = document.getElementById('cargoDetailBody');
    const addressQuery = `${cargo.address}, ${cargo.location}`;
    const comments = loadComments(cargo.trackingNo);
  
    // Adres, statü vs.
    modalBody.innerHTML = `
      <div>
        <div class="mb-2"><strong>Takip Numarası:</strong> ${cargo.trackingNo}</div>
        <div class="mb-2"><strong>Alıcı:</strong> ${cargo.receiver}</div>
        <div class="mb-2"><strong>Adres:</strong> ${cargo.address}</div>
        <div class="mb-2"><strong>Durum:</strong> <span class="${getStatusBadgeClass(cargo.status)}">${cargo.status}</span></div>
        <div class="mb-2"><strong>Şehir/Konum:</strong> ${cargo.location}</div>
        <div class="text-center text-muted my-3" id="mapLoading">Harita yükleniyor...</div>
        <div class="cargo-detail-map mt-3 mb-2" id="osmMapBox"></div>
        <div id="commentsSection"></div>
      </div>
    `;
  
    // Modalı aç
    const detailModal = new bootstrap.Modal(document.getElementById('cargoDetailModal'));
    detailModal.show();
  
    // HARİTA yükle (adresin tamına göre marker ile)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`)
  .then(response => response.json())
  .then(data => {
    if (data && data.length > 0) {
      const lat = Number(data[0].lat);
      const lon = Number(data[0].lon);
      const bbox = [
        lon - 0.02,
        lat - 0.01,
        lon + 0.02,
        lat + 0.01
      ].join(',');
      const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
      document.getElementById('osmMapBox').innerHTML = `
        <iframe width="100%" height="230" frameborder="0" scrolling="no"
          src="${mapSrc}"></iframe>
      `;
      document.getElementById('mapLoading').remove();
    } else {
      document.getElementById('osmMapBox').innerHTML = `<div class="text-danger">Harita bulunamadı.</div>`;
      document.getElementById('mapLoading').remove();
    }
  })
  .catch(() => {
    document.getElementById('osmMapBox').innerHTML = `<div class="text-danger">Harita yüklenirken hata oluştu.</div>`;
    document.getElementById('mapLoading').remove();
  });
  
    // ========== YORUM ALANI ==========
    const commentArea = document.getElementById('commentsSection');
    // Sadece Teslim Edildi ise aktif, değilse gri/kitli görünüm!
    if (cargo.status === "Teslim Edildi") {
      // Ortalama puan
      let avg = 0;
      if (comments.length > 0) {
        avg = (comments.reduce((acc, c) => acc + (c.rating || 0), 0) / comments.length).toFixed(1);
      }
      commentArea.innerHTML = `
        <div class="mb-2 mt-4"><strong>Kullanıcı Yorumları:</strong></div>
        <div class="mb-2">${avg > 0 ? `<span class="text-warning fs-5">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</span> <span class="ms-2 fw-bold">${avg}/5</span>` : `<span class="text-muted">Henüz puan yok.</span>`}</div>
        <ul id="commentsList" class="list-group mb-3">
          ${comments.length === 0 ? "<li class='list-group-item text-muted'>Henüz yorum yok.</li>" : comments.map(comment => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <span>${comment.text}</span>
              <span class="text-warning">${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}</span>
            </li>
          `).join("")}
        </ul>
        <form id="commentForm" class="d-flex align-items-center mb-2">
          <input type="text" class="form-control me-2" id="commentInput" maxlength="120" placeholder="Yorumunuzu yazın..." required>
          <div id="starRating" class="me-2">
            ${[1,2,3,4,5].map(i => `<span class="star fs-3" data-rate="${i}" style="cursor:pointer;">☆</span>`).join('')}
          </div>
          <button type="submit" class="btn btn-orange">Ekle</button>
        </form>
      `;
  
      // Yıldız rating interaktivite
      let selectedRating = 5;
      const stars = document.querySelectorAll('#starRating .star');
      stars.forEach(star => {
        star.addEventListener('mouseenter', function() {
          let rate = Number(this.dataset.rate);
          stars.forEach((s, idx) => { s.textContent = idx < rate ? '★' : '☆'; });
        });
        star.addEventListener('mouseleave', function() {
          stars.forEach((s, idx) => { s.textContent = idx < selectedRating ? '★' : '☆'; });
        });
        star.addEventListener('click', function() {
          selectedRating = Number(this.dataset.rate);
          stars.forEach((s, idx) => { s.textContent = idx < selectedRating ? '★' : '☆'; });
        });
      });
  
      // Yorum ekleme eventi
      document.getElementById("commentForm").addEventListener("submit", function(e){
        e.preventDefault();
        const val = document.getElementById("commentInput").value.trim();
        if(val.length > 1 && selectedRating > 0) {
          comments.push({ text: val, rating: selectedRating });
          saveComments(cargo.trackingNo, comments);
          showCargoDetail(index); // Modalı güncelle
        }
      });
  
    } else {
      // Gri ve kilitli alan
      commentArea.innerHTML = `
        <div class="mb-2 mt-4"><strong>Kullanıcı Yorumları:</strong></div>
        <div class="alert alert-secondary d-flex align-items-center" style="opacity:0.65;">
          <span class="me-2 fs-3">🔒</span> 
          Yorum ve puan bırakmak için kargo <b>"Teslim Edildi"</b> olmalı.
        </div>
      `;
    }
  }
  
  // ========== KARGO EKLEME ==========
  document.getElementById('addCargoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const trackingNo = document.getElementById('trackingNo').value.trim();
    const receiver = document.getElementById('receiver').value.trim();
    const address = document.getElementById('address').value.trim();
    const status = document.getElementById('status').value;
    const location = document.getElementById('location').value.trim();
  
    // Takip numarası eşsiz olsun
    if (cargos.some(c => c.trackingNo === trackingNo)) {
      alert('Bu takip numarası zaten var!');
      return;
    }
  
    cargos.push({ trackingNo, receiver, address, status, location });
    saveCargos();
  
    this.reset();
    bootstrap.Modal.getInstance(document.getElementById('addCargoModal')).hide();
  
    updateStats();
    renderCargos();
  });
  
  // ========== ARAMA/FİLTRE ==========
  document.getElementById('searchInput').addEventListener('input', renderCargos);
  document.getElementById('statusFilter').addEventListener('change', renderCargos);
  
  // ========== İLK YÜKLEME ==========
  updateStats();
  renderCargos();
  