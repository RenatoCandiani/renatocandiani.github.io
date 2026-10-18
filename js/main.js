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

  // vídeos de divulgação: tocam mudos só enquanto estão na tela; o som só liga no botão
  Array.prototype.forEach.call(document.querySelectorAll('.video-brag'), function (bloco) {
    var video = bloco.querySelector('video');
    var botaoPlay = bloco.querySelector('.video-play');
    var botaoSom = bloco.querySelector('.video-som');
    if (!video || !botaoPlay || !botaoSom) return;
    var nome = bloco.getAttribute('data-nome') || 'vídeo';
    var naTela = false;
    var pausadoPeloUsuario = false;

    function tocar() {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
    function mostrarPlay(parado) {
      botaoPlay.textContent = parado ? 'Reproduzir' : 'Pausar';
      botaoPlay.setAttribute('aria-label', (parado ? 'Reproduzir o ' : 'Pausar o ') + nome);
    }
    function mostrarSom() {
      var comSom = !video.muted;
      botaoSom.textContent = comSom ? 'Silenciar' : 'Ativar som';
      botaoSom.setAttribute('aria-pressed', comSom ? 'true' : 'false');
      botaoSom.setAttribute('aria-label', (comSom ? 'Silenciar o ' : 'Ativar som do ') + nome);
    }
    function falhou() { bloco.classList.add('video-falhou'); }

    botaoPlay.addEventListener('click', function () {
      if (video.paused) {
        pausadoPeloUsuario = false;
        tocar();
      } else {
        pausadoPeloUsuario = true;
        video.pause();
      }
    });
    botaoSom.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted && video.paused && naTela) {
        pausadoPeloUsuario = false;
        tocar();
      }
    });
    video.addEventListener('play', function () { mostrarPlay(false); });
    video.addEventListener('pause', function () { mostrarPlay(true); });
    video.addEventListener('volumechange', mostrarSom);
    video.addEventListener('error', falhou);
    var fonte = video.querySelector('source');
    if (fonte) fonte.addEventListener('error', falhou);
    if (video.networkState === 3) falhou(); // o arquivo já falhou antes deste script rodar
    mostrarPlay(menosMovimento || !('IntersectionObserver' in window)); // nesses casos o vídeo começa parado
    mostrarSom();

    // toca sozinho (sempre mudo) ao entrar na tela e pausa ao sair; com menos movimento, só toca no botão
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          naTela = en.isIntersecting && en.intersectionRatio >= 0.35;
          if (!naTela) {
            video.pause();
            video.muted = true; // ao voltar para a tela ele não retoma com som sozinho
          } else if (!pausadoPeloUsuario && !menosMovimento) tocar();
        });
      }, { threshold: [0, 0.35] }).observe(video);
    }
  });

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
