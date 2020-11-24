//----------------기본 세팅 --------------------------//
const express = require('express')
const app = express()
const request = require('request');
const jwt = require('jsonwebtoken');
const auth = require('./lib/auth');

app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

app.set('view engine', 'ejs'); // 사용하는 뷰 엔진


app.use(express.static(__dirname + '/public')); //디자인 파일이 위치할 정적 요소들을 저장하는 디렉토리

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
app.get('/signup',function(req,res){
    res.render('signup');
})

app.get('/login', function(req, res){
    res.render('login');
})

app.get('/login2', function(req, res){
    res.render('login2');
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
    connection.query([userEmail], function(err, result){
        if(err){
            console.error(err);
            res.json(0);
            throw err;
        }
        else {
            if(result.length == 0){
                res.json(3)
            }
            else {
                var Password = result[0].password;
                if(Password == userPassword){
                    var tokenKey = ""
                    jwt.sign(
                      {
                          userId : result[0].id,
                          userEmail : result[0].email
                      },
                      tokenKey,
                      {
                          expiresIn : '',
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



//----------------------- 서비스 작동 ----------------------------------//

app.get('authResult', function(req,res){
    var authCode = req.query.code
    console.log(authCode)
    var option ={
        method : "POST",
        url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
        headers : {
            'Content-Type' : 'applcation/x-222-form-urlencoded'
        },
        form : {
            code: authCode,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_url : 'http://localhost:3000/authResult',

        }
    }
})


app.listen(3000, function(){
    console.log('서버가 3000번 포트에서 실행중 입니다.');
})
