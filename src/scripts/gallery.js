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

masonry.addEventListener('click', event => {
	popup.classList.add('active')
})

// popup.addEventListener('click', (event) => {
// if (event.target === event.currentTarget) {
// 	popup.classList.remove('active')
// }
// })

var splide = new Splide('.splide', {
	type: 'loop',
	perPage: 1,
	focus: 'center',
	pagination: false
})
splide.mount()
