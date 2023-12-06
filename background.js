const redirectList = [
    { id: 1, label: "reddit/r -> old.reddit/r", from: "^https?://www\.reddit\.com/r/(.*)", to: "https://old.reddit.com/r/\\1", enabled: true },
    { id: 2, label: "reddit/u -> old.reddit/u", from: "^https?://www\.reddit\.com/u(.*)", to: "https://old.reddit.com/u\\1", enabled: true },
    { id: 3, label: "reddit/u/top -> old.reddit/u/top", from: "^https?://(?:.*)\.reddit\.com/(?:u|user)/(.*)/submitted/$", to: "https://old.reddit.com/user/\\1/submitted/?sort=top", enabled: true },
    { id: 4, label: "reddit/r/top -> old.reddit/r/top", from: "^https?://(?:.*)\.reddit\.com/r/(.*)/top/$", to: "https://old.reddit.com/r/\\1/top/?sort=top&t=all", enabled: true },
    { id: 5, label: "twitter -> nitter", from: "^https?://twitter\.com/(.*)", to: "https://nitter.cz/\\1", enabled: true },
    { id: 6, label: "quora -> quetre", from: "^https?://www\.quora\.com/(.*)", to: "https://quetre.iket.me/\\1", enabled: true },
    { id: 7, label: "bitsearch -> bitsearch-sorted", from: "^https?://bitsearch\.to/search\\?q=([^&]*)$", to: "https://bitsearch\.to/search?sort=seeders&q=\\1", enabled: true },
    { id: 8, label: "google with bang -> duck", from: "^https?://www\.google\.com/search\\?q=(.*(?:%21|!).*)$", to: "https://duckduckgo\.com/?kae=d&ks=n&k1=-1&kl=au-en&kz=1&ku=-1&kp=-2&kaq=-1&kam=google-maps&kaj=m&k5=2&kw=n&kah=au-en&kao=1&kak=-1&kk=-1&kad=en_AU&q=\\1", enabled: true },
]
//{ id: 7, label: "bitsearch -> bitsearch-sorted", from: "https?://bitsearch\.to/search\\?q=([a-zA-Z0-9]+)$", to: "https://bitsearch\.to/search?sort=seeders&q=\\1", enabled: true },

let localRedirectList

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ hardRedirectorList: redirectList })
    chrome.storage.local.get("hardRedirectorList", (localRedirectList) => {
        clearSessionRules(redirectList)
        applySessionRules(localRedirectList)
    });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("hardRedirectorList", (localRedirectList) => {
        clearSessionRules(redirectList)
        applySessionRules(localRedirectList)
    });
})

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.hardRedirectorList?.newValue) {
        chrome.storage.local.get("hardRedirectorList", (localRedirectList) => {
            clearSessionRules(redirectList)
            applySessionRules(localRedirectList)
        });
    }
});

let clearSessionRules = (redirectList) => {
    chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: Array(redirectList.length).fill().map((_, i) => i + 1)
    })
}

let applySessionRules = (localRedirectList) => {
    chrome.declarativeNetRequest.updateSessionRules(formatRules(onlyEnabled(localRedirectList.hardRedirectorList)))
}

let onlyEnabled = (localRedirectList) => {
    return localRedirectList.filter((rule) => { return rule.enabled == true })
}

let formatRules = (localRedirectList) => {
    let delIds = []
    let rules = []
    for (let i = 0; i < localRedirectList.length; i++) {
        rules.push({
            id: localRedirectList[i].id,
            action: {
                type: "redirect",
                redirect: { regexSubstitution: localRedirectList[i].to }
            },
            condition: {
                resourceTypes: ["main_frame"],
                regexFilter: localRedirectList[i].from
            }
        })
        delIds.push(i + 1)
    }
    return { removeRuleIds: delIds, addRules: rules }
}
