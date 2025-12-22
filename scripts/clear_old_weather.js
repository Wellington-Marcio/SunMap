#!/usr/bin/env node
/**
 * scripts/clear_old_weather.js
 * Deleta registros antigos da coleção de weather (destrutivo).
 * Uso:
 *  node scripts/clear_old_weather.js --days 30 [--yes]
 *  node scripts/clear_old_weather.js --before 2025-12-01T00:00:00Z --yes
 *
 * O script lê `MONGO_URI` do ambiente, `MONGODB_URI` ou usa fallback do docker-compose.
 */

const mongoose = require('mongoose');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--days') out.days = Number(argv[++i]);
    else if (a === '--before') out.before = argv[++i];
    else if (a === '--yes' || a === '-y') out.yes = true;
    else if (a.startsWith('--days=')) out.days = Number(a.split('=')[1]);
    else if (a.startsWith('--before=')) out.before = a.split('=')[1];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

async function main() {
  const argv = parseArgs(process.argv.slice(2));
  if (argv.help) {
    console.log('Uso: node scripts/clear_old_weather.js --days N [--yes]');
    console.log('       node scripts/clear_old_weather.js --before 2025-12-01T00:00:00Z --yes');
    process.exit(0);
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://root:123456@localhost:27017/sunmap?authSource=admin';
  const days = argv.days ? Number(argv.days) : null;
  const before = argv.before ? new Date(argv.before) : null;
  const doDelete = argv.yes === true;

  if (!days && !before) {
    console.error('Erro: informe --days N ou --before <ISO-date>');
    process.exit(1);
  }

  const cutoff = before || new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

  console.log('Conectando ao MongoDB em', mongoUri);
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const collInfos = await mongoose.connection.db.listCollections().toArray();
    const hasWeathers = collInfos.some(c => c.name === 'weathers' || c.name === 'weather');
    const collectionName = hasWeathers ? (collInfos.some(c => c.name === 'weathers') ? 'weathers' : 'weather') : 'weathers';

    const collection = mongoose.connection.db.collection(collectionName);

    const query = { createdAt: { $lt: cutoff } };
    const count = await collection.countDocuments(query);

    console.log(`Registros encontrados para remoção (criados antes de ${cutoff.toISOString()}):`, count);

    if (count === 0) {
      console.log('Nada para apagar. Encerrando.');
      await mongoose.disconnect();
      process.exit(0);
    }

    if (!doDelete) {
      console.log('\nModo de simulação — nenhum registro será apagado. Para apagar, execute com --yes.');
      console.log('Exemplo: node scripts/clear_old_weather.js --days 30 --yes');
      await mongoose.disconnect();
      process.exit(0);
    }

    const res = await collection.deleteMany(query);
    console.log('Registros apagados:', res.deletedCount);
  } catch (err) {
    console.error('Erro durante operação:', err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

main();
