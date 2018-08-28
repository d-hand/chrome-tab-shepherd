chrome.tabs.query({currentWindow: true}, function(tabs) {
    if (tabs.length === 0)
        return;
    
    var orderedTabsIds = OrderedTabIdsProvider.get();
    var orderdTabs = tabs.sort((tab1, tab2) => orderedTabsIds.indexOf(tab1.id) - orderedTabsIds.indexOf(tab2.id));    

    var tabsList = document.getElementById('tabs-lits-id');
    tabsList.innerHTML = '';
    orderdTabs.forEach((tab, index) => {
        var tabItem = document.createElement('div');
        tabItem.id = tab.id;

        tabItem.innerHTML = `<img src='${tab.favIconUrl}' width="16" height="16"/>` +                            
                            `<span>${tab.title}</span>`; 
        tabsList.appendChild(tabItem);
        tabItem.onclick = function() {
            //chrome.tabs.update(Number.parseInt(this.id), {active: true, highlighted: true});
            chrome.tabs.update(tab.id, {active: true, highlighted: true});
        }
    });

    var selectedIndex = orderdTabs.length >= 2 ? 1 : 0;
    select(orderdTabs[selectedIndex].id);
    
    document.body.onkeydown = function(e) {
        if (e.code === "ArrowDown") {
            unselect(orderdTabs[selectedIndex].id);
            selectedIndex = ++selectedIndex >= orderdTabs.length ? 0 : selectedIndex;
            select(orderdTabs[selectedIndex].id)
            return;
        }      
        else if (e.code === "ArrowUp") {
            unselect(orderdTabs[selectedIndex].id);
            selectedIndex = --selectedIndex < 0 ? orderdTabs.length - 1 : selectedIndex;
            select(orderdTabs[selectedIndex].id)    
            return;
        }
        else if (e.code === "Enter") {
            chrome.tabs.update(orderdTabs[selectedIndex].id, {active: true, highlighted: true});
        }
        else;
    };
});
  
function select(tabId) {
    var tabItem = document.getElementById(tabId);
    tabItem.style.borderStyle = 'solid';
    tabItem.style.borderColor = 'green';
}

function unselect(tabId) {
    document.getElementById(tabId).style = undefined;
}