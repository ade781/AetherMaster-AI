const { describe, it } = require('node:test');
const assert = require('node:assert');
const { sequelize, isProduction } = require('../src/config/database');
const { Character, Campaign, GameSession, StoryNode } = require('../src/models');

describe('SQLite In-Memory Database for Testing', () => {
  it('should use sqlite dialect and :memory: storage in test environment', () => {
    assert.strictEqual(sequelize.getDialect(), 'sqlite', 'Dialect must be sqlite in test mode');
    assert.strictEqual(sequelize.options.storage, ':memory:', 'Storage must be :memory:');
    assert.strictEqual(isProduction, false, 'isProduction should be false in test mode');
  });

  it('can authenticate and synchronize schema without requiring external MySQL or PostgreSQL', async () => {
    await assert.doesNotReject(async () => {
      await sequelize.authenticate();
      await sequelize.sync();
    }, 'In-memory SQLite authentication and synchronization must succeed');
  });

  it('can perform basic CRUD operations independently in memory', async () => {
    const testChar = await Character.create({
      name: 'TestInMemoryHero',
      characterClass: 'wizard',
      level: 1,
      hp: 15,
      maxHp: 15
    });

    assert.ok(testChar.id, 'Character must have an id');
    const fetched = await Character.findByPk(testChar.id);
    assert.strictEqual(fetched.name, 'TestInMemoryHero');

    await testChar.destroy();
    const deleted = await Character.findByPk(testChar.id);
    assert.strictEqual(deleted, null, 'Character should be deleted');
  });
});
