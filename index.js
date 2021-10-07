const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
const secret = 'shhh my guy';



const knx = require('knex')({
  client: 'pg',
  connection: {
    host : env.DB_HOST,
    user : env.DB_USER,
    password : env.DB_PASSWORD,
    database : env.DB'
  },
});


app.use(express.urlencoded({extended: false})); //Parses the request body
app.use(express.json());
app.use(function(req, res, next){
  //Create a list of allowed routes without
  //a valid JWT.
  console.log(req.originalUrl);
  next();
});

app.use(cors());

function createJWT()
{
  return jwt.sign({text: "I Am Toekn"}, secret,
  {expiresIn: 15});
}

app.get('/check', (req, res) => {
    const token = req.header('token');

    if(!token)
    {
      return res.send('no toke')
    }

    try {
      var decoded = jwt.verify(token, secret);
      return res.send('good toekn');
    } catch(err) {
      return res.send('bad token');
    }
})

app.get('/order_my_appointments', (req, res) => {

    knx('appointments').where({
      receiver_email: req.body.email
    }).orderBy('time', 'asc').then(appointments => {
      res.send(appointments)
    });

})

function checkUser(user,res,firebase)
{
  if(user.length != 0)
  {
    //Create JWT token, get user info and send it back
    console.log(user);
    return res.json({message:'success',
    token: createJWT(),
    name: user[0].name})
  }
  else
  {
    if(firebase)
    {
      return res.json({message:'doesnt exist'})
    }else{
      return res.json({message:'wrong creds'})
    }
  }
}

app.post('/get_appointments', (req, res) => {
  let info = req.body;
  console.log(info);
  knx('appointments').where({
    receiver_email: info.email
  }).then(response => {
    res.send(response)
  })

})

app.post('/register', (req, res) => {
  let info = req.body;

  knx('users').insert({
    name: info['name'],
    email: info['email'],
    password: info['password']
  }).then(response => {
    res.json({message: 'Good',
    token: createJWT()});
  }, error => {
    res.json({message: 'Already Exists'});
  })
})

app.post('/login', (req, res) => {

  let info = req.body;
  console.log(info);

  if(info.firebase == true)
  {
    knx('users').where({
      email: info['email'],
    }).then(user => checkUser(user,res,true))
  }else{
    knx('users').where({
      email: info['email'],
      password: info['password']
    }).then(user => checkUser(user,res))
  }
})

app.get('/donedoff', (req, res) => {

  /*Creating a JSON Token and assigning to the
  token var, which is sent back to the user.
  Now whenever info-sensitive ops are being done
  (for example, trying to goto the user setting page
  while not logged in) you'll need a good token, if
  not you won't be allowed to access the page.
  */
  var token = createJWT();


  /*Send the token back, now on the front-end
  we need to assign token part of this JSON obj
  to the session storage on the window*/
  res.json({text: 'done', token})

});

app.post('/create_appointment', (req, res) => {

  info = req.body;

  console.log(info);
  knx('appointments').insert({
    client_name: info['client_name'],
    receiver_email: info['receiver_email'],
    sender_email: info['sender_email'],
    location: info['location']
  }).then(success => {
      res.send({message:'done'})
  }, reject => {
    res.json({message:'not found'})
  })

})

app.post('/create_user', (req, res) => {
  const user_info = req.body;

  if(user_info['name'] != ''
  && user_info['password'] != ''
  && user_info['email'] != '')
  {
    knx('users').insert({
      name: user_info['name'],
      email: user_info['email'],
      password: password
    }).then(success => {
        res.send('success')
    }, reject => {
        res.send('error')
    });
  } else {
    return res.send('ERROR')
  }
})

app.get('/test', (req, res) => {
  knx.raw(`select * from appointments where time > now() - interval '1 day'`).then(
    a => {
      res.json(a.rows);
    }
  );
})

app.listen(process.env.PORT);
