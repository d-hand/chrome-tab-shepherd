class TabShepherd {
    constructor() {
        this.__tabs = [];
    }

    addFromTab(tab) {
        this.__tabs.push({
            id: tab.id,
            windowId: tab.windowId,
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            timestamp: Date.now()
        });    
    }

    update(tabId, {windowId, url, title, favIconUrl, screenShotDataUrl}) {
        var tab = this.__tabs.find(x => x.id === tabId)
        tab.windowId = windowId === undefined ? tab.windowId : windowId
        tab.title = title === undefined ? tab.title : title
        tab.url = url === undefined ? tab.url : url
        tab.favIconUrl = favIconUrl === undefined ? tab.favIconUrl : favIconUrl
        tab.screenShotDataUrl = screenShotDataUrl === undefined ? tab.screenShotDataUrl : screenShotDataUrl
        tab.timestamp = Date.now()
    }

    remove(tabId) {
        this.__tabs = this.__tabs.filter(x => x.id !== tabId);
    }

    actualize(actualTabs) {
        for (const actualTab of actualTabs) {
            const tab = this.__tabs.find(x => x.id === actualTab.id)

            if (!tab) {
                this.addFromTab(actualTab)
                continue
            }
                
            if (tab.url !== actualTab.url) {
                this.update(tab.id, {...actualTab, screenShotDataUrl: null})
                continue
            }                
        }

        this.__tabs = this.__tabs.filter(tab => !!actualTabs.find(actualTab => tab.id === actualTab.id))
    }

    getTabs(windowId) {
        return this.__tabs
            .filter(tab => tab.windowId === windowId)
            .sort((tab1, tab2) => tab2.timestamp - tab1.timestamp)
    }
}

var tabShepherd = new TabShepherd();

chrome.browserAction.onClicked.addListener(function() {   
    chrome.tabs.create({url: chrome.extension.getURL('pasture.html')});    
});

chrome.tabs.onCreated.addListener(tab => {
    tabShepherd.addFromTab(tab)
})

chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
    makeScreenShot(tabId, windowId, screenShotDataUrl => {
        tabShepherd.update(tabId, {screenShotDataUrl})
    })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, {windowId, url, title, favIconUrl}) => {
    if (changeInfo.status === 'complete') {
        makeScreenShot(tabId, windowId, screenShotDataUrl => {
            tabShepherd.update(tabId, {url, title, favIconUrl, screenShotDataUrl})
        })
    }
})

chrome.tabs.onDetached.addListener((tabId) => {
    tabShepherd.update(tabId, {windowId: null})
})

chrome.tabs.onAttached.addListener((tabId, {newWindowId}) => {
    tabShepherd.update(tabId, {windowId: newWindowId})
})

chrome.tabs.onRemoved.addListener(tabId => tabShepherd.remove(tabId))

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.getTabs) {
        chrome.tabs.query({}, tabs => {
            tabShepherd.actualize(tabs)
            sendResponse(tabShepherd.getTabs(sender.tab.windowId))                   
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

