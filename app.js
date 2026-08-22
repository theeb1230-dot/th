const CFG = {
  BASE_URL: "https://w.anaplayer.online/albaplayer/",
  MAX_SERVERS: 9,
  BUILD_URL: (base, slug, type, season, episode, server) => {
    const epPath = type === "tv" ? `-s${String(season).padStart(2, "0")}e${String(episode).padStart(2, "0")}` : "";
    return `${base}${slug}${epPath}/?serv=${server}`;
  }
};

// المكتبة المدمجة الأساسية المقفلة
const DEFAULT_DB = [
  {title:"📺 مسلسل وادي الذئاب (Kurtlar Vadisi Pusu)", slug:"kurtlar-vadisi-pusu", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:9},{n:2,eps:32},{n:3,eps:22}]},
  {title:"📺 مسلسل المنظمة (Teskilat)", slug:"teskilat", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:184}]},
  {title:"📺 مسلسل ثلاث قروش (Uc Kurus)", slug:"uc-kurus", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:28}]},
  {title:"📺 مسلسل رامو (Ramo)", slug:"ramo", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:40}]},
  {title:"📺 مسلسل قطاع طرق لن يحكموا العالم (Eskiya Dunyaya)", slug:"eskiya-dunyaya-hukumdar-olmaz", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:40},{n:2,eps:31},{n:3,eps:36},{n:4,eps:32},{n:5,eps:26},{n:6,eps:34}]},
  {title:"📺 مسلسل قيامة أرطغرل (Dirilis Ertugrul)", slug:"dirilis-ertugrul", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:150}]},
  {title:"📺 مسلسل المؤسس عثمان (Kurulus Osman)", slug:"kurulus-osman", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:194}]},
  {title:"📺 مسلسل الحفرة (Cukur)", slug:"cukur", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:33},{n:2,eps:34},{n:3,eps:26},{n:4,eps:39}]},
  {title:"📺 مسلسل الذئب الوحيد (Yalniz Kurt)", slug:"yalniz-kurt", type:"tv", isBuiltIn: true, seasons:[{n:1,eps:32}]},

  {title:"🎬 فيلم وادي الذئاب غلاديو (2009)", slug:"kurtlar-vadisi-gladstatus", type:"movie", isBuiltIn: true},
  {title:"🎬 فيلم وادي الذئاب الوطن (2017)", slug:"kurtlar-vadisi-vatan", type:"movie", isBuiltIn: true},
  {title:"🎬 فيلم وادي الذئاب فلسطين (2011)", slug:"kurtlar-vadisi-filistin", type:"movie", isBuiltIn: true},
  {title:"🎬 فيلم وادي الذئاب العراق (2006)", slug:"kurtlar-vadisi-irak", type:"movie", isBuiltIn: true}
];

const Storage = {
  getCustomCatalog(){
    const saved = localStorage.getItem("THEEB_CUSTOM_CATALOG");
    return saved ? JSON.parse(saved) : [];
  },
  saveCustomCatalog(data){
    localStorage.setItem("THEEB_CUSTOM_CATALOG", JSON.stringify(data));
  },
  getFavs(){
    return JSON.parse(localStorage.getItem("THEEB_FAVS") || "[]");
  },
  saveFavs(favs){
    localStorage.setItem("THEEB_FAVS", JSON.stringify(favs));
  },
  getHistory(){
    return JSON.parse(localStorage.getItem("THEEB_HISTORY") || "[]");
  },
  saveHistory(hist){
    localStorage.setItem("THEEB_HISTORY", JSON.stringify(hist));
  }
};

let customDB = Storage.getCustomCatalog();
let DB = [...customDB, ...DEFAULT_DB];

const State = {
  data: {type:"tv", slug:"kurtlar-vadisi-pusu", season:1, episode:1, server:1, currentShow:DB[0]},
  get(){return this.data},
  set(u){Object.assign(this.data, u)}
};

