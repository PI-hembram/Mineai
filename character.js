
const character = document.getElementById("character");
const stage = document.getElementById("characterStage");
const image = document.getElementById("characterImage");

const posX = document.getElementById("posX");
const posY = document.getElementById("posY");
const scale = document.getElementById("charScale");
const angle = document.getElementById("charAngle");
const background = document.getElementById("backgroundSelect");

function updateCharacter() {
    character.style.transform =
        `translate(${posX.value}px, ${posY.value}px) ` +
        `scale(${scale.value / 100}) ` +
        `rotate(${angle.value}deg)`;
}

[posX, posY, scale, angle].forEach(control => {
    control.addEventListener("input", updateCharacter);
});

function updateBackground() {
    if (background.value === "night") {
        stage.style.background =
            "linear-gradient(#10152f, #46365f)";
    } else {
        stage.style.background =
            "linear-gradient(#f6d9b5, #a77b88)";
    }
}

background.addEventListener("change", updateBackground);

function resetCharacter() {
    posX.value = 0;
    posY.value = 0;
    scale.value = 100;
    angle.value = 0;
    background.value = "room";

    updateCharacter();
    updateBackground();
}

updateCharacter();
updateBackground();
      
