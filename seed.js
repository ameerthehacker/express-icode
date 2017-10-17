const seeder = require('./db/seeder');

seeder.seed('users', 'user');
seeder.seed('compilers', 'compiler');
seeder.seed('challenges', 'challenge');
