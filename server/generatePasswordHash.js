const bcrypt = require('bcrypt');

const password = 'rjvuytoew'; // Замените на желаемый пароль
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('Generated hash:', hash);
});