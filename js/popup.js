import * as Chrome from "./modules/chrome.js";
import * as Common from "./modules/common.js";

const ul = document.getElementById("tagList");
const commentInput = formData.commentInput;
const commentCount = document.getElementById("commentCount");
const tagInput = formData.tagInput;
const tagCount = document.getElementById("tagCount");
const presetList = document.getElementById("presetList");
const saveButton = formData.saveButton;
let count = 0;

setInterval(checkTagInput, 100);

tagInput.addEventListener("input", tagCounter);
commentInput.addEventListener("input", commentCounter);
saveButton.addEventListener("click", saveToStorage);

presetList.addEventListener("change", () => {
    Promise.resolve()
    .then(() => Chrome.getStorage(presetList.options[presetList.selectedIndex].value))
    .then(item => {
        if (item === undefined) return;
        formData.tagInput.value = item.raw_tag;
        formData.commentInput.value = item.raw_comment;
        formData.privacy.value = item.restrict;
    })
})

Promise.resolve()
.then(() => Chrome.getStorage(null))
.then(allItem => Common.setAllPreset(allItem))
.then(() => Chrome.getStorage("selectedPreset"))
.then(item => {
    if (item === undefined) return;
    for (let i = 0; i < presetList.options.length; i++) {
        if (presetList.options[i].value === item) presetList.options[i].selected = true;   
    }
})
.then(() => Chrome.getStorage(presetList.options[presetList.selectedIndex].value))
.then(item => {
    if (item === undefined) return;
    formData.tagInput.value = item.raw_tag;
    formData.commentInput.value = item.raw_comment;
    formData.privacy.value = item.restrict;
})

Promise.resolve()
.then(() => Chrome.getPHPSESSID())
.then(PHPSESSID => Common.getBookmarkTag(PHPSESSID))
.then(response => Common.handleErrors(response))
.then(response => response.json())
.then(obj => Common.joinArray(obj.body.private, obj.body.public))
.then(tag => {
    for (let i = 0; i < tag.length; i++) {
        let li = document.createElement("li");
        li.innerText = tag[i].tag;
        ul.appendChild(li);
    }
})
.then(() => tagCounter())
.then(() => commentCounter())
.then(() => ul.addEventListener("click", tagInputToggle))
.catch(error => {
    const errorTextElement = document.createElement("span");
    ul.appendChild(errorTextElement);
    switch (error) {
        case 404:
            errorTextElement.innerHTML = "タグの取得に失敗しました。\n 取得するには<a href='https://accounts.pixiv.net/login' target='_blank'>pixiv</a>にログインしてください。\n";
            break;
    
        case "TypeError: Failed to fetch":
            errorTextElement.innerHTML = "タグの取得に失敗しました。\n 取得するにはネットワークに接続してください。";
            break;
    }
})

function tagInputToggle(event) {
    if (event.target.tagName == "LI"){
        const tagText = event.target.innerText.replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
        const regex = new RegExp(tagText + "\\s" + "|" + tagText + "$", "g");

        if (regex.test(tagInput.value)){
            tagInput.value = tagInput.value.replace(regex, "");
        } else {
            if (count < 10){
                if (tagInput.value && tagInput.value.slice(-1) != " " && tagInput.value.slice(-1) != "　"){
                    tagInput.value += " ";
                }
                tagInput.value += event.target.innerText;
            }
        }
    }

    tagInput.value = Common.deleteExtraSpace(tagInput.value);
    tagCounter();
}

function tagCounter() {
    if (tagInput.value) {
        count = tagInput.value.split(/[  　]/).length;
    } else {
        count = 0;
    }
    
    tagCount.innerText = count + " / 10";
}

function commentCounter() {
    commentCount.innerText = commentInput.value.length + " / 140";
}

function saveToStorage() {
    let data = {
        mode: "add",
        tt: null, // token
        id: null, // illustId
        from_sid: "",
        type: "illust",
        comment: Common.fixedEncodeURIComponent(commentInput.value), // コメント
        raw_comment: commentInput.value,
        tag: Common.fixedEncodeURIComponent(Common.zenkakuToHankaku(tagInput.value)), // タグ
        raw_tag: Common.zenkakuToHankaku(tagInput.value),
        restrict: formData.privacy.value, // 0 = 公開, 1 = 非公開
        name: presetList.options[presetList.selectedIndex].innerText
    }

    Promise.resolve()
    .then(() => Chrome.setStorage(presetList.options[presetList.selectedIndex].value, data))
    .then(() => Chrome.setStorage("selectedPreset", presetList.options[presetList.selectedIndex].value))
    .then(() => Chrome.setBadgeText(presetList.options[presetList.selectedIndex].innerText))
    .then(() => window.close());
}

function checkTagInput() {
    const li = ul.querySelectorAll("li");

    li.forEach(e => {
        const tagText2 = e.innerText.replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
        let tagRegex = new RegExp(tagText2 + "\\s" + "|" + tagText2 + "$", "g");

        if (tagRegex.test(tagInput.value)){
            e.classList.add("selected");
        } else {
            e.classList.remove("selected");
        }
    });
}