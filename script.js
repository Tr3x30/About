const SCROLL_LOCK_TIME = 400;
const DELTA_GROWTH_EPSILON = 10;

let scrollLocked = false;
let currentIndex = 0;
let lastDeltaMagnitude = 0;

// MOBILE
let touchStartY = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 5; // in vh


function updateMenuBar() {
  const svg = document.getElementById('menu-bar-background');
  const path = document.getElementById('menu-path');
  const pageInfo = document.getElementById('content-info');
  const pageMenu = document.getElementById('page-menu');
  const contentGrid = document.getElementById('content-grid');

  const w = window.innerWidth;
  const h = Math.ceil(window.innerHeight / 3);
  const drop = h / 2;

  const infoWidth = pageInfo.offsetWidth;
  let segment = w / 4;
  let middleFlat = 2 * segment - 2 * drop;

  if (middleFlat < infoWidth) {
    segment = (w - infoWidth - 2 * drop) / 2;
    middleFlat = infoWidth;
  }

  // Build path
  const d = `
    M 0 0
    l ${Math.ceil(segment)} 0
    c ${drop / 2} 0, ${drop / 2} ${drop}, ${drop} ${drop}
    l ${Math.ceil(middleFlat)} 0
    c ${drop / 2} 0, ${drop / 2} ${-drop}, ${drop} ${-drop}
    l ${Math.ceil(segment)} 0
    l 0 ${h}
    L 0 ${h} z
    `.replace(/\s+/g, ' ').trim();

  path.setAttribute('d', d);
  svg.setAttribute('height', `${h}px`);

  if (pageInfo) {
    pageInfo.style.height = `${h / 2}px`;
  }

  if (pageMenu && contentGrid) {
    var spaceAvailable = ((w - contentGrid.offsetWidth) / 2);
    if (spaceAvailable < pageMenu.offsetWidth) {
      console.log(`Insufficient Space: ${spaceAvailable}`);
    }
    pageMenu.style.left = `${w - spaceAvailable / 2}px`;
  }
}

function handleSwipe(deltaY) {
  if (scrollLocked) return;

  const threshold = (SWIPE_THRESHOLD / 100) * window.innerHeight;
  if (Math.abs(deltaY) < threshold) return;

  scrollLocked = true;

  goToIndex(currentIndex + (deltaY > 0 ? 1 : -1));

  setTimeout(() => {
    scrollLocked = false;
  }, SCROLL_LOCK_TIME);
}

function goToIndex(index) {
  const items = document.querySelectorAll('.menu-text');
  const title = document.getElementById('menu-title');
  const grid = document.getElementById('content-grid');
  const block = document.querySelector('.content-block');

  if (!items.length || !grid || !block) return;

  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  const gridStyle = window.getComputedStyle(grid);
  const blockStyle = window.getComputedStyle(block);

  // Detect current column count
  const columns = gridStyle.gridTemplateColumns.split(' ').filter(Boolean).length || 4;

  // Mobile = 2 columns, Desktop = 4 columns
  const isMobileLayout = columns === 2;

  // On mobile, each real section takes 2 positions
  const maxScrollIndex = isMobileLayout
    ? (items.length * 2) - 1
    : items.length - 1;

  // Clamp scroll index
  currentIndex = Math.max(0, Math.min(index, maxScrollIndex));

  // Section index controls active title/menu state
  const sectionIndex = isMobileLayout
    ? Math.floor(currentIndex / 2)
    : currentIndex;

  // ---- UPDATE MENU STATE ----
  items.forEach(i => i.classList.remove('active'));

  const activeItem = items[sectionIndex];
  if (activeItem) {
    activeItem.classList.add('active');

    if (title) {
      title.textContent = activeItem.textContent;
    }
  }

  // ---- SCROLL GRID ----

  // Find single-row height
  let blockHeight = block.offsetHeight;
  let blockRows = blockStyle.gridRow;

  if (blockRows && blockRows !== "auto") {
    blockRows = blockRows.replace("span ", "");
    const span = parseInt(blockRows, 10);
    if (!isNaN(span) && span > 0) {
      blockHeight /= span;
    }
  }

  const rowGap = parseFloat(gridStyle.rowGap) || 0;

  // Full section height:
  // desktop: 2 rows
  // mobile: 4 rows
  const rowsPerSection = columns === 2 ? 4 : 2;

  // But mobile needs half-section stepping
  const rowsPerStep = isMobileLayout ? 2 : rowsPerSection;

  const stepSize = (rowsPerStep * blockHeight) + ((rowsPerStep - 1) * rowGap);

  const gridMargin = 0.05 * windowHeight;
  const idealTop = gridMargin - (stepSize * currentIndex);
  const maxTop = windowHeight / 2 - grid.offsetHeight;

  grid.style.top = `${Math.max(idealTop, maxTop)}px`;
}

