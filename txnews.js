/*
更新时间: 2020-09-10 13:30
腾讯新闻签到修改版，可以自动阅读文章获取红包，该活动为瓜分百万现金挑战赛，针对幸运用户参与
获取Cookie方法:
1.把以下配置复制到响应配置下
2.打开腾讯新闻app，阅读几篇文章，倒计时结束后即可获取阅读Cookie;
3.看一次推荐视频获取视频地址
4.可能腾讯有某些限制，有些号码无法领取红包，手动阅读几篇，能领取红包，一般情况下都是正常的，
5.此脚本根据阅读篇数开启通知，默认阅读50篇通知一次，此版本和另一版本相同
版本更新日志:
1.01 修复无法自动获取视频红包，修改通知为阅读篇数间隔，即阅读篇数除以间隔余0时通知，或者自定义常开或常关，
1.02 支持boxjs配置，增加通知跳转链接https://news.qq.com/FERD/cjRedDown.htm，需手动领取此红包
---------------------
Surge 4.0
[Script]
腾讯新闻 = type=cron,cronexp=0 8 0 * * *,script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/txnews.js,script-update-interval=0
腾讯新闻 = type=http-request,pattern=https:\/\/api\.inews\.qq\.com\/event\/v1\/user\/event\/report\?,script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/txnews.js, requires-body=true
~~~~~~~~~~~~~~~~~~~~~
Loon 2.1.0+
[Script]
# 本地脚本
cron "04 00 * * *" script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/txnews.js, enabled=true, tag=腾讯新闻
http-request https:\/\/api\.inews\.qq\.com\/event\/v1\/user\/event\/report\? script-path=https://raw.githubusercontent.com/Sunert/Scripts/master/Task/txnews.js, requires-body=true
-----------------
QX 1.0.7+ :
 [task_local]
0 9 * * * https://raw.githubusercontent.com/Sunert/Scripts/master/Task/txnews.js, tag=腾讯新闻
 [rewrite_local]
https:\/\/api\.inews\.qq\.com\/event\/v1\/user\/event\/report\? url script-request-body https://raw.githubusercontent.com/Sunert/Scripts/master/Task/txnews.js
~~~~~~~~~~~~~~~~~~
 [MITM]
hostname = api.inews.qq.com
---------------------------
Cookie获取后，请注释掉Cookie地址。
*/
const $ = new Env('腾讯新闻');
const notify = $.isNode() ? require('./sendNotify') : '';
let s = $.getdata('delay')||500 // 间隔延迟时间
let notifyInterval =$.getdata('notifynum')||50; //阅读篇数间隔通知开为1，常关为0;
const TX_HOST = 'https://api.inews.qq.com/activity/v1/'


let signurlVal = $.getdata('sy_signurl_txnews')
let cookieVal = $.getdata( 'sy_cookie_txnews')
let videoVal = $.getdata( 'video_txnews')

if ($.isNode()) {
  cookieVal = process.env.cookieVal;
  signurlVal = process.env.signurlVal;
  videoVal = process.env.videoVal
 
}

let isGetCookie = typeof $request !== 'undefined'
if (isGetCookie) {
  GetCookie()
} else {
 !(async () => {
    {
  if(!signurlVal && !cookieVal){
    $.msg($.name, '【提示】??登录腾讯新闻app获取cookie',"qqnews://article_9500?tab=news_news&from=self", {"open-url": "qqnews://article_9500?tab=news_news&from=self"})
    await notify.sendNotify($.name, '【提示】请先获取腾讯新闻一Cookie',"qqnews://article_9500?tab=news_news&from=self", {"open-url": "qqnews://article_9500?tab=news_news&from=self"});
     return;
    }
     token = signurlVal.match(/devid=[a-zA-Z0-9_-]+/g)
     console.log("\n开始获取您的活动ID");
      await getsign();
      await activity();
      await toRead();
      await lookVideo();
      await StepsTotal();
      if(getreadred > 0){
        redbody = `redpack_type=article&activity_id=${actid}`
        await Redpack()
      };
      if(getvideored>0){
        redbody = `redpack_type=video&activity_id=${actid}`
        await Redpack()
      };
      await getTotal();
      await showmsg();
  if ($.isNode()){
   if (readnum%notifyInterval!==0){
        await notify.sendNotify($.name,subTile,detail);
      }
    }
    else if (openreadred==readredtotal&&openvideored==videoredtotal){
        await notify.sendNotify($.name+` 今日任务已完成?`,subTile,detail);
      }
      console.log('-----------'+'\n'+$.name,subTile,detail)
    }
  })()
      .catch((e) => $.logErr(e))
      .finally(() => $.done())
}

