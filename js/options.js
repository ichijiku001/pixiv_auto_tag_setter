/*
The MIT License (MIT)

Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import {nanoid} from "./modules/nanoid.js";
import * as Chrome from "./modules/chrome.js";
import * as Common from "./modules/common.js";

const ul = document.getElementById("tagList");
const commentInput = formData.commentInput;
const commentCount = document.getElementById("commentCount");
const tagInput = formData.tagInput;
const tagCount = document.getElementById("tagCount");
const presetList = document.getElementById("presetList");
const toolBar = document.getElementById("toolBar");
let count = 0;

Chrome.getStorage(null).then(item => console.log(item))

setInterval(checkTagInput, 100);

Promise.resolve()
.then(() => Chrome.getStorage(null))
.then(allItem => Common.setAllPreset(allItem))
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

tagInput.addEventListener("input", tagCounter);
commentInput.addEventListener("input", commentCounter);

presetList.addEventListener("change", () => {
    Chrome.getStorage(presetList.options[presetList.selectedIndex].value)
    .then(item => {
        if (item === undefined) return;
        formData.tagInput.value = item.raw_tag;
        formData.commentInput.value = item.raw_comment;
        formData.privacy.value = item.restrict;
    })
})

toolBar.addEventListener("click", event => {
    if (event.target.tagName !== "BUTTON") return;
    let result;
    switch (event.target.value) {
        case "new":
            result = window.prompt("プリセット名を入力してください");
            if (result === null) return;

            let data = {
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
                name: result
            }

            const key = nanoid();

            Promise.resolve()
            .then(() => Chrome.setStorage(key, data)) 
            .then(() => {
                const option = document.createElement("option");
                option.innerText = data.name;
                option.value = key;
                option.selected = true;
                presetList.appendChild(option);
            })
            .then(() => Chrome.getStorage(presetList.options[presetList.selectedIndex].value))
            .then(item => {
                if (item === undefined) return;
                formData.tagInput.value = item.raw_tag;
                formData.commentInput.value = item.raw_comment;
                formData.privacy.value = item.restrict;
            })

            break;
    
        case "remove":
            result = window.confirm("プリセットを削除しますか？");
            if (!result) return;

            Promise.resolve()
            .then(() => Chrome.removeStorage(presetList.options[presetList.selectedIndex].value))
            .then(() => presetList.remove(presetList.selectedIndex))
            .then(() => Chrome.getStorage(presetList.options[presetList.selectedIndex].value))
            .then(item => {
                if (item === undefined) return;
                formData.tagInput.value = item.raw_tag;
                formData.commentInput.value = item.raw_comment;
                formData.privacy.value = item.restrict;
            })
            break;

        case "rename":
            result = window.prompt("プリセット名を入力してください", presetList.options[presetList.selectedIndex].innerText);
            if (result === null) return;

            Promise.resolve()
            .then(() => Chrome.getStorage(presetList.options[presetList.selectedIndex].value))
            .then(item => {
                item.name = result;
                return item;
            })
            .then(item => Chrome.setStorage(presetList.options[presetList.selectedIndex].value, item))
            .then(() => {
                presetList.options[presetList.selectedIndex].innerText = result;
            })
            break;

        case "save":
            let saveData = {
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
            .then(() => Chrome.setStorage(presetList.options[presetList.selectedIndex].value, saveData))
            .then(() => window.alert("保存しました"))
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