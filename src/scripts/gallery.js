const popup = document.querySelector('div.popup')
const splideList = document.querySelector('.splide__list')
const masonryItems = Array.from(document.querySelectorAll('.masonry__item'))
const filters = document.querySelectorAll('.gallery__filter_button:not(#load-more)')
const loadMoreBtn = document.getElementById('load-more')

let splide
let allGeneratedSlides = []
let visibleCount = 20
const STEP = 12
let currentCategory = 'Все'

// --- 1. ЗАГРУЗКА МЕДИА ДЛЯ ГЛАВНОЙ СТРАНИЦЫ ---
function loadMedia(item) {
    const media = item.querySelector('img, video')
    if (!media) return
    const src = media.getAttribute('data-src')
    if (src) {
        media.src = src
        media.removeAttribute('data-src')
        if (media.tagName.toLowerCase() === 'video') media.load()
    }
}

// --- 2. ГЕНЕРАЦИЯ СЛАЙДОВ ---
function generateSlides() {
    allGeneratedSlides = masonryItems.map(item => {
        const media = item.querySelector('img, video')
        // Важно: всегда берем путь из data-src, так как в masonry он может быть уже заменен на src
        const src = media.getAttribute('src') || media.getAttribute('data-src')
        const alt = media.getAttribute('alt') || ''
        const filter = item.dataset.filter
        const isVideo = media.tagName.toLowerCase() === 'video'

        const slide = document.createElement('div')
        slide.className = 'splide__slide slider__item'
        slide.dataset.filter = filter

        const mediaHtml = isVideo
            ? `<video data-splide-lazy="${src}" class="slider__img" loop muted playsinline controls></video>`
            : `<img data-splide-lazy="${src}" class="slider__img" alt="${alt}" />`

        slide.innerHTML = `
            <div class="splide__cube"></div>
            <div class="splide__cover events__none">
				<div class="splide__cover_wrapper">
					<button class="splide__close events__all">
						<svg class="splide__icon_close"><use href="img/icons/sprite.svg#close"></use></svg>
					</button>
					<button class="slide__arrow_btn prev events__all">
						<svg class="splide__icon"><use href="img/icons/sprite.svg#left"></use></svg>
					</button>
					<button class="slide__arrow_btn next events__all">
						<svg class="splide__icon"><use href="img/icons/sprite.svg#right"></use></svg>
					</button>
				</div>
            </div>
            ${mediaHtml}
        `
        return slide
    })
}

// --- 3. ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ SPLIDE ---
function initGallery() {
    generateSlides()

    splide = new Splide('.splide', {
        type: 'region', // Для галереи "всплывающим окном" fade работает лучше
        perPage: 1,
        focus: 'center',
        rewind: true,
        pagination: false,
        arrows: false,
        perMove: 1,
        lazyLoad: 'nearby',
        flickPower: 9000,
    })

    // Останавливаем видео при переключении
    splide.on('move', () => {
        splideList.querySelectorAll('video').forEach(v => v.pause())
    })

    // Когда слайд стал активным ИЛИ когда загрузилась ленивая картинка — обновляем рамку
    splide.on('active lazyload:loaded', () => {
        updateImageBorder()
        const activeSlide = splide.Components.Slides.getAt(splide.index).slide
        const video = activeSlide.querySelector('video')
        if (video && popup.classList.contains('active')) video.play()
    })

    splide.mount()
    applyGalleryLogic()
}

