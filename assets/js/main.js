'use strict';

// Theme switcher
function themeSwitch() {
    const body = document.body;
    const isLightTheme = body.dataset.bsTheme === "light";
    body.dataset.bsTheme = isLightTheme ? "dark" : "light";
    body.style.backgroundImage = `url('assets/images/background${isLightTheme ? "Dark" : "Light"}.png')`;
}
