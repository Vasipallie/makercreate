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

//START SERVER
const PORT = 3000;
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
})