const UI = {
  els: {},
  init(){
    this.cache();
    this.renderCatalog();
    this.renderServers();
    this.initAdvSeasonSelect();
    this.bind();
    this.loadShow(DB[0]);
    this.fillAdvDefaults();
    this.updateFavButtonState();
  },
  cache(){
    ["videoPlayer","playerOverlay","catalogSelect","seasonSelect","episodeSelect","serverSelect","urlDisplay","quickServersBar","applyBtn","prevEpBtn","nextEpBtn","favToggleBtn","fullscreenBtn","copyUrlBtn","openUrlBtn","mobileModeBtn","mainLayout","seasonGroup","episodeGroup","advTypeSelect","advNameInput","advSeasonCountSelect","advSeasonCountGroup","advEpisodesGroup","advEpisodesContainer","advFetchBtn","advClearBtn","advResetBtn","favListBtn","historyBtn","manageCustomDbBtn","modalBackdrop","modalTitle","modalBody","modalCloseBtn","modalSearchBox","dbSearchInput","clearAllCustomBtn"].forEach(id => this.els[id] = document.getElementById(id));
  },
  initAdvSeasonSelect(){
    let opts = '';
    for(let i=1; i<=9; i++) opts += `<option value="${i}">الموسم ${i}</option>`;
    this.els.advSeasonCountSelect.innerHTML = opts;
    this.renderAdvEpisodeInputs(1);
  },
  renderAdvEpisodeInputs(count){
    let html = '';
    for(let i=1; i<=count; i++){
      html += `
        <div class="control-group">
          <label class="control-label">حلقات مـ ${i}</label>
          <input type="number" min="1" value="10" class="form-input adv-ep-input" data-season="${i}">
        </div>
      `;
    }
    this.els.advEpisodesContainer.innerHTML = html;
  },
  bind(){
    this.els.catalogSelect.addEventListener("change", e => {
      const show = DB[e.target.value];
      if(show){ 
        State.set({currentShow:show, slug:show.slug, type:show.type}); 
        this.loadShow(show); 
        Engine.load(); 
      }
    });
    this.els.seasonSelect.addEventListener("change", e => { 
      State.set({season: parseInt(e.target.value), episode: 1}); 
      this.renderEpisodes(); 
      Engine.load(); 
    });
    this.els.episodeSelect.addEventListener("change", e => { 
      State.set({episode: parseInt(e.target.value)}); 
      this.updateNavState();
      Engine.load(); 
    });
    this.els.serverSelect.addEventListener("change", e => { this.setServer(parseInt(e.target.value)); });
    
    this.els.applyBtn.addEventListener("click", () => Engine.load());
    this.els.nextEpBtn.addEventListener("click", () => this.navEp(1));
    this.els.prevEpBtn.addEventListener("click", () => this.navEp(-1));

    this.els.favToggleBtn.addEventListener("click", () => this.toggleFavorite());
    this.els.favListBtn.addEventListener("click", () => this.openFavModal());
    this.els.historyBtn.addEventListener("click", () => this.openHistoryModal());
    this.els.manageCustomDbBtn.addEventListener("click", () => this.openManageDbModal());

    this.els.modalCloseBtn.addEventListener("click", () => {
      this.els.modalBackdrop.classList.remove("active");
    });
    this.els.modalBackdrop.addEventListener("click", (e) => {
      if(e.target === this.els.modalBackdrop) this.els.modalBackdrop.classList.remove("active");
    });

    // البحث داخل تحرير المكتبة
    this.els.dbSearchInput.addEventListener("input", (e) => {
      this.renderCustomDbItems(e.target.value.trim().toLowerCase());
    });

    // مسح كافة العناصر المضافة
    this.els.clearAllCustomBtn.addEventListener("click", () => {
      if(confirm("هل أنت تأكد من إزالة جميع العناصر المضافة؟")){
        customDB = [];
        Storage.saveCustomCatalog(customDB);
        DB = [...customDB, ...DEFAULT_DB];
        this.renderCatalog();
        this.els.modalBackdrop.classList.remove("active");
        this.clearAdvInputs();
        this.loadShow(DB[0]);
        Engine.load();
      }
    });

    // الإعدادات المتقدمة
    this.els.advTypeSelect.addEventListener("change", e => {
      const isMovie = e.target.value === "movie";
      this.els.advSeasonCountGroup.classList.toggle("hidden", isMovie);
      this.els.advEpisodesGroup.classList.toggle("hidden", isMovie);
    });

    this.els.advSeasonCountSelect.addEventListener("change", e => {
      this.renderAdvEpisodeInputs(parseInt(e.target.value));
    });

    this.els.advFetchBtn.addEventListener("click", () => {
      const type = this.els.advTypeSelect.value;
      const slug = this.els.advNameInput.value.trim() || "custom-show";
      const title = (type === "movie" ? "🎬 " : "📺 ") + slug;

      let seasons = [];
      if(type === "tv"){
        const sCount = parseInt(this.els.advSeasonCountSelect.value);
        const epInputs = document.querySelectorAll('.adv-ep-input');
        epInputs.forEach((inp, idx) => {
          if(idx < sCount){
            seasons.push({n: idx+1, eps: parseInt(inp.value) || 10});
          }
        });
      }

      const newItem = { title, slug, type, seasons, isBuiltIn: false };
      
      // التخزين بالاعتماد على دالة المفتاح الفريد (Slug) لمنع التكرار
      const existingIndex = customDB.findIndex(item => item.slug === slug);
      if(existingIndex > -1){
        customDB[existingIndex] = newItem;
      } else {
        customDB.unshift(newItem);
      }

      Storage.saveCustomCatalog(customDB);
      DB = [...customDB, ...DEFAULT_DB];

      this.renderCatalog();
      const targetIdx = DB.findIndex(item => item.slug === slug);
      this.els.catalogSelect.value = targetIdx > -1 ? targetIdx : 0;
      State.set({currentShow: newItem, slug: newItem.slug, type: newItem.type, season:1, episode:1});
      this.loadShow(newItem);
      Engine.load();
      alert(existingIndex > -1 ? "تم تحديث بيانات العمل في المكتبة وتحديث المشغل!" : "تم سحب البيانات وإضافتها للمكتبة المضافة وتحديث المشغل تلقائياً!");
    });

    this.els.advClearBtn.addEventListener("click", () => {
      localStorage.removeItem("THEEB_FAVS");
      localStorage.removeItem("THEEB_HISTORY");
      this.updateFavButtonState();
      alert("تم مسح السجل والمفضلة المحفوظة بالمتصفح!");
    });

    this.els.advResetBtn.addEventListener("click", () => {
      localStorage.removeItem("THEEB_CUSTOM_CATALOG");
      customDB = [];
      DB = [...DEFAULT_DB];
      this.renderCatalog();
      this.fillAdvDefaults();
      this.loadShow(DB[0]);
      Engine.load();
      alert("تم مسح جميع العناصر المضافة وإعادة الضبط للافتراضي!");
    });

    this.els.mobileModeBtn.addEventListener("click", () => {
      this.els.mainLayout.classList.toggle("mobile-mode");
      this.els.mobileModeBtn.classList.toggle("active");
    });

    this.els.copyUrlBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(this.els.urlDisplay.textContent).then(() => alert("تم نسخ الرابط!"));
    });
    this.els.openUrlBtn.addEventListener("click", () => {
      window.open(this.els.urlDisplay.textContent, "_blank");
    });

    this.els.fullscreenBtn.addEventListener("click", () => {
      const el = document.getElementById('playerWrapper');
      if(!document.fullscreenElement) el.requestFullscreen(); else document.exitFullscreen();
    });
  },

  clearAdvInputs(){
    this.els.advTypeSelect.value = "tv";
    this.els.advTypeSelect.dispatchEvent(new Event('change'));
    this.els.advNameInput.value = "";
    this.els.advSeasonCountSelect.value = "1";
    this.renderAdvEpisodeInputs(1);
  },
  
  toggleFavorite(){
    const st = State.get();
    let favs = Storage.getFavs();
    const idx = favs.findIndex(f => f.slug === st.slug);
    
    if(idx > -1){
      favs.splice(idx, 1);
      alert("تم الإزالة من المفضلة");
    } else {
      favs.unshift({
        title: st.currentShow.title,
        slug: st.slug,
        type: st.type
      });
      alert("تمت الإضافة إلى المفضلة");
    }
    Storage.saveFavs(favs);
    this.updateFavButtonState();
  },

  updateFavButtonState(){
    const st = State.get();
    const favs = Storage.getFavs();
    const isFav = favs.some(f => f.slug === st.slug);
    
    if(isFav){
      this.els.favToggleBtn.classList.add("active");
      this.els.favToggleBtn.innerHTML = `<i class="fas fa-heart"></i> المفضلة`;
    } else {
      this.els.favToggleBtn.classList.remove("active");
      this.els.favToggleBtn.innerHTML = `<i class="far fa-heart"></i> المفضلة`;
    }
  },

  openFavModal(){
    this.els.modalSearchBox.classList.add("hidden");
    const favs = Storage.getFavs();
    this.els.modalTitle.innerHTML = `<i class="fas fa-heart" style="color:var(--accent-secondary)"></i> قائمة المفضلة`;
    if(favs.length === 0){
      this.els.modalBody.innerHTML = `<div class="empty-msg">لا توجد عناصر بالمفضلة حتى الآن</div>`;
    } else {
      this.els.modalBody.innerHTML = favs.map((f, i) => `
        <div class="modal-item">
          <div class="modal-item-info" onclick="UI.playFromModal('${f.slug}')">
            <div class="modal-item-title">${f.title}</div>
            <div class="modal-item-sub">${f.type === 'tv' ? 'مسلسل' : 'فيلم'}</div>
          </div>
          <button class="modal-item-btn del" onclick="UI.removeFav(${i})" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      `).join('');
    }
    this.els.modalBackdrop.classList.add("active");
  },

  removeFav(idx){
    let favs = Storage.getFavs();
    favs.splice(idx, 1);
    Storage.saveFavs(favs);
    this.openFavModal();
    this.updateFavButtonState();
  },

  openHistoryModal(){
    this.els.modalSearchBox.classList.add("hidden");
    const hist = Storage.getHistory();
    this.els.modalTitle.innerHTML = `<i class="fas fa-history" style="color:var(--accent-primary)"></i> سجل المشاهدة`;
    if(hist.length === 0){
      this.els.modalBody.innerHTML = `<div class="empty-msg">سجل المشاهدة فارغ</div>`;
    } else {
      this.els.modalBody.innerHTML = hist.map((h, i) => `
        <div class="modal-item">
          <div class="modal-item-info" onclick="UI.playFromHistory(${i})">
            <div class="modal-item-title">${h.title}</div>
            <div class="modal-item-sub">${h.type === 'tv' ? `الموسم ${h.season} - الحلقة ${h.episode}` : 'فيلم'} | سيرفر ${h.server}</div>
          </div>
          <button class="modal-item-btn del" onclick="UI.removeHistory(${i})" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      `).join('');
    }
    this.els.modalBackdrop.classList.add("active");
  },

  removeHistory(idx){
    let hist = Storage.getHistory();
    hist.splice(idx, 1);
    Storage.saveHistory(hist);
    this.openHistoryModal();
  },

  playFromModal(slug){
    const idx = DB.findIndex(d => d.slug === slug);
    if(idx > -1){
      this.els.catalogSelect.value = idx;
      const show = DB[idx];
      State.set({currentShow:show, slug:show.slug, type:show.type});
      this.loadShow(show);
      Engine.load();
      this.els.modalBackdrop.classList.remove("active");
    }
  },

  playFromHistory(histIndex){
    const hist = Storage.getHistory()[histIndex];
    if(!hist) return;
    const idx = DB.findIndex(d => d.slug === hist.slug);
    if(idx > -1){
      this.els.catalogSelect.value = idx;
      const show = DB[idx];
      State.set({currentShow:show, slug:show.slug, type:show.type, season: hist.season || 1, episode: hist.episode || 1, server: hist.server || 1});
      this.loadShow(show);
      if(show.type === "tv"){
        this.els.seasonSelect.value = hist.season || 1;
        this.renderEpisodes();
        this.els.episodeSelect.value = hist.episode || 1;
      }
      this.setServer(hist.server || 1);
      Engine.load();
      this.els.modalBackdrop.classList.remove("active");
    }
  },

  openManageDbModal(){
    this.els.modalTitle.innerHTML = `<i class="fas fa-database" style="color:var(--accent-warning)"></i> تحرير العناصر المضافة (${customDB.length})`;
    this.els.modalSearchBox.classList.remove("hidden");
    this.els.dbSearchInput.value = "";
    this.renderCustomDbItems("");
    this.els.modalBackdrop.classList.add("active");
  },

  renderCustomDbItems(query = ""){
    if(customDB.length === 0){
      this.els.modalBody.innerHTML = `
        <div class="empty-msg">
          لا توجد عناصر مضافة يدوياً حالياً.<br>
          <small style="color:var(--text-muted)">العناصر المدمجة الأساسية محمية ولا يمكن تعديلها.</small>
        </div>`;
      return;
    }

    const filtered = customDB.map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter(item => item.title.toLowerCase().includes(query) || item.slug.toLowerCase().includes(query));

    if(filtered.length === 0){
      this.els.modalBody.innerHTML = `<div class="empty-msg">لا توجد نتائج مطابقة للبحث "${query}"</div>`;
      return;
    }

    this.els.modalBody.innerHTML = filtered.map(item => `
      <div class="modal-item">
        <div class="modal-item-info">
          <div class="modal-item-title">${item.title}</div>
          <div class="modal-item-sub">Slug: ${item.slug}</div>
          <span class="badge-custom">عنصر مضاف</span>
        </div>
        <div class="modal-actions-btns">
          <button class="modal-item-btn edit" onclick="UI.editCustomDbItem(${item.originalIndex})" title="تحرير واستدعاء التعبئة"><i class="fas fa-pencil-alt"></i></button>
          <button class="modal-item-btn del" onclick="UI.deleteCustomDbItem(${item.originalIndex})" title="حذف من المكتبة"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `).join('');
  },

  editCustomDbItem(cIdx){
    const item = customDB[cIdx];
    if(!item) return;

    // استدعاء وتعبئة البيانات في خانات الإعدادات المتقدمة
    this.els.advTypeSelect.value = item.type;
    this.els.advTypeSelect.dispatchEvent(new Event('change'));
    
    this.els.advNameInput.value = item.slug;

    if(item.type === "tv" && item.seasons && item.seasons.length > 0){
      const sCount = item.seasons.length;
      this.els.advSeasonCountSelect.value = sCount;
      this.renderAdvEpisodeInputs(sCount);

      const inputs = document.querySelectorAll('.adv-ep-input');
      item.seasons.forEach((seasonData, idx) => {
        if(inputs[idx]){
          inputs[idx].value = seasonData.eps;
        }
      });
    }

    // إغلاق قائمة التحرير المنبثقة
    this.els.modalBackdrop.classList.remove("active");
  },

  deleteCustomDbItem(cIdx){
    const deletedItem = customDB[cIdx];
    customDB.splice(cIdx, 1);
    Storage.saveCustomCatalog(customDB);
    DB = [...customDB, ...DEFAULT_DB];
    
    this.renderCatalog();
    
    // إغلاق قائمة التحرير المنبثقة
    this.els.modalBackdrop.classList.remove("active");

    // تنظيف الخانات إذا كان العنصر المحذوف هو الموجود بخانات السحب حالياً
    if(deletedItem && this.els.advNameInput.value.trim() === deletedItem.slug){
      this.clearAdvInputs();
    }

    this.loadShow(DB[0]);
    Engine.load();
  },

  fillAdvDefaults(){
    this.els.advTypeSelect.value = "tv";
    this.els.advTypeSelect.dispatchEvent(new Event('change'));
    this.els.advNameInput.value = "kurtlar-vadisi-pusu";
    this.els.advSeasonCountSelect.value = "3";
    this.renderAdvEpisodeInputs(3);
    const inputs = document.querySelectorAll('.adv-ep-input');
    if(inputs[0]) inputs[0].value = 9;
    if(inputs[1]) inputs[1].value = 32;
    if(inputs[2]) inputs[2].value = 22;
  },
  renderCatalog(){
    this.els.catalogSelect.innerHTML = DB.map((item, idx) => `<option value="${idx}">${item.title} ${item.isBuiltIn ? '' : '⭐️ (مضاف)'}</option>`).join('');
  },
  renderServers(){
    const chips = [];
    const options = [];
    for(let i=1; i<=CFG.MAX_SERVERS; i++){
      chips.push(`<div class="server-chip ${i===1?'active':''}" onclick="UI.setServer(${i})">سيرفر ${i}</div>`);
      options.push(`<option value="${i}">سيرفر ${i}</option>`);
    }
    this.els.quickServersBar.innerHTML = chips.join('');
    this.els.serverSelect.innerHTML = options.join('');
  },
  setServer(srv){
    State.set({server: srv});
    this.els.serverSelect.value = srv;
    document.querySelectorAll('.server-chip').forEach((chip, idx) => {
      chip.classList.toggle('active', (idx + 1) === srv);
    });
    Engine.load();
  },
  loadShow(show){
    this.updateFavButtonState();
    if(show.type === "movie"){
      this.els.seasonGroup.classList.add("hidden");
      this.els.episodeGroup.classList.add("hidden");
      this.els.prevEpBtn.classList.add("hidden");
      this.els.nextEpBtn.classList.add("hidden");
    } else {
      this.els.seasonGroup.classList.remove("hidden");
      this.els.episodeGroup.classList.remove("hidden");
      this.els.prevEpBtn.classList.remove("hidden");
      this.els.nextEpBtn.classList.remove("hidden");
      
      const firstSeasonNum = show.seasons[0] ? show.seasons[0].n : 1;
      this.els.seasonSelect.innerHTML = show.seasons.map(s => `<option value="${s.n}">الموسم ${s.n}</option>`).join('');
      State.set({season: firstSeasonNum, episode: 1});
      this.renderEpisodes();
    }
  },
  renderEpisodes(){
    const st = State.get();
    if(st.type === "movie") return;
    const sd = st.currentShow.seasons.find(s => s.n === st.season);
    const eps = sd ? sd.eps : 10;
    let opts = '';
    for(let i=1; i<=eps; i++) opts += `<option value="${i}">الحلقة ${i}</option>`;
    this.els.episodeSelect.innerHTML = opts;
    this.els.episodeSelect.value = st.episode;
    this.updateNavState();
  },
  updateNavState(){
    const st = State.get();
    if(st.type === "movie") return;

    const seasons = st.currentShow.seasons;
    const firstSeasonNum = seasons[0] ? seasons[0].n : 1;
    const lastSeasonObj = seasons[seasons.length - 1];
    
    const isFirstEpOfFirstSeason = (st.season === firstSeasonNum && st.episode === 1);
    this.els.prevEpBtn.classList.toggle("disabled", isFirstEpOfFirstSeason);

    const isLastEpOfLastSeason = (lastSeasonObj && st.season === lastSeasonObj.n && st.episode === lastSeasonObj.eps);
    this.els.nextEpBtn.classList.toggle("disabled", isLastEpOfLastSeason);
  },
  navEp(delta){
    const st = State.get();
    if(st.type === "movie") return;

    const seasons = st.currentShow.seasons;
    const currentSeasonIdx = seasons.findIndex(s => s.n === st.season);
    if(currentSeasonIdx === -1) return;

    const currentSeasonObj = seasons[currentSeasonIdx];
    let targetEp = st.episode + delta;

    if(delta === -1){
      if(targetEp < 1){
        if(currentSeasonIdx > 0){
          const prevSeasonObj = seasons[currentSeasonIdx - 1];
          State.set({season: prevSeasonObj.n, episode: prevSeasonObj.eps});
          this.els.seasonSelect.value = prevSeasonObj.n;
          this.renderEpisodes();
          Engine.load();
        }
      } else {
        State.set({episode: targetEp});
        this.els.episodeSelect.value = targetEp;
        this.updateNavState();
        Engine.load();
      }
    } else if(delta === 1){
      if(targetEp > currentSeasonObj.eps){
        if(currentSeasonIdx < seasons.length - 1){
          const nextSeasonObj = seasons[currentSeasonIdx + 1];
          State.set({season: nextSeasonObj.n, episode: 1});
          this.els.seasonSelect.value = nextSeasonObj.n;
          this.renderEpisodes();
          Engine.load();
        }
      } else {
        State.set({episode: targetEp});
        this.els.episodeSelect.value = targetEp;
        this.updateNavState();
        Engine.load();
      }
    }
  }
};

const Engine = {
  load(){
    const st = State.get();
    const url = CFG.BUILD_URL(CFG.BASE_URL, st.slug, st.type, st.season, st.episode, st.server);
    UI.els.urlDisplay.textContent = url;
    UI.els.playerOverlay.classList.remove("hidden");
    UI.els.videoPlayer.classList.remove("loaded");
    UI.els.videoPlayer.src = url;
    
    let hist = Storage.getHistory();
    hist = hist.filter(h => h.slug !== st.slug);
    hist.unshift({
      title: st.currentShow.title,
      slug: st.slug,
      type: st.type,
      season: st.season,
      episode: st.episode,
      server: st.server
    });
    if(hist.length > 20) hist.pop();
    Storage.saveHistory(hist);

    setTimeout(() => {
      UI.els.videoPlayer.classList.add("loaded");
      UI.els.playerOverlay.classList.add("hidden");
    }, 800);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  UI.init();
  Engine.load();
});
