const express = require('express');
const router = express.Router();
const {
  getAllCharacters,
  getCharacterById,
  getCatalog,
  createCharacter,
  toggleEquipItem,
  castSpell,
  toggleCondition,
  modifyHp,
  levelUpCharacter,
  deleteCharacter,
} = require('../controllers/characterController');

router.get('/catalog', getCatalog);

router.route('/')
  .get(getAllCharacters)
  .post(createCharacter);

router.route('/:id')
  .get(getCharacterById)
  .delete(deleteCharacter);

router.post('/:id/equip', toggleEquipItem);
router.post('/:id/cast', castSpell);
router.post('/:id/condition', toggleCondition);
router.patch('/:id/hp', modifyHp);
router.post('/:id/levelup', levelUpCharacter);

module.exports = router;
