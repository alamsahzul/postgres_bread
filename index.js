const express = require('express');
const app     = express();
const body    = require('body-parser');
const path    = require('path');
const moment  = require('moment');


app.set('view engine', 'ejs'); //deklarasikan view engine
app.set('views', path.join(__dirname, '../view'));
app.use(express.static(path.join(__dirname,'../public')));
app.use(body.urlencoded({extended:true}));

const {Client} = require('pg')
const client = new Client({
  user: 'zul',
  host: 'localhost',
  database: 'anggota_db',
  password: '1234',
  port: 5432,
})
client.connect()

app.listen(3000, function () {
  console.log('server is ready');
});


app.get('/', (req,res)=>{
  let bagianWhere     = [];
  let where_status    = false;
  let idChecked       = req.query.idChecked;
  let id              = req.query.id;
  let namaChecked     = req.query.namaChecked;
  let nama            = req.query.string
  let umurChecked     = req.query.umurChecked;
  let umur            = req.query.integer;
  let tinggiChecked   = req.query.tinggiChecked;
  let tinggi          = req.query.float;
  let dateChecked     = req.query.dateChecked;
  let start_date      = req.query.start_date
  let end_date        = req.query.end_date;
  let statusChecked   = req.query.statusChecked;
  let status          = req.query.boolean;
  let halaman         = Number(req.query.page) || 1;
  let url             = (req.url == "/") ? "/?page=1" : req.url;

  if (url.indexOf('&cari=') != -1){
    halaman = 1;
  }
  url = url.replace('&cari=','')
  if(idChecked){
    bagianWhere.push( `id='${id}'` );
    where_status = true;
  }
  if(namaChecked){
    bagianWhere.push( `nama='${nama}'` );
    where_status = true;
  }
  if(umurChecked){
    bagianWhere.push( `umur='${umur}'` );
    where_status = true;
  }
  if(tinggiChecked){
    bagianWhere.push( `tinggi='${tinggi}'` );
    where_status = true;
  }
  if(dateChecked){
    bagianWhere.push(`tanggal_lahir BETWEEN '${req.query.start_date}' AND '${req.query.end_date}'`);
    where_status = true;
  }
  if(statusChecked){
    bagianWhere.push( `status='${status}'` );
    where_status = true;
  }
  let sql = 'SELECT count(id) FROM anggota';
  if(where_status){
    sql += ' WHERE ' + bagianWhere.join(' AND ');
  }
  // promise
  client.query(sql, (err, data) =>{
    let totalRecord   = data.rows[0].count;
    console.log(data.rows[0].count);
    let limit         = 3;
    let offset        = (halaman-1)*limit;
    let jumlahHalaman  = (totalRecord == 0) ? 1 : Math.ceil(totalRecord/limit);
    sql =  `SELECT * FROM anggota`
    if(where_status){
      sql += ' WHERE ' + bagianWhere.join(' AND ');
    }
    sql+= ` LIMIT ${limit} OFFSET ${offset}`

    client.query(sql, (err, data) => {
      res.render('index', {title: "SQLITE 3", rows:data.rows, halaman:halaman, jumlahHalaman: jumlahHalaman, query: req.query, url:url });
    });
  })
});

app.get('/add', function(req,res){
  res.render('add',{title: "ADD"});
});

app.post('/add', function(req,res){
  let string      = req.body.string;
  let integer     = parseInt(req.body.integer);
  let float       = parseFloat(req.body.float);
  let date        = new Date(req.body.date);
  let boolean     = JSON.parse(req.body.boolean);

  client.query('INSERT INTO anggota (nama, umur, tinggi, tanggal_lahir, status ) VALUES ($1,$2,$3,$4,$5)', [string,integer,float,date,boolean])
  .then(data => {
    console.log('berhasil',data);
    res.redirect('/');
  })
  .catch(e => console.error(e.stack))
});

app.get('/delete/:id', (req, res) =>{
  let id_delete = Number(req.params.id);
  client.query(`DELETE FROM anggota WHERE id = $1`, [id_delete])
  .then(data => res.redirect('/'))
  .catch(e => console.error(e.stack))
});

app.get('/edit/:id', (req, res) => {
  let id          = Number(req.params.id);
  client.query('SELECT * FROM anggota WHERE id = $1', [id])
  .then(data => {
    data.rows[0].tanggal_lahir = moment(data.rows[0].tanggal_lahir).format("YYYY-MM-DD");
    res.render('edit', {title:"edit", data: data.rows[0]})
  })
  .catch(e => console.error(e.stack))
})

app.post('/edit/:id', (req, res) => {
  let id          = Number(req.params.id);
  let string      = req.body.string;
  let integer     = parseInt(req.body.integer);
  let float       = parseFloat(req.body.float);
  let date        = new Date(req.body.date);
  let boolean     = JSON.parse(req.body.boolean);

  client.query('UPDATE anggota SET nama=$1, umur=$2, tinggi=$3, tanggal_lahir=$4, status=$5 WHERE id=$6 ', [string,integer,float,date,boolean, id])
  .then(data => {
    console.log('berhasil',data);
    res.redirect('/');
  })
  .catch(e => console.error(e.stack))
})
