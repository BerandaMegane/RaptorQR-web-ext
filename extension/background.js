chrome.action.onClicked.addListener(() => {
  const appUrl = chrome.runtime.getURL('app/index.html');
  void chrome.tabs.create({ url: appUrl });
});