function GetCookie() {
  if ($request &&$request.body.indexOf("article_read")> -1) {
    const signurlVal =  $request.url
    const cookieVal = $request.headers['Cookie'];
    $.log(`signurlVal:${signurlVal}`)
    $.log(`cookieVal:${cookieVal}`)
    if (signurlVal) $.setdata(signurlVal, 'sy_signurl_txnews')
    if (cookieVal) $.setdata(cookieVal,  'sy_cookie_txnews')
    $.msg($.name, `获取Cookie: 成功??`, ``)
  }
  if ($request &&$request.body.indexOf("video_read")> -1) {
    const videoVal =  $request.url
    $.log(`videoVal:${videoVal}`)
    if (videoVal) $.setdata(videoVal,  'video_txnews')
    $.msg($.name, `获取视频地址: 成功??`, ``)
  }
}


//签到
function getsign() {
  return new Promise((resolve, reject) => {
    const signUrl = {
      url: `https://api.inews.qq.com/task/v1/user/signin/add?`,headers:{Cookie: cookieVal}
    };
    $.post(signUrl, (error, response, data) => {
      let obj = JSON.parse(data)
      if (obj.info=="success"){
        next = obj.data.next_points
        tip =  obj.data.tip_soup||obj.data.share_tip
        imgurl= obj.data.share_img
        Dictum = tip.replace(/[\<|\.|\>|br]/g,"")+""+obj.data.author.replace(/[\<|\.|\>|br|图|腾讯网友]/g,"")
        signinfo =  '【签到信息】连续签到' + obj.data.signin_days+'天 '+'明日+'+ next +'金币 成功??\n'}
      else {
        $.msg('签到失败，??登录腾讯新闻app获取cookie', "", "")
        console.log('签到失败，??登录腾讯新闻app获取cookie'+data)
        return
      }
      resolve()
    })
  })
}

function activity() {
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      $.get({url:`${TX_HOST}user/activity/get?isJailbreak=0&${token}`, headers: {Cookie:cookieVal}}, (error,response, data) =>{
        if (error) {
          $.msg("获取活动Id失败??", "", error)
        } else {
          let obj = JSON.parse(data)
          actid = obj.data.activity.id
          console.log(` 您的活动ID为: `+actid+"\n")
        }
        resolve()
      })
    },s)
  })
}

//阅读阶梯
function toRead() {
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      $.post({url: signurlVal, headers: {Cookie:cookieVal}, body: 'event=article_read'},(error, resp, data)=> {
        $.log("正在浏览文章"+data)
      })
      resolve()
    },s)
  })
}
function lookVideo() {
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      $.post({url: videoVal, headers: {Cookie:cookieVal},body: 'event=video_read'},(error, response, data) =>{
        if (error){
          $.msg($.name, '观看视频:'+ error)
        }else{
         $.log("正在观看视频"+data)
          tolookresult = JSON.parse(data)
        }
        resolve()
      })
    },s*2)
  })
}

