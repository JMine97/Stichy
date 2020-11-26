//----------------기본 세팅 --------------------------//
const express = require('express')
const app = express()
const request = require('request');
const jwt = require('jsonwebtoken');
const auth = require('./lib/auth');
var store = require('store');
const { Script } = require('vm');


app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

app.set('view engine', 'ejs'); // 사용하는 뷰 엔진
app.set('views', __dirname + '/views');//랜더링할 파일이 있는 디렉토리 


app.use(express.static(__dirname + '/public')); //디자인 파일이 위치할 정적 요소들을 저장하는 디렉토리

//------------------카카오 API---------------------------
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;

// localhost:3000/login/kakao로 들어오면(get으로 들어오면) passport.authenticate를 실행(여기서는 임의로 login-kakao로 이름을 줌)
app.get('/kakaologin', passport.authenticate('login-kakao'));

// 이름을 login-kakao로 임의로 주었습니다 그래서 /kakao로 들어오면 아래가 실행이 됩니다
passport.use('login-kakao', new KakaoStrategy({
        clientID : 'a85690d51bf65cc8b3ba6ab3c981b9d5',
        callbackURL : 'http://localhost:3000/login/kakao' // 카카오 개발자 사이트에서 지정한 리다이렉트 URL 
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(profile);
        return done(null, profile);
    }
));

app.get('/oauth/kakao/callback', passport.authenticate('login-kakao', {
    successRedirect: '/client', // 성공하면 /main으로 가도록
    failureRedirect: '/'
}));

//------------------database 연결 ----------------------
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost', //서버의 주소
  user     : 'root', // 접근 계정 이름
  password : 'root', // 계정 비밀번호

  database : 'fintech' // 데이터베이스 이름
});
connection.connect();


// ------------------ get Method -------------------------

app.get('/login',function(req,res){
    res.render('login');
})

// app.get('/kakaologin', function(req, res){
//     res.render('kakaologin');
// })


app.get('/signup', function(req, res){
    res.render('signup');
})

app.get('/signup2', function(req, res){
    res.render('signup2');
})

app.get('/client', function (req, res) {
    res.render('client');
})
  
//guest용 화면
app.get('/client2', function (req, res) {
  res.render('client2');
  })
  app.get('/sendlist', function (req, res) {
    res.render('sendlist');
    })
app.get('/customer', function (req, res) {
res.render('customer');
})

app.get('/camera', function (req, res) {
res.render('camera');
})

//host용 화면
app.get('/admin', function (req, res) {
res.render('admin');
})

app.get('/qrcode', function (req, res) {
res.render('qrcode');
})  

app.get('/message', function (req, res) {
  res.render('message');
  })  

// ------------회원가입 --------------------------//
var clientId = "o3fwum9rDR2LUKdyY46O4tfA7kaRdzjIdKuv7FNU"
var clientSecret = "b4xVe7ARKAdL2CxDjVjNEbOMZY2cyCBcvNd4XssW"


app.post('/signup', function(req, res){
    console.log(req.body);
    var userName = req.body.userName;
    var userPassword = req.body.userPassword;
    var userEmail = req.body.userEmail;
    var userAccessToken = req.body.userAccessToken;
    var userRefreshToken = req.body.userRefreshToken;
    var userSeqNo = req.body.userSeqNo;
    var insertUserSql = "INSERT INTO user (`name`, `email`, `accesstoken`, `refreshtoken`, `userseqno`, `password`) VALUES (?, ?, ?, ?, ?, ?)"
    connection.query(insertUserSql,[userName, userEmail, userAccessToken, userRefreshToken, userSeqNo, userPassword], function (error, results, fields) {
      if (error) throw error;
      else {
        res.json(1);
      }
    });
})


//--------------로그인----------------------------//
app.post('/login', function(req, res){
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;
    var searchEmailSql = "SELECT * FROM user WHERE email = ?";
    connection.query(searchEmailSql,[userEmail, userPassword], function (error, results, fields) {
       if(error){
            console.error(error);
            res.json(0);
            throw error;
        }
        else {
            if(results.length == 0){
                res.json(3)
            }
            else {
                store.set('user', results[0].name);

                var Password = results[0].password;
                if(Password == userPassword){
                    var tokenKey = "f@i#n%tne#ckfhlafkd0102test!@#%"
                    jwt.sign(
                      {
                          userId : results[0].id,
                          userName : results[0].name,
                          userEmail : results[0].email
                      },
                      tokenKey,
                      {
                          expiresIn : '10d',
                          issuer : '.admin',
                          subject : 'user.login.info'
                      },
                      function(err, token){
                          console.log('로그인 성공', token)
                          res.json(token)
                      }
                    )            
                }
                else {
                    res.json(2);
                }
            }
        }
    })
})
//


app.post('/authTest', auth, function(req,res){
    res.json('login');
})