// --- 4. ОБНОВЛЕНИЕ ГРАНИЦ (ИСПРАВЛЕНО) ---
async function updateImageBorder() {
    const activeSlide = splide.Components.Slides.getAt(splide.index)?.slide
    if (!activeSlide) return

    const media = activeSlide.querySelector('.slider__img')
    const cube = activeSlide.querySelector('.splide__cube')
    const cover = activeSlide.querySelector('.splide__cover')
    if (!media || !cube || !cover) return

    // Скрываем, пока не высчитали
    cube.style.opacity = '0'

    try {
        const dimensions = await new Promise((resolve, reject) => {
            // Если src еще нет (Splide не подставил), берем из data-splide-lazy
            const currentSrc = media.src || media.getAttribute('data-splide-lazy')

            if (media.tagName.toLowerCase() === 'video') {
                if (media.videoWidth) {
                    resolve({w: media.videoWidth, h: media.videoHeight})
                } else {
                    media.onloadedmetadata = () => resolve({w: media.videoWidth, h: media.videoHeight})
                    media.onerror = reject
                    if (!media.src) media.src = currentSrc // Форсируем загрузку для видео
                }
            } else {
                const tempImg = new Image()
                tempImg.onload = () => resolve({w: tempImg.naturalWidth, h: tempImg.naturalHeight})
                tempImg.onerror = reject
                tempImg.src = currentSrc
            }
        })

        const mediaAspect = dimensions.w / dimensions.h
        const maxWidthPx = window.innerWidth * 0.85
        const maxHeightPx = window.innerHeight * 0.9

        let finalW, finalH
        if (maxWidthPx / maxHeightPx > mediaAspect) {
            finalH = maxHeightPx
            finalW = finalH * mediaAspect
        } else {
            finalW = maxWidthPx
            finalH = finalW / mediaAspect
        }

        const sizeW = Math.round(finalW) + 'px'
        const sizeH = Math.round(finalH) + 'px'

        ;[cube, cover].forEach(el => {
            el.style.width = sizeW
            el.style.height = sizeH
        })

        cube.style.opacity = '1'
        cover.querySelectorAll('.slide__arrow_btn, .splide__close').forEach(btn => btn.style.opacity = '1')
    } catch (e) {
        console.error("Ошибка загрузки размеров медиа:", e)
    }
}

// --- 5. УПРАВЛЕНИЕ ВИДИМОСТЬЮ ---
function applyGalleryLogic() {
    const filteredMasonry = masonryItems.filter(
        item => currentCategory === 'Все' || item.dataset.filter === currentCategory,
    )

    masonryItems.forEach(item => (item.style.display = 'none'))

    filteredMasonry.forEach((item, index) => {
        if (index < visibleCount) {
            item.style.display = 'block'
            loadMedia(item)
        }
    })

    loadMoreBtn.style.display = visibleCount >= filteredMasonry.length ? 'none' : 'inline-block'
    updateSliderContent(currentCategory)
}

function updateSliderContent(category) {
    splideList.innerHTML = ''
    const filtered = allGeneratedSlides.filter(
        slide => category === 'Все' || slide.dataset.filter === category,
    )
    filtered.forEach(slide => splideList.appendChild(slide))
    splide.refresh()
}

// --- 6. СОБЫТИЯ КЛИКОВ ---
masonryItems.forEach(item => {
    item.addEventListener('click', () => {
        const media = item.querySelector('img, video')
        // Путь, по которому будем искать слайд в Splide
        const clickedSrc = media.getAttribute('src') || media.getAttribute('data-src')

        popup.classList.add('active')

        // Сначала обновляем структуру
        splide.refresh()

        const currentSlides = Array.from(splideList.querySelectorAll('.slider__item'))
        const targetIndex = currentSlides.findIndex(s => {
            const img = s.querySelector('.slider__img')
            return img.getAttribute('data-splide-lazy') === clickedSrc || img.getAttribute('src') === clickedSrc
        })

        if (targetIndex !== -1) {
            splide.go(targetIndex)
        }

        // Вызываем расчет размеров принудительно
        setTimeout(updateImageBorder, 50)
    })
})

// Фильтры
filters.forEach(filterBtn => {
    filterBtn.addEventListener('click', () => {
        currentCategory = filterBtn.querySelector('span')?.innerText || filterBtn.innerText.trim()
        filters.forEach(f => f.classList.remove('active'))
        filterBtn.classList.add('active')
        visibleCount = STEP
        applyGalleryLogic()
    })
})

loadMoreBtn.addEventListener('click', () => {
    visibleCount += STEP
    applyGalleryLogic()
})

// Закрытие
const closeSlider = () => {
    popup.classList.remove('active')
    popup.querySelectorAll('video').forEach(v => {
        v.pause()
        v.currentTime = 0
    })
}

popup.addEventListener('click', e => {
    const target = e.target
    if (target.closest('.slide__arrow_btn.next')) return splide.go('>')
    if (target.closest('.slide__arrow_btn.prev')) return splide.go('<')
    if (target.closest('.splide__close')) return closeSlider()
    if (target === popup || target.classList.contains('splide__track') || target.tagName === 'IMG' || target.classList.contains('splide__cube')) {
        closeSlider()
    }
})

window.addEventListener('resize', updateImageBorder)
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && popup.classList.contains('active')) closeSlider()
})

initGallery()
