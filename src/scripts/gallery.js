
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
	console.log(event.target)
})



// var slider = tns({
// 	container: '.my-slider',
// 	items: 1,
// 	responsive: {
// 		640: {
// 			edgePadding: 20,
// 			gutter: 20,
// 			items: 2,
// 		},
// 		700: {
// 			gutter: 30,
// 		},
// 		900: {
// 			items: 3,
// 		},
// 	},
// })