//阅读文章统计
function StepsTotal() {
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      const StepsUrl = {
        url: `${TX_HOST}activity/info/get?activity_id=${actid}&${token}`,
        headers: {Cookie: cookieVal}
      }
      $.get(StepsUrl, (error, response, data) => {
        totalred = JSON.parse(data)
        $.log("正在统计阅读数据:")
        totalcion = totalred.data.extends.today_total_coin
        if (totalred.ret == 0){
          for (i=0;i<totalred.data.award.length;i++){
            if(totalred.data.award[i].type=='article'){
              readredtotal =totalred.data.award[i].total
              readtitle =
                  totalred.data.award[i].title.split("，")[0].replace(/[\u4e00-\u9fa5]/g,``)
              getreadred=totalred.data.award[i].openable
              openreadred= totalred.data.award[i].opened
              readnum = totalred.data.award[i].event_num
            }
            if(totalred.data.award[i].type=='video'){
              videoredtotal = totalred.data.award[i].total
              videotitle = totalred.data.award[i].title.split("，")[0].replace(/[\u4e00-\u9fa5]/g,``)
              getvideored = totalred.data.award[i].openable
              openvideored = totalred.data.award[i].opened
              videonum = totalred.data.award[i].event_num/2
            }
          }
          $.log("  已阅读文章"+readnum+"篇\n  浏览视频"+videonum+"分钟\n  今日已打开"+(openreadred+openvideored)+"个红包\n  今日金币收益"+totalcion)
        }
        resolve()
      })
    },s)
  })
}


//阶梯红包到账
function Redpack() {
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      const cashUrl = {
        url: `${TX_HOST}activity/redpack/get?isJailbreak=0&${token}`,
        headers: {Cookie: cookieVal},
        body: redbody
      }
      $.post(cashUrl, (error, response, data) => {
        let rcash = JSON.parse(data)
        try{
          redpacks = rcash.data.award.num/100
          if (rcash.ret == 0&&readredpack!=0&&getreadred>0){
            redpackres = `【阅读红包】到账`+readredpack+`元 ??\n`
            $.log("阅读红包到账"+readredpack+"元\n")
          }
          else if (rcash.ret == 0&&videoredpack!=0&&getvideored>0){
            redpackres = `【视频红包】到账`+videoredpack+`元 ??\n`
            $.log("视频红包到账"+videoredpack+"元\n")
          }
        }
        catch(err){
          $.log("打开红包失败,响应数据: "+ data+"\n错误代码:"+err) };
        $.msg($.name, "开红包失败，详情请看日志 ?", err)
        resolve()
      })
    },s)
  })
}

//收益总计
function getTotal() {
  return new Promise((resolve, reject) => {
    const totalUrl = {
      url: `${TX_HOST}usercenter/activity/list?isJailbreak=0`,
      headers: {Cookie: cookieVal}};
    $.post(totalUrl, function(error,response, data) {
      if (error) {
        $.msg("获取收益信息失败??", "", error)
      } else {
        const obj = JSON.parse(data)
        subTile = '【收益总计】'+obj.data.wealth[0].title +'金币  '+"钱包: " +obj.data.wealth[1].title+'元'
        $.log("钱包收益共计"+obj.data.wealth[1].title+"元")
      }
      resolve()
    })
  })
}

function showmsg() {
  return new Promise((resolve, reject) => {
    if(readnum||videonum){
      detail = signinfo + `【文章阅读】已读/再读: `+ readnum +`/`+readtitle+` 篇\n`+`【阅读红包】已开/总计: `+openreadred+`/`+readredtotal+` 个??\n`+ `【观看视频】已看/再看: `+ videonum +`/`+videotitle+` 分钟\n`+`【视频红包】已开/总计: `+openvideored+`/`+videoredtotal+` 个??\n【每日一句】`+Dictum
    }
    if (readnum%notifyInterval==0){
      $.msg($.name,subTile,detail,{ 'open-url': "https://news.qq.com/FERD/cjRedDown.htm", 'media-url': imgurl } )
    }
    else if (openreadred==readredtotal&&openvideored==videoredtotal){
      $.msg($.name+` 今日任务已完成?`,subTile,detail,{ 'open-url': "https://news.qq.com/FERD/cjRedDown.htm", 'media-url': imgurl } )
    }
    resolve()
  })
}

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
