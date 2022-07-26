const router = require('express').Router();
var path = require('path');
var getConnection = require('../DB/DBConnect');
var crypto = require('crypto');
var session = require('express-session');
var filestore = require('session-file-store')(session);
const cons = require('consolidate');
const { stringify } = require('querystring');
const { javascript } = require('docker/src/languages');
const { Console } = require('console');

const CryptoKey = '156asda15s48fd53s2d';

function ShaEnCryption(data,key){
    var CryptoSha = crypto.createHmac('sha256',key);
    var HmacUP = CryptoSha.update(data).digest('hex');
    return HmacUP;
}

router.get('/',(req,res,next)=>{
    if(req.session.user){
        res.render(path.join(__dirname,'../../public/HTML/login'));
    }else{
        res.render(path.join(__dirname,'../../public/HTML/main'));
    }
})

router.post('/',(req,res,next)=>{
    var id = req.body.id;
    var pw = req.body.pw;

    //console.log(id);
    //console.log(pw);

    /* 로그인시 데이터 검증
        1. ID
            - 데이터베이스에 ID가 존재하는지 체크
            - ID input태그가 빈 상태인지 체크
        2. PassWard
            - 비밀번호 input태그가 빈 상태인지 체크
            - 입력한 비밀번호 암호화하여 데이터베이스에 저장된 데이터와 비교
    */
    // 비었는지 체크
    function DataNullCheck() {
        if(id == "" && pw == ""){
            res.send("<script>alert('아이디와 비밀번호를 입력해주세요!');</script>");
            return false;
        }
        else if(id == ""){
            res.send("<script>alert('아이디를 입력해주세요!');</script>");
            return false;
        }
        else if(pw == ""){
            res.send("<script>alert('비밀번호를 입력해주세요!');</script>");
            return false;
        }
        return true;
    }

    function LoginDataCheck(id, pw){
        getConnection(async (conn) => {
            var cryptoPW = ShaEnCryption(pw, CryptoKey);
            var sql1 = "SELECT COUNT(id) as count FROM sign WHERE id=?;";
            //var sql2 = "SELECT * FROM sign WHERE id=?;";
            var param = [id];
            var result1, result2;
            conn.query(sql1,param,(err,row)=>{
                if(!err){
                    console.log(row);
                    console.log(row.count)
                    if(row[0].count){
                        result1 = true;
                    }
                    else{
                        result1 = false;
                    }
                }
                else{
                    console.log('err : ' + err);
                }
            });
            /*
            conn.query(sql2, param, (err,row)=>{
                if(!err){
                    console.log(row);
                    if(cryptoPW == row[0].password){
                        result2 = true;
                    }
                    else{
                        result2 = false;
                    }
                }
                else{
                    console.log('err : ' + err);
                }
            });
            */
            conn.release();
            console.log(result1);
            console.log(result2);
        });
        
    }
    /*
    function LoginIdDataCheck(id){
        getConnection((conn)=>{
            sql = "SELECT COUNT(id) as count FROM sign WHERE id=?;";
            param = [id]
            var rowData = conn.query(sql,param, (err,row)=>{
                try{
                    if(row[0].count){
                        return true;
                    }
                    else{
                        return false;
                    }
                }catch{
                    console.log('err : '+ err);
                }
                finally{
                    conn.release();
                }
            });
        });
        console.log(rowData);
        if(result == true){ return true; } else { return false; }
    }

    function LoginPwDataCheck(id,pw){
        var result;
        var cryptoPW = ShaEnCryption(pw,CryptoKey);
        getConnection((conn)=>{
            sql = "SELECT * FROM sign WHERE id=?;";
            param = [id];
            conn.query(sql,param, (err,row)=>{
                if(row[0].password != cryptoPW){
                    result = false;
                }
                else{
                    result =  true;
                }
            });
            conn.release();
        });
        if(result == true){return true}else{return false}
    }
    */

    function AllDataCheck(){
        console.log('AllDataCheck');
        console.log(DataNullCheck());
        console.log(LoginDataCheck(id,pw));

        /*
        if(DataNullCheck() && LoginDataCheck(id,pw)){
            return true;
        }
        else{
            return false;
        }
        */
    }

    if(AllDataCheck()){
        console.log('로그인 성공');
        req.session.user = {
            id : id,
            pw : ShaEnCryption(pw,CryptoKey),
            authorized : true
        };
        res.render(path.join(__dirname,'../../public/HTML/login.html'))
    }
    else{
        console.log('로그인 실패');
        res.render(path.join(__dirname,'../../public/HTML/main.html'))
    }
})

