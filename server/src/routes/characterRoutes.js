const express = require('express');
const router = express.Router();
const {
  getAllCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  modifyHp,
  levelUpCharacter,
  deleteCharacter,
} = require('../controllers/characterController');

// Open-access character endpoints
router.route('/')
  .get(getAllCharacters)
  .post(createCharacter);

router.route('/:id')
  .get(getCharacterById)
  .put(updateCharacter)
  .delete(deleteCharacter);

router.patch('/:id/hp', modifyHp);
router.post('/:id/levelup', levelUpCharacter);

module.exports = router;
