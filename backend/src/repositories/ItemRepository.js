const { Item } = require('../models');
const { itemsData } = require('../models/seeders/worldDataSeeder');

class ItemRepository {
  /**
   * Finds an item by ID or name strictly from Database / master definitions.
   * Rejects any unregistered items.
   *
   * @param {string} idOrName
   * @returns {Promise<object|null>}
   */
  static async findById(idOrName) {
    if (!idOrName || typeof idOrName !== 'string') return null;
    const clean = idOrName.trim();
    const lower = clean.toLowerCase();

    // 1. Check database first
    try {
      let dbItem = await Item.findByPk(clean);
      if (dbItem) return dbItem.toJSON();

      dbItem = await Item.findOne({
        where: { id: lower }
      });
      if (dbItem) return dbItem.toJSON();

      dbItem = await Item.findOne({
        where: { name: clean }
      });
      if (dbItem) return dbItem.toJSON();
    } catch (e) {
      // In case database connection is not ready or during isolated in-memory unit tests
    }

    // 2. Fallback to master seeded items definition (synchronized with database)
    const matched = itemsData.find(i =>
      i.id === clean ||
      i.id.toLowerCase() === lower ||
      i.name.toLowerCase() === lower
    );

    return matched ? JSON.parse(JSON.stringify(matched)) : null;
  }

  /**
   * Retrieves all items from database.
   */
  static async findAll(options = {}) {
    try {
      const items = await Item.findAll(options);
      if (items && items.length > 0) {
        return items.map(i => i.toJSON());
      }
    } catch (e) {}

    return JSON.parse(JSON.stringify(itemsData));
  }

  /**
   * Finds items by category.
   */
  static async findByCategory(category) {
    try {
      const items = await Item.findAll({ where: { category } });
      if (items && items.length > 0) return items.map(i => i.toJSON());
    } catch (e) {}

    return itemsData.filter(i => i.category === category);
  }

  /**
   * Checks if an item is consumable.
   */
  static async isConsumable(idOrName) {
    const item = await this.findById(idOrName);
    if (!item) return false;
    return item.isConsumable === true || item.category === 'consumable' || item.category === 'Obat';
  }

  /**
   * Normalizes an inventory array into the canonical reference format:
   * [{ itemId: "item_01_potion_heal", quantity: 1 }]
   *
   * @param {Array} rawInventory
   * @returns {Array<{ itemId: string, quantity: number }>}
   */
  static normalizeInventory(rawInventory) {
    if (!Array.isArray(rawInventory)) return [];
    const normalized = [];

    for (const entry of rawInventory) {
      if (!entry) continue;
      let itemId = null;
      let quantity = 1;

      if (typeof entry === 'string') {
        itemId = entry;
      } else if (typeof entry === 'object') {
        itemId = entry.itemId || entry.id;
        quantity = Number(entry.quantity ?? 1);
        if (isNaN(quantity) || quantity < 1) quantity = 1;
      }

      if (!itemId) continue;

      const existingIndex = normalized.findIndex(i => i.itemId === itemId);
      if (existingIndex !== -1) {
        normalized[existingIndex].quantity += quantity;
      } else {
        normalized.push({ itemId, quantity });
      }
    }

    return normalized;
  }

  /**
   * Hydrates an inventory list with full master metadata from the database.
   * Returns complete objects for UI rendering or combat execution.
   *
   * @param {Array} inventory - Canonical or legacy inventory array
   * @returns {Promise<Array<object>>}
   */
  static async hydrateInventory(inventory) {
    const canonical = this.normalizeInventory(inventory);
    const allItems = await this.findAll();
    const itemMap = new Map(allItems.map(i => [i.id, i]));

    return canonical.map(entry => {
      const def = itemMap.get(entry.itemId) || {
        id: entry.itemId,
        name: entry.itemId,
        category: 'misc',
        description: '',
        icon: 'item_01_potion_heal'
      };

      return {
        ...def,
        itemId: entry.itemId,
        quantity: entry.quantity
      };
    });
  }
}

module.exports = ItemRepository;
