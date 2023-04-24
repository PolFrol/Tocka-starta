let tab = function () {
    let tabNav = document.querySelectorAll('.tabs-nav__item'),
        tabContent = document.querySelectorAll('.tab'),
        tabName;

    tabNav.forEach(item => {
        item.addEventListener('click', selectTabNav)
    });

    function selectTabNav() {
        tabNav.forEach(item => {
            item.classList.remove('is-active');
        });
        this.classList.add('is-active');
        tabName = this.getAttribute('data-tab-name');
        selectTabContent(tabName);
    }

    function selectTabContent(tabName) {
        tabContent.forEach(item => {
            item.classList.contains(tabName) ? item.classList.add('is-active') : item.classList.remove('is-active');
        })
    }

    let button = document.querySelector('.tabs__button_next')

};


tab();

let navHeader = document.querySelector('.header__nav');
let headerToggle = document.querySelector('.nav__toggle');
let headerClose = document.querySelector('.nav__close');

navHeader.classList.remove('header--nojs');

headerToggle.onclick = function () {
    navHeader.classList.toggle('header--opened');
};

headerClose.onclick = function () {
    navHeader.classList.remove('header--opened');
}


$(document).ready(function () {
    $(".owl-carousel").owlCarousel();
});

$('.owl-carousel').owlCarousel({
    loop: true,
    margin: 10,
    nav: true,
    autoplay: true,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
    items: 1,
    navText:["<img src='assets/img/arrow-left-m.svg'>", "<img src='assets/img/arrow-rigth-m.svg'>"],
})