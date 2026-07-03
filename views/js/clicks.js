const PS = 10;
const sounds = [];
for (let i = 0; i < PS; i++) {
    const audio = new Audio("/resources/cursor/clik.mp3");
    audio.preload = "auto";
    audio.volume = 0.2;
    sounds.push(audio);
}
let i = 0;
document.addEventListener("click", () => {
    const audio = sounds[i];
    audio.currentTime = 0;
    audio.play().catch(() => {});
    i = (i + 1) % PS;
});