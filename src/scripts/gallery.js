const popup = document.querySelector('div.popup')
const masonryContainer = document.querySelector('.masonry') // Предположим, есть обертка
const masonries = Array.from(document.querySelectorAll('div.masonry__item'))
const filters = document.querySelectorAll('button.gallery__filter_button')
const prevs = document.querySelectorAll('.slide__arrow_btn.prev')
const nexts = document.querySelectorAll('.slide__arrow_btn.next')

// Инициализация Splide
var splide = new Splide('.splide', {
	type: 'loop',
	perPage: 1,
	focus: 'center',
	pagination: false,
	arrows: false,
	perMove: 1,
})
splide.mount()

// 1. Исправленная функция получения активного контейнера
function getActiveSlide() {
	// Получаем текущий активный слайд через API Splide, а не через селекторы классов
	const index = splide.index
	const slideComponent = splide.Components.Slides.getAt(index)
	return slideComponent ? slideComponent.slide : null
}

// 2. Фильтрация
filters.forEach(filter => {
	filter.addEventListener('click', () => {
		const category = filter.innerText

		filters.forEach(f => f.classList.remove('active'))
		filter.classList.add('active')

		// Фильтруем masonry на странице
		masonries.forEach(item => {
			const isVisible = category === 'All' || item.dataset.filter === category
			item.style.display = isVisible ? 'block' : 'none'
		})

		// Синхронизируем слайдер: оставляем только нужные слайды
		const allSlides = Array.from(document.querySelectorAll('.slider__item'))

		allSlides.forEach(slide => {
			const imgInside = slide.querySelector('img')
			const slideSrc = imgInside.getAttribute('src')

			// Находим соответствующий элемент в masonry, чтобы понять, должен ли быть виден этот слайд
			const correspondingMasonry = masonries.find(
				m => m.querySelector('img').getAttribute('src') === slideSrc,
			)

			if (
				category === 'All' ||
				(correspondingMasonry && correspondingMasonry.dataset.filter === category)
			) {
				slide.classList.add('splide__slide')
				slide.style.display = ''
			} else {
				slide.classList.remove('splide__slide')
				slide.style.display = 'none'
			}
		})

		splide.refresh()
		splide.go(0)
	})
})

// 3. Обработка клика по картинке (исправлен индекс)
masonries.forEach(masonry => {
	masonry.addEventListener('click', async event => {
		const clickedImgSrc = event.currentTarget.querySelector('img').getAttribute('src')

		// Находим индекс среди видимых в данный момент слайдов
		const visibleSlides = Array.from(document.querySelectorAll('.slider__item.splide__slide'))
		const targetIndex = visibleSlides.findIndex(
			slide => slide.querySelector('img').getAttribute('src') === clickedImgSrc,
		)

		if (targetIndex !== -1) {
			popup.classList.add('active')

			// Сначала переходим к слайду
			splide.go(targetIndex)

			// Ждем завершения отрисовки и обновляем рамки
			setTimeout(() => {
				updateImageBorder()
			}, 10)
		}
	})
})

// События перемещения
splide.on('moved', () => {
	updateImageBorder()
})

// Resize для пересчета рамок при изменении окна
window.addEventListener('resize', updateImageBorder)

async function updateImageBorder() {
	const container = getActiveSlide() // Используем надежный метод получения слайда
	if (!container) return

	const img = container.querySelector('.slider__img')
	const cube = container.querySelector('.splide__cube')
	const cover = container.querySelector('.splide__cover')
	const close = cover?.querySelector('.splide__close')
	const buttons = Array.from(cover?.querySelectorAll('.slide__arrow_btn') || [])

	if (!img || !cube || !cover) return

	// Скрываем, пока считаем, чтобы не было "прыжка"
	cube.style.opacity = '0'

	try {
		const {width, height} = await getImageDimensions(img.src)
		const imgAspect = width / height

		// Ограничения из CSS
		const maxWidthPx = window.innerWidth * 0.85
		const maxHeightPx = window.innerHeight * 0.9

		// Размеры контейнера слайда
		const containerRect = container.getBoundingClientRect()
		const availableWidth = Math.min(containerRect.width, maxWidthPx)
		const availableHeight = Math.min(containerRect.height, maxHeightPx)

		const containerAspect = availableWidth / availableHeight

		let displayWidth, displayHeight

		if (containerAspect > imgAspect) {
			displayHeight = availableHeight
			displayWidth = displayHeight * imgAspect
		} else {
			displayWidth = availableWidth
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

// Вспомогательная функция
function getImageDimensions(src) {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({width: img.naturalWidth, height: img.naturalHeight})
		img.onerror = reject
		img.src = src
	})
}

// Функция закрытия попапа
const closeSlider = () => {
	popup.classList.remove('active')
}

// 1. Делегирование событий внутри попапа (стрелки, крестик, клик в пустоту)
popup.addEventListener('click', event => {
	const target = event.target

	// Клик по кнопке "Вперед"
	if (target.closest('.slide__arrow_btn.next')) {
		splide.go('>')
		return
	}

	// Клик по кнопке "Назад"
	if (target.closest('.slide__arrow_btn.prev')) {
		splide.go('<')
		return
	}

	// Клик по кнопке "Закрыть" (крестик)
	if (target.closest('.splide__close')) {
		closeSlider()
		return
	}

	// Клик "вне картинки":
	// Если кликнули по самому попапу ИЛИ по контейнеру slider__item (фон слайда),
	// но НЕ по самой картинке и не по рамке cube
	if (
		target.classList.contains('slider__item') ||
		target.classList.contains('popup') ||
		target.classList.contains('splide__track')
	) {
		closeSlider()
	}
})

// 2. Закрытие по кнопке Esc (хороший тон для UX)
document.addEventListener('keydown', event => {
	if (event.key === 'Escape' && popup.classList.contains('active')) {
		closeSlider()
	}
})
