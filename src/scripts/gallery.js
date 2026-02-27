const popup = document.querySelector('div.popup')
const splideList = document.querySelector('.splide__list')
const masonryItems = Array.from(document.querySelectorAll('.masonry__item'))
const filters = document.querySelectorAll('.gallery__filter_button:not(#load-more)')
const loadMoreBtn = document.getElementById('load-more')

let splide
let allGeneratedSlides = []
let visibleCount = 4 // Сколько элементов показывать изначально
const STEP = 4 // Сколько добавлять при клике
let currentCategory = 'All'

// --- 1. ГЕНЕРАЦИЯ СЛАЙДОВ (без изменений) ---
function generateSlides() {
	allGeneratedSlides = masonryItems.map(item => {
		const media = item.querySelector('img, video')
		const src = media.getAttribute('src')
		const alt = media.getAttribute('alt') || ''
		const filter = item.dataset.filter
		const isVideo = media.tagName.toLowerCase() === 'video'

		const slide = document.createElement('div')
		slide.className = 'splide__slide slider__item'
		slide.dataset.filter = filter

		const mediaHtml = isVideo
			? `<video src="${src}" class="slider__img" loop muted playsinline controls></video>`
			: `<img src="${src}" class="slider__img" alt="${alt}" />`

		slide.innerHTML = `
            <div class="splide__cube"></div>
            <div class="splide__cover events__none">
				<div class="splide__cover_wrapper">
					<button class="splide__close events__all">
						<svg class="splide__icon_close"><use href="/src/img/icons/sprite.svg#close"></use></svg>
					</button>
					<button class="slide__arrow_btn prev events__all">
						<svg class="splide__icon"><use href="/src/img/icons/sprite.svg#left"></use></svg>
					</button>
					<button class="slide__arrow_btn next events__all">
						<svg class="splide__icon"><use href="/src/img/icons/sprite.svg#right"></use></svg>
					</button>
				</div>
            </div>
            ${mediaHtml}
        `
		return slide
	})
}

// --- 2. ГЛАВНАЯ ФУНКЦИЯ УПРАВЛЕНИЯ ВИДИМОСТЬЮ ---
function applyGalleryLogic() {
	// 1. Фильтруем элементы masonry по категории
	const filteredMasonry = masonryItems.filter(
		item => currentCategory === 'All' || item.dataset.filter === currentCategory,
	)

	// 2. Показываем только первые N из отфильтрованных
	masonryItems.forEach(item => (item.style.display = 'none')) // Сначала прячем всё

	filteredMasonry.forEach((item, index) => {
		if (index < visibleCount) {
			item.style.display = 'block'
		}
	})

	// 3. Управляем кнопкой "Показать еще"
	if (visibleCount >= filteredMasonry.length) {
		loadMoreBtn.style.display = 'none'
	} else {
		loadMoreBtn.style.display = 'inline-block'
	}

	// 4. Обновляем слайдер (в слайдере всегда все элементы категории)
	updateSliderContent(currentCategory)
}

// --- 3. ИНИЦИАЛИЗАЦИЯ ---
function initGallery() {
	generateSlides()

	splide = new Splide('.splide', {
		type: 'region',
		perPage: 1,
		focus: 'center',
		pagination: false,
		arrows: false,
		perMove: 1,
	})

	splide.on('moved', updateImageBorder)
	splide.on('move', () => {
		splideList.querySelectorAll('video').forEach(v => v.pause())
	})
	splide.on('moved', () => {
		const activeSlide = splide.Components.Slides.getAt(splide.index).slide
		const video = activeSlide.querySelector('video')
		if (video) video.play()
	})

	splide.mount()

	// Запускаем логику отображения
	applyGalleryLogic()
}

// --- 4. ФИЛЬТРАЦИЯ СЛАЙДЕРА ---
function updateSliderContent(category) {
	splideList.innerHTML = ''
	const filtered = allGeneratedSlides.filter(
		slide => category === 'All' || slide.dataset.filter === category,
	)
	filtered.forEach(slide => splideList.appendChild(slide))
	splide.refresh()
}

// Логика кнопок фильтров
filters.forEach(filterBtn => {
	filterBtn.addEventListener('click', () => {
		currentCategory = filterBtn.querySelector('span')?.innerText || filterBtn.innerText.trim()

		filters.forEach(f => f.classList.remove('active'))
		filterBtn.classList.add('active')

		visibleCount = STEP // При смене категории сбрасываем счетчик до 8
		applyGalleryLogic()
	})
})

// Логика кнопки "Показать еще"
loadMoreBtn.addEventListener('click', () => {
	visibleCount += STEP
	applyGalleryLogic()
})

// --- 5. ОТКРЫТИЕ ПОПАПА ---
masonryItems.forEach(item => {
	item.addEventListener('click', () => {
		const media = item.querySelector('img, video')
		const clickedSrc = media.getAttribute('src')

		popup.classList.add('active')

		requestAnimationFrame(() => {
			splide.refresh()
			const currentSlides = Array.from(splideList.querySelectorAll('.slider__item'))
			const targetIndex = currentSlides.findIndex(
				s => s.querySelector('.slider__img').getAttribute('src') === clickedSrc,
			)

			if (targetIndex !== -1) {
				splide.go(targetIndex)
				splide.Components.Move.jump(splide.index)
				setTimeout(updateImageBorder, 50)
			}
		})
	})
})

// --- 6. ОБНОВЛЕНИЕ ГРАНИЦ (без изменений) ---
async function updateImageBorder() {
	const activeSlide = splide.Components.Slides.getAt(splide.index)?.slide
	if (!activeSlide) return

	const media = activeSlide.querySelector('.slider__img')
	const cube = activeSlide.querySelector('.splide__cube')
	const cover = activeSlide.querySelector('.splide__cover')
	if (!media || !cube || !cover) return

	cube.style.opacity = '0'

	try {
		const dimensions = await new Promise((resolve, reject) => {
			if (media.tagName.toLowerCase() === 'video') {
				if (media.videoWidth) resolve({w: media.videoWidth, h: media.videoHeight})
				else {
					media.onloadedmetadata = () =>
						resolve({w: media.videoWidth, h: media.videoHeight})
					media.onerror = reject
				}
			} else {
				const tempImg = new Image()
				tempImg.onload = () => resolve({w: tempImg.naturalWidth, h: tempImg.naturalHeight})
				tempImg.onerror = reject
				tempImg.src = media.src
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
		const buttons = Array.from(cover.querySelectorAll('.slide__arrow_btn, .splide__close'))
		buttons.forEach(btn => (btn.style.opacity = '1'))
	} catch (e) {
		console.error(e)
	}
}

// --- 7. ЗАКРЫТИЕ И СОБЫТИЯ ---
window.addEventListener('resize', updateImageBorder)

const closeSlider = () => {
	popup.classList.remove('active')
	splideList.querySelectorAll('video').forEach(v => v.pause())
}

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

initGallery()
