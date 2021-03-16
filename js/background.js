let formData = {
    mode: "add",
    tt: null, // token
    id: null, // illustId
    from_sid: "",
    type: "illust",
    comment: "", // コメント
    raw_comment: "",
    tag: "", // タグ
    raw_tag: "",
    restrict: 0, // 0 = 公開, 1 = 非公開
}

const prop = {
    id: "add",
    title: "このイラストをクイックブックマーク",
    contexts: ["link"],
    targetUrlPatterns: ["https://www.pixiv.net/artworks/*"]
}

chrome.contextMenus.create(prop);

Promise.resolve()
.then(() => getStorage("selectedPreset"))
.then(item => getStorage(item))
.then(item => {
    if (item !== undefined) formData = item;
})

chrome.storage.local.onChanged.addListener(result => {
    if (result.selectedPreset) {
        Promise.resolve()
        .then(() => getStorage(result.selectedPreset.newValue))
        .then(item => {
            if (item === undefined) return;
            formData = item;
        })
    } else {
        for (let key in result) {
            Promise.resolve()
            .then(() => getStorage("selectedPreset"))
            .then(item => {
                if (item === key) formData = result[key].newValue;
            })
        }
    }
});

chrome.contextMenus.onClicked.addListener(bookmark);

function getStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, item => {
            if (key === null) resolve(item);
            else resolve(item[key]);
        })
    })
}

function bookmark(object) {
    const illustId = object.linkUrl.split("https://www.pixiv.net/artworks/")[1];

    fetch("https://www.pixiv.net/bookmark_add.php?type=illust&illust_id=" + illustId)
        .then(handleErrors)
        .then(res => res.text())
        .then(text => new DOMParser().parseFromString(text, "text/html"))
        .then(dom => dom.querySelector("#meta-global-data").content)
        .then(content => JSON.parse(content))
        .then(obj => obj.token)
        .then(token => {
            formData.id = illustId;
            formData.tt = token;
            return formData;
        })
        .then(data => compileFormData(data))
        .then(cmpData => Promise.all([addBookmark(illustId, cmpData), ImageToBase64(object.srcUrl)]))
        .then(result => {
            let text_restrict;
            if (formData.restrict == 0) {
                text_restrict = "【公開】";
            } else if (formData.restrict == 1) {
                text_restrict = "【非公開】";
            }

            const NotificationOptions = {
                type: "basic",
                title: text_restrict + "クイックブックマーク",
                message: "コメント：" + formData.raw_comment + "\n" + "タグ：" + formData.raw_tag,
                iconUrl: result[1]
            }

            chrome.notifications.create(NotificationOptions, notificationId => {
                setTimeout(() => {
                    chrome.notifications.clear(notificationId);
                }, 10000);
            });
        })
        .catch(error => {
            const NotificationOptions = {
                type: "basic",
                title: "クイックブックマーク",
                message: "ブックマークに失敗しました。" + "\n" + error,
                iconUrl: "/icon/icon128.png"
            }

            chrome.notifications.create(NotificationOptions);
        })
}

function handleErrors(response) {
    return new Promise((resolve, reject) => {
        if (!response.ok){
            reject(response.status);
        }
    
        resolve(response);
    })
}

function compileFormData(data) {
    let compileData = "";

    for (key in data) {
        if (!(key == "raw_tag" || key == "raw_comment" || key == "name")) {
            compileData += key + "=" + data[key] + "&";
        }
    }
    return compileData;
}

function addBookmark(illustId, data) {
    return new Promise(function (resolve, reject) {
        fetch("https://www.pixiv.net/bookmark_add.php?id=" + illustId, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: data
        })
        .then(handleErrors)
        .then(res => {
            if (/^https:\/\/www\.pixiv\.net\/\?return_to/.test(res.url)) {
                reject("ログインしてください。");
            }

            resolve();
        })
        .catch(error => {
            reject(error);
        })
    });
}

function ImageToBase64(imageSrc) {
    return new Promise(function (resolve, reject) {
        function ImageToBase64(img) {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL("image/jpeg");
        }

        const image = new Image();

        image.onload = function () {
            resolve(ImageToBase64(this));
        }

        image.onerror = function () {
            resolve("/icon/icon128.png");
        }

        image.src = imageSrc;
    });
}