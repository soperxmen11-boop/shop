
// ui/shop.js — bind Shop button to a modal (no game logic changed)
(function(){
  function $(s, r=document){ return r.querySelector(s); }
  function $all(s, r=document){ return Array.from(r.querySelectorAll(s)); }

  function ensureShop(){
    if ($('#kp-shop')) return $('#kp-shop');
    const modal = document.createElement('div');
    modal.id = 'kp-shop';
    modal.className = 'kp-modal';
    modal.innerHTML = `
      <div class="kp-card" style="position:relative;">
        <button class="kp-shop-close" aria-label="Close">✖</button>
        <div style="display:flex; align-items:center; gap:10px; font-weight:900; font-size:22px;">
          🛍️ <span>Kids Shop</span>
        </div>
        <div class="kp-shop-grid">
          <div class="kp-shop-item">
            <div class="icon">⭐</div>
            <div class="name">Stars Pack</div>
            <button class="buy kp-glow-btn">Get</button>
          </div>
          <div class="kp-shop-item">
            <div class="icon">🎵</div>
            <div class="name">Music Pack</div>
            <button class="buy kp-glow-btn">Get</button>
          </div>
          <div class="kp-shop-item">
            <div class="icon">🐼</div>
            <div class="name">Mascots Pack</div>
            <button class="buy kp-glow-btn">Get</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // close handlers
    modal.addEventListener('click', (e)=>{
      if (e.target === modal || e.target.classList.contains('kp-shop-close')){
        modal.classList.remove('open');
      }
    });
    return modal;
  }

  function openShop(){
    const m = ensureShop();
    m.classList.add('open');
  }

  function bindButtons(){
    const selectors = ['#shopBtn', '.shop', '[data-action="shop"]', 'button[aria-label="Shop"]'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (btn.dataset.kpShopBound) return;
        btn.dataset.kpShopBound = '1';
        btn.addEventListener('click', (e)=>{
          e.preventDefault();
          openShop();
        });
      });
    });
  }

  function init(){
    bindButtons();
    // in case elements added later
    const obs = new MutationObserver(()=> bindButtons());
    obs.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