var tokenKey = ""
const authMiddleware = (req, res, next) => {
   const token = req.headers['ourtoken'] || req.query.token;
   console.error(token)
   if(!token) {
       return res.status(403).json({
           server : "서버",
           success: false,
           message: 'not logged in'
       })
   }
   const p = new Promise(
       (resolve, reject) => {
           jwt.verify(token, tokenKey, (err, decoded) => {
               if(err) reject(err)
               resolve(decoded)
           })
       }
   )
   const onError = (error) => {
       console.log(error);
       res.status(403).json({
            server : "서버",
           success: false,
           message: error.message
       })
   }
   p.then((decoded)=>{
       req.decoded = decoded
       next()
   }).catch(onError)
}
module.exports = authMiddleware;
//

//미들웨어 auth
app.post('/list', function(req, res){
    //user/me 요청 만들기
    var email = req.body.userEmail;
    console.log('server', email);
    var userSelectSql = "SELECT * FROM user WHERE email = ?";
    connection.query(userSelectSql, [email], function(err, results){
      if(err){throw err}
      else {
        var userAccessToken = results[0].accesstoken;
        var userSeqNo = results[0].userseqno;
        var option = {
          method : "GET",
          url : "https://testapi.openbanking.or.kr/v2.0/user/me",
          headers : {
            //토큰
            Authorization : "Bearer " + userAccessToken
          },
          //get 요청을 보낼때 데이터는 qs, post 에 form, json 입력가능
          qs : {
            user_seq_no : userSeqNo
          }
        }
        request(option, function (error, response, body) {
          //json이 아니면 바꿔줘야 출력됨
          var listResult = JSON.parse(body);

          var pinInsertSql = "update user set userfin = ? WHERE email = ?";
          connection.query(pinInsertSql, [listResult.res_list[0].fintech_use_num, email], function(err, results){
            if(err){throw err}
            else {}
          });
          
          res.json(listResult)
        });
      }    
    })
  })

//받은경조사비 내역 가져오기
app.post('/admin', function(req, res){
  var email = req.body.userEmail;
  // console.log('server', email);
 // var userSelectSql = "SELECT * from user inner join list on user.email=list.receiver where email=?";
 var userSelectSql = "SELECT * from user inner join list on user.email=list.sender where receiver=?";
  connection.query(userSelectSql, [email], function(err, results){
    if(err){throw err}
    else {
      var admin = results;
      // console.log(admin);
      console.log(admin)
    }
    res.json(admin)
  })
})

//보낸내역 가져오기
app.post('/sendlist', function(req, res){
  var email = req.body.userEmail;
  // console.log('server', email);
  var userSelectSql = "SELECT * from user inner join list on user.email=list.receiver where sender=?";
  connection.query(userSelectSql, [email], function(err, results){
    if(err){throw err}
    else {
      var sendlist = results;
      
    }
    res.json(sendlist)
  })
})

//메시지 가져오는 기능
app.post('/message', function(req, res){
  var email = req.body.userEmail;
  // console.log('server', email);
  var userSelectSql = "SELECT name, message from user inner join list on user.email=list.sender where receiver=?";
  connection.query(userSelectSql, [email], function(err, results){
    if(err){throw err}
    else {
      var message = results;
      // console.log(message);
    }
    res.json(message)
  })
})

app.post('/record', function(req, res){
  
  var userName = store.get('user');

  var email = req.body.email;
  var finno = req.body.toFinUseNo;
  var receiver;

  var userSelectSql = "select email from user where userfin = ?";
  connection.query(userSelectSql, [finno], function(err, results){
    if(err){throw err}
    else {
      console.log(finno);
      console.log(results);
      receiver = results;
      // console.log(message);
    }
    
  })
  

  var insertUserSql = "INSERT INTO list ( `money`, `message`, `receiver`,`sender`) VALUES ( ?, ?, ?, ?)"
  connection.query(insertUserSql,[req.body.money, req.body.message,receiver, email], function (error, results, fields) {
    if (error) throw error;
    else {
      res.json('insert success');
    }
  });
})


//----------------------- 서비스 작동 ----------------------------------//

app.get('/authResult', function(req, res){
    var authCode = req.query.code;
    console.log("인증코드 : ", authCode)
    var option = {
      method : "POST",
      url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
      headers : {
        "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8"
      },
      form : {
        code : authCode,
        client_id : clientId,
        client_secret : clientSecret,
        redirect_uri : "http://localhost:3000/authResult",
        grant_type : "authorization_code"
      }
    }
    request(option, function (error, response, body) {
      var accessRequestResult = JSON.parse(body);
      console.log(accessRequestResult);
      res.render("resultChild", { data: accessRequestResult });
    });
  })


app.listen(3000, function(){
    console.log('서버가 3000번 포트에서 실행중 입니다.');
})


