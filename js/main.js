// Portfólio Renato Candiani: menu do celular, sombra do topo, aparecer ao rolar e link ativo no menu
(function () {
  var botao = document.querySelector('.menu-botao');
  var menu = document.getElementById('menu');

  function fecharMenu() {
    if (!menu) return;
    menu.classList.remove('aberto');
    if (botao) botao.setAttribute('aria-expanded', 'false');
  }

  if (botao && menu) {
    botao.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) fecharMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('aberto')) {
        fecharMenu();
        botao.focus();
      }
    });
  }

  // sombra no topo depois de rolar
  var topo = document.getElementById('topo');
  function aoRolar() {
    if (topo) topo.classList.toggle('rolou', window.scrollY > 8);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  // blocos aparecem ao entrar na tela (menos movimento = aparecem direto)
  var itens = document.querySelectorAll('.revelar');
  var menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || menosMovimento) {
    itens.forEach(function (el) { el.classList.add('visivel'); });
  } else {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visivel');
          obs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    itens.forEach(function (el) { obs.observe(el); });
  }

  // marca no menu a seção que está na tela
  var links = menu ? Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]')) : [];
  var pares = links
    .map(function (a) { return [document.querySelector(a.getAttribute('href')), a]; })
    .filter(function (p) { return p[0]; });
  if ('IntersectionObserver' in window && pares.length) {
    var obsMenu = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        pares.forEach(function (p) { if (p[0] === en.target) p[1].setAttribute('aria-current', 'true'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    pares.forEach(function (p) { obsMenu.observe(p[0]); });
  }

  // pilha de fotos: clicar na pilha (ou no botão) manda a foto de cima pro fundo
  var pilha = document.getElementById('pilha');
  if (pilha) {
    var fotos = Array.prototype.slice.call(pilha.querySelectorAll('.polaroid'));
    var proximaFoto = function () {
      fotos.forEach(function (f) {
        var pos = Number(f.getAttribute('data-pos'));
        f.setAttribute('data-pos', String(pos === 0 ? fotos.length - 1 : pos - 1));
      });
    };
    pilha.addEventListener('click', proximaFoto);
    var botaoPilha = document.querySelector('.pilha-botao');
    if (botaoPilha) botaoPilha.addEventListener('click', proximaFoto);
  }

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
