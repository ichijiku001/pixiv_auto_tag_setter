function zenkakuToHankaku(str) {
    str = deleteExtraSpace(str);
    return str.replace(/[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    })
}

function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/%20/g, "+");
}

function deleteExtraSpace(str) {
    str = str.replace(/　/g, " ");
    str = str.replace(/\s{2,}/g, " ");
    str = str.replace(/^\s+|\s+$/g, "");

    return str;
}

function setAllPreset(allItem) {
    if (allItem === undefined) return;
    for (let key in allItem) {
        if (!(key === "formData" || key === "selectedPreset")) {
            const option = document.createElement("option");
            option.innerText = allItem[key].name;
            option.value = key;
            presetList.appendChild(option);
        }   
    }
}

function handleErrors(response) {
    return new Promise((resolve, reject) => {
        if (!response.ok){
            reject(response.status);
        }
    
        resolve(response);
    })
}

function getBookmarkTag(userId) {
    return new Promise((resolve, reject) => {
        fetch("https://www.pixiv.net/ajax/user/" + userId + "/illusts/bookmark/tags?lang=ja")
        .then(resolve)
    })
}

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

export {
    zenkakuToHankaku,
    fixedEncodeURIComponent,
    deleteExtraSpace,
    setAllPreset,
    handleErrors,
    getBookmarkTag,
    joinArray
}