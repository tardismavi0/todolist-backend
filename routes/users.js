const express = require('express');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const _ = require("lodash");
const userauth = require('../auth/userauth');
const jwt = require("jsonwebtoken");
const sql = require('mssql');
const MD5 = require('crypto-js/md5');

const sqlConfig = {
    user: "SA",
    password: "MyPass@word",
    database: "todolist",
    server: 'localhost',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
}


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});



router.post('/login',
    body('email').isEmail(),
    body('password').isString(),
    async function (req, res) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.mapped()});
        }


        const {email, password} = req.body;

        try {
            await sql.connect(sqlConfig)
            const result = await sql.query`select *
                                           from users
                                           where email = ${email}
                                             and password = ${MD5(password).toString()}`;


            if (result.recordset.length) {

                let user = result.recordset[0];

                const payload = {id: user.id};
                const token = jwt.sign(payload, "oc2525SXFvcrigQ13!zer14546aRXfrtAS_fAWRGGFH");


                return res.status(200).json({
                    token,
                    message: 'Giriş Başarılı!',
                    payload,
                    result: {email: user.email, id: user.id}
                });


            } else {

                return res.status(401).json({message: "Kullanıcı Bilgileri Yanlış"});

            }


        } catch (err) {
            return res.status(401).json({message: err.message});
        }

});


router.get('/auth',
    userauth,
    async function (req, res) {

        try {

            await sql.connect(sqlConfig)
            const result = await sql.query`select *
                                           from users
                                           where id = ${req.userData.id}`;


            if (result.recordset.length) {

                let user = result.recordset[0];


                return res.json({message: 'Authed!', result: {email: user.email, id: user.id}});
            } else {
                return res.status(400).json({message: 'Hesap bulunamadı!'});
            }

        } catch (e) {
            return res.status(400).json({message: e.message});
        }

});


router.get('/todo/list',
    userauth,
    async function (req, res) {

        try {

            await sql.connect(sqlConfig)
            const result = await sql.query`select *
                                           from user_todo_list
                                           where user_id = ${req.userData.id} order by created_at desc`;


            return res.json({message: 'Data list', result:result.recordset});


        } catch (e) {
            return res.status(400).json({message: e.message});
        }

});



router.post('/todo/delete',
    userauth,
    body('id').isNumeric(),

    async function (req, res) {

        const {id} = req.body;

        try {

            await sql.connect(sqlConfig)
            const result = await sql.query`delete 
                                           from user_todo_list
                                           where id = ${id}`;


            return res.json({message: 'Öğe Silindi', result});


        } catch (e) {
            return res.status(400).json({message: e.message});
        }

 });



router.post('/todo/add',
    userauth,
    body('title').isString(),

    async function (req, res) {

        const {title} = req.body;

        try {

            let time = new Date().getTime() / 1000;

            await sql.connect(sqlConfig)
            const result = await sql.query`insert into  user_todo_list (title, user_id, created_at)
                                           values (${title},${req.userData.id},${time}) `;


            if (result){

                return res.json({message: 'Öğe Eklendi', result});


            }




        } catch (e) {
            return res.status(400).json({message: e.message});
        }

    });


router.post('/todo/edit',
    userauth,
    body('title').isString(),
    body('id').isNumeric(),

    async function (req, res) {

        const {title,id} = req.body;

        try {

            await sql.connect(sqlConfig)
            const result = await sql.query`update  user_todo_list  set title = ${title}  where id = ${id}`;

            console.log(result);

            if (result){

                return res.json({message: 'Düzenleme Kaydedildi', result});


            }




        } catch (e) {
            return res.status(400).json({message: e.message});
        }

    });

module.exports = router;

