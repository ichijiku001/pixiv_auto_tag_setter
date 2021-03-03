const ul = document.getElementById("tagList");
const commentInput = formData.commentInput;
const commentCount = document.getElementById("commentCount");
const tagInput = formData.tagInput;
const tagCount = document.getElementById("tagCount");
const saveButton = formData.saveButton;

let count = 0;

restoreStorage();
setInterval(checkTagInput, 100);

tagInput.addEventListener("input", tagCounter);
commentInput.addEventListener("input", commentCounter);
saveButton.addEventListener("click", saveToStorage);

chrome.cookies.get({url:"https://www.pixiv.net/", name:"PHPSESSID"}, cookie => setUserTag(cookie.value.split("_")[0]));

function setUserTag(userId) {
    fetch("https://www.pixiv.net/ajax/user/" + userId + "/illusts/bookmark/tags?lang=ja")
    .then(handleErrors)
    .then(res => res.json())
    .then(data => {
        function joinArray(arr1, arr2) {
            for (let i = 0; i < arr1.length; i++) {
                let check = arr2.findIndex(element => element.tag == arr1[i].tag);
              
                if (check !== -1) {
                    if (arr1[i].cnt >= arr2[check].cnt) {
                        arr2.splice(check, 1);
                    } else if (arr1[i].cnt < arr2[check].cnt) {
                        arr1.splice(i, 1);
                        i--;
                    }
                }
            }
            
            return arr1.concat(arr2);
        }

        return joinArray(data.body.private, data.body.public);
    })
    .then(tag => {
        for (let i = 0; i < tag.length; i++) {
            let li = document.createElement("li");
            li.innerText = tag[i].tag;
            ul.appendChild(li);
        }
    })
    .then(() => {
        ul.addEventListener("click", tagInputToggle);
        tagCounter();
        commentCounter();
    })
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
}

function handleErrors(response) {
    return new Promise((resolve, reject) => {
        if (!response.ok){
            reject(response.status);
        }
    
        resolve(response);
    })
}

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

    tagInput.value = deleteExtraSpace(tagInput.value);
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
        comment: fixedEncodeURIComponent(commentInput.value), // コメント
        raw_comment: commentInput.value,
        tag: fixedEncodeURIComponent(zenkakuToHankaku(tagInput.value)), // タグ
        raw_tag: zenkakuToHankaku(tagInput.value),
        restrict: formData.privacy.value // 0 = 公開, 1 = 非公開
    }

    chrome.storage.local.set({"formData": data}, window.close());

    function zenkakuToHankaku(str) {
        str = deleteExtraSpace(str);
        return str.replace(/[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g, function(s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        })
    }

    function fixedEncodeURIComponent(str) {
        return encodeURIComponent(str).replace(/%20/g, "+");
    }
}

function restoreStorage(){
    chrome.storage.local.get(["formData"], result => {
        if (result.formData.raw_tag !== undefined){
            formData.tagInput.value = result.formData.raw_tag;
        }
        
        if (result.formData.raw_comment !== undefined){
            formData.commentInput.value = result.formData.raw_comment;
        }
        
        if (result.formData.restrict !== undefined){
            formData.privacy.value = result.formData.restrict;
        }
    });
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

function deleteExtraSpace(str) {
    str = str.replace(/　/g, " ");
    str = str.replace(/\s{2,}/g, " ");
    str = str.replace(/^\s+|\s+$/g, "");

    return str;
}