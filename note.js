// 1:图片压缩上传
// 2.微信分享
// 3.判断访问终端
// 4.通过node爬取数据

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
//三、判断访问终端
var browser = {
    versions: function() {
        var u = navigator.userAgent,
            app = navigator.appVersion;
        return {
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
            iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1, //是否iPad
            webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
            weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
            qq: u.match(/\sQQ/i) == "qq", //是否QQ
            weibo: u.match(/WeiBo/i) == "weibo", //是否微博
        };
    }(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
};

// 四、通过node爬取网站数据
//首先通过npm下载三个模块:express,superagent,cheerio
var express = require("express");
var superagent = require("superagent")
var cheerio = require("cheerio")

//实例化express
var app = express();
//app.get是路由的方法,"./index"是url上的路径
app.get("/index",function(req,res){
//	这里调用了superagent的数据请求get方法
    superagent.get("https://cnodejs.org/")
        .end(function(err,cb){
//		常规的错误处理
            if (err){
                return next(err)
            }
            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            // 剩下就都是 jquery 的内容了
            var $ = cheerio.load(cb.text);
            var items = [];
//		这里的'#topic_list .topic_title'是爬取的网站上面的标签类名,遍历这些类名获取里面的text内容
            $('#topic_list .topic_title').each(function (idx, element) {
//		将每个便签对象拿出来,添加到数组里面
                var $element = $(element);
                items.push({
                    title: $element.attr('title'),
                    href: $element.attr('href')
                });
            });
//    渲染到页面
            res.send(items)
        })
})
//监听的端口
app.listen(8000,function(){
    console.log("index is listening")
})

















