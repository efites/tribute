const popup = document.querySelector('div.popup')
const splideList = document.querySelector('.splide__list')
const masonries = Array.from(document.querySelectorAll('.masonry__item'))
const filters = document.querySelectorAll('.gallery__filter_button')

// 1. Сохраняем все оригинальные слайды в массив ОДИН РАЗ при загрузке.
// Это наш "золотой запас", из которого мы будем брать нужные слайды.
const allOriginalSlides = Array.from(document.querySelectorAll('.slider__item'))

// Инициализация Splide
var splide = new Splide('.splide', {
	type: 'region',
	perPage: 1,
	focus: 'center',
	pagination: false,
	arrows: false,
	perMove: 1,
})
splide.mount()

// Функция получения активного слайда
function getActiveSlide() {
	const index = splide.index
	const slideComponent = splide.Components.Slides.getAt(index)
	return slideComponent ? slideComponent.slide : null
}

// 2. Функция фильтрации слайдера
function filterSplide(category) {
	// Очищаем текущий список в DOM
	splideList.innerHTML = ''

	// Отбираем только нужные слайды из нашего сохраненного массива
	const filteredSlides = allOriginalSlides.filter(slide => {
		const src = slide.querySelector('img').getAttribute('src')
		const correspondingMasonry = masonries.find(
			m => m.querySelector('img').getAttribute('src') === src,
		)
		return (
			category === 'All' ||
			(correspondingMasonry && correspondingMasonry.dataset.filter === category)
		)
	})

	// Добавляем отфильтрованные слайды обратно в список
	filteredSlides.forEach(slide => splideList.appendChild(slide))

	// Пересобираем Splide, чтобы он пересчитал количество слайдов и индексы
	splide.refresh()
}

// 3. Обработка клика по фильтрам
filters.forEach(filter => {
	filter.addEventListener('click', () => {
		const category = filter.querySelector('span')
			? filter.querySelector('span').innerText
			: filter.innerText.trim()

		filters.forEach(f => f.classList.remove('active'))
		filter.classList.add('active')

		// Фильтруем masonry (плитку)
		masonries.forEach(item => {
			const isVisible = category === 'All' || item.dataset.filter === category
			item.style.display = isVisible ? 'block' : 'none'
		})

		// Фильтруем сам слайдер
		filterSplide(category)
	})
})

// 4. Клик по картинке в галерее
masonries.forEach(masonry => {
	masonry.addEventListener('click', event => {
		const clickedImgSrc = event.currentTarget.querySelector('img').getAttribute('src')

		// Перед открытием убеждаемся, что Splide знает свои размеры
		popup.classList.add('active')
		splide.refresh()

		// Ищем индекс картинки в ТЕКУЩЕМ (уже отфильтрованном) списке слайдов
		const currentSlidesInDom = Array.from(splideList.querySelectorAll('.slider__item'))
		const targetIndex = currentSlidesInDom.findIndex(
			slide => slide.querySelector('img').getAttribute('src') === clickedImgSrc,
		)

		if (targetIndex !== -1) {
			splide.go(targetIndex)
			// Даем время на отрисовку перед расчетом границ
			setTimeout(updateImageBorder, 50)
		}
	})
})

// Обновление границ при листании
splide.on('moved', updateImageBorder)
window.addEventListener('resize', updateImageBorder)

async function updateImageBorder() {
	const container = getActiveSlide()
	if (!container) return

	const img = container.querySelector('.slider__img')
	const cube = container.querySelector('.splide__cube')
	const cover = container.querySelector('.splide__cover')
	const close = cover?.querySelector('.splide__close')
	const buttons = Array.from(cover?.querySelectorAll('.slide__arrow_btn') || [])

	if (!img || !cube || !cover) return

	cube.style.opacity = '0'

	try {
		const {width, height} = await getImageDimensions(img.src)
		const imgAspect = width / height

		const maxWidthPx = window.innerWidth * 0.85
		const maxHeightPx = window.innerHeight * 0.9

		let displayWidth, displayHeight

		if (maxWidthPx / maxHeightPx > imgAspect) {
			displayHeight = maxHeightPx
			displayWidth = displayHeight * imgAspect
		} else {
			displayWidth = maxWidthPx
			displayHeight = displayWidth / imgAspect
		}

		const finalW = Math.round(displayWidth) + 'px'
		const finalH = Math.round(displayHeight) + 'px'

		cube.style.width = finalW
		cube.style.height = finalH
		cover.style.width = finalW
		cover.style.height = finalH

		cube.style.opacity = '1'
		if (close) close.style.opacity = '1'
		buttons.forEach(btn => (btn.style.opacity = '1'))
	} catch (err) {
		console.error('Ошибка обновления границ:', err)
	}
}

function getImageDimensions(src) {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({width: img.naturalWidth, height: img.naturalHeight})
		img.onerror = reject
		img.src = src
	})
}

// Закрытие
const closeSlider = () => popup.classList.remove('active')

popup.addEventListener('click', event => {
	const target = event.target
	if (target.closest('.slide__arrow_btn.next')) return splide.go('>')
	if (target.closest('.slide__arrow_btn.prev')) return splide.go('<')
	if (target.closest('.splide__close')) return closeSlider()

	if (
		target === popup ||
		target.classList.contains('splide__track') ||
		target.classList.contains('splide__slide')
	) {
		closeSlider()
	}
})

document.addEventListener('keydown', e => {
	if (e.key === 'Escape' && popup.classList.contains('active')) closeSlider()
})
