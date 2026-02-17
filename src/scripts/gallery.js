
const popup = document.querySelector('div.popup')
const masonry = document.querySelector('div.masonry')
const filters = document.querySelectorAll('button.gallery__filter_button')
let activeFilter

filters.forEach(filter => {
	if (!activeFilter) {
		activeFilter = [...filters].find(filter => filter.classList.contains('active'))
		console.log(activeFilter)
	}

	filter.addEventListener('click', () => {
		filters.forEach(filter => filter.classList.remove('active'))
		filter.classList.add('active')
	})
})


masonry.addEventListener('click', (event) => {
	popup.classList.add('active')
	console.log(event.target)
})

popup.addEventListener('click', (event) => {
	if (event.target === event.currentTarget) {
		popup.classList.remove('active')
	}
})



const slider = tns({
	container: '.slider',
	items: 2,
	autoHeight: true,
	// autoWidth: true,
	center: true,
	mouseDrag: true,
	viewportMax: true,
})
