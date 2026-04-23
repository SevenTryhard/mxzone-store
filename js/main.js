/**
 * MXZONE STORE - Main JavaScript
 * Premium interactions and animations
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initHeader();
  initMobileMenu();
  initActiveNavLink();
  initScrollAnimations();
  initSmoothScroll();
  initShopFilters();
  initFAQAccordion();
  initSizeSelector();
  initProductThumbnails();
  initContactForm();
  initCountUp();
  initProductModal();
  initHeroParticles();
  initHeroParallax();
});

/**
 * Set active navigation link based on current page
 */
function initActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Comparar href exacto o si la página actual empieza con el href (para query params)
    if (href === currentPage || currentPage.startsWith(href + '?') || currentPage.startsWith(href + '#')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Header scroll effect
 */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/**
 * Mobile menu toggle
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });
}

/**
 * Scroll animations for elements
 */
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe elements
  document.querySelectorAll('.animate-on-scroll, .product-card, .category-card, .benefit-card, .testimonial-card').forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
  });
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Advanced Shop Filters
 */
function initShopFilters() {
  // Si no hay productos aún, esperar a que se carguen
  const productCards = document.querySelectorAll('.product-card');
  if (!productCards.length) {
    console.log('No hay productos aún, esperando carga del CMS...');
    return;
  }

  initShopFiltersInternal();
}

