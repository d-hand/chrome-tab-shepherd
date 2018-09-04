chrome.tabs.onCreated.addListener(tab => {
    TabShepherd.addFromTab(tab)
})

chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
    makeScreenShot(tabId, windowId, screenShotDataUrl => {
        TabShepherd.update(tabId, {screenShotDataUrl})
    })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, {windowId, url, title, favIconUrl}) => {
    if (changeInfo.status === 'complete') {
        makeScreenShot(tabId, windowId, screenShotDataUrl => {
            TabShepherd.update(tabId, {url, title, favIconUrl, screenShotDataUrl})
        })
    }
})

chrome.tabs.onDetached.addListener((tabId) => {
    TabShepherd.update(tabId, {windowId: null})
})

chrome.tabs.onAttached.addListener((tabId, {newWindowId}) => {
    TabShepherd.update(tabId, {windowId: newWindowId})
})

chrome.tabs.onRemoved.addListener(tabId => TabShepherd.remove(tabId))

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.getTabs) {
        chrome.tabs.query({}, tabs => {
            TabShepherd.actualize(tabs)
            sendResponse(TabShepherd.getTabs(sender.tab.windowId))                   
        })
        return true
    }
    if (message.selectedTabId) {
        chrome.tabs.update(message.selectedTabId, {active: true, highlighted: true});
    }
});

function makeScreenShot(tabId, windowId, callback) {
    chrome.tabs.get(tabId, tab => {
        if (tab.active && tab.url && !tab.url.includes("chrome://")) {
            chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 100 }, callback)
            return;
        }

        callback(undefined);
    });
}

class TabShepherd {
    static __init(){
        TabShepherd.__tabs = [];
    }

    static addFromTab(tab) {
        TabShepherd.__tabs.push({
            id: tab.id,
            windowId: tab.windowId,
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            timestamp: Date.now()
        });    
    }

    static update(tabId, {windowId, url, title, favIconUrl, screenShotDataUrl}) {
        var tab = TabShepherd.__tabs.find(x => x.id === tabId)
        tab.windowId = windowId === undefined ? tab.windowId : windowId
        tab.title = title === undefined ? tab.title : title
        tab.url = url === undefined ? tab.url : url
        tab.favIconUrl = favIconUrl === undefined ? tab.favIconUrl : favIconUrl
        tab.screenShotDataUrl = screenShotDataUrl === undefined ? tab.screenShotDataUrl : screenShotDataUrl
        tab.timestamp = Date.now()
    }

    static remove(tabId) {
        TabShepherd.__tabs = TabShepherd.__tabs.filter(x => x.id !== tabId);
    }

    static actualize(actualTabs) {
        for (const actualTab of actualTabs) {
            const tab = TabShepherd.__tabs.find(x => x.id === actualTab.id)

            if (!tab) {
                TabShepherd.addFromTab(actualTab)
                continue
            }
                
            if (tab.url !== actualTab.url) {
                TabShepherd.update(tab.id, {...actualTab, screenShotDataUrl: null})
                continue
            }                
        }

        TabShepherd.__tabs = TabShepherd.__tabs.filter(tab => !!actualTabs.find(actualTab => tab.id === actualTab.id))
    }

    static getTabs(windowId) {
        return TabShepherd.__tabs
            .filter(tab => tab.windowId === windowId)
            .sort((tab1, tab2) => tab2.timestamp - tab1.timestamp)
    }
}
TabShepherd.__init()