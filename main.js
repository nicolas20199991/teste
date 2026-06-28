/**
 * PROMORAR AVANÇA - LÓGICA DE INTERATIVIDADE E ANIMAÇÃO
 * Desenvolvido com JavaScript Vanila (sem bibliotecas externas)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos do DOM ---
  const mapContainer = document.getElementById('map-container');
  const maskPath = document.getElementById('mask-path');
  const pins = document.querySelectorAll('.pin');
  const modalOverlay = document.getElementById('modal-overlay');
  const modals = document.querySelectorAll('.modal');
  const closeButtons = document.querySelectorAll('.modal-close');
  const couponBtn = document.getElementById('btn-coupon');

  // Controle de quais pins já abriram seus modais automaticamente durante a rolagem
  const autoOpenedPins = new Set();

  // --- Lógica de Inicialização do Caminho SVG ---
  let pathLength = 0;

  /**
   * Inicializa ou atualiza o cálculo do comprimento do caminho da máscara SVG.
   * Isso é executado no carregamento inicial e sempre que a janela for redimensionada,
   * garantindo que a proporção da animação permaneça correta e responsiva.
   */
  function initPath() {
    if (maskPath) {
      // Obtém o comprimento total do path da máscara em pixels
      pathLength = maskPath.getTotalLength();
      
      // Define a propriedade strokeDasharray com o comprimento total.
      maskPath.style.strokeDasharray = pathLength;
      
      // Define o strokeDashoffset inicial com o comprimento total para ocultar a revelação.
      maskPath.style.strokeDashoffset = pathLength;
      
      // Atualiza o desenho imediatamente para refletir a posição atual de rolagem
      updateScrollPath();
    }
  }

  /**
   * Lógica Principal de Scroll:
   * Calcula a rolagem do usuário em relação à seção do mapa e revela a estrada proporcionalmente.
   */
  function updateScrollPath() {
    if (!mapContainer || !maskPath || pathLength === 0) return;

    // Posição atual de rolagem vertical da página
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Distância do topo da seção do mapa até o topo do documento HTML
    const mapTopOffset = mapContainer.offsetTop;
    
    // Altura total da seção do mapa (no nosso caso, 3200px)
    const mapHeight = mapContainer.offsetHeight;
    
    // Altura útil da janela de visualização do navegador (viewport)
    const windowHeight = window.innerHeight;

    /**
     * O progresso do caminho deve começar a ser desenhado no momento em que o topo do mapa
     * entra na tela (ou seja, após passar a seção Hero) e terminar quando a base do mapa
     * atinge a base do viewport (fim da rolagem útil do mapa).
     * 
     * A distância total de rolagem interativa dentro do mapa é a altura do mapa menos a altura da tela.
     */
    const scrollRange = mapHeight - windowHeight;
    
    // Calcula quanto o usuário rolou dentro deste intervalo específico do mapa
    const scrolledInsideMap = scrollTop - mapTopOffset;

    // Normaliza o progresso em um fator entre 0.0 (início do mapa) e 1.0 (fim do mapa)
    let scrollProgress = scrolledInsideMap / scrollRange;
    
    // Limita o progresso no intervalo [0, 1] para evitar valores negativos ou maiores que o caminho
    scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);

    /**
     * Calcula o novo deslocamento do traço da máscara (strokeDashoffset).
     * Conforme o usuário rola para baixo, revelamos a estrada (asfalto, acostamento e faixa amarela).
     */
    const newOffset = pathLength - (pathLength * scrollProgress);
    maskPath.style.strokeDashoffset = newOffset;

    // --- Ativação Dinâmica dos Pins e Abertura Automática de Modais ---
    pins.forEach(pin => {
      const pinId = pin.dataset.pin;
      // Lê a porcentagem de progresso necessária para este pin (definida no HTML via data-progress)
      const pinActivationThreshold = parseFloat(pin.dataset.progress);
      
      // Se o progresso da rolagem for maior ou igual ao limite do pin
      if (scrollProgress >= pinActivationThreshold) {
        pin.classList.add('active');
        
        // Abertura Automática do Modal:
        // Caso o modal correspondente a este pin ainda não tenha sido aberto automaticamente
        if (!autoOpenedPins.has(pinId)) {
          autoOpenedPins.add(pinId);
          openModal(pinId);
        }
      } else {
        pin.classList.remove('active');
        
        // Reseta o estado de "aberto automaticamente" se o usuário rolar de volta para cima
        // Adicionamos uma margem de segurança de 3% (0.03) para evitar gatilhos múltiplos ou oscilações ao parar o scroll no limite do pin.
        if (scrollProgress < pinActivationThreshold - 0.03) {
          autoOpenedPins.delete(pinId);
        }
      }
    });
  }

  // --- Lógica de Controle dos Modais (Abertura e Fechamento) ---

  /**
   * Abre um modal específico e bloqueia a rolagem do fundo.
   * @param {string} id - O ID numérico do pin/modal.
   */
  function openModal(id) {
    const targetModal = document.getElementById(`modal-${id}`);
    if (targetModal && modalOverlay) {
      modalOverlay.classList.add('active');
      targetModal.classList.add('active');
      // Impede o scroll da página de fundo enquanto o modal estiver aberto (ótima prática mobile UX)
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Fecha todos os modais abertos e libera a rolagem da página.
   */
  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
    }
    modals.forEach(modal => modal.classList.remove('active'));
    // Restaura o comportamento padrão de scroll da página
    document.body.style.overflow = '';
  }

  // Associa o evento de clique em cada Pin para abrir seu respectivo modal
  pins.forEach(pin => {
    pin.addEventListener('click', () => {
      const pinId = pin.dataset.pin;
      openModal(pinId);
    });
  });

  // Fecha o modal ao clicar no botão "Fechar" (X)
  closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita propagação de evento indesejada
      closeModal();
    });
  });

  // Fecha o modal se o usuário clicar no fundo escurecido (overlay)
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }

  // Fecha o modal ao pressionar a tecla 'Escape' (acessibilidade em desktops)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // --- Lógica do Cupom do Colégio São José (Easter Egg - Modal 4) ---
  if (couponBtn) {
    couponBtn.addEventListener('click', function() {
      // Verifica se o cupom já não foi resgatado para evitar cliques repetidos
      if (!this.classList.contains('coupon-claimed')) {
        // Adiciona a classe que muda a cor do fundo para verde e aplica efeito de pop
        this.classList.add('coupon-claimed');
        // Altera o texto do botão para exibir o código do cupom
        this.textContent = 'CÓDIGO: PROM010';
      }
    });
  }

  // --- Inicialização de Eventos Globais ---
  
  // Executa o cálculo inicial das dimensões do SVG
  initPath();

  // Escuta o evento de scroll do navegador para pintar a estrada
  window.addEventListener('scroll', updateScrollPath);

  // Escuta o redimensionamento da tela para recalcular as proporções do SVG
  window.addEventListener('resize', () => {
    initPath();
  });
});
