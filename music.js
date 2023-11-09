Array.prototype.shuffle = function() {
    var j, x, i;
    for (i = this.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = this[i - 1];
        this[i - 1] = this[j];
        this[j] = x;
    }
    return this;
};

var request = new XMLHttpRequest();

request.open('get', './music', false);
request.send();
var music = JSON.parse(request.responseText).shuffle();

request.open('get', './gifs', false);
request.send();
var gifs = JSON.parse(request.responseText).shuffle();

var gif = document.getElementById('gif');
var j = 0;
gif.style.backgroundImage = "url('" + gifs[j] + "')";

var overlay = document.getElementById('overlay');
var playbtn = document.getElementById('play');
var playstartbtn = document.getElementById('playstart');
var pausebtn = document.getElementById('pause');

var player = document.getElementById('player');
var i = 0;
player.src = music[i];
player.load();
player.play().catch(e => playstartbtn.className = "popup");
console.log('now playing ', current());
document.title = current()[0];
title.innerHTML = document.title;
player.volume = localStorage.getItem('player_volume') || 1;
overlay.style.opacity = 0.9533 - player.volume * 0.5333;
console.log('player volume: ' + Math.round(player.volume * 100) + '%');

function upd() {
    anim = false;
    playbtn.classList = ['hidden'];
    playstartbtn.classList = ['hidden'];
    pausebtn.classList = ['hidden'];
    if (i == music.length) {
        music.shuffle();
        i = 0;    
    }
    if (i < 0) {
        i = music.length - 1;
    }
    if (j == gifs.length) {
        gifs.shuffle();
        j = 0;
    }
    if (j < 0) {
        j = gifs.length - 1;
    }
    gif.style.backgroundImage = "url('" + gifs[j] + "')";
    player.src = music[i];
    player.load();
    player.play();
    console.log('now playing ',current());
    document.title = current()[0];
    title.innerHTML = document.title;
}

// Получаем ссылку на элемент <canvas>
const canvas = document.getElementById("viewport");

// Добавляем обработчик события нажатия клавиш
document.addEventListener("keydown", function(event) {
  // Проверяем, нажаты ли одновременно клавиши ctrl и m
  if (event.ctrlKey && event.key === "m") {
    // Если да, меняем свойство display на противоположное
    canvas.style.display = canvas.style.display === "none" ? "inline-block" : "none";
  }
});

function next() {
    i++;
    j++;
    upd();
}

function prev() {
    i--;
    j--;
    upd();
}
player.addEventListener('ended', next);
player.addEventListener('error', next);

var anim = false;
function playorpause() {
	if (playstart.className === "popup") {
		player.play();
		playstart.className = "hidden popup";
		return;
	}
    if (anim) {
        return;
    }
    if (player.paused) {
        player.play();
        pausebtn.classList = ['hidden'];
        playbtn.classList = ['popup'];
        anim = true;
        setTimeout(function(){ playbtn.classList = ['hidden']; anim = false; } ,1200);
    } else {
        player.pause();   
        pausebtn.classList = ['popup'];
        anim = false;
    }
}
gif.addEventListener('click', playorpause);

window.addEventListener('keydown', function(e){
    if (e.key == 'ArrowRight') {
        next();    
        return;
    }
    if (e.key == 'ArrowLeft') {
        prev();
        return;
    }
    if (e.key == ' ') {
        playorpause();
        return;
    }
    if (e.key == 'Backspace') {
        location.replace(document.referrer);
        return;
    }
});

window.addEventListener('wheel', function(e) {
   vol(e.deltaY > 0 ? -1 : 1); 
});

window.addEventListener('keydown', function(e) {
    if (e.key == "ArrowUp")
        return vol(1);
    if (e.key == "ArrowDown")
        return vol(-1);
})

function vol(v) {
    var vol = player.volume;
    vol += v * 0.05;
    if (vol < 0.1) vol = 0.1;
    if (vol > 1) vol = 1;
    player.volume = vol;
    overlay.style.opacity = 0.9533 - vol * 0.5333;
    localStorage.setItem('player_volume', vol);
    console.log('player volume: ' + Math.round(player.volume * 100) + '%');
}

window.addEventListener('doubletap', next);

function mem() {
    var request = new XMLHttpRequest();
    request.open('get', '/mem', false);
    request.send();
    var data = JSON.parse(request.responseText);    
    for (var prop in data) {
        data[prop] = Math.round(data[prop] / 1024 / 1024 ) + 'M';    
    }
    return data;
}

function current() {
    return [music[i].replace(/^.*\//, '').replace('.mp3', ''),
    gifs[j].replace(/^.*\//, '')];
}

var pointerTimeout;

window.addEventListener('mousemove', function(e) {
        var controls = document.getElementsByClassName('controls');
            [].forEach.call(controls,function(x){
                x.classList.add('pointer-fade'); 
            });
            clearTimeout(pointerTimeout);
            pointerTimeout = setTimeout(function(){
            [].forEach.call(controls,function(x){
                    x.classList.remove('pointer-fade'); 
                });
            }, 1300);
});

var vt;
window.addEventListener('mousemove', function(e) {
    document.querySelector('html').classList = [];
    if (vt) clearTimeout(vt);
    vt = setTimeout(function(){document.querySelector('html').classList = ['no-cursor']},1000);
});

gif.addEventListener('dblclick', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
});

//player.addEventListener('canplaythrough', function(){
//    player.play();
//});

