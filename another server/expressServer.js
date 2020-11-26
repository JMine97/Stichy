const express = require('express')
const app = express()
const request = require('request');
var store = require('store')

app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

app.set('view engine', 'ejs'); // 사용하는 뷰 엔진
app.set('views', __dirname + '/views');//랜더링할 파일이 있는 디렉토리 


app.get('/test',function(req,res){
    var money=req.body.money;
    console.log(money);
    var option = {
        method: "POST",
        url: "https://kapi.kakao.com/v1/payment/ready",
        headers: {
          Authorization: "KakaoAK 3c350b16261bff69d388000ddd91417d",
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8"
        },
        form: {
          cid: "TC0ONETIME",
          partner_order_id: "878978903011",
          partner_user_id: "098986752411",
          item_name: "축의/부의금",
          quantity: "1",
          total_amount: money,
          tax_free_amount: "020",
          approval_url: "http://localhost:3000/pay",
          cancel_url: "http://localhost:3000",
          fail_url: "http://localhost:3000"
        }
      };
      request(option, function (error, response, body) {
        var testRequestResult = JSON.parse(body);
        var tid =testRequestResult.tid;

        store.set('tid',tid);
    
        console.log(tid)
        var redirect_pc_url=testRequestResult.next_redirect_pc_url;
        var resultObj = {
            tid : tid,
            redirectUrl : redirect_pc_url,
        }
        console.log(resultObj);
        res.json(resultObj);

      });

})

app.listen(8000, function(){
    console.log('서버가 8000번 포트에서 실행중 입니다.');
})
