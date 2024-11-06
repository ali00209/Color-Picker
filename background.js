// Cache window dimensions
let lastWindowPosition = null;

browser.browserAction.onClicked.addListener(async () => {
  const width = 900;
  const height = 1000;
  
  try {
    // Use cached position if available, otherwise calculate
    if (!lastWindowPosition) {
      const currentWindow = await browser.windows.getCurrent();
      lastWindowPosition = {
        left: Math.round(currentWindow.left + (currentWindow.width - width) / 2),
        top: Math.round(currentWindow.top + (currentWindow.height - height) / 2)
      };
    }

    await browser.windows.create({
      url: "popup.html",
      type: "popup",
      width: width,
      height: height,
      left: lastWindowPosition.left,
      top: lastWindowPosition.top
    });
  } catch (error) {
    console.error('Error creating window:', error);
  }
}); 