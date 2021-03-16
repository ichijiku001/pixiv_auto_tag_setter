function getPHPSESSID() {
    return new Promise((resolve, reject) => {
        chrome.cookies.get({url:"https://www.pixiv.net/", name:"PHPSESSID"}, cookie => {
            resolve(cookie.value.split("_")[0]);
        })
    })
}

function getStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, item => {
            if (key === null) resolve(item);
            else resolve(item[key]);
        })
    })
}

function setStorage(key, data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({[key]: data}, () => {
            resolve();
        });
    })
}

function removeStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, () => {
            resolve();
        })
    })
}

function setBadgeText(text) {
    return new Promise((resolve, reject) => {
        if (text == "-- 未選択 --") text = null;
        chrome.browserAction.setBadgeText({text: text}, () => resolve())
    })
}

export {
    getPHPSESSID,
    getStorage,
    setStorage,
    removeStorage,
    setBadgeText
}