const SCROLL_LOCK_TIME = 400;
const DELTA_GROWTH_EPSILON = 10;

let scrollLocked = false;
let currentIndex = 0;
let lastDeltaMagnitude = 0;


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

function goToIndex(index) {
  console.log(index);
  const items = document.querySelectorAll('.menu-text');
  const title = document.getElementById('menu-title');

  // Clamp index (important for scroll input)
  currentIndex = Math.max(0, Math.min(index, items.length - 1));

  // ---- UPDATE MENU STATE ----
  items.forEach(i => i.classList.remove('active'));

  const activeItem = items[currentIndex];
  activeItem.classList.add('active');

  if (title) {
    title.textContent = activeItem.textContent;
  }

  // ---- SCROLL GRID ----
  const grid = document.getElementById('content-grid');
  const block = document.querySelector('.content-block');

  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  let blockHeight = block.offsetHeight;
  blockRows = window.getComputedStyle(block).gridRow;
  if (blockRows != "auto") {
    blockRows = blockRows.replace("span ", "");
    blockHeight /= parseInt(blockRows);
  }

  const gridMargin = 0.05 * windowHeight;
  const cellPadding = (currentIndex / 50) * windowWidth;
  const cellSize = 2 * blockHeight * currentIndex;
  const idealTop = gridMargin - cellPadding - cellSize;
  const maxTop = windowHeight / 2 - grid.offsetHeight;
  const tooWide = 0.62 * windowHeight < 0.02 * windowWidth + 2 * blockHeight;
  if (tooWide) {
    console.log(`Max: ${0.62 * windowHeight}\tCurrent: ${0.02 * windowWidth + 2 * blockHeight}`);
  }
  grid.style.top = `${Math.max(idealTop, maxTop)}px`;
}


function closeCardClone(overlay, clone) {
  // Animate back to original position
  const rect = clone._originRect;

  overlay.style.backgroundColor = 'rgba(0,0,0,0)';
  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;

  setTimeout(() => {
    overlay.remove();
    scrollLocked = false;
  }, 500);
}

function openCardClone(originalCard) {
  scrollLocked = true;

  /* ---------- OVERLAY ---------- */
  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';
  overlay.style.backgroundColor = 'rgba(0,0,0,0)';
  overlay.style.transition = 'background-color 0.5s ease';
  document.body.appendChild(overlay);

  /* ---------- CLONE ---------- */
  const clone = originalCard.cloneNode(true);
  clone.classList.add('no-border');
  clone.style.position = 'fixed';
  clone.style.margin = '0';
  clone.style.transition = 'top 0.5s ease, left 0.5s ease, width 0.5s ease, height 0.5s ease';
  clone.style.backgroundColor = '#ffd580';
  clone.style.zIndex = '2100';

  let thumbnail = clone.querySelector('.card-thumb');
  thumbnail.style.display = "none";
  let content = clone.querySelector('.card-content');
  content.style.display = "block";

  const rect = originalCard.getBoundingClientRect();
  clone._originRect = rect;

  // Start exactly on top of original
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

  console.log(vw * 0.8);

  const targetTop = Math.floor((vh - targetHeight) / 2);
  const targetLeft = Math.floor((vw - targetWidth) / 2);

  /* ---------- TRIGGER ANIMATION ---------- */
  requestAnimationFrame(() => {
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    clone.style.top = `${targetTop}px`;
    clone.style.left = `${targetLeft}px`;
    clone.style.width = `${Math.ceil(targetWidth)}px`;
    clone.style.height = `${Math.ceil(targetHeight)}px`;
  });

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


window.addEventListener('resize', () => {
  updateMenuBar();
  goToIndex(currentIndex);
});
