import express from 'express';
import cors from 'cors';
const app = express();
const port  = 5000;
app.use(express.json());
app.use(cors());

//peticiones
app.get('/api', (req,res) =>{
    res.json({message: 'holiiiii'});
});


app.listen(port, () =>{
    console.log(`running on ${port}`)
})

