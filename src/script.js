console.log('script is working')
const bigHeader = document.querySelector('header.header');
const smallHeader = document.querySelector('div.header-small');

document.body.addEventListener('scroll', () => {
    if (document.body.scrollTop > 440) {
        bigHeader.style.opacity = '0';
        bigHeader.style.transform = 'translateY(10px)';

        smallHeader.style.opacity = '1';
		smallHeader.style.transform = 'translateY(0)';
    } else {
        bigHeader.style.opacity = '1';
		bigHeader.style.transform = 'translateY(0)';

        smallHeader.style.opacity = '0';
		smallHeader.style.transform = 'translateY(-10px)';
    }
});
