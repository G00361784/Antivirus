const parallax = document.querySelector('.parallax');

window.addEventListener('scroll', function() {
  let offset = window.pageYOffset;
  parallax.style.backgroundPositionY = offset * 0.7 + 'px';
});
$('.carousel').carousel({
  interval: 2000
})