function initShopFiltersInternal() {
  const productCards = document.querySelectorAll('.product-card');
  if (!productCards.length) return;

  // Elements
  const searchInput = document.getElementById('productSearch');
  const mobileSearchInput = document.getElementById('mobileProductSearch');
  const categoryFilters = document.querySelectorAll('.category-filter');
  const brandFilters = document.querySelectorAll('.brand-filter');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const applyPriceBtn = document.getElementById('applyPriceFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const resultsCount = document.getElementById('resultsCount');
  const sortSelect = document.getElementById('sortSelect');

  // Extract brand from product name
  function getBrand(productName) {
    const name = productName.toLowerCase();
    if (name.includes('fox')) return 'fox';
    if (name.includes('fly')) return 'fly';
    if (name.includes('alpinestars') || name.includes('alpine')) return 'alpinestars';
    if (name.includes('leatt')) return 'leatt';
    if (name.includes('troy lee')) return 'troy-lee';
    if (name.includes('oneal') || name.includes('oneal')) return 'oneal';
    if (name.includes('airoh')) return 'airoh';
    if (name.includes('acerbis')) return 'acerbis';
    if (name.includes('gaerne')) return 'gaerne';
    if (name.includes('fxr')) return 'fxr';
    if (name.includes('thor')) return 'thor';
    if (name.includes('ktm')) return 'ktm';
    return 'other';
  }

  // Add data-brand attribute to all products
  productCards.forEach(card => {
    const name = card.querySelector('.product-name').textContent;
    const brand = getBrand(name);
    card.dataset.brand = brand;

    // Extract price number
    const priceText = card.querySelector('.product-price').textContent;
    const priceNum = parseInt(priceText.replace(/[^0-9]/g, ''));
    card.dataset.price = priceNum;
  });

  // Filter function
  function filterProducts() {
    const searchTerm = searchInput?.value.toLowerCase() || '';

    // Get selected categories
    const selectedCategories = Array.from(categoryFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.dataset.category);

    // Get selected brands
    const selectedBrands = Array.from(brandFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.dataset.brand);

    // Get price range
    const minPrice = parseInt(minPriceInput?.value) || 0;
    const maxPrice = parseInt(maxPriceInput?.value) || 3000000;

    let visibleCount = 0;

    productCards.forEach(card => {
      try {
        const nameEl = card.querySelector('.product-name');
        if (!nameEl) return;

        const name = nameEl.textContent.toLowerCase();
        const category = card.dataset.category;
        const brand = card.dataset.brand;
        const price = parseInt(card.dataset.price) || 0;

        // Search filter
        const matchesSearch = name.includes(searchTerm);

        // Category filter
        const matchesCategory = selectedCategories.includes('all') || selectedCategories.includes(category);

        // Brand filter
        const matchesBrand = selectedBrands.includes('all') || selectedBrands.includes(brand);

        // Price filter
        const matchesPrice = price >= minPrice && price <= maxPrice;

        if (matchesSearch && matchesCategory && matchesBrand && matchesPrice) {
          card.style.display = 'block';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      } catch (e) {
        console.warn('Error filtering product card:', e);
      }
    });

    // Update results count
    if (resultsCount) {
      resultsCount.textContent = visibleCount;
    }
  }

  // Expose filterProducts globally for price slider
  window.filterProducts = filterProducts;

  // Sort function
  function sortProducts() {
    const sortBy = sortSelect?.value || 'default';
    const productsArray = Array.from(productCards);
    const grid = document.querySelector('.products-grid');

    if (!grid) return;

    productsArray.sort((a, b) => {
      try {
        const nameAEl = a.querySelector('.product-name');
        const nameBEl = b.querySelector('.product-name');
        const nameA = nameAEl ? nameAEl.textContent.toUpperCase() : '';
        const nameB = nameBEl ? nameBEl.textContent.toUpperCase() : '';
        const priceA = parseInt(a.dataset.price) || 0;
        const priceB = parseInt(b.dataset.price) || 0;

        switch (sortBy) {
          case 'price-asc':
            return priceA - priceB;
          case 'price-desc':
            return priceB - priceA;
          case 'name-asc':
            return nameA.localeCompare(nameB);
          case 'name-desc':
            return nameB.localeCompare(nameA);
          default:
            return 0;
        }
      } catch (e) {
        console.warn('Error sorting products:', e);
        return 0;
      }
    });

    productsArray.forEach(card => {
      try {
        grid.appendChild(card);
      } catch (e) {
        console.warn('Error appending sorted card:', e);
      }
    });
  }

  // Sync mobile and desktop search inputs
  function syncSearchInputs(source, target) {
    if (source && target) {
      try {
        target.value = source.value;
      } catch (e) {
        console.warn('Error syncing search inputs:', e);
      }
    }
  }

  // Event listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      syncSearchInputs(searchInput, mobileSearchInput);
      filterProducts();
    });
  }

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      syncSearchInputs(mobileSearchInput, searchInput);
      filterProducts();
    });
  }

  // Sync mobile chips with desktop filters
  function updateMobileChips(selectedCategory = null, selectedBrand = null) {
    const mobileFilterChips = document.querySelectorAll('.mobile-filter-chip');
    mobileFilterChips.forEach(chip => chip.classList.remove('active'));

    if (selectedCategory && selectedCategory !== 'all') {
      const matchingChip = document.querySelector(`.mobile-filter-chip[data-filter="${selectedCategory}"]`);
      if (matchingChip) matchingChip.classList.add('active');
    } else if (selectedBrand && selectedBrand !== 'all') {
      const matchingChip = document.querySelector(`.mobile-filter-chip[data-filter="${selectedBrand}"]`);
      if (matchingChip) matchingChip.classList.add('active');
    } else {
      const allChip = document.querySelector('.mobile-filter-chip[data-filter="all"]');
      if (allChip) allChip.classList.add('active');
    }
  }

  categoryFilters.forEach(cb => {
    cb.addEventListener('change', () => {
      // Handle "all" checkbox
      if (cb.dataset.category === 'all') {
        if (cb.checked) {
          categoryFilters.forEach(c => {
            if (c.dataset.category !== 'all') c.checked = false;
          });
        }
      } else {
        const allCheckbox = document.querySelector('.category-filter[data-category="all"]');
        if (allCheckbox) allCheckbox.checked = false;
      }

      // Update mobile chips
      const selectedCategory = Array.from(categoryFilters).find(c => c.checked && c.dataset.category !== 'all')?.dataset.category;
      const selectedBrand = Array.from(brandFilters).find(b => b.checked && b.dataset.brand !== 'all')?.dataset.brand;
      updateMobileChips(selectedCategory, selectedBrand);

      filterProducts();
    });
  });

  brandFilters.forEach(cb => {
    cb.addEventListener('change', () => {
      // Handle "all" checkbox
      if (cb.dataset.brand === 'all') {
        if (cb.checked) {
          brandFilters.forEach(b => {
            if (b.dataset.brand !== 'all') b.checked = false;
          });
        }
      } else {
        const allCheckbox = document.querySelector('.brand-filter[data-brand="all"]');
        if (allCheckbox) allCheckbox.checked = false;
      }

      // Update mobile chips
      const selectedCategory = Array.from(categoryFilters).find(c => c.checked && c.dataset.category !== 'all')?.dataset.category;
      const selectedBrand = Array.from(brandFilters).find(b => b.checked && b.dataset.brand !== 'all')?.dataset.brand;
      updateMobileChips(selectedCategory, selectedBrand);

      filterProducts();
    });
  });

  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', filterProducts);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      // Reset search
      if (searchInput) searchInput.value = '';
      if (mobileSearchInput) mobileSearchInput.value = '';

      // Reset categories
      categoryFilters.forEach(cb => {
        cb.checked = cb.dataset.category === 'all';
      });

      // Reset brands
      brandFilters.forEach(cb => {
        cb.checked = cb.dataset.brand === 'all';
      });

      // Reset price
      if (minPriceInput) minPriceInput.value = 0;
      if (maxPriceInput) maxPriceInput.value = 3000000;

      // Reset sort
      if (sortSelect) sortSelect.value = 'default';

      filterProducts();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', sortProducts);
  }

  // Check URL params for category filter
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('cat');
  if (category) {
    const targetCb = document.querySelector(`.category-filter[data-category="${category}"]`);
    if (targetCb) {
      document.querySelector('.category-filter[data-category="all"]').checked = false;
      targetCb.checked = true;
      filterProducts();
    }
  }

  // Mobile filter toggle (legacy support)
  const mobileFilterToggle = document.getElementById('mobileFilterToggle');
  const shopSidebar = document.querySelector('.shop-sidebar');
  const shopOverlay = document.getElementById('shopOverlay');

  // New Mobile Filters Trigger Button
  const mobileFiltersTrigger = document.getElementById('mobileFiltersTrigger');
  const sidebarClose = document.getElementById('sidebarClose');

  function openSidebar() {
    if (shopSidebar) shopSidebar.classList.add('active');
    if (shopOverlay) shopOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (shopSidebar) shopSidebar.classList.remove('active');
    if (shopOverlay) shopOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileFiltersTrigger) {
    mobileFiltersTrigger.addEventListener('click', openSidebar);
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  if (mobileFilterToggle && shopSidebar) {
    mobileFilterToggle.addEventListener('click', () => {
      shopSidebar.classList.toggle('active');
      if (shopOverlay) shopOverlay.classList.toggle('active');
    });
  }

  // Close sidebar when clicking overlay
  if (shopOverlay) {
    shopOverlay.addEventListener('click', closeSidebar);
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && shopSidebar && shopSidebar.classList.contains('active')) {
      if (!shopSidebar.contains(e.target) &&
          !mobileFiltersTrigger?.contains(e.target) &&
          !mobileFilterToggle?.contains(e.target)) {
        closeSidebar();
      }
    }
  });

  // ========================================
  // DUAL-HANDLE PRICE RANGE SLIDER
  // ========================================
  initPriceRangeSlider();
}

