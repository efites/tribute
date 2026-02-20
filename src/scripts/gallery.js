const popup = document.querySelector('div.popup')
const splideList = document.querySelector('.splide__list')
const masonryItems = Array.from(document.querySelectorAll('.masonry__item'))
const filters = document.querySelectorAll('.gallery__filter_button')

let splide
let allGeneratedSlides = [] // Здесь будем хранить созданные DOM-узлы слайдов

// --- 1. ФУНКЦИЯ ГЕНЕРАЦИИ СЛАЙДОВ ---
function generateSlides() {
	allGeneratedSlides = masonryItems.map(item => {
		const img = item.querySelector('img')
		const src = img.getAttribute('src')
		const alt = img.getAttribute('alt')
		const filter = item.dataset.filter

		// Создаем структуру слайда (как в вашем исходном HTML)
		const slide = document.createElement('div')
		slide.className = 'splide__slide slider__item'
		slide.dataset.filter = filter // Сохраняем фильтр в самом слайде

		slide.innerHTML = `
            <div class="splide__cube"></div>
            <div class="splide__cover">
                <button class="splide__close">
                    <svg class="splide__icon_close">
                        <use href="/src/img/icons/sprite.svg#close"></use>
                    </svg>
                </button>
                <button class="slide__arrow_btn prev">
                    <svg class="splide__icon">
                        <use href="/src/img/icons/sprite.svg#left"></use>
                    </svg>
                </button>
                <button class="slide__arrow_btn next">
                    <svg class="splide__icon">
                        <use href="/src/img/icons/sprite.svg#right"></use>
                    </svg>
                </button>
            </div>
            <img src="${src}" class="slider__img" alt="${alt}" />
        `
		return slide
	})
}

// --- 2. ИНИЦИАЛИЗАЦИЯ ---
function initGallery() {
	generateSlides() // Собираем слайды из Masonry

	splide = new Splide('.splide', {
		type: 'region',
		perPage: 1,
		focus: 'center',
		pagination: false,
		arrows: false,
		perMove: 1,
	})

	splide.on('moved', updateImageBorder)
	splide.mount()

	// По умолчанию загружаем все слайды в слайдер
	updateSliderContent('All')
}

// --- 3. ФИЛЬТРАЦИЯ СЛАЙДЕРА ---
function updateSliderContent(category) {
	splideList.innerHTML = '' // Очищаем текущие слайды

	const filtered = allGeneratedSlides.filter(slide => {
		return category === 'All' || slide.dataset.filter === category
	})

	filtered.forEach(slide => splideList.appendChild(slide))

	splide.refresh()
}

// Логика кнопок фильтров
filters.forEach(filterBtn => {
	filterBtn.addEventListener('click', () => {
		const category = filterBtn.querySelector('span')?.innerText || filterBtn.innerText.trim()

		filters.forEach(f => f.classList.remove('active'))
		filterBtn.classList.add('active')

		// Фильтруем сетку masonry
		masonryItems.forEach(item => {
			const isVisible = category === 'All' || item.dataset.filter === category
			item.style.display = isVisible ? 'block' : 'none'
		})

		// Фильтруем содержимое слайдера
		updateSliderContent(category)
	})
})

// --- 4. ОТКРЫТИЕ ПОПАПА ---
masonryItems.forEach(item => {
	item.addEventListener('click', () => {
		const clickedSrc = item.querySelector('img').getAttribute('src')

		popup.classList.add('active')

		// Принудительный пересчет размеров в видимом состоянии
		requestAnimationFrame(() => {
			splide.refresh()

			// Ищем индекс кликнутой картинки среди ТЕКУЩИХ слайдов в DOM
			const currentSlides = Array.from(splideList.querySelectorAll('.slider__item'))
			const targetIndex = currentSlides.findIndex(
				s => s.querySelector('img').getAttribute('src') === clickedSrc,
			)

			if (targetIndex !== -1) {
				splide.go(targetIndex)
				// Фикс центровки для повторных кликов
				splide.Components.Move.jump(splide.index)

				setTimeout(updateImageBorder, 50)
			}
		})
	})
})

// --- 5. ОБНОВЛЕНИЕ ГРАНИЦ (UPDATE IMAGE BORDER) ---
async function updateImageBorder() {
	const activeSlide = splide.Components.Slides.getAt(splide.index)?.slide
	if (!activeSlide) return

	const img = activeSlide.querySelector('.slider__img')
	const cube = activeSlide.querySelector('.splide__cube')
	const cover = activeSlide.querySelector('.splide__cover')
	const close = cover?.querySelector('.splide__close')
	const buttons = Array.from(cover?.querySelectorAll('.slide__arrow_btn') || [])

	if (!img || !cube || !cover) return

	cube.style.opacity = '0'

	try {
		const dimensions = await new Promise((resolve, reject) => {
			const tempImg = new Image()
			tempImg.onload = () => resolve({w: tempImg.naturalWidth, h: tempImg.naturalHeight})
			tempImg.onerror = reject
			tempImg.src = img.src
		})

		const imgAspect = dimensions.w / dimensions.h
		const maxWidthPx = window.innerWidth * 0.85
		const maxHeightPx = window.innerHeight * 0.9

		let finalW, finalH
		if (maxWidthPx / maxHeightPx > imgAspect) {
			finalH = maxHeightPx
			finalW = finalH * imgAspect
		} else {
			finalW = maxWidthPx
			finalH = finalW / imgAspect
		}

		const sizeW = Math.round(finalW) + 'px'
		const sizeH = Math.round(finalH) + 'px'

		;[cube, cover].forEach(el => {
			el.style.width = sizeW
			el.style.height = sizeH
		})

		cube.style.opacity = '1'
		if (close) close.style.opacity = '1'
		buttons.forEach(btn => (btn.style.opacity = '1'))
	} catch (e) {
		console.error(e)
	}
}

// --- 6. ВСПОМОГАТЕЛЬНЫЕ СОБЫТИЯ ---
window.addEventListener('resize', updateImageBorder)

const closeSlider = () => popup.classList.remove('active')

popup.addEventListener('click', e => {
	const target = e.target
	if (target.closest('.slide__arrow_btn.next')) return splide.go('>')
	if (target.closest('.slide__arrow_btn.prev')) return splide.go('<')
	if (target.closest('.splide__close')) return closeSlider()
	if (
		target === popup ||
		target.classList.contains('slider__img') ||
		target.classList.contains('splide__track') ||
		target.classList.contains('splide__slide')
	) {
		closeSlider()
	}
})

document.addEventListener('keydown', e => {
	if (e.key === 'Escape' && popup.classList.contains('active')) closeSlider()
})

// Запуск
initGallery()
