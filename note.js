// 1:图片压缩上传
// 2.微信分享


// 一、图片压缩上传
<input type="file" accept="image/*" class="info-file-none" ng-model="avatar.value"
onchange="angular.element(this).scope().avatar.change(this.files)"style="right:0;left: auto;z-index: 9">

$scope.avatar = {
    title: i18n.AVATAR,
    value: "",
    change: function(files) {
        $scope.$apply(function () {
            $scope.codes = "正在上传"
        })
        this.value = files[0];
        if(this.value != "") {
            setAvatar(this.value);
        }
    }
};
function setAvatar(file) {
    utils.imageCompress(file, function(base64) {
        var updateUrl = utils.getBaseUrl() + "extend/uploadfile";
        var formData = new FormData();
        formData.append("data", utils.convertBase64UrlToBlob(base64));
        // console.log(utils.convertBase64UrlToBlob(base64));
        ajax.UPLOAD(updateUrl, formData, function(d) {
            if (d.status){
                $scope.$apply(function () {
                    $scope.codes="上传成功"
                })
                $scope.fill.code = d.data.filename;
            }else {
                alert("上传失败")
            }

        });
    })
};

//图片压缩
imageCompress: function (file, callback) {
    var retImgStr = "";
    var percent = 1;
    function canvasDataURL(re, percent) {
        var newImg = new Image();
        newImg.src = re;
        var imgWidth, imgHeight, offsetX = 0, offsetY = 0;
        newImg.onload = function () {
            var img = document.createElement("img");
            img.src = newImg.src;
            imgWidth = img.width * percent;
            imgHeight = img.height * percent;
            var canvas = document.createElement("canvas");
            canvas.width = imgWidth;
            canvas.height = imgHeight;
            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, imgWidth, imgHeight);
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
            var base64 = canvas.toDataURL("image/jpeg", 1);
            // console.log(base64)
            callback(base64);
        }
    }

    var fileSize = file.size / 1024 / 1024;
    if ((fileSize > 1) && (fileSize < 2)) {
        percent = 0.1;
    }
    else if ((fileSize >= 2) && (fileSize < 4)) {
        percent = 0.1;
    }
    else if (fileSize >= 4) {
        percent = 0.1;
    }
    else if (fileSize < 1 && fileSize > 0.5) {
        percent = 0.4;
    }
    else {
        percent = 0.8;
    }
    var ready = new FileReader();
    /*开始读取指定的Blob对象或File对象中的内容.
    当读取操作完成时,
    readyState属性的值会成为DONE,
    如果设置了onloadend事件处理程序,则调用之.
    同时,result属性中将包含一个data: URL格式的字符串以表示所读取文件的内容.*/
    ready.readAsDataURL(file);
    ready.onload = function () {
        var re = this.result;
        canvasDataURL(re, percent);
    }
    // return retImgStr;
}

//二、 微信分享
wxShare: function () { //调用改函数时传的参数，以arguments的形式进行获取
    // 分析网址
    var reg1 = /^.*\/wxsrc\/.*$/;
    var reg2 = constant.urlReg;
    var currentUrl = location.href;
    var urlResult = reg2.exec(currentUrl);
    var replaceUrl = reg1.test(currentUrl) ? 'wxsrc' : 'wx';
    if (urlResult != null) {
        var sginBaseUrl = urlResult[0];
    }
    var shareTitle = "「涨听」-一问就有财";
    var shareDesc = "一个专业的付费投资知识分享平台，在涨听上你可以向各路大牛一对一付费问财，并听到他们的亲口回答，解决你的投资困惑";
    var shareImage = require('../../assets/style/images/icon/logo_share.png');
    shareImage = `${constant.BASE_URL.slice(0,-1)}${shareImage}`;
    var shareObj = constant.shareObjDefault;
    var linkUrl = constant.BASE_URL + "weixin/subscribedCheck?uri=" + replaceUrl + "/index.html#!" + arguments[0];
    shareObj.link = linkUrl.replace("#", "%23");
    if (arguments.length == 1) {
        // shareObj.link = arguments[0];
        shareObj.title = shareTitle;
        shareObj.desc = shareDesc;
        shareObj.imgUrl = shareImage;
    }
    else if (arguments.length == 3) {
        // shareObj.link = arguments[0];
        shareObj.title = arguments[1];
        shareObj.desc = arguments[2];
        shareObj.imgUrl = shareImage;
    }
    else if (arguments.length == 4) {
        // shareObj.link = arguments[0];
        shareObj.title = arguments[1];
        shareObj.desc = arguments[2];
        shareObj.imgUrl = arguments[3];
        shareObj.imgUrl = this.transShareImgDomain(shareObj.imgUrl);
    }
    shareObj.success = function () { };

    var signUrl = constant.BASE_URL + "weixin/signPackage";
    var urlParams = {
        // 向后台传递当前url
        url: constant.BASE_URL.split("//")[1] + sginBaseUrl
    };
    $.ajax({
        type: "POST",
        url: signUrl,
        data: urlParams,
        dataType: "json",
        success: function (data) {
            if (data.status == 0) {
                wx.config({
                    // debug: true,
                    appId: data.data.signPackage.appId,
                    timestamp: data.data.signPackage.timestamp,
                    nonceStr: data.data.signPackage.nonceStr,
                    signature: data.data.signPackage.signature,
                    jsApiList: constant.jsApiList
                });
                wx.ready(function () {
                    wx.onMenuShareAppMessage(shareObj);
                    wx.onMenuShareTimeline(shareObj);
                    $('.opinion-detail-content img').click(function (event) {
                        var reg = /http|https/gi;
                        var imageArray = [];
                        var curImageUrl = $(this).attr('src');
                        if (!reg.test(curImageUrl)) {
                            curImageUrl = constant.BASE_URL + curImageUrl;
                        }
                        imageArray.push(curImageUrl);
                        wx.previewImage({
                            urls: imageArray,
                            current: curImageUrl
                        });
                    });
                    wx.hideMenuItems({
                        menuList: ['menuItem:favorite']
                    });
                });
            }
            else {
                alert(data.message);
            }
        },
        error: function () {

        }
    });
},



















