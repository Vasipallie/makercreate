import express from 'express';
import cookieParser from 'cookie-parser';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
import path from 'path';

const app = express();
app.use(cookieParser());
app.use('/models', express.static(path.join(__dirname, 'views', 'resources', 'models')));
app.use('/three', express.static(path.join(__dirname, 'node_modules', 'three')));
app.use(express.static(path.join(__dirname, 'views')));

app.set('view engine', 'ejs');



app.get('/', (req, res) => {
    res.render('index');
}
);

app.get('/dashboard', (req, res) => {

});

app.get('/console', (req, res) => {
    res.render('console');
});

//START SERVER
const PORT = 3000;
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
})


/* 

https://auth.hackclub.com/oauth/authorize?client_id=c64a336b6421768c772ca0b711d5e81e&redirect_uri=http://localhost:3000/authenticate&response_type=code&scope=email

*/