router.get('/main',(req,res,next)=>{
    res.render(path.join(__dirname,'../../public/HTML/main.html'));
})

router.post('/login',(req,res,next)=>{
    res.render(path.join(__dirname,'../../public/HTML/login.html'));
})

router.get('/signup',(req,res,next)=>{
    res.render(path.join(__dirname,'../../public/HTML/signup.html'));
})

router.post('/signup',(req,res,next)=>{
    var id = req.body.id;
    var pw = req.body.pw;
    var pwck = req.body.pwck;
    var name = req.body.name;
    var birth = req.body.birth;
    var gender = req.body.gender;
    var email = req.body.email;
    var phone = req.body.phone;
    var age = req.body.age;
    
    /* 회원가입 데이터 검증
        1. ID
            - ID 데이터가 빈값인지 체크
            - 데이터베이스에 ID 데이터 조회해서 존재하는지 체크
            - 데이터베이스에 ID 데이터가 없으면 정규식 조건 체크
        2. 패스워드
            - 패스워드와 패스워드 확인 데이터가 빈값인지 체크
            - 아이디와 패스워드가 일치하는지 체크
            - 패스워드와 패스워트 확인 데이터 정규식 조건 체크
            - 패스워드와 패스워드 확인 데이터가 일치하는지 체크
        3. 이름
            - 이름 데이터가 빈값인지 체크
            - 이름 데이터 정규식 조건 체크
        4. 생일
            - 생일 데이터가 빈값인지 체크
            - 생일 데이터 정규식 조건 체크
        5. 성별
            - 성병 데이터 정규식 조건 체크
        6. 이메일
            - 이메일 데이터 정규식 조건 체크
        7. 전화번호
            - 전화번호 데이터가 빈값인지 체크
            - 전화번호 데이터 정규식 조건 체크
        8. 나이
            - 나이 데이터 정규식 조건 체크
     */

    console.log(id);
    function DataNullCheck(value, dataname) {
        if(value == null || value == ''){
            res.send("<script>alert(dataname + ' 입력해주세요!');</script>");
            return false;
        }
        return true;
    }

    function UserIdChack(id) {
        if(!DataNullCheck(id, "아이디를")){
            return false;
        }
        var sql = "SELECT COUNT(id) as count FROM sign WHERE id='" + id + "';";
        getConnection((conn)=>{
            conn.query(sql,(err,rows)=>{
                try{
                    if(rows[0].count){
                        res.send("<script>alert('동일한 아이디가 존재합니다.');</script>");
                        return false;
                    }
                    else{
                        var RegulId = /^[a-zA-Z0-9]{4,12}$/;
                        if(!RegulId.test(id)){
                            res.send("<script>alert('아이디는 영문 대소문자와 숫자 4~12자리로 입력해야합니다!');</script>");
                            return false;
                        }
                    }
                    return true;
                }catch{
                    console.log('err : ' + err);
                }finally{
                    conn.release();
                }
            });
        });
    }

    function UserPasswardCheck(id,pw,pwck) {
        if(!DataNullCheck(pw, "비밀번호를")){
            return false;
        }
        if(!DataNullCheck(pwck, "비밀번호 확인을")){
            return false;
        }
        var RegulPw = /^[a-zA-Z0-9]{8,}$/;
        if(!RegulPw.test(pw)){
            res.send("<script>alert('비밀번호는 영문 대소문자와 숫자 4~12자리로 입력해야합니다!');</script>");
            return false;
        }
        if(!RegulPw.test(pwck)){
            res.send("<script>alert('비밀번호 확인은 영문 대소문자와 숫자 4~12자리로 입력해야합니다!');</script>");
            return false;
        }
        if(pw != pwck){
            res.send("<script>alert('두 비밀번호가 맞지 않습니다.');</script>");
            return false;
        }
        if(id == pw){
            res.send("<script>alert('아이디와 비밀번호가 같습니다.');</script>");
            return false;
        }
        return true;
    }

    function UserNameCheck(name){
        if(!DataNullCheck(name, "이름을")){
            return false;
        }
        var RegulName = /^[a-zA-Z가-핳]/;
        if(!RegulName.test(name)){
            res.send("<script>alert('이름이 올바르지 않습니다.');</script>");
            return false;
        }
        return true;
    }

    function UserBirthCheck(birth) {
        if(!DataNullCheck(birth,"생일을")){
            return false;
        }

        var RegulBirth = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/;
        if(!RegulBirth.test(birth)){
            res.send("<script>alert('생일 입력 형식이 틀렸습니다. ex) 2022-07-22')</script>")
            return false;
        }
        return true;
    }

    function UserGenderCheck(gender) {
        var RegulGender = /^여|남/;
        if(!RegulGender.test(gender) && gender != ""){
            res.send("<script>alert('성별 형식이 틀렸습니다. ex) 남/여')</script>");
            return false;
        }
        if(gender == ""){
            gender = "-";
        }
        return true;
    }

    function UserEmailCheck(email){
        var RegulEmail =/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
        if(!RegulEmail.test(email) && email != ""){
            res.send("<script>alert('이메일 형식이 틀렸습니다. ex) abc@naver.com')</script>");
            return false;
        }
        if(email==""){
            email="-";
        }
        return true;
    }

    function UserPhoneCheck(phone){
        if(!DataNullCheck(phone,"전화번호를")){
            return false;
        }

        var RegulPhone = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}/;
        if(!RegulPhone.test(phone)){
            res.send("<script>alert('전화번호 형식이 틀렸습니다. ex) 010-1234-6789')</script>");
            return false;
        }
        return true;
    }

    function UserAgeCheck(age){
        var RegulAge = /^[0-9]/;
        if(!RegulAge.test(age) && age != ""){
            res.send("<script>alert('전화번호 형식이 틀렸습니다.');</script>")
            return false;
        }
        if(age == ""){
            age = -1;
        }
        return true;
    }

    function AllDataCheck(){
        /*
        if(UserIdChack(id)){console.log('id체크 통과')}else{console.log('id체크 실패')}
        if(UserPasswardCheck(id,pw,pwck)){console.log('비밀번호 체크 통과')}else{console.log('비밀번호 체크 실패')}
        if(UserNameCheck(name)){console.log('이름 체크 통과')}else{console.log('이름 체크 실패')}
        if(UserBirthCheck(birth)){console.log('생일 체크 통과')}else{console.log('생일 체크 실패')}
        if(UserGenderCheck(gender)){console.log('성별 체크 통과')}else{console.log('성별 체크 실패')}
        if(UserEmailCheck(email)){console.log('이메일 체크 통과')}else{console.log('이메일체크 실패')}
        if(UserPhoneCheck(phone)){console.log('전화번호 체크 통과')}else{console.log('전화번호 체크 실패')}
        if(UserAgeCheck(age)){console.log('나이 체크 통과')}else{console.log('나이 체크 실패')}
        */

        if(UserIdChack(id) && UserPasswardCheck(id,pw,pwck) && UserNameCheck(name) && UserBirthCheck(birth) && UserGenderCheck(gender) && UserEmailCheck(email) && UserPhoneCheck(phone) && UserAgeCheck(age)){
           return true;
        }
        return false;
    }

    if(AllDataCheck()){
        var sql = "INSERT INTO sign VALUES (?,?,?,?,?,?,?,?,?);";
        var param = [id, ShaEnCryption(pw,CryptoKey) ,ShaEnCryption(pwck,CryptoKey) , name, birth, gender, email, phone, age];
        
        getConnection((conn) => {
            conn.query(sql,param,(err,row) => {
                if(err){
                    console.log(err);
                    conn.release();
                } 
            })
            conn.release();
        })
        console.log('전부 통과');
        res.render(path.join(__dirname,'../../public/HTML/main'));
    }
    else{
        console.log('실패')
        //res.render(path.join(__dirname,'../../public/HTML/signup'));
    }
})

module.exports = router;