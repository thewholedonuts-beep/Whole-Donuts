const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`Whole Donuts merch backend listening on port ${port}`);
});
