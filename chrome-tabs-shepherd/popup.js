chrome.tabs.query({currentWindow: true}, function(tabs) {
    var orderedTabsIds = OrderedTabIdsProvider.get();
    var orderdTabs = tabs.sort((tab1, tab2) => orderedTabsIds.indexOf(tab1.id) - orderedTabsIds.indexOf(tab2.id))    

    var tabsList = document.getElementById('tabs-lits-id');
    tabsList.innerHTML = '';    
    for (const tab of orderdTabs) {
        var tabItem = document.createElement('div');
        tabItem.className = 'row';
        tabItem.innerHTML = `<img src='${tab.favIconUrl}' width="16" height="16"/>  ` +
                            //`<span>${tab.id}</span` +
                            `<span>${tab.title}</span>`; 
        tabsList.appendChild(tabItem);
    }   

});
  