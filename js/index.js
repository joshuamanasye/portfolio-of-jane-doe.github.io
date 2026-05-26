var mainMenu = document.getElementById("main-menu");
var menu = "menu0";
var MENU_COUNT = 5;

var buttonAudio = new Audio("./assets/button.wav");
var selectAudio = new Audio("./assets/switch.wav");
var menuBgm = new Audio("./assets/dark-forest-bgm.mp3");
menuBgm.loop = true;

String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    var b = "!@#$%^&*?/";
        m = b.length;

    for (var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;

        if (Math.random() < 0.15) {
            a[i] = b.charAt(Math.floor(Math.random() * m));
        }
    }
    return a.join("");
}

function changeHover(ele) {
    if (ele.id == menu) return;

    buttonAudio.currentTime = 0;
    buttonAudio.play();

    buttonLeave(document.getElementById(menu));
    menu = ele.id;
    buttonHover(ele);
}

function buttonHover(ele) {
    ele.innerHTML = ele.value;
    ele.style.filter = "blur(0px)";
    ele.style.color = "#000000";

    var bg = document.getElementById(ele.id + "bg");
    bg.style.backgroundColor = "rgba(215, 100, 0, 0.7)";
}

function buttonLeave(ele) {
    ele.innerHTML = ele.innerHTML.shuffle();
    ele.style.filter = "blur(2px)";
    ele.style.color = "#ffffff";

    var bg = document.getElementById(ele.id + "bg");
    bg.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
}

function menuSelection(e) {
    var moved = false;
    var menuId = parseInt(menu.slice(-1));

    if (e.keyCode === 38 || e.keyCode === 87) {
        menuId--;
        moved = true;
    } else if (e.keyCode === 40 || e.keyCode === 83) {
        menuId++;
        moved = true;
    } else if (e.keyCode === 13 || e.keyCode === 32 || e.keyCode === 69) {
        selectMenu(document.getElementById(menu));
        return;
    }

    menuId = ((menuId % MENU_COUNT) + MENU_COUNT) % MENU_COUNT;

    if (moved) {
        changeHover(document.getElementById("menu" + menuId));
    }
}

function selectMenu(ele) {
    selectAudio.currentTime = 0;
    selectAudio.play();

    var routes = {
        'ABOUT':   'about.html',
        'WORK':    null,
        'SKILLS':  null,
        'CONTACT': null,
        'RESUME':  null
    };

    var href = routes[ele.value];
    if (href) {
        setTimeout(function () { window.location.href = href; }, 300);
    }
}

function movingBackground() {
    var movementStrength = 20;
    var height = movementStrength / innerHeight;
    var width = movementStrength / innerWidth;

    mainMenu.addEventListener('mousemove', function(e) {
        var pageX = e.pageX - (innerWidth / 2);
        var pageY = e.pageY - (innerHeight / 2);
        var newvalueX = width * pageX * -1 - 25;
        var newvalueY = height * pageY * -1 - 50;
        mainMenu.style.backgroundPosition = newvalueX + "px " + newvalueY + "px";
    });
}

function openMainMenu() {
    for (var i = 0; i < MENU_COUNT; i++) {
        buttonLeave(document.getElementById("menu" + i));
    }

    mainMenu.style.display = "flex";
    menu = "menu0";
    buttonHover(document.getElementById("menu0"));

    document.addEventListener('keydown', menuSelection);
    menuBgm.play();
    movingBackground();
}

function closeMainMenu() {
    document.removeEventListener('keydown', menuSelection);
    mainMenu.style.display = "none";
    menuBgm.pause();
    menuBgm.currentTime = 0;
}

function hideLoadScreen() {
    document.getElementById("load-screen").style.display = "none";
}

closeMainMenu();
