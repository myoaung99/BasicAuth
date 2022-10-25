const csrf = require('csurf');
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/user')
const {mongoose} = require("mongoose");
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const MONGODB_URI = 'mongodb+srv://myomyintaung:4EvwakdYAaFx9s7s@cluster0.torxfu9.mongodb.net/practice';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'Sessions',
})

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'my secret key',
    store: store,
}));
app.use((req, res, next)=>{
    console.log(req.session);
    if(!req.session.user){
        return next();
    }
    User.findOne({_id: req.session.user._id})
        .then((user)=>{
            req.user = user;
            next();
        })
        .catch(err=>console.log(err))
});
app.use(csrf());

app.use((req, res, next)=>{
    res.locals.csrfToken = req.csrfToken();
    next();
})


app.get('/login', (req, res, next)=>{
    res.render('login', {
        pageTitle: 'Login'
    })
});
app.post('/login', (req, res, next)=>{
    const {email, password} = req.body;
    User.findOne({email: email})
        .then((user)=>{
            if(!user){
                return res.redirect('/signup');
            }
            return bcrypt.compare(password, user.password)
                .then((result)=>{
                    if(result){
                        req.session.isAuthenticated = true;
                        req.session.user = user;
                        return res.redirect('/')
                    }else {
                        return res.redirect('/login')
                    }
                })
                .catch(err=>console.log(err))
        })
        .catch(err=>console.log(err))
});

app.get('/signup', (req, res, next)=>{
    res.render('signup', {
        pageTitle: 'SignUp'
    })
});

app.post('/signup', (req, res, next)=>{
    const {email, password} = req.body;
    User.findOne({email: email}).then((userDoc)=>{
        if(userDoc){
            return res.redirect('/login')
        }
        return bcrypt.hash(password, 12)
            .then((hashPassword)=>{
                const user = new User({email: email, password: hashPassword });
                user.save();
            })
            .catch(err=>console.log(err))
    }).catch(err=>console.log(err))
    return res.redirect('/login')
});

app.get('/logout', (req, res, next)=>{
    return res.render('logout');
})

app.post('/logout', (req, res, next)=>{
    req.session.destroy(()=>{
        res.redirect('/login')
    })
})

app.get('/secret', (req, res, next)=>{
    if(!req.session.isAuthenticated){
        return res.redirect('/login')
    }
    return res.render('admin', {
        pageTitle: 'Secret Page'
    })
})

app.get('/', (req, res, next)=>{
    return res.send('Hello, Welcome from Index Page');
});

app.use('',(req, res, next)=>{
    return res.send('Page not found 404.');
});

mongoose.connect(MONGODB_URI).then(()=>(app.listen(3000))).catch(err=>console.log(err))
