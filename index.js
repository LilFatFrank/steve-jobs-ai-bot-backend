import express from 'express';
import router from './routes.js';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.use('/xi', router);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
