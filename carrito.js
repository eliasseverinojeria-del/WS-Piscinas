(function(){
  const catalog = {
    'bomba-filtrado-1hp': { name: 'Bomba filtrado 1HP', price: 159990 },
    'robot-limpiafondos': { name: 'Robot limpiafondos', price: 799990 },
    'boya-flotante': { name: 'Boya flotante', price: 4590 },
    'malla-saca-hojas': { name: 'Malla Saca Hojas', price: 6990 },
    'cloro-granulado': { name: 'Cloro granulado', options: { '1': 3500, '3': 10000, '5': 15000 } },
    'cloro-tabletas': { name: 'Cloro en tabletas', options: { '1': 3900, '3': 10500, '5': 16000 } }
  };

  function getCart(){ return JSON.parse(localStorage.getItem('ws_cart') || '[]'); }
  function saveCart(c){ localStorage.setItem('ws_cart', JSON.stringify(c)); }
  function normalize(item){
    return {
      key: item.key,
      name: item.name || (catalog[item.key] ? catalog[item.key].name : item.key),
      unitPrice: Number(item.unitPrice ?? item.price ?? 0),
      quantity: Math.max(1, parseInt(item.quantity || 1)),
      image: item.image || ''
    };
  }

  // Actualizar el badge del carrito
  function updateCartBadge(){
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const items = getCart();
    const count = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  window.addToCart = window.addToCart || function(item){
    const n = normalize(item);
    const c = getCart();
    const idx = c.findIndex(x => x.key === n.key && x.name === n.name);
    if (idx >= 0) c[idx].quantity = Number(c[idx].quantity) + Number(n.quantity);
    else c.push(n);
    saveCart(c);
    updateCartBadge();
    try { window.dispatchEvent(new CustomEvent('ws_cart_updated', { detail: { count: getCart().length } })); } catch(e){}
  };

  function interceptAnchors(root = document){
    const anchors = root.querySelectorAll('a[href*="pago.html?producto="]');
    anchors.forEach(a => {
      if (a.dataset.wsIntercepted) return;
      a.dataset.wsIntercepted = '1';
      a.addEventListener('click', ev => {
        ev.preventDefault();
        try {
          const url = new URL(a.href, location.href);
          const params = Object.fromEntries(url.searchParams.entries());
          const key = params.producto;
          const cantidad = params.cantidad || '1';
          if (!key) { location.href = a.href; return; }

          const entry = catalog[key] || {};
          let name = entry.name || key;
          let unitPrice = entry.price || 0;
          if (entry.options){
            const sel = (cantidad in entry.options) ? cantidad : Object.keys(entry.options)[0];
            name = `${entry.name} — ${sel} kg`;
            unitPrice = Number(entry.options[sel] || 0);
          }

          window.addToCart({ key, name, unitPrice, quantity: Number(cantidad) || 1 });
          location.href = 'carrito.html';
        } catch(err){
          console.error(err);
          location.href = a.href;
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>{
    interceptAnchors(document);
    updateCartBadge();
  });
  else {
    interceptAnchors(document);
    updateCartBadge();
  }

  // Optimized MutationObserver con debounce
  let debounceTimer;
  new MutationObserver(()=> {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(()=> {
      interceptAnchors(document);
      updateCartBadge();
    }, 300); // Espera 300ms sin cambios antes de ejecutar
  }).observe(document.documentElement, { childList:true, subtree:true });
})();