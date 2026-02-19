const bigHeader = document.querySelector('header.header')
const smallHeader = document.querySelector('div.header-small')

setHeader()

document.body.addEventListener('scroll', setHeader)

function setHeader() {
	if (document.body.scrollTop > 440) {
		bigHeader.style.opacity = '0'
		bigHeader.style.transform = 'translateY(10px)'
		bigHeader.style.pointerEvents = 'none'

		smallHeader.style.opacity = '1'
		smallHeader.style.transform = 'translateY(0)'
	} else {
		bigHeader.style.pointerEvents = 'all'
		bigHeader.style.opacity = '1'
		bigHeader.style.transform = 'translateY(0)'

		smallHeader.style.opacity = '0'
		smallHeader.style.transform = 'translateY(-10px)'
	}
}
