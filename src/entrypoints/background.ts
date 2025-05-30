export default defineBackground(() => {
  browser.action.onClicked.addListener(() => browser.runtime.openOptionsPage());
  browser.runtime.onMessage.addListener((msg) => {
    if (msg.action === "openOptionsPage") {
      browser.runtime.openOptionsPage();
    }
  });
});
