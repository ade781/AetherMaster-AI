const { Item } = require('../models');
const { ITEM_CATALOG, normalizeItemId } = require('../engine/itemMaster');

class ItemRepository {
  /**
   * Finds an item by ID or alias.
   * Checks database first, falls back to memory catalog.
   */
  static async findById(idOrName) {
    if (!idOrName) return null;
    const canonicalId = normalizeItemId(idOrName);

    try {
      const dbItem = await Item.findByPk(canonicalId);
      if (dbItem) return dbItem.toJSON();
    } catch (e) {
      // In case database connection is not ready or during in-memory tests
    }

    return ITEM_CATALOG[canonicalId] || null;
  }

  static async findAll(options = {}) {
    try {
      const items = await Item.findAll(options);
      if (items && items.length > 0) {
        return items.map(i => i.toJSON());
      }
    } catch (e) {}

    return Object.values(ITEM_CATALOG);
  }

  static async findByCategory(category) {
    try {
      const items = await Item.findAll({ where: { category } });
      if (items && items.length > 0) return items.map(i => i.toJSON());
    } catch (e) {}

    return Object.values(ITEM_CATALOG).filter(i => i.category === category);
  }

  static async isConsumable(idOrName) {
    const item = await this.findById(idOrName);
    if (!item) return false;
    return item.isConsumable === true || item.category === 'consumable';
  }
}

module.exports = ItemRepository;
