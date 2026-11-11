const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  // Go to the registro page
  await page.goto('http://localhost:4200/registro', { waitUntil: 'networkidle0' });
  
  // Wait for the animation to finish
  await new Promise(r => setTimeout(r, 1500));
  
  const state = await page.evaluate(() => {
    const loginBox = document.querySelector('.login-box');
    const overlay = document.querySelector('.overlay-layer');
    const medical = document.querySelector('.medical-content');
    const registerHalf = document.querySelector('.register-half');
    const loginHalf = document.querySelector('.login-half');
    
    const getStyles = (el) => {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        opacity: s.opacity,
        visibility: s.visibility,
        clipPath: s.clipPath,
        left: s.left,
        right: s.right,
        width: s.width,
        height: s.height,
        zIndex: s.zIndex,
        pointerEvents: s.pointerEvents,
        display: s.display,
        position: s.position
      };
    };

    return {
      classes: loginBox ? loginBox.className : '',
      overlay: getStyles(overlay),
      medical: getStyles(medical),
      register: getStyles(registerHalf),
      login: getStyles(loginHalf)
    };
  });
  
  console.log(JSON.stringify(state, null, 2));
  await browser.close();
})();