function closeCardClone(overlay, clone) {
  const rect = clone._originRect;
  const startRect = clone.getBoundingClientRect();
  const content = clone.querySelector('.card-content');
  const thumbnail = clone.querySelector('.card-thumb');

  const duration = 500;
  let startTime = null;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function animate(timestamp) {
    if (startTime === null) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const progress = easeOutCubic(rawProgress);

    const currentTop = lerp(startRect.top, rect.top, progress);
    const currentLeft = lerp(startRect.left, rect.left, progress);
    const currentWidth = lerp(startRect.width, rect.width, progress);
    const currentHeight = lerp(startRect.height, rect.height, progress);

    clone.style.top = `${currentTop}px`;
    clone.style.left = `${currentLeft}px`;
    clone.style.width = `${currentWidth}px`;
    clone.style.height = `${currentHeight}px`;

    overlay.style.backgroundColor = `rgba(0,0,0,${0.5 * (1 - progress)})`;

    if (content) {
      content.style.opacity = `${1 - progress}`;
    }

    if (thumbnail) {
      thumbnail.style.opacity = progress
    }

    if (rawProgress < 1) {
      requestAnimationFrame(animate);
    } else {
      overlay.remove();
      scrollLocked = false;
    }
  }

  requestAnimationFrame(animate);
}


function openCardClone(originalCard) {
  scrollLocked = true;

  /* ---------- OVERLAY ---------- */
  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0,0,0,0)';
  overlay.style.zIndex = '2000';
  document.body.appendChild(overlay);

  /* ---------- CLONE ---------- */
  const clone = originalCard.cloneNode(true);
  clone.classList.add('no-border');
  clone.style.position = 'fixed';
  clone.style.margin = '0';
  clone.style.backgroundColor = '#ffd580';
  clone.style.zIndex = '2100';

  const thumbnail = clone.querySelector('.card-thumb');
  const content = clone.querySelector('.card-content');

  if (thumbnail) {
    thumbnail.style.opacity = '1';
  }
  if (content) {
    content.style.display = 'block';
    content.style.opacity = '0';
  }

  const rect = originalCard.getBoundingClientRect();
  clone._originRect = rect;

  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;

  overlay.appendChild(clone);

  /* ---------- TARGET SIZE MATH ---------- */
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  let targetHeight = 0.8 * vh;
  let targetWidth = (4 / 3) * targetHeight;

  const maxWidth = 0.8 * vw;
  if (targetWidth > maxWidth) {
    targetWidth = maxWidth;
    targetHeight = targetWidth * (3 / 4);
  }

  const targetTop = (vh - targetHeight) / 2;
  const targetLeft = (vw - targetWidth) / 2;

  /* ---------- ANIMATION ---------- */
  const duration = 500;
  let startTime = null;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function animate(timestamp) {
    if (startTime === null) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const progress = easeOutCubic(rawProgress);

    const currentTop = lerp(rect.top, targetTop, progress);
    const currentLeft = lerp(rect.left, targetLeft, progress);
    const currentWidth = lerp(rect.width, targetWidth, progress);
    const currentHeight = lerp(rect.height, targetHeight, progress);

    clone.style.top = `${currentTop}px`;
    clone.style.left = `${currentLeft}px`;
    clone.style.width = `${currentWidth}px`;
    clone.style.height = `${currentHeight}px`;

    overlay.style.backgroundColor = `rgba(0,0,0,${0.5 * progress})`;

    if (content) {
      content.style.opacity = progress;
    }

    if (thumbnail) {
      thumbnail.style.opacity = 1 - progress;
    }

    if (rawProgress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);

  /* ---------- CLOSE HANDLERS ---------- */
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeCardClone(overlay, clone);
    }
  });

  function escHandler(e) {
    if (e.key === 'Escape') {
      closeCardClone(overlay, clone);
      document.removeEventListener('keydown', escHandler);
    }
  }

  document.addEventListener('keydown', escHandler);
}


document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('content-grid');

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.content-block');
    if (!card) return;

    openCardClone(card);
  });

  updateMenuBar();
  const items = document.querySelectorAll('.menu-text');

  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      goToIndex(index);
    });
  });
});

window.addEventListener('keydown', (e) => {
  let direction = 0;
  switch (e.key) {
    case 'ArrowDown':
    case 'PageDown':
      direction = 1;
      break;

    case 'ArrowUp':
    case 'PageUp':
      direction = -1;
      break;

    case 'Home':
      goToIndex(0);
      break;

    case 'End':
      goToIndex(4);
      break;

    default:
      return;
  }
  goToIndex(currentIndex + direction);
});


window.addEventListener('wheel', (e) => {
  e.preventDefault();

  const delta = e.deltaY;
  const magnitude = Math.abs(delta);

  // Reject momentum (delta magnitude shrinking)
  if (magnitude <= lastDeltaMagnitude + DELTA_GROWTH_EPSILON) {
    lastDeltaMagnitude = magnitude;
    return;
  }

  lastDeltaMagnitude = magnitude;

  if (scrollLocked) return;
  scrollLocked = true;

  goToIndex(
    currentIndex + (delta > 0 ? 1 : -1)
  );

  // Unlock 
  setTimeout(() => {
    scrollLocked = false;
  }, SCROLL_LOCK_TIME);

}, { passive: false }); // Allow preventDefault();

window.addEventListener('touchstart', (e) => {
  if (scrollLocked) return;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  touchEndY = e.changedTouches[0].clientY;
  const deltaY = touchStartY - touchEndY;
  handleSwipe(deltaY);
}, { passive: true });

window.addEventListener('resize', () => {
  updateMenuBar();
  goToIndex(currentIndex);
});
