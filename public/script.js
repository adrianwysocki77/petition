let menuicon = document.getElementsByClassName("hamburgercontainer");
let overlay = document.getElementsByClassName("overlay");
let menucontainer = document.getElementsByClassName("menucontainer");

console.log("menuicon: ", menuicon);

menuicon[0].addEventListener("click", function() {
    // console.log("hamburgermenu click");
    overlay[0].classList.remove("zindex");
    menucontainer[0].classList.add("move");
});