function initPriceRangeSlider() {
  const track = document.querySelector('.slider-track');
  const minThumb = document.getElementById('minThumb');
  const maxThumb = document.getElementById('maxThumb');
  const sliderFill = document.querySelector('.slider-fill');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const applyPriceBtn = document.getElementById('applyPriceFilter');

  if (!track || !minThumb || !maxThumb || !sliderFill || !minPriceInput || !maxPriceInput) {
    return;
  }

  // Get product price range dynamically
  let MIN_PRICE = 0;
  let MAX_PRICE = 3000000;

  // Try to get actual price range from loaded products
  function updatePriceRangeFromProducts() {
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length === 0) return;

    let min = Infinity;
    let max = -Infinity;

    productCards.forEach(card => {
      const price = parseInt(card.dataset.price) || 0;
      if (price > 0) {
        min = Math.min(min, price);
        max = Math.max(max, price);
      }
    });

    if (min !== Infinity && max !== -Infinity) {
      MIN_PRICE = min;
      MAX_PRICE = max;
      // Update input max/min attributes
      minPriceInput.max = MAX_PRICE;
      maxPriceInput.max = MAX_PRICE;
      minPriceInput.min = MIN_PRICE;
      maxPriceInput.min = MIN_PRICE;
    }
  }

  // Call after products are loaded
  setTimeout(updatePriceRangeFromProducts, 500);

  let isMinDragging = false;
  let isMaxDragging = false;

  // Convert price to percentage position
  function priceToPercent(price) {
    const range = MAX_PRICE - MIN_PRICE;
    if (range === 0) return 0;
    return ((price - MIN_PRICE) / range) * 100;
  }

  // Convert percentage position to price
  function percentToPrice(percent) {
    const range = MAX_PRICE - MIN_PRICE;
    return MIN_PRICE + (percent / 100) * range;
  }

  // Update slider fill and input values
  function updateSlider() {
    const minPrice = parseInt(minPriceInput.value) || MIN_PRICE;
    const maxPrice = parseInt(maxPriceInput.value) || MAX_PRICE;

    const minPercent = priceToPercent(minPrice);
    const maxPercent = priceToPercent(maxPrice);

    // Position thumbs
    minThumb.style.left = `${minPercent}%`;
    maxThumb.style.left = `${maxPercent}%`;

    // Update fill
    sliderFill.style.left = `${minPercent}%`;
    sliderFill.style.right = `${100 - maxPercent}%`;
  }

  // Handle drag start
  function handleDragStart(e, isMin) {
    e.preventDefault();
    if (isMin) {
      isMinDragging = true;
    } else {
      isMaxDragging = true;
    }
    document.body.style.cursor = 'grabbing';
  }

  // Handle drag end
  function handleDragEnd() {
    isMinDragging = false;
    isMaxDragging = false;
    document.body.style.cursor = '';
  }

  // Handle drag move
  function handleDragMove(e) {
    if (!isMinDragging && !isMaxDragging) return;
    e.preventDefault();

    // Get pointer position (touch or mouse)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const trackRect = track.getBoundingClientRect();
    const trackWidth = trackRect.width;

    // Calculate percentage along track
    let percent = ((clientX - trackRect.left) / trackWidth) * 100;
    percent = Math.max(0, Math.min(100, percent)); // Clamp between 0-100

    // Convert to price
    let newPrice = percentToPrice(percent);
    // Round to step (50000)
    newPrice = Math.round(newPrice / 50000) * 50000;

    const minPrice = parseInt(minPriceInput.value) || MIN_PRICE;
    const maxPrice = parseInt(maxPriceInput.value) || MAX_PRICE;

    if (isMinDragging) {
      // Min thumb can't exceed max thumb
      if (newPrice > maxPrice) {
        newPrice = maxPrice;
      }
      minPriceInput.value = newPrice;
    } else if (isMaxDragging) {
      // Max thumb can't go below min thumb
      if (newPrice < minPrice) {
        newPrice = minPrice;
      }
      maxPriceInput.value = newPrice;
    }

    updateSlider();
  }

  // Event listeners for thumbs
  minThumb.addEventListener('mousedown', (e) => handleDragStart(e, true));
  maxThumb.addEventListener('mousedown', (e) => handleDragStart(e, false));

  minThumb.addEventListener('touchstart', (e) => handleDragStart(e, true), { passive: false });
  maxThumb.addEventListener('touchstart', (e) => handleDragStart(e, false), { passive: false });

  // Global drag listeners
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('touchmove', handleDragMove, { passive: false });
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('touchend', handleDragEnd);

  // Sync input changes with slider
  minPriceInput.addEventListener('input', updateSlider);
  maxPriceInput.addEventListener('input', updateSlider);

  // Apply filter on button click
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', () => {
      if (typeof filterProducts === 'function') {
        filterProducts();
      }
    });
  }

  // Also filter when dragging ends
  function handleDragEndWithFilter() {
    handleDragEnd();
    if (typeof filterProducts === 'function') {
      filterProducts();
    }
  }

  minThumb.addEventListener('mouseup', handleDragEndWithFilter);
  maxThumb.addEventListener('mouseup', handleDragEndWithFilter);
  minThumb.addEventListener('touchend', handleDragEndWithFilter);
  maxThumb.addEventListener('touchend', handleDragEndWithFilter);

  // Initialize slider position
  updateSlider();

  if (shopOverlay && shopSidebar) {
    shopOverlay.addEventListener('click', () => {
      shopSidebar.classList.remove('active');
      shopOverlay.classList.remove('active');
    });
  }

  // Mobile Quick Filters - REINITIALIZABLE function
  window.initMobileFilterChips = function() {
    const mobileFilterChips = document.querySelectorAll('.mobile-filter-chip');
    if (!mobileFilterChips.length) return;

    mobileFilterChips.forEach(chip => {
      // Remove old listeners by cloning
      const newChip = chip.cloneNode(true);
      chip.parentNode.replaceChild(newChip, chip);

      newChip.addEventListener('click', () => {
        // Remove active class from all chips
        document.querySelectorAll('.mobile-filter-chip').forEach(c => c.classList.remove('active'));
        // Add active class to clicked chip
        newChip.classList.add('active');

        const filterValue = newChip.dataset.filter;

        // Reset desktop filters
        categoryFilters.forEach(cb => cb.checked = false);
        brandFilters.forEach(cb => cb.checked = false);

        if (filterValue === 'all') {
          // Show all products
          const allCategory = document.querySelector('.category-filter[data-category="all"]');
          if (allCategory) allCategory.checked = true;
          const allBrand = document.querySelector('.brand-filter[data-brand="all"]');
          if (allBrand) allBrand.checked = true;
        } else if (['cascos', 'uniformes', 'botas', 'protecciones'].includes(filterValue)) {
          // Category filter
          const targetCategory = document.querySelector(`.category-filter[data-category="${filterValue}"]`);
          if (targetCategory) {
            targetCategory.checked = true;
            // Uncheck "all"
            const allCategory = document.querySelector('.category-filter[data-category="all"]');
            if (allCategory) allCategory.checked = false;
          }
          // Check "all brands"
          const allBrand = document.querySelector('.brand-filter[data-brand="all"]');
          if (allBrand) allBrand.checked = true;
        } else {
          // Brand filter
          const targetBrand = document.querySelector(`.brand-filter[data-brand="${filterValue}"]`);
          if (targetBrand) {
            targetBrand.checked = true;
            // Uncheck "all"
            const allBrand = document.querySelector('.brand-filter[data-brand="all"]');
            if (allBrand) allBrand.checked = false;
          }
          // Check "all categories"
          const allCategory = document.querySelector('.category-filter[data-category="all"]');
          if (allCategory) allCategory.checked = true;
        }

        filterProducts();
        updateResultsCount();

        // Scroll to products grid
        document.getElementById('productsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  // Initialize mobile filter chips
  window.initMobileFilterChips();
}

/**
 * FAQ accordion
 */
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all items
      faqItems.forEach(i => i.classList.remove('active'));

      // Open clicked if it wasn't active
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/**
 * Size selector for product pages
 */
function initSizeSelector() {
  const sizeBtns = document.querySelectorAll('.size-btn');
  if (!sizeBtns.length) return;

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.size-selector');
      if (!container) return;

      container.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/**
 * Product thumbnail selection
 */
function initProductThumbnails() {
  const thumbnails = document.querySelectorAll('.thumbnail');
  if (!thumbnails.length) return;

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const container = thumb.closest('.product-gallery');
      if (!container) return;

      container.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');

      // Update main image (placeholder logic)
      const mainImage = container.querySelector('.product-main-image');
      if (mainImage) {
        mainImage.style.opacity = '0.5';
        setTimeout(() => {
          mainImage.style.opacity = '1';
        }, 200);
      }
    });
  });
}

/**
 * Contact form handling
 */
function initContactForm() {
  const form = document.querySelector('.contact-form form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // Validate
    if (!name || !email || !message) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }

    // Redirect to WhatsApp with pre-filled message
    const whatsappMessage = `Hola MXZONE, mi nombre es ${name}. ${message}`;
    const whatsappUrl = `https://wa.me/573176692997?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(whatsappUrl, '_blank');

    // Reset form
    form.reset();
    showNotification('¡Redirigiendo a WhatsApp!', 'success');
  });
}

/**
 * Notification system
 */
function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Styles
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: '600',
    zIndex: '1000',
    animation: 'fadeInUp 0.3s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    ...(type === 'success' ? { background: '#25D366' } :
      type === 'error' ? { background: '#E63946' } :
      { background: '#FF6600' })
  });

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'fadeInUp 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Count up animation for stats
 */
function initCountUp() {
  const stats = document.querySelectorAll('.stat-number');
  if (!stats.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const text = target.textContent;

        // Check if it's a number with + sign
        if (text.includes('+')) {
          const num = parseInt(text.replace('+', ''));
          if (!isNaN(num)) {
            animateCountUp(target, 0, num, 1500);
          }
        } else if (text.includes('%')) {
          const num = parseInt(text.replace('%', ''));
          if (!isNaN(num)) {
            animateCountUp(target, 0, num, 1500, '%');
          }
        }

        observer.unobserve(target);
      }
    });
  }, observerOptions);

  stats.forEach(stat => observer.observe(stat));
}

function animateCountUp(element, start, end, duration, suffix = '') {
  const startTime = performance.now();

  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (easeOutQuart)
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (end - start) * ease);

    element.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };

  requestAnimationFrame(update);
}

/**
 * Parallax effect for hero section
 */
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroHeight = hero.offsetHeight;

    if (scrolled < heroHeight) {
      const bg = hero.querySelector('.hero-bg-pattern');
      if (bg) {
        bg.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    }
  }, { passive: true });
}

// Initialize parallax if on homepage
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
  initParallax();
}

/**
 * Lazy loading for images
 */
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
initLazyLoading();

/**
 * Add to cart animation (for future e-commerce)
 */
function addToCartAnimation(btn) {
  const originalText = btn.textContent;
  btn.textContent = '¡Agregado!';
  btn.style.background = '#25D366';

  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 1500);
}

/**
 * Search functionality (for future implementation)
 */
function initSearch() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();

    document.querySelectorAll('.product-card').forEach(card => {
      const name = card.querySelector('.product-name').textContent.toLowerCase();
      const category = card.querySelector('.product-category').textContent.toLowerCase();

      if (name.includes(query) || category.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

/**
 * Product Modal / Lightbox
 */
function initProductModal() {
  // Si no hay productos aún, esperar a que se carguen
  const productCards = document.querySelectorAll('.product-card');
  if (!productCards.length) {
    console.log('No hay productos aún, esperando carga del CMS...');
    return;
  }

  initProductModalInternal();
}

function initProductModalInternal() {
  const modal = document.getElementById('productModal');
  const modalClose = document.getElementById('modalClose');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  if (!modal) return;

  // Modal elements
  const modalImage = document.getElementById('modalImage');
  const modalPlaceholder = document.getElementById('modalPlaceholder');
  const modalThumbnails = document.getElementById('modalThumbnails');
  const modalCategory = document.getElementById('modalCategory');
  const modalName = document.getElementById('modalName');
  const modalPrice = document.getElementById('modalPrice');
  const modalDescription = document.getElementById('modalDescription');
  const modalSizes = document.getElementById('modalSizes');
  const modalSizesContainer = document.getElementById('modalSizesContainer');
  const modalSizeSelect = document.getElementById('modalSizeSelect');
  const modalWhatsapp = document.getElementById('modalWhatsapp');
  const modalAddToCart = document.getElementById('modalAddToCart');

  // Product descriptions for different categories
  const descriptions = {
    cascos: 'Casco de alto rendimiento con certificación DOT y ECE. Ventilación optimizada y materiales de máxima calidad para protección superior en pista y trail.',
    uniformes: 'Kit completo de uniforme (jersey + pantalón) diseñado para competición. Tejidos transpirables, costuras reforzadas y ajuste ergonómico.',
    botas: 'Botas de motocross con sistema de protección avanzado. Suela antideslizante, cierre de hebillas y soporte de tobillo reforzado.',
    protecciones: 'Equipo de protección certificado para máxima seguridad. Materiales impact-absorbentes y diseño ergonómico para comodidad en carrera.'
  };

  // Current product data
  let currentProduct = null;
  let currentImages = [];
  let currentImageIndex = 0;

  // Function to update modal image
  function setModalImage(imageSrc) {
    if (imageSrc) {
      modalImage.style.opacity = '0';
      setTimeout(() => {
        modalImage.src = imageSrc;
        modalImage.style.display = 'block';
        modalPlaceholder.style.display = 'none';
        modalImage.style.opacity = '1';
      }, 150);
    } else {
      modalImage.style.display = 'none';
      modalPlaceholder.style.display = 'block';
    }
  }

  // Function to create thumbnails
  function createThumbnails(images) {
    if (!modalThumbnails) return;

    modalThumbnails.innerHTML = '';

    if (images.length <= 1) {
      modalThumbnails.style.display = 'none';
      return;
    }

    modalThumbnails.style.display = 'flex';

    images.forEach((imgSrc, index) => {
      const thumb = document.createElement('div');
      thumb.className = `modal-thumbnail${index === 0 ? ' active' : ''}`;

      if (imgSrc) {
        thumb.innerHTML = `<img src="${imgSrc}" alt="Vista ${index + 1}">`;
      } else {
        thumb.innerHTML = '<div class="modal-thumbnail-placeholder">MX</div>';
      }

      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        currentImageIndex = index;

        // Update active state
        modalThumbnails.querySelectorAll('.modal-thumbnail').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');

        // Update main image
        setModalImage(imgSrc);
      });

      modalThumbnails.appendChild(thumb);
    });
  }

  // Setup size selector in modal
  function setupSizeSelector(sizes) {
    if (!modalSizes || !modalSizeSelect) return;

    const sizesArray = sizes.split('/').map(s => s.trim());

    // Show selector for multiple sizes, tags for single size
    if (sizesArray.length > 1) {
      modalSizes.style.display = 'none';
      modalSizeSelect.style.display = 'block';
      modalSizeSelect.innerHTML = sizesArray.map(size =>
        `<option value="${size}">${size}</option>`
      ).join('');
    } else {
      modalSizes.style.display = 'flex';
      modalSizeSelect.style.display = 'none';
      modalSizes.innerHTML = '';
      sizesArray.forEach(size => {
        const sizeTag = document.createElement('span');
        sizeTag.className = 'modal-size-tag';
        sizeTag.textContent = size;
        modalSizes.appendChild(sizeTag);
      });
    }
  }

  // Get selected size from modal
  function getSelectedSize() {
    if (modalSizeSelect && modalSizeSelect.style.display !== 'none') {
      return modalSizeSelect.value;
    }
    const selectedTag = modalSizes.querySelector('.modal-size-tag.active');
    if (selectedTag) {
      return selectedTag.textContent;
    }
    const firstTag = modalSizes.querySelector('.modal-size-tag');
    return firstTag ? firstTag.textContent : 'Única';
  }

  // Open modal on product card click (anywhere on the card)
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking on WhatsApp, Add to Cart, Ver button, or size select
      if (e.target.closest('.btn-whatsapp') ||
          e.target.closest('.btn-cart-add') ||
          e.target.closest('.btn-secondary') ||
          e.target.closest('.card-size-select') ||
          e.target.closest('.product-sizes-selector')) {
        return;
      }

      e.preventDefault();

      // Get product data from card
      const name = card.querySelector('.product-name').textContent;
      const price = card.querySelector('.product-price').textContent;
      const categoryEl = card.querySelector('.product-category').textContent;
      const category = categoryEl.toLowerCase();
      const sizesEl = card.querySelector('.product-size span');
      const sizes = sizesEl ? sizesEl.textContent : card.dataset.sizes || 'Única';

      // Get images (support for multiple images)
      let images = [];
      try {
        const imagesData = card.dataset.images;
        if (imagesData) {
          images = JSON.parse(imagesData.replace(/&#39;/g, "'"));
        }
      } catch (err) {
        images = [];
      }

      // Fallback to single image if no images array
      if (images.length === 0 && card.dataset.image) {
        images = [card.dataset.image];
      }

      // Store current product data
      currentProduct = {
        name,
        price,
        priceNum: parseInt(price.replace(/[^0-9]/g, '')),
        category,
        image: images[0] || '',
        images,
        sizes
      };

      currentImages = images;
      currentImageIndex = 0;

      // Populate modal
      modalCategory.textContent = categoryEl;
      modalName.textContent = name;
      modalPrice.textContent = price;
      modalDescription.textContent = descriptions[category] || descriptions.cascos;

      // Set main image and thumbnails
      setModalImage(images[0] || '');
      createThumbnails(images);

      // Setup size selector
      setupSizeSelector(sizes);

      // Set WhatsApp link
      const whatsappMessage = `Estoy%20interesado%20en%20${encodeURIComponent(name)}`;
      modalWhatsapp.href = `https://wa.me/573176692997?text=${whatsappMessage}`;

      // Show modal
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // Add cursor pointer to indicate clickability
    card.style.cursor = 'pointer';
  });

  // Add to Cart button in modal
  if (modalAddToCart) {
    modalAddToCart.addEventListener('click', () => {
      if (!currentProduct) return;

      const selectedSize = getSelectedSize();
      window.MXZONECart.addToCart(currentProduct, selectedSize);

      // Animation feedback
      modalAddToCart.innerHTML = '✓ Agregado';
      modalAddToCart.style.background = '#25D366';
      setTimeout(() => {
        modalAddToCart.innerHTML = '🛒 Agregar al Carrito';
        modalAddToCart.style.background = '';
      }, 1500);
    });
  }

  // Size tag selection (for single size display)
  modalSizes?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-size-tag')) {
      modalSizes.querySelectorAll('.modal-size-tag').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
    }
  });

  // Close modal functions
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
    currentImages = [];
    currentImageIndex = 0;
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Navigate images with arrow keys
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active') || currentImages.length <= 1) return;

    if (e.key === 'ArrowLeft') {
      currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
      setModalImage(currentImages[currentImageIndex]);

      // Update thumbnail active state
      if (modalThumbnails) {
        modalThumbnails.querySelectorAll('.modal-thumbnail').forEach((t, i) => {
          t.classList.toggle('active', i === currentImageIndex);
        });
      }
    } else if (e.key === 'ArrowRight') {
      currentImageIndex = (currentImageIndex + 1) % currentImages.length;
      setModalImage(currentImages[currentImageIndex]);

      // Update thumbnail active state
      if (modalThumbnails) {
        modalThumbnails.querySelectorAll('.modal-thumbnail').forEach((t, i) => {
          t.classList.toggle('active', i === currentImageIndex);
        });
      }
    }
  });

  // Size Guide Modal
  const sizeGuideModal = document.getElementById('sizeGuideModal');
  const openSizeGuideBtn = document.getElementById('openSizeGuide');
  const closeSizeGuideBtn = document.getElementById('closeSizeGuide');
  const confirmSizeGuideBtn = document.getElementById('confirmSizeGuide');

  if (openSizeGuideBtn && sizeGuideModal) {
    openSizeGuideBtn.addEventListener('click', () => {
      sizeGuideModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  function closeSizeGuide() {
    if (sizeGuideModal) {
      sizeGuideModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (closeSizeGuideBtn) closeSizeGuideBtn.addEventListener('click', closeSizeGuide);
  if (confirmSizeGuideBtn) confirmSizeGuideBtn.addEventListener('click', closeSizeGuide);
  if (sizeGuideModal) {
    sizeGuideModal.addEventListener('click', (e) => {
      if (e.target === sizeGuideModal) closeSizeGuide();
    });
  }

  // Image Preview Modal - Click en imagen abre preview
  const imagePreviewModal = document.getElementById('imagePreviewModal');
  const imagePreviewMain = document.getElementById('imagePreviewMain');
  const imagePreviewThumbnails = document.getElementById('imagePreviewThumbnails');
  const closeImagePreviewBtn = document.getElementById('closeImagePreview');

  if (imagePreviewModal && imagePreviewMain) {
    // Delegación de eventos para clicks en imágenes de productos
    document.addEventListener('click', (e) => {
      const productImage = e.target.closest('.product-image img');
      if (!productImage || !productImage.src) return;

      e.preventDefault();
      e.stopPropagation();

      // Obtener todas las imágenes del producto
      const card = productImage.closest('.product-card');
      let images = [];

      try {
        const imagesData = card?.dataset.images;
        if (imagesData) {
          images = JSON.parse(imagesData.replace(/&#39;/g, "'"));
        }
      } catch (err) {
        images = [];
      }

      if (images.length === 0 && productImage.src) {
        images = [productImage.src];
      }

      // Mostrar preview
      imagePreviewMain.src = images[0] || productImage.src;
      imagePreviewMain.dataset.index = '0';

      // Crear thumbnails si hay múltiples imágenes
      if (images.length > 1 && imagePreviewThumbnails) {
        imagePreviewThumbnails.innerHTML = '';
        imagePreviewThumbnails.style.display = 'flex';

        images.forEach((imgSrc, idx) => {
          const thumb = document.createElement('div');
          thumb.className = `image-preview-thumb${idx === 0 ? ' active' : ''}`;
          thumb.innerHTML = `<img src="${imgSrc}" alt="Vista ${idx + 1}">`;
          thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            imagePreviewMain.src = imgSrc;
            imagePreviewMain.dataset.index = idx.toString();
            imagePreviewThumbnails.querySelectorAll('.image-preview-thumb').forEach((t, i) => {
              t.classList.toggle('active', i === idx);
            });
          });
          imagePreviewThumbnails.appendChild(thumb);
        });
      } else if (imagePreviewThumbnails) {
        imagePreviewThumbnails.style.display = 'none';
      }

      imagePreviewModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // Cerrar preview
    if (closeImagePreviewBtn) {
      closeImagePreviewBtn.addEventListener('click', () => {
        imagePreviewModal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    imagePreviewModal.addEventListener('click', (e) => {
      if (e.target === imagePreviewModal || e.target.classList.contains('image-preview-container')) {
        imagePreviewModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Navegar con teclas
    document.addEventListener('keydown', (e) => {
      if (!imagePreviewModal.classList.contains('active')) return;

      const currentIndex = parseInt(imagePreviewMain.dataset.index) || 0;
      const thumbnails = imagePreviewThumbnails?.querySelectorAll('.image-preview-thumb');

      if (e.key === 'Escape') {
        imagePreviewModal.classList.remove('active');
        document.body.style.overflow = '';
      } else if (thumbnails && thumbnails.length > 1) {
        if (e.key === 'ArrowLeft') {
          const prevIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
          thumbnails[prevIndex].click();
        } else if (e.key === 'ArrowRight') {
          const nextIndex = (currentIndex + 1) % thumbnails.length;
          thumbnails[nextIndex].click();
        }
      }
    });
  }
}

/**
 * Hero Particles Animation - Optimized
 */
function initHeroParticles() {
  const particlesContainer = document.getElementById('heroParticles');
  if (!particlesContainer) return;

  // Reduced particle count for performance
  const particleCount = 15;

  for (let i = 0; i < particleCount; i++) {
    createParticle(particlesContainer, i);
  }
}

function createParticle(container, index) {
  const particle = document.createElement('div');
  particle.className = 'particle';

  // Random properties - smaller particles for better performance
  const size = Math.random() * 8 + 2;
  const left = Math.random() * 100;
  const delay = Math.random() * 5;
  const duration = Math.random() * 15 + 15;

  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.left = `${left}%`;
  particle.style.animationDelay = `${delay}s`;
  particle.style.animationDuration = `${duration}s`;
  particle.style.willChange = 'transform, opacity';

  container.appendChild(particle);
}

/**
 * Hero Parallax Effect & Video Toggle
 * Nota: Parallax removido para mejor rendimiento y scroll smooth
 */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const videoContainer = hero.querySelector('.hero-video-container');
  const video = hero.querySelector('.hero-video');

  if (!videoContainer) return;

  let videoEnabled = true;
  const triggerPoint = hero.offsetHeight * 0.3;

  // Solo toggle del video, sin parallax
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;

    if (scrolled > triggerPoint) {
      if (videoEnabled) {
        videoContainer.classList.add('hidden');
        video.pause();
        videoEnabled = false;
      }
    } else {
      if (!videoEnabled) {
        videoContainer.classList.remove('hidden');
        video.play();
        videoEnabled = true;
      }
    }
  }, { passive: true });
}

// Export functions for external use
window.MXZONE = {
  addToCartAnimation,
  showNotification,
  InitShopFilters: initShopFiltersInternal,
  InitProductModal: initProductModalInternal,
  InitPriceSlider: initPriceRangeSlider
};
