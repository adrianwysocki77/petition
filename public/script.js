let menuicon = document.getElementsByClassName("hamburgercontainer");
let overlay = document.getElementsByClassName("overlay");
let menucontainer = document.getElementsByClassName("menucontainer");
let x = document.getElementsByClassName("x");

let edit = document.getElementById("edit");
let signers = document.getElementById("signers");
let thanks = document.getElementById("thanks");

console.log(edit);
console.log(signers);
console.log(thanks);

menuicon[0].addEventListener("click", function() {
    overlay[0].classList.remove("zindex");
    menucontainer[0].classList.add("move");
});

x[0].addEventListener("click", function() {
    overlay[0].classList.add("zindex");
    menucontainer[0].classList.remove("move");
});

if (window.location.pathname == "/thanks") {
    console.log("thanks!!");
    signers.classList.remove("underline");
    edit.classList.remove("underline");
    thanks.classList.add("underline");
} else if (window.location.pathname == "/signers") {
    console.log("signers!!");
    signers.classList.add("underline");
    edit.classList.remove("underline");
    thanks.classList.remove("underline");
} else if (window.location.pathname == "/edit") {
    console.log("edit!!");
    signers.classList.remove("underline");
    edit.classList.add("underline");
    thanks.classList.remove("underline");
}
// else if (window.location.pathname == "/edit") {
//     console.log("logout!!");
//     signers.classList.remove("underline");
//     edit.classList.add("underline");
//     thanks.classList.remove("underline");
// }
