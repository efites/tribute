const popup = document.querySelector('div.popup')
const masonry = document.querySelector('div.masonry')
const filters = document.querySelectorAll('button.gallery__filter_button')
const prevs = document.querySelectorAll('.slide__arrow_btn.prev')
const nexts = document.querySelectorAll('.slide__arrow_btn.next')
let activeFilter

filters.forEach(filter => {
	if (!activeFilter) {
		activeFilter = [...filters].find(filter => filter.classList.contains('active'))
	}

	filter.addEventListener('click', () => {
		filters.forEach(filter => filter.classList.remove('active'))
		filter.classList.add('active')
	})
})

masonry.addEventListener('click', async event => {
	popup.classList.add('active')
	await updateImageBorder()
})

popup.addEventListener('click', event => {
	const arrows = document.querySelectorAll('button.slide__arrow_btn')

	if (
		!event.target.classList.contains('splide__cover') &&
		!Array.from(arrows).some(arrow => event.composedPath().includes(arrow))
	) {
		popup.classList.remove('active')
	}
})

var splide = new Splide('.splide', {
	type: 'loop',
	perPage: 1,
	focus: 'center',
	pagination: false,
	arrows: false,
})

splide.mount()

splide.on('moved', async () => {
	await updateImageBorder()
})

prevs.forEach(prev => {
	prev.addEventListener('click', async event => {
		splide.go('<')
	})
})

nexts.forEach(next => {
	next.addEventListener('click', async event => {
		splide.go('>')
	})
})

function getImageDimensions(src) {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({width: img.naturalWidth, height: img.naturalHeight})
		img.onerror = () => reject(new Error('Не удалось загрузить изображение'))
		img.src = src
	})
}

async function updateImageBorder() {
	const container = document.querySelector('.slider__item.is-active.is-visible')
	const img = container.querySelector('.slider__img')
	const cube = container.querySelector('.splide__cube')
	const cover = container.querySelector('.splide__cover')
	const close = cover.querySelector('.splide__close')
	const buttons = Array.from(cover.querySelectorAll('.slide__arrow_btn'))

	if (!container || !img || !cube) return

	buttons.forEach(button => {
		button.style.opacity = '1'
	})

	// 1. Получаем натуральные размеры изображения
	const src = img.src
	const {width, height} = await getImageDimensions(src)
	const imgAspect = width / height

	// 2. Вычисляем ограничения из CSS (max-width: 90vw, max-height: 90vh)
	const maxWidthPx = window.innerWidth * 0.85
	const maxHeightPx = window.innerHeight * 0.9

	// 3. Размеры родительского контейнера
	const containerRect = container.getBoundingClientRect()

	// 4. Доступная область — минимальные значения из размеров контейнера и ограничений
	const availableWidth = Math.min(containerRect.width, maxWidthPx)
	const availableHeight = Math.min(containerRect.height, maxHeightPx)

	const containerAspect = availableWidth / availableHeight

	// 5. Вычисляем реальные размеры изображения с object-fit: contain
	let displayWidth, displayHeight
	if (containerAspect > imgAspect) {
		// Контейнер шире пропорций → высота заполняет доступную высоту
		displayHeight = availableHeight
		displayWidth = displayHeight * imgAspect
	} else {
		// Контейнер выше → ширина заполняет доступную ширину
		displayWidth = availableWidth
		displayHeight = displayWidth / imgAspect
	}

	// 6. Применяем размеры к рамке (округляем для чёткости)
	cube.style.width = Math.round(displayWidth) + 'px'
	cube.style.height = Math.round(displayHeight) + 'px'
	cube.style.opacity = '1'
	close.style.opacity = '1'

	cover.style.width = Math.round(displayWidth) + 'px'
	cover.style.height = Math.round(displayHeight) + 'px'
}
