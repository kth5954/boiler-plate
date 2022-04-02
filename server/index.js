const express = require('express');
const app = express();
const config = require('./config/key');
const { auth } = require('./middleware/auth');


// mongoDB 연결
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI)
.then(console.log("mongoDB connected..."))
.catch(err => console.log(err))

//parser
const bodyParser = require('body-parser');
const { User } = require('./models/User')
const { mongoURI } = require('./config/dev');
const cookieParser = require('cookie-parser');
const { json } = require('express/lib/response');
 
//body-parser가 다음과 같은 형태로 되어있는 데이터를 분석하여 가져옴 
//application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({extended: true}));
//application/json
app.use(bodyParser.json())
app.use(cookieParser());


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/api/hello', (req, res)=> {
    res.send('안녕하세요! ')
})

  
// Register Route
app.post('/api/users/register', (req, res) => {
    const user = new User(req.body) // user instance 생성(body-parser 이용)
    // 비밀번호 암호화 (mongoose 기능 이용)
    user.save((err, doc) => { //mongoDB method, DB에 저장 
      if (err) return res.json({ success: false, err})
      return res.status(200).json({   
        success: true
      }) 
    }) 
  })
  
  
  
  // Login Route
  app.post('/api/users/login', (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
      if (!user) {
        return res.json({
          loginSuccess: false,
          message: "등록되지 않은 사용자입니다."
        })
      }
      user.comparePassword( req.body.password, (err, isMatch) => {
        if (!isMatch) return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀립니다."
        })
        
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);
        // 토큰을 저장한다 어디에? 쿠키, 로컬 스토리지 ? 
        res.cookie("x_auth", user.token)
        .status(200)
        .json({
          loginSuccess: true,
          userId: user._id
          })
        })
      })
    })
  })
  
  // auth Route 
  // role === 0 -> 일반유저, role != 0 -> 관리자(1: admin, 2: 특정부서)
  app.get('/api/users/auth', auth, (req, res) => {
    // 여기까지 미들웨어를 통과했단 것은 Authentication이 true라는 말
    res.status(200).json({
      _id: req.user._id,
      isAdmin: req.user.role === 0 ? false:true,
      isAuth: true,
      email: req.user.email,
      name: req.user.name,
      lastname: req.user.lastname,
      role: req.user.role,
      image: req.user.image
    })
  })
  
  // logout Route
  // 토큰 지워주기 
  app.get('/api/users/logout',   
  auth, (req, res) => {
    User.findOneAndUpdate({_id: req.user._id}, 
      {token: ""}, (err, user) => {
        if (err) return res.json({ success: false, err});
        return res.status(200).send({
          success: true
        })
  
      }) // middleware에서 가져와서 찾기
  })
  
  // show the port on console
  const port = 5000